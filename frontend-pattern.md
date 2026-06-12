# Standar dan Pattern Next.js (TypeScript)

Dokumen ini merangkum *best practices*, standar arsitektur, serta *pattern* modern untuk pengembangan aplikasi Next.js (App Router) menggunakan TypeScript, demi menjaga kualitas *codebase* jangka panjang dan memudahkan kolaborasi.

---

## 1. Arsitektur & Struktur Direktori

Daripada menumpuk semua kode di direktori `components`, gunakan kombinasi pendekatan berbasis turunan fungsional (**Feature-Sliced**) di dalam folder `src/`.

```text
src/
├── app/                  # File routing Next.js (page.tsx, layout.tsx, route.ts, dll)
├── components/           # UI Components yang global/general (Button, Input, Card, Modal)
├── features/             # Modul logika khusus per fitur (sangat dianjurkan untuk project besar)
│   ├── authentication/
│   │   ├── components/   # Komponen UI spesifik untuk modul login/register
│   │   ├── hooks/        # Custom hooks spesifik otentikasi
│   │   ├── actions.ts    # Server Actions murni untuk otentikasi
│   │   └── types.ts      # Type definintions terkait auth
├── lib/                  # Konfigurasi Pihak ke-3 & helper eksternal (dbClient, supabase, dll)
├── types/                # Definisi TypeScript global (hindari menaruh type spesifik disini)
└── utils/                # Helper / fungsi utilitas kecil murni (formatDate, formatCurrency)
```

**Rekomendasi:** Selalu pertahankan folder `app/` agar sebersih mungkin. Hanya simpan logika *routing*, deklarasi halaman (`page.tsx`), dan pemuatan data tingkat tinggi (*server-fetching*) di sana. Usahakan pendenlegasian visual diturunkan ke `components/` atau `features/`.

---

## 2. Pola Penulisan Komponen (Server vs Client)

Sebagai *default*, di Next.js dengan arsitektur *App Router*, seluruh komponen adalah **Server Component**. 

### Server Components (SC)
Gunakan *Server Component* untuk kasus di mana Anda butuh *backend access*, performa respons cepat (HTML langsung di-render HTML), dan untuk *Search Engine Optimization* (SEO).
- Akses dan memuat data (fetch) langsung dari database atau sistem eksternal internal.
- Menjaga hal-hal yang bersifat rahasia (*API keys*, dll).

### Client Components (CC)
Tandai komponen menggunakan arahan `"use client"` di baris no 1. Hanya gunakan ini bila:
- Komponen menggunakan *state* dan sekuritas siklus hidup (`useState`, `useEffect`, `useReducer`).
- Butuh interaksi langsung dari user (`onClick`, `onChange`).
- Perlu mengakses API interaksi DOM bawaan klien (seperti `window`, `localStorage`).

**Pattern Terbaik ("Leave the Leaves to Client"):**  
Jangan jadikan satu layout/page keseluruhan sebagai `Client Component`. Isolasi *state* sejauh mungkin ke bawah hierarki komponen.

```tsx
// ❌ HINDARI: Menjadikan satu Page menjadi Client Component
"use client"
import StaticNavbar from "@/components/StaticNavbar";
import { useState } from "react";

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <StaticNavbar /> {/* Akan dirender di sisi client, bundle membesar */}
      <Button onClick={() => setIsOpen(true)}>Buka Pilihan</Button>
    </div>
  )
}

// ✅ REKOMENDASI: Isolasi Client Component ke komponen khusus (misal DropdownButtonInteractive)
import StaticNavbar from "@/components/StaticNavbar";
import DropdownButtonInteractive from "@/features/article/components/DropdownButtonInteractive";

export default function Page() {
  return (
    <div>
      <StaticNavbar /> {/* Tetap menjadi Server Component */}
      <DropdownButtonInteractive /> {/* Hanya komponen ini yang memakai 'use client' */}
    </div>
  )
}
```

---

## 3. Standar Kebersihan TypeScript

