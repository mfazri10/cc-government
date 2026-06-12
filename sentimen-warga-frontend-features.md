# 🖥️ Frontend Feature List — Sentimen Warga Dashboard

> Berdasarkan backend API yang tersedia, frontend-pattern.md, dan kebutuhan modul Sentimen Warga.

---

## 📦 Dependencies yang Perlu Diinstall

```bash
pnpm add zustand zod react-hook-form @hookform/resolvers recharts clsx tailwind-merge lucide-react
pnpm add -D @tanstack/react-query  # opsional, untuk polling real-time
```

---

## 🏗️ Struktur Direktori (Sesuai frontend-pattern.md)

```
src/
├── app/
│   ├── layout.tsx                       # Root layout + font + providers
│   ├── page.tsx                         # Landing / redirect ke login
│   ├── login/page.tsx                   # F01 - Halaman Login
│   └── dashboard/
│       ├── layout.tsx                   # Dashboard shell (sidebar + topbar)
│       ├── page.tsx                     # F02 - Dashboard Overview
│       ├── sentimen/page.tsx            # F03 - Sentimen Analytics
│       ├── feedbacks/page.tsx           # F04 - Feedback Explorer
│       ├── pengaduan/page.tsx           # F05 - Pengaduan Intelligence
│       ├── target-entities/page.tsx     # F06 - Target Entity Manager
│       ├── users/page.tsx               # F07 - User Management
│       ├── roles/page.tsx               # F08 - Role & Permission Manager
│       └── menus/page.tsx               # F09 - Menu Management
│
├── components/                          # Shared UI components
│   ├── ui/                              # Primitives (Button, Input, Card, Modal, Badge, etc.)
│   ├── charts/                          # Chart wrappers (PieChart, BarChart, LineChart)
│   ├── layout/                          # Sidebar, Topbar, Breadcrumb
│   └── data-table/                      # Reusable DataTable + pagination
│
├── features/
│   ├── auth/
│   │   ├── components/                  # LoginForm
│   │   ├── actions.ts                   # Server actions (login, logout)
│   │   ├── hooks/useAuth.ts             # Auth state hook
│   │   └── types.ts
│   ├── dashboard/
│   │   ├── components/                  # StatCard, OverviewGrid
│   │   └── actions.ts                   # Fetch dashboard overview
│   ├── sentimen/
│   │   ├── components/                  # SentimentPieChart, EmotionTrend, TopIssuesBar
│   │   └── actions.ts                   # Fetch analytics data
│   ├── feedbacks/
│   │   ├── components/                  # FeedbackTable, FeedbackDetail, LiveFeed
│   │   └── actions.ts                   # Fetch/filter feedbacks
│   ├── target-entities/
│   │   ├── components/                  # EntityTable, EntityFormModal
│   │   └── actions.ts                   # CRUD target entities
│   ├── users/
│   │   ├── components/                  # UserTable, UserFormModal, RoleAssigner
│   │   └── actions.ts                   # CRUD users
│   ├── roles/
│   │   ├── components/                  # RoleTable, PermissionCheckboxGrid
│   │   └── actions.ts                   # CRUD roles + assign permissions
│   └── menus/
│       ├── components/                  # MenuTree, MenuFormModal
│       └── actions.ts                   # CRUD menus
│
├── lib/
│   └── api.ts                           # Base API client (fetch wrapper ke FastAPI)
├── types/
│   └── index.ts                         # Global shared types
└── utils/
    ├── cn.ts                            # clsx + tailwind-merge
    └── format.ts                        # formatDate, formatNumber helpers
```

---

## 📋 Daftar Fitur (Feature List)

### F01 — Login Page
| Item | Detail |
|------|--------|
| **Endpoint** | — (auth via JWT, future) |
| **Komponen** | `LoginForm` (email + password) |
| **Validasi** | Zod + React Hook Form |
| **State** | Zustand `useAuthStore` (menyimpan user + token + permissions) |
| **Catatan** | Untuk MVP, bisa hardcode token atau bypass auth. Prioritas rendah. |

---

### F02 — Dashboard Overview ⭐ (Prioritas Tinggi)
| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/v1/analytics/dashboard` |
| **Komponen** | `StatCard` (4 kartu: Total Feedback, Positif, Negatif, Perlu Perhatian) |
| **Visualisasi** | Mini trend sparkline di setiap stat card |
| **UX** | Auto-refresh tiap 60 detik (opsional: TanStack Query polling) |
| **Layout** | Grid 4 kolom (stat cards) + 2 kolom (pie chart + top issues bar chart) |

---

### F03 — Sentimen Analytics ⭐ (Prioritas Tinggi)
| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/v1/analytics/sentiment-summary`, `GET /api/v1/analytics/top-issues` |
| **Komponen Utama** | |
| — Pie Chart | Persentase Positif vs Negatif vs Netral (Recharts) |
| — Bar Chart | Top 10 isu/keluhan terbanyak |
| — Line Chart | Tren sentimen harian (30 hari terakhir) |
| **Filter** | Dropdown rentang waktu (7 hari, 30 hari, 90 hari) |

---

