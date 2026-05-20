Bertindaklah sebagai Senior Software Architect, Security Expert, dan Database Engineer ahli Laravel & Inertia.js. Saya ingin membangun sistem SaaS POS (Point of Sales) untuk bisnis retail UMKM Toko Elektronik dan Komputer.

Sistem ini HARUS dirancang dengan pendekatan arsitektur Single Database Multi-Tenancy (Row-Level Isolation menggunakan `tenant_id`) berbasis MySQL demi efisiensi resource server, skalabilitas biaya UMKM, dan kemudahan migrasi data saat production.

Spesifikasi Teknologi:

- Backend: Laravel 13 (Latest Stable) & Eloquent ORM.
- Frontend: Inertia.js (React dengan TypeScript) & Tailwind CSS.
- State & Query: Memanfaatkan Inertia Partial Reloads untuk optimasi pencarian data produk di kasir agar hemat bandwidth.

Spesifikasi Manajemen Akses (RBAC Multi-Tenant):

1. Super Admin (Global): Memiliki akses penuh ke seluruh ekosistem SaaS. Dilengkapi dengan fitur "Impersonate" (aman dan berbasis session tracking) untuk menyamar sebagai tenant tertentu guna keperluan troubleshooting tanpa mengetahui password tenant.
2. Tenant Owner (Toko): Pemilik toko dengan isolasi data mutlak.
3. Custom Tenant Roles: Tenant Owner bisa membuat role kustom secara dinamis (seperti Kasir, Admin Gudang, Teknisi Servis) dengan granular permissions yang disimpan secara efisien (misal memanfaatkan kolom JSON array atau tabel per-tenant permission yang terindeks).

Karakteristik Unik Toko Komputer/Elektronik yang Wajib Diakomodasi:

- Pelacakan Serial Number (IMEI/SN): Satu produk bisa memiliki banyak SN unik. Harus bisa melacak status SN (Available, Sold, Service, Claimed/Retur).
- Manajemen Multi-Gudang/Cabang: Pelacakan stok terisolasi per lokasi gudang/toko fisik di dalam satu tenant.
- Manajemen Garansi & Modul Servis: Pencatatan barang servis masuk dari pelanggan, progress pengerjaan oleh Teknisi, hingga kalkulasi biaya sparepart + jasa.
- Paket Langganan SaaS: Modul internal untuk mencatat status subscription tenant (Active, Suspended, Grace Period).

Tolong buatkan blueprint teknis yang mencakup:

1. Desain Arsitektur Sistem & Struktur Folder yang menerapkan Modular System atau Clean DDD (Domain-Driven Design) yang disederhanakan di dalam Laravel agar kode terisolasi dengan baik.
2. Skema Database (Laravel Migrations Lengkap) yang ternormalisasi (3NF jika perlu) dan sangat "load-optimized". Wajib sertakan Composite Indexing yang tepat (menggabungkan `tenant_id` dengan SKU, Barcode, SN, Invoice Number, dan Created_at) untuk memastikan query super cepat ketika baris data menyentuh jutaan row global.
3. Implementasi Kode Keamanan Isolasi Tenant: Tunjukkan cara membuat Global Query Scope dan Model Observer/Trait secara native di Laravel agar pengisian dan penyaringan `tenant_id` berjalan otomatis di layer Eloquent tanpa perlu ditulis manual di Controller (mencegah human error/kebocoran data antar kompetitor).
4. Strategi Caching & Optimasi Query: Tunjukkan implementasi Redis Cache untuk menampung konfigurasi role/permission tenant, cara mencegah N+1 Query secara strict di production, dan cara melakukan parsial data render menggunakan Inertia.js saat transaksi kasir sedang padat.
