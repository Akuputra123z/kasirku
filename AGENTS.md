# AGENTS.md — POS Multi-Tenant Toko Komputer

## Arsitektur Tenancy

- **Stancl Tenancy v3 — database terpisah per tenant** (bukan row-level `tenant_id`). Setiap tenant punya database sendiri (`tenant_{id}`).
- Identifikasi tenant via **subdomain** (`toko1.amerta.test`). Juga support query param `?tenant=slug` + cookie untuk dev localhost.
- Central DB (`mysql`/`sqlite`) berisi: users, tenants, domains, permission_tables_central, impersonation_tokens, tenant_user_lookups.
- Tenant DB berisi semua data bisnis: categories, products, transactions, shifts, customers, vouchers, dll.
- TenantSeeder (`config/tenancy.php` `seeder_parameters.class`) jalan otomatis saat `tenants:migrate-fresh`. Tidak ada command `tenants:seed` terpisah.

## Commands Penting

| Command | Keterangan |
|---|---|
| `vendor/bin/pint --format agent` | Format semua PHP (wajib sebelum commit) |
| `npm run build` | Build frontend production |
| `npm run dev` | Dev server Vite |
| `npm run format` | Prettier resources/ |
| `npm run lint:check` | ESLint check saja |
| `npm run types:check` | TypeScript type check (`tsc --noEmit`) |
| `php artisan test --compact` | Jalankan semua test (Pest) |
| `php artisan tenants:migrate-fresh` | Reset + seed ulang semua tenant database |
| `php artisan wayfinder:generate` | Generate ulang route/action types di resources/js/ |
| `php artisan route:list --path=api --method=GET` | Filter route list |

## Struktur Kunci

- **Tenant migrations:** `database/migrations/tenant/` (bukan `database/migrations/`)
- **Central migrations:** `database/migrations/` (users, tenants, domains, permissions)
- **Routes tenant:** `routes/tenant.php` (semua route bisnis di sini)
- **Routes central:** `routes/web.php` (welcome, admin, register store)
- **Frontend pages:** `resources/js/pages/` (Inertia)
- **Layout dipilih otomatis** di `resources/js/app.tsx` berdasarkan nama page (`auth/*` → AuthLayout, `settings/*` → `[AppLayout, SettingsLayout]`, sisanya → AppLayout)
- **Wayfinder:** Import route dari `@/routes/` (named routes) atau action dari `@/actions/` (controller methods). Generate berarti ada.
- **shadcn/ui components** di `resources/js/components/ui/` — cek sebelum bikin komponen baru.

## Key Middleware (urut prioritas)

1. `InitializeTenancyIfSubdomain` — deteksi tenant dari subdomain/query/cookie, init tenancy
2. `PreventAccessFromTenantDomains` — blokir akses tenant ke route `/admin/*`
3. `EnsureTenancyIsInitialized` — redirect ke login jika tenancy belum init (untuk route tenant)
4. `HandleCentralAdminContext` — login ulang sebagai central admin saat di route `/admin/*`
5. `HandleInertiaRequests` — share `tenant`, `auth.permissions`, `auth.roles`, `centralAdmin` ke semua Inertia response

## Frontend Patterns

- **Import route:** `import posRoute from '@/routes/pos'` lalu `posRoute.url()` atau `posRoute.get()` / `posRoute.post()` / `posRoute.form()`
- **Import action:** `import { DashboardController } from '@/actions/App/Http/Controllers/DashboardController'`
- **Forms:** `useForm` dari `@inertiajs/react` untuk form dengan validasi; `router.post`/`router.patch` untuk aksi sederhana
- **State management:** Tidak ada Redux/Zustand — data dikirim via Inertia props. Gunakan `usePage()` untuk shared props.
- **Search/filter:** `router.get(route, { search }, { preserveState: true, replace: true })` (Inertia partial reload)
- **Toasts:** `toast.success()` / `toast.error()` dari `sonner`
- `"use client"` di atas setiap page/component yang pakai hooks/event listeners
- Path alias: `@/` → `resources/js/`

## Backend Patterns

- **Authorization:** `Gate::authorize('permission-name')` di awal method (Spatie Permission)
- **Excel import:** `Maatwebsite\Excel\Facades\Excel::toArray()` di controller, file validation `mimes:xlsx,xls,csv|max:5120`
- **Excel export:** Class di `app/Exports/` implement `FromArray, WithHeadings`
- **Seeders:** Jangan panggil CategorySeeder dari DatabaseSeeder (itu central DB). Harus dari TenantSeeder.
- Tidak ada Global Scope untuk `tenant_id` — isolasi via separate database.
- SoftDeletes ada, tapi **tidak ada unique constraint protection** khusus untuk data yang di-soft-delete. Perlu manual `withTrashed()->where(...)` di validasi.

## Testing

- **Pest** dengan `RefreshDatabase` di `tests/Feature/`
- Run: `php artisan test --compact`
- Buat test: `php artisan make:test --pest NamaTest`
- Auth tests di `tests/Feature/Auth/`
- Tidak ada database tenancy di test (SQLite :memory:) — test hanya central context