### F04 — Feedback Explorer ⭐ (Prioritas Tinggi)
| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/v1/feedbacks?page=1&sentiment=NEGATIVE&entity_id=3` |
| **Komponen Utama** | |
| — DataTable | Tabel paginated (content, sentimen, emosi, source, waktu) |
| — Filter Bar | Filter by: Sentimen, OPD/Entity, Date range |
| — Badge | Warna badge berdasarkan sentimen (Hijau/Merah/Abu) |
| — Detail Modal | Klik baris → tampilkan konten lengkap + topics + summary |
| **Fitur Spesial** | Badge "⚠️ Perlu Perhatian" untuk `needs_attention: true` |

---

### F05 — Pengaduan Intelligence (Prioritas Sedang)
| Item | Detail |
|------|--------|
| **Deskripsi** | View khusus untuk feedback bersentimen NEGATIVE yang sudah di-route ke OPD tertentu |
| **Komponen** | Reuse `FeedbackTable` dengan filter `sentiment=NEGATIVE` |
| **Tambahan** | Hotspot map (opsional, fase lanjutan) |

---

### F06 — Target Entity Manager (Prioritas Sedang)
| Item | Detail |
|------|--------|
| **Endpoint** | `CRUD /api/v1/target-entities` |
| **Komponen** | `EntityTable` + `EntityFormModal` (Create/Edit) |
| **Field Form** | name, entity_type (dropdown), keywords (tag input), pic_contact |
| **Validasi** | Zod schema |

---

### F07 — User Management (Prioritas Sedang)
| Item | Detail |
|------|--------|
| **Endpoint** | `CRUD /api/v1/users` |
| **Komponen** | `UserTable` + `UserFormModal` |
| **Fitur** | Assign roles ke user via multi-select/checkbox |
| **Field Form** | name, email, password, role_ids |

---

### F08 — Role & Permission Manager (Prioritas Sedang)
| Item | Detail |
|------|--------|
| **Endpoint** | `CRUD /api/v1/roles`, `GET /api/v1/permissions` |
| **Komponen** | `RoleTable` + `PermissionCheckboxGrid` |
| **UX** | Grid checkbox: baris = permissions, kolom = roles. Centang/uncentang langsung. |
| **Catatan** | Ini fitur admin only (`super_admin` / `admin`). |

---

### F09 — Menu Management (Prioritas Rendah)
| Item | Detail |
|------|--------|
| **Endpoint** | `CRUD /api/v1/menus`, `GET /api/v1/menus/user/{id}` |
| **Komponen** | `MenuTree` (drag-and-drop tree view) + `MenuFormModal` |
| **Fitur** | Nested menu, set icon (Lucide), set order, aktif/nonaktif |
| **Catatan** | Fitur ini melengkapi RBAC agar sidebar dinamis sesuai role user. |

---

### F11 — Source & Ingestion Manager (Prioritas Sedang)
| Item | Detail |
|------|--------|
| **Endpoint** | `CRUD /api/v1/sources`, `POST /api/v1/scrape/trigger` |
| **Komponen** | `SourceTable` + `ScrapeControlPanel` |
| **Fitur** | Kelola URL/Keyword sumber data (Google Maps, Twitter). Menampilkan waktu *scrape* terakhir, dan tombol manual trigger *Ingestion Pipeline* via Inngest. |

---

### F12 — EWS / Alert Logs (Prioritas Sedang)
| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/v1/alerts` |
| **Komponen** | `AlertHistoryTable` |
| **Fitur** | Menampilkan riwayat notifikasi peringatan dini (EWS) yang dikirim ke Telegram PIC saat terjadi anomali keluhan warga. |

---

### F10 — Dashboard Shell (Layout) ⭐ (Prioritas Tinggi)
| Item | Detail |
|------|--------|
| **Komponen** | `Sidebar`, `Topbar`, `Breadcrumb` |
| **Sidebar** | Navigasi dinamis dari API `/menus/user/{id}` (sesuai permission). Icon dari Lucide React. |
| **Topbar** | User info (nama + role), tombol logout, dark mode toggle |
| **Responsive** | Sidebar collapse di mobile (hamburger menu) |
| **Theme** | Dark mode by default (premium look). Glassmorphism cards. |

---

## 🎯 Urutan Pengerjaan (Recommended)

| Prioritas | Fitur | Estimasi |
|-----------|-------|----------|
| 🔴 1 | **F10 — Dashboard Shell** (layout, sidebar, topbar) | 1 hari |
| 🔴 2 | **F02 — Dashboard Overview** (stat cards + charts) | 1 hari |
| 🔴 3 | **F03 — Sentimen Analytics** (pie, bar, line charts) | 1 hari |
| 🔴 4 | **F04 — Feedback Explorer** (data table + filters) | 1 hari |
| 🟡 5 | **F06 — Target Entity Manager** (CRUD) | 0.5 hari |
| 🟡 6 | **F07 — User Management** (CRUD + role assign) | 0.5 hari |
| 🟡 7 | **F08 — Role & Permission Manager** (checkbox grid) | 0.5 hari |
| 🟢 8 | **F05 — Pengaduan Intelligence** (filtered view) | 0.5 hari |
| 🟢 9 | **F11 — Source & Ingestion Manager** (CRUD & trigger) | 0.5 hari |
| 🟢 10 | **F12 — EWS / Alert Logs** (history view) | 0.5 hari |
| 🟢 11 | **F01 — Login Page** (auth flow) | 0.5 hari |
| 🟢 12 | **F09 — Menu Management** (tree view) | 0.5 hari |

**Total Estimasi: ~8 hari kerja**

---

## 🎨 Design Direction

- **Theme**: Dark mode primary, glassmorphism cards, gradient accents
- **Color Palette**: Slate/Zinc base + Emerald (positif) + Rose (negatif) + Amber (netral/warning)
- **Typography**: Inter (dari Google Fonts)
- **Icons**: Lucide React
- **Charts**: Recharts (modern, responsive, customizable)
- **Animation**: Subtle transitions (framer-motion opsional)
