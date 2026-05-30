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

## Printing (macOS + RPP02N Bluetooth / USB)

### Architecture

```
[Success Modal] → POST /print/receipt/{id}?driver={driver}
                    ↓
           PrintController (rate-limited 1 hit / 10 detik per user+transaksi)
                    ↓
           resolveConnector(driver)
              ├── file    → FilePrintConnector      (ke storage/logs/receipts/)
              ├── usb     → CupsPrintConnector       (via CUPS `lp -d printer -o raw`)
              ├── bluetooth → BluetoothPrintConnector (via Python send-receipt.py)
              ├── network → NetworkPrintConnector    (TCP socket ke host:port)
              └── windows → WindowsPrintConnector    (Windows SMB)
                    ↓
           Jika gagal → fallback otomatis ke file driver
```

### Default: `PRINT_DRIVER=file` (paling aman & stabil)

Receipt disimpan ke `storage/logs/receipts/{timestamp}_{uniqid}.bin`. Tidak ada risiko hang/blokir HTTP request. Cetak manual via:

```bash
./send-receipt-to-printer.sh              # cetak file .bin terbaru
./send-receipt-to-printer.sh path/file    # cetak file tertentu
```

### Tombol di Success Modal (POS)

| Tombol | Driver | Use Case |
|---|---|---|
| **Cetak Bluetooth** | `bluetooth` | RPP02N via Python + serial |
| **Cetak Printer (USB)** | `usb` | Printer USB via CUPS (`lp`) |
| **Simpan Struk (File)** | `file` | Simpan ke disk, cetak nanti |

### Keamanan & Stabilitas

- **Rate limiting:** Session-based, 1 print per 10 detik per user+transaksi (cegah double-click)
- **Fallback file:** Setiap driver gagal → otomatis simpan ke file, user tetap dapat struk
- **No raw `exec()`:** Semua penggunaan `exec()` diganti dengan `Symfony\Component\Process\Process` (timeout 15-30 detik)
- **Symfony Process:** Timeout, error output capture, exit code checking
- **Unique filename:** Timestamp + `uniqid()` untuk hindari tabrakan nama file

### Driver Config

| Env | Default | Driver |
|---|---|---|
| `PRINT_DRIVER` | `file` | Semua |
| `PRINT_FILE_PATH` | `storage/logs/receipts` | file |
| `PRINT_BLUETOOTH_DEVICE` | `/dev/cu.RPP02N` | bluetooth |
| `PRINT_BLUETOOTH_MAC` | — | bluetooth |
| `PRINT_USB_PRINTER` | `STMicroelectronics_58Printer` | usb |
| `PRINT_HOST` | `127.0.0.1` | network |
| `PRINT_PORT` | `9100` | network |

### Scripts

| Script | Env Vars |
|---|---|
| `send-receipt.py` | `PRINT_DEVICE`, `PRINT_BAUD`, `PRINT_LOCK_FILE` |
| `send-receipt-to-printer.sh` | `PRINT_DEVICE`, `PRINT_MAC`, `PRINT_BAUD`, `PRINT_RECEIPTS_DIR` |
| `diagnose-printer.sh` | `PRINT_DEVICE`, `PRINT_MAC` |

Semua script membaca env var, fallback ke default hardcoded.

### "Cetak Bluetooth" vs "Print Struk" vs Web Bluetooth

- **"Cetak Bluetooth"** (backend, POS success modal): PHP → Python script → serial port (`/dev/cu.RPP02N`). **Ini yang berfungsi untuk RPP02N.**
- **"Print Struk"** (react-to-print, history page): browser native print dialog untuk printer thermal yang terdaftar di System Settings via CUPS driver.
- **Web Bluetooth API** (`use-bluetooth-print.ts`): **RPP02N tidak support**. RPP02N pakai Classic SPP, Web Bluetooth hanya untuk BLE. Hook ini disimpan untuk masa depan (printer BLE).

### Tips Deploy / Production

1. Set `PRINT_DRIVER=file` — jangan pernah set ke `bluetooth` atau `usb` di production tanpa testing
2. Pastikan `storage/logs/receipts/` writable
3. Untuk cetak realtime production: pasang queue worker (`QUEUE_CONNECTION=database`) dan buat `PrintReceiptJob`
4. Di macOS local: tetap pakai `file` + `./send-receipt-to-printer.sh` untuk kirim ke RPP02N
