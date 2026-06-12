# Rekomendasi Pattern Pengembangan Backend (FastAPI + Inngest)

> **Tujuan**: Menetapkan standar penulisan kode, arsitektur *layering*, dan pola desain (Design Patterns) untuk tim *backend engineer*. Dokumen ini memastikan basis kode tetap mudah dibaca (*maintainable*), mudah diuji (*testable*), dan siap diskalakan (*scalable*).

---

## 1. Arsitektur Layering (Controller-Service-Data)

Untuk menghindari "Fat Controllers" (logika bisnis menumpuk di file router/API), kita menerapkan pola **Layered Architecture** secara ketat:

### A. Router Layer (`api/routers/`)
- **Peran**: Bertanggung jawab **hanya** untuk menerima HTTP request, memvalidasi payload menggunakan Pydantic, memanggil *Service Layer*, dan mengembalikan HTTP response.
- **Aturan**:
  - Dilarang keras menulis query database (SQLAlchemy) di layer ini.
  - Dilarang keras memasukkan logika bisnis (if/else kompleks).
  - Wajib menggunakan FastAPI `Depends()` untuk injeksi dependensi.

```python
# CONTOH BENAR
@router.post("/", response_model=ProjectResponse)
async def create_project(
    req: ProjectCreate, 
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Hanya meneruskan data ke service
    project = await project_service.create(db, user.id, req)
    return project
```

### B. Service Layer (`services/`)
- **Peran**: Tempat di mana semua **logika bisnis** dan pemrosesan aturan aplikasi berada.
- **Aturan**:
  - Semua operasi transaksi database (seperti integrasi antar tabel atau pengurangan kredit) ditaruh di sini.
  - Harus agnostik terhadap HTTP. *Service* tidak boleh tahu-menahu soal objek `Request`, `Header`, atau `HTTPException`.
  - Me-return data model murni atau *custom exception*.

### C. Data Access Layer (`core/models/` & Pydantic)
- Kita menggunakan pemisahan yang jelas antara **ORM Models** (Representasi struktur tabel PostgreSQL) dan **Pydantic Schemas** (Representasi struktur JSON untuk input/output API).

---

## 2. Dependency Injection (DI)

Manfaatkan kekuatan utama FastAPI, yaitu sistem *Dependency Injection*, untuk membuat kode yang sangat mudah untuk di-mock saat *Unit Testing*.

- **Database Session**: Selalu *inject* `get_db` agar lifecycle *session* diatur oleh FastAPI (otomatis close saat request selesai).
- **Authentication**: `get_current_user` membaca *header* Authorization, memvalidasi JWT, dan mengembalikan instans User.
- **Credit Guard**: Dependency khusus untuk memblokir eksekusi di level *router* jika saldo tidak cukup.

```python
# api/dependencies.py
async def credit_guard(cost: int):
    async def guard(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
        if user.credit_balance < cost:
            raise InsufficientCreditsException()
        return True
    return guard

# Penggunaan di Router
@router.post("/generate", dependencies=[Depends(credit_guard(cost=10))])
async def generate_something():
    ...
```

---

## 3. Strategi Exception Handling Terpusat

Dilarang melakukan *hardcode* `raise HTTPException(status_code=400, detail="...")` di dalam layer *Service*. Hal ini membuat service terikat pada layer HTTP.

**Pola yang benar**:
1. Buat class *Exception* kustom di `core/exceptions.py` (misal: `UserNotFoundException`, `InsufficientCreditsException`, `ProviderTimeoutException`).
2. Buat *Global Exception Handler* di `api/main.py`.

```python
# core/exceptions.py
class InsufficientCreditsException(Exception):
    pass

# api/main.py
@app.exception_handler(InsufficientCreditsException)
async def insufficient_credits_handler(request: Request, exc: InsufficientCreditsException):
    return JSONResponse(
        status_code=402,
        content={"error": "Payment Required", "message": "Kredit Anda tidak mencukupi untuk operasi ini."}
    )
```

---

## 4. Pola Abstraksi Provider (Adapter Pattern)

Mengingat platform ini sangat bergantung pada model AI dari pihak ketiga (OpenAI, Replicate, Deepgram), kita **dilarang** meng-import dan memanggil SDK *provider* secara langsung di dalam *service* atau *worker*.