- **Wajib `strict: true`**: Tetap pastikan file `tsconfig.json` memiliki status setingan kompilasi berjenis ketat (strict).
- **Interface vs Type**:
  - Gunakan `interface` mendefinisikan bentuk props komponen (*object* terstruktur yang rentan diekstensi di masa depan).
  - Gunakan `type` variasi tipe (union, tupel, dll) contohnya `type Status = "idle" | "loading"`.
- **Cegah Penggunaan `any`**:
  - Jangan gunakan tipe sakti `any`. Jika respons pihak ketiga belum dinamis, definisikan dengan tipe `unknown` lalu gunakan validasi eksternal Zod.

**Pattern Props Standar:**
Contoh mendefinisikan properti komponen:

```tsx
import type { ReactNode } from "react";

export interface CardProps {
  title: string;
  description?: string; // Tanda tanya untuk elemen opsional
  children: ReactNode;  // Gunakan ReactNode untuk element pembungkus
}

export function Card({ title, description, children }: CardProps) {
    return (
        <div>
           <h2>{title}</h2>
           {description && <p>{description}</p>}
           {children}
        </div>
    )
}
```

---

## 4. Pola Mengambil Data & Melakukan Perubahan Server

1. **Memuat Data (*Read/Query*)**:  
   Gunakan struktur deklarasi pemanggilan `async/await` murni dari fitur integrasi native *Next.js 14/15/16* (`fetch`). Diusahakan untuk tidak melakukan *Data Fetching* dari sisi client (`onClick` / `useEffect`) apabila datanya bisa diambil dari parameter URL atau Server Component.

2. **Perubahan Data Server (*Write/Mutations*)**:  
   Wajib menggunakan utilitas **Server Actions**. Simpan sekumpulan fungsi di sebuah file terpisah (contoh `actions.ts`) di mana bagian kodenya wajib menyematkan label atas `"use server"`.

---

## 5. Rekomendasi Libraries Penunjang Modern (Tech Stack Teruji)

Apabila mengembangkan proyek *large scaling / Enterprise* dalam ekosistem Next.js TypeScript, berikut ini opsi pattern paling direkomendasikan dan kokoh. 

### A. Validasi Skema / Data -> **Zod**
Wajib melengkapi antarmuka sistem yang berurusan langsung dengan masukan/API external yang tidak stabil dengan Zod. Mengkonversi Type *script* saja pada *runtime production* itu tidak berlaku.

```typescript
import { z } from "zod";

export const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18, "Umur minimal 18"),
});

export type UserObject = z.infer<typeof UserSchema>; 
```

### B. Form Kompleks Terkelola -> **React Hook Form + Zod**
Manajemen formulir (pendaftaran, formulir entri pengguna) yang meminimalisir re-render ketimbang menggunakan varian form tipe useState bawaan.
Bungkus `react-hook-form` beserta penyesuai pengaitan dari validasinya ke Zod (`@hookform/resolvers/zod`).

### C. Abstraksi dan Penggabung Class HTML CSS -> **clsx + tailwind-merge**
Wajib mencegah *bug styling* bila kelas CSS utility berbentrokan / digabung kondisional secara asinkron. Abstraksi helper penulisan ini biasa disebut file pengelola string `cn`.

```tsx
// src/utils/cn.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Implementasi kondisional pada komponen
<div className={cn("bg-red-500 rounded p-4", props.isActive && "bg-blue-500 uppercase")} />
```

### D. Manajemen State Lokal Global -> **Zustand**
Hindari sistem rumit semacam *Redux* yang butuh `Store Provider Provider` tingkat tinggi jika konteks data terbatas (Hanya berlaku untuk `client`).
Pengembang komunitas mayoritas memilih **Zustand** yang dapat memecahkan sinkronisasi kompleks state client dengan beban penulisan minimal dan *clean pattern*.

### E. *Server State Synchronization* Khusus Klien -> **TanStack Query** *(Opsional)*
Sejauh ini pendelegasian komponen Next JS *App Router Server Actions & Server Component* sangatlah mumpuni. Namun khusus kasus UI kompleks, misalnya _polling tabel data 2 arah secara periodik 1 detik sekali_ di sisi client, sangat cocok didelegasikan secara tangguh di sisi klient menggunakan TanStack Query (React Query).