Terapkan **Adapter Pattern**:
1. Definisikan `Abstract Base Class (ABC)` untuk setiap kategori AI.
2. Buat implementasi adapter untuk *provider* yang digunakan.
3. *Service* hanya memanggil abstraksinya.

Ini memudahkan *hot-swap* (penggantian model tanpa merusak aplikasi) dan *mocking* untuk *testing* tanpa memotong kuota API sungguhan.

---

## 5. Pola Pekerja Latar Belakang (Event-Driven Inngest)

Karena sistem *backend* diubah dari Celery menjadi **Inngest**, pola pikir kita berubah dari "Queue & Task" menjadi "Event & Workflow".

- **Asynchronous API**: *Router API* harus sangat cepat merespons. Tanggung jawabnya hanya menyimpan data mentah ke *database* dan **menyebarkan (emit) *event***, lalu langsung me-return status `202 Accepted`.
- **Idempotency**: Setiap fungsi Inngest (`@inngest.create_function`) wajib bersifat *idempotent*. Artinya, jika Inngest gagal di tengah jalan dan me-*retry* eksekusi (menjalankannya 2x), hasilnya tidak boleh merusak data (misalnya memotong kredit dua kali).
- **Step Functions**: Manfaatkan `step.run()` di dalam fungsi Inngest. Inngest akan membuat *checkpoint* otomatis setelah step selesai. Jika step berikutnya gagal, *retry* akan langsung melompat (resume) ke step yang gagal tanpa mengulangi step awal yang sudah sukses.

```python
# inngest_fns/media_functions.py
@inngest_client.create_function(
    fn_id="process-clipper-video",
    trigger=inngest.TriggerEvent(event="clipper/process.requested"),
)
async def process_video(ctx: inngest.Context, step: inngest.Step):
    
    # Checkpoint 1: Download Video
    video_path = await step.run("download_video", lambda: download_from_youtube(ctx.event.data["url"]))
    
    # Checkpoint 2: Extract Audio
    audio_path = await step.run("extract_audio", lambda: extract_audio_from_video(video_path))
    
    # Trigger Event Lanjutan (Choreography Pattern)
    await step.send_event("trigger_transcribe", inngest.Event(
        name="ai/transcribe.requested", 
        data={"audio_path": audio_path, "project_id": ctx.event.data["project_id"]}
    ))
```

---

## 6. Atomic Ledger (Penanganan Race Condition)

Dalam sistem berbasis *kredit virtual*, *race condition* sering terjadi ketika *user* melakukan dua operasi mahal secara bersamaan (misal klik tombol *Generate* dua kali cepat). 

- **Row-Level Lock**: Wajib gunakan kombinasi `with_for_update()` di dalam transaksi `async with session.begin()` untuk membaca dan memotong saldo. Ini memastikan sistem *PostgreSQL* mengunci *row user* hingga pemotongan selesai.
- **Prinsip HOLD-CAPTURE**: Saat *Job* dimulai, jangan langsung memotong kredit secara permanen. Ubah saldo melalui status `HOLD` (ditahan). Jika *Job* di Inngest sukses, lakukan `CAPTURE`. Jika gagal atau eror, lakukan `RELEASE` untuk mengembalikan *HOLD* tersebut secara otomatis.

---

## 7. Penamaan & Konvensi Kode (Style Guide)

- **Linter & Formatter**: Wajib menggunakan `ruff` untuk memformat kode sebelum *commit* (akan dipasang *pre-commit hook*).
- **Type Hinting**: Gunakan *Type Hinting* Python secara disiplin di mana saja (contoh: `def calculate(a: int, b: int) -> int:`). Ini sangat penting bagi Pydantic dan performa tim.
- **Penamaan**:
  - `snake_case` untuk nama variabel, fungsi, dan nama *file*.
  - `PascalCase` untuk nama *Class* (Model ORM, Skema Pydantic, Exception).
  - `UPPER_SNAKE_CASE` untuk *constant variables* (konstanta).
- **Lokasi Skema Pydantic**: Pydantic sebaiknya tidak dicampur di `models/` dengan kelas SQLAlchemy/SQLModel. Buat file terpisah seperti `schemas/user.py` atau `schemas.py` di dalam setiap router modul.
