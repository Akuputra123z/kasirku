<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DummyDataSeeder extends Seeder
{
    private const array CATEGORIES = [
        ['name' => 'Makanan & Minuman', 'description' => 'Makanan ringan, berat, dan minuman siap saji.'],
        ['name' => 'Elektronik & Gadget', 'description' => 'HP, laptop, aksesoris elektronik, dan perangkat digital.'],
        ['name' => 'Fashion & Aksesoris', 'description' => 'Pakaian, hijab, sepatu, tas, dan aksesoris fesyen.'],
        ['name' => 'Kesehatan & Kecantikan', 'description' => 'Obat, vitamin, skincare, kosmetik, dan perawatan tubuh.'],
        ['name' => 'Perlengkapan Rumah', 'description' => 'Peralatan dapur, furnitur, dekoraasi, dan kebersihan rumah.'],
        ['name' => 'Olahraga & Outdoor', 'description' => 'Alat olahraga, perlengkapan camping, dan aksesoris fitness.'],
        ['name' => 'Otomotif', 'description' => 'Aksesoris mobil/motor, oli, ban, dan perlengkapan otomotif.'],
        ['name' => 'Buku & Alat Tulis', 'description' => 'Buku pelajaran, novel, alat tulis kantor, dan perlengkapan sekolah.'],
        ['name' => 'Mainan & Hobi', 'description' => 'Mainan anak, action figure, board game, dan perlengkapan hobi.'],
        ['name' => 'Peralatan Dapur', 'description' => 'Panci, wajan, pisau, blender, dan peralatan memasak lainnya.'],
        ['name' => 'Aksesoris HP', 'description' => 'Casing, tempered glass, charger, power bank, dan aksesoris gadget.'],
        ['name' => 'Souvenir & Hadiah', 'description' => 'Kado, souvenir pernikahan, hampers, dan barang hadiah.'],
        ['name' => 'Produk Bayi & Anak', 'description' => 'Popok, susu formula, mainan edukasi, dan perlengkapan bayi.'],
        ['name' => 'Hewan Peliharaan', 'description' => 'Makanan hewan, kandang, aksesoris, dan perlengkapan pet.'],
        ['name' => 'Lainnya', 'description' => 'Berbagai produk lainnya.'],
    ];

    private const array BRANDS = [
        'Indofood', 'Mayora', 'Nestle', 'Kraft', 'Samsung', 'Apple', 'Xiaomi',
        'Sony', 'LG', 'Panasonic', 'Nike', 'Adidas', 'H&M', 'Uniqlo', 'Converse',
        'Wardah', 'Mustika Ratu', 'The Body Shop', 'Ponds', 'Dove',
        'IKEA', 'Maspion', 'Oxone', 'Tupperware', 'Polytron',
        'Sharp', 'Cosmos', 'Miyako', 'Philips', 'Yamaha',
        'Toyota', 'Honda', 'Mitsubishi', 'Shell', 'Castrol',
        'Yonex', 'Reebok', 'Specs', 'Eiger', 'Consina',
        'Sido Muncul', 'Tolak Angin', 'Komik', 'Gunpla', 'LEGO',
        'Kawasaki', 'Kyoai', 'Puma', 'New Balance', 'Skechers',
        'Dell', 'HP', 'Lenovo', 'Canon', 'Epson',
        'Logitech', 'Kingston', 'Seagate', 'Toshiba', 'Acer',
    ];

    public function run(): void
    {
        $this->command?->info('■■■ MEMULAI SEEDER 300 TENANT + 5000 PRODUK ■■■');

        // ── 1. Tenants ────────────────────────────────────────────
        $this->command?->info('1/6 Membuat 300 tenant...');
        $tenants = Tenant::factory()->count(300)->create();
        $tenantIds = $tenants->pluck('id');
        $this->command?->info('   ✓ '.count($tenants).' tenant created');

        // ── 2. Roles & Permissions ────────────────────────────────
        $this->command?->info('2/6 Membuat roles & permissions...');
        $permissionNames = [
            'view-dashboard', 'manage-products', 'manage-categories', 'manage-brands',
            'manage-payment-methods', 'manage-pos', 'view-history', 'manage-shifts',
            'view-reports', 'export-reports', 'manage-settings', 'manage-users',
            'manage-vouchers', 'manage-suppliers', 'manage-purchases', 'manage-stock',
            'manage-customers',
        ];

        $now = now();

        // Permissions are global (no tenant_id)
        foreach ($permissionNames as $name) {
            DB::table('permissions')->insertOrIgnore([
                'name' => $name,
                'guard_name' => 'web',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
        $allPerms = DB::table('permissions')
            ->whereIn('name', $permissionNames)
            ->where('guard_name', 'web')
            ->get(['id', 'name']);
        $permIds = [];
        foreach ($allPerms as $p) {
            $permIds[$p->name] = $p->id;
        }

        // Roles are per-tenant
        $roleNames = ['admin', 'supervisor', 'kasir'];
        $roleIds = [];
        foreach ($tenants as $tenant) {
            foreach ($roleNames as $name) {
                $roleIds[$tenant->id][$name] = DB::table('roles')->insertGetId([
                    'name' => $name,
                    'guard_name' => 'web',
                    'tenant_id' => $tenant->id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // role_has_permissions (bulk)
        $rhpData = [];
        foreach ($tenants as $tenant) {
            $roles = $roleIds[$tenant->id];

            foreach ($permIds as $permId) {
                $rhpData[] = ['permission_id' => $permId, 'role_id' => $roles['admin']];
            }
            foreach (['view-dashboard', 'view-history', 'view-reports', 'export-reports', 'manage-vouchers', 'manage-suppliers', 'manage-customers'] as $name) {
                $rhpData[] = ['permission_id' => $permIds[$name], 'role_id' => $roles['supervisor']];
            }
            foreach (['view-dashboard', 'manage-pos', 'manage-shifts'] as $name) {
                $rhpData[] = ['permission_id' => $permIds[$name], 'role_id' => $roles['kasir']];
            }
        }
        DB::table('role_has_permissions')->insert($rhpData);
        $this->command?->info('   ✓ Roles & permissions selesai');

        // ── 3. Users ──────────────────────────────────────────────
        $this->command?->info('3/6 Membuat 300 user owner...');
        $userMap = []; // tenantId => userId
        $mhrData = [];

        foreach ($tenants as $tenant) {
            $user = User::create([
                'name' => "Owner {$tenant->name}",
                'email' => "owner-{$tenant->slug}@test.com",
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]);

            TenantUser::create([
                'user_id' => $user->id,
                'tenant_id' => $tenant->id,
                'role' => 'owner',
                'is_active' => true,
            ]);

            $userMap[$tenant->id] = $user->id;
            $mhrData[] = [
                'role_id' => $roleIds[$tenant->id]['admin'],
                'model_type' => 'App\Models\User',
                'model_id' => $user->id,
            ];
        }
        DB::table('model_has_roles')->insert($mhrData);
        $this->command?->info('   ✓ 300 user + tenant_user selesai');

        // ── 4. Categories ─────────────────────────────────────────
        $this->command?->info('4/6 Membuat kategori & brand...');
        $catRows = [];
        $catCount = 0;
        $now = now();
        foreach ($tenantIds as $tid) {
            foreach (self::CATEGORIES as $cat) {
                $catRows[] = [
                    'tenant_id' => $tid,
                    'name' => $cat['name'],
                    'description' => $cat['description'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
                $catCount++;
                if ($catCount % 1000 === 0) {
                    DB::table('categories')->insert($catRows);
                    $catRows = [];
                }
            }
        }
        if ($catRows) {
            DB::table('categories')->insert($catRows);
        }
        unset($catRows);

        $categoryMap = [];
        $allCats = Category::whereIn('tenant_id', $tenantIds)->get(['id', 'tenant_id', 'name']);
        foreach ($allCats as $c) {
            $categoryMap[$c->tenant_id][$c->name] = $c->id;
        }
        unset($allCats);

        // ── 5. Brands ─────────────────────────────────────────────
        $brandRows = [];
        $brandCount = 0;
        $brandDesc = collect(self::BRANDS)->map(fn ($n) => sprintf('Brand %s terpercaya dan berkualitas.', $n))->toArray();
        foreach ($tenantIds as $tid) {
            foreach (self::BRANDS as $i => $name) {
                $brandRows[] = [
                    'tenant_id' => $tid,
                    'name' => $name,
                    'description' => $brandDesc[$i],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
                $brandCount++;
                if ($brandCount % 1000 === 0) {
                    DB::table('brands')->insert($brandRows);
                    $brandRows = [];
                }
            }
        }
        if ($brandRows) {
            DB::table('brands')->insert($brandRows);
        }
        unset($brandRows, $brandDesc);

        $brandMap = [];
        $allBrands = Brand::whereIn('tenant_id', $tenantIds)->get(['id', 'tenant_id', 'name']);
        foreach ($allBrands as $b) {
            $brandMap[$b->tenant_id][$b->name] = $b->id;
        }
        $this->command?->info('   ✓ '.number_format($catCount).' kategori + '.number_format($brandCount).' brand selesai');

        // ── 6. Products ───────────────────────────────────────────
        $this->command?->info('5/6 Membuat 5000 produk (distribusi ke 300 tenant)...');

        $productPool = $this->buildProductPool(5000, $categoryMap, $brandMap);

        $chunks = array_chunk($productPool, 100);
        $progress = 0;
        $totalVariants = 0;
        $totalExtras = 0;
        $variantRows = [];
        $extraRows = [];

        foreach ($chunks as $chunk) {
            $created = [];
            foreach ($chunk as $data) {
                $product = Product::create([
                    'tenant_id' => $data['tenant_id'],
                    'name' => $data['name'],
                    'slug' => $data['slug'] ?? Str::slug($data['name']),
                    'description' => $data['description'],
                    'price' => $data['price'],
                    'cost_price' => $data['cost_price'],
                    'stock' => $data['stock'],
                    'category_id' => $data['category_id'],
                    'brand_id' => $data['brand_id'],
                    'status' => $data['status'],
                    'visible_online' => $data['visible_online'],
                    'online_price' => $data['online_price'],
                    'stock_online' => $data['stock_online'],
                    'weight' => $data['weight'],
                    'sku' => 'SKU-'.$data['tenant_id'].'-'.$data['seq'],
                    'barcode' => fake()->ean13(),
                ]);
                $created[] = $product;

                // Generate variants (2-3 per product)
                $variantCount = rand(2, 3);
                $variantNames = $this->getRandomVariantNames($variantCount);
                foreach ($variantNames as $vName) {
                    $variantRows[] = [
                        'tenant_id' => $product->tenant_id,
                        'product_id' => $product->id,
                        'name' => $vName,
                        'additional_price' => fake()->randomElement([0, 2000, 3000, 5000, 7000, 10000]),
                        'stock' => rand(0, 30),
                        'sku' => 'VAR-'.$product->id.'-'.strtolower(str_replace(' ', '', $vName)),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                $totalVariants += $variantCount;

                // Generate extras (2-3 per product)
                $extraCount = rand(2, 3);
                $extraNames = $this->getRandomExtraNames($extraCount);
                foreach ($extraNames as $eName) {
                    $extraRows[] = [
                        'tenant_id' => $product->tenant_id,
                        'product_id' => $product->id,
                        'name' => $eName,
                        'price' => fake()->randomElement([2000, 3000, 5000, 7500, 10000, 15000, 20000]),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                $totalExtras += $extraCount;
            }

            $progress += count($created);

            // Flush variants/extras every 500 products
            if ($progress % 500 === 0 || $progress === 5000) {
                if ($variantRows) {
                    DB::table('product_variants')->insert($variantRows);
                    $variantRows = [];
                }
                if ($extraRows) {
                    DB::table('product_extras')->insert($extraRows);
                    $extraRows = [];
                }
            }

            if ($progress % 500 === 0) {
                $this->command?->info("   ... {$progress}/5000 produk + variants/extras");
            }
        }

        // Flush remaining
        if ($variantRows) {
            DB::table('product_variants')->insert($variantRows);
        }
        if ($extraRows) {
            DB::table('product_extras')->insert($extraRows);
        }

        $this->command?->info('   ✓ 5000 produk + '.number_format($totalVariants).' varian + '.number_format($totalExtras).' extra selesai');

        // ── Selesai ────────────────────────────────────────────────
        $this->command?->info('');
        $this->command?->info('■■■ SEEDER SELESAI ■■■');
        $this->command?->info('Login: owner-{slug-tenant}@test.com / password');
        $this->command?->info('Contoh: owner-demo-toko-1@test.com / password');
    }

    /**
     * Build 5000 product data entries distributed across tenants.
     */
    private function buildProductPool(int $total, array $categoryMap, array $brandMap): array
    {
        $tenantIds = array_keys($categoryMap);
        shuffle($tenantIds);

        // Distribution: 50 large (~50 each), 100 medium (~15 each), 150 small (~7 each)
        $largeTenants = array_slice($tenantIds, 0, 50);
        $mediumTenants = array_slice($tenantIds, 50, 100);
        $smallTenants = array_slice($tenantIds, 150, 150);

        $distribution = [];
        foreach ($largeTenants as $id) {
            $distribution[$id] = 50;
        }
        foreach ($mediumTenants as $id) {
            $distribution[$id] = 15;
        }
        foreach ($smallTenants as $id) {
            $distribution[$id] = 7;
        }

        // Adjust to exact 5000
        $currentTotal = array_sum($distribution);
        $diff = $total - $currentTotal;
        if ($diff !== 0) {
            $distribution[$largeTenants[0]] += $diff;
        }

        $pool = [];
        $globalSeq = 0;

        foreach ($distribution as $tenantId => $count) {
            $catNames = array_keys($categoryMap[$tenantId]);
            $brandNames = array_keys($brandMap[$tenantId]);

            for ($i = 0; $i < $count; $i++) {
                $globalSeq++;
                $catName = $catNames[array_rand($catNames)];
                $brandName = $brandNames[array_rand($brandNames)];
                $name = $this->randomProductName($catName);

                $basePrice = $this->randomPrice($catName);
                $costPrice = (int) round($basePrice * rand(55, 80) / 100);
                $visible = fake()->boolean(30);

                $pool[] = [
                    'tenant_id' => $tenantId,
                    'name' => $name,
                    'slug' => Str::slug($name.'-'.$globalSeq),
                    'description' => fake()->sentence(rand(5, 12)),
                    'price' => $basePrice,
                    'cost_price' => $costPrice,
                    'stock' => rand(0, 200),
                    'category_id' => $categoryMap[$tenantId][$catName],
                    'brand_id' => $brandMap[$tenantId][$brandName],
                    'status' => fake()->randomElement(['active', 'active', 'active', 'inactive']),
                    'visible_online' => $visible,
                    'online_price' => $visible ? (int) round($basePrice * rand(95, 115) / 100) : null,
                    'stock_online' => $visible ? rand(5, 100) : null,
                    'weight' => rand(50, 5000),
                    'seq' => $globalSeq,
                ];
            }
        }

        return $pool;
    }

    private function randomProductName(string $category): string
    {
        $pools = [
            'Makanan & Minuman' => [
                'Indomie Goreng', 'Indomie Kuah Rendang', 'Mie Sedap Ayam Bawang',
                'Chitato Sapi Panggang', 'Qtela Balado', 'Cheetos Jagung Bakar',
                'Kopiko 78 Coffee Candy', 'Kacang Garuda', 'Taro Net Seaweed',
                'Silver Queen Dark', 'Beng Beng White', 'Oreo Original',
                'Good Day Cappuccino', 'Nescafe Classic', 'Teh Botol Sosro',
                'Pocari Sweat', 'Aqua 600ml', 'Coca Cola 390ml',
                'Fanta Strawberry', 'Sprite 390ml', 'Ultra Milk Full Cream',
                'Indomilk Susu Kental Manis', 'Milo Active Go', 'Koko Krunch',
                'Roti Tawar Sariroti', 'Sari Gandum Sandwich', 'Roma Malkist Crackers',
                'Super Bubur Ayam', 'Pop Mie Kari Ayam', 'Better Fruit Punch',
            ],
            'Elektronik & Gadget' => [
                'Samsung Galaxy S25 5G', 'iPhone 16 Pro Max', 'Xiaomi 14T Pro',
                'OPPO Find N5', 'Vivo X200 Pro', 'Realme GT 7 Pro',
                'Samsung Galaxy Tab S10', 'iPad Air M4', 'MacBook Air M4',
                'ASUS ROG Ally X', 'Lenovo Legion Go', 'Nintendo Switch OLED',
                'Sony WH-1000XM6', 'AirPods Pro 3', 'JBL Flip 7',
                'Samsung Galaxy Watch 7', 'Apple Watch Ultra 3', 'Xiaomi Band 9',
                'Canon EOS R6 II', 'Sony Alpha A7R V', 'DJI Mini 4 Pro',
                'LG OLED C4 65\"', 'Sony Bravia XR 55\"', 'Samsung QLED 85\"',
                'PlayStation 6', 'Xbox Series X 2TB', 'Steam Deck OLED',
            ],
            'Fashion & Aksesoris' => [
                'Nike Air Max 270', 'Adidas Ultraboost 25', 'New Balance 990v6',
                'Converse Chuck 70', 'Vans Old Skool', 'Puma Suede Classic',
                'H&M Slim Fit Kemeja', 'Uniqlo Airism T-Shirt', 'Zara Blazer Wanita',
                'Hijab Pashmina Ceruti', 'Khimar Syar\'i Instan', 'Baju Koko Modern',
                'Tas Ransel Eiger', 'Jansport Big Student', 'Tas Selempang Converse',
                'Jam Tangan Casio G-Shock', 'Jam Tangan Fossil', 'Jam Tangan Seiko 5',
                'Kacamata Rayban Aviator', 'Kacamata Oakley Holbrook', 'Ikat Pinggang Kulit',
                'Jam Tangan Smart Watch', 'Cincin Emas 24K', 'Gelang Silver Pandora',
            ],
            'Kesehatan & Kecantikan' => [
                'Paracetamol 500mg', 'Bodrex Flu & Batuk', 'Antangin JRG',
                'Tolak Angin Cair', 'Promag Tablet', 'OBH Combi Batuk',
                'Wardah Lightening Day Cream', 'Mustika Ratu Bedak', 'Ponds Bright Beauty',
                'The Body Shop Tea Tree Oil', 'Scarlett Whitening Body Lotion',
                'MS Glow Moisturizer', 'Emina Sun Protection SPF 30', 'Garnier Micellar Water',
                'Dove Shampoo Anti Hairfall', 'Pantene Pro-V', 'Lifebuoy Sabun Cair',
                'Sunscreen SPF 50 Aqua', 'Lipstik Wardah Exclusive', 'Masker Wajah Korea',
                'Serum Vitamin C', 'Collagen Drink', 'Suplemen Vitamin D3',
            ],
            'Perlengkapan Rumah' => [
                'Sapu Lantai Lipat', 'Pel Lantai Mop', 'Kemoceng Bulu',
                'Sikat WC Gagang Panjang', 'Pembersih Kaca Spray', 'Pengharum Ruangan Elektrik',
                'Gorden Blackout 120x200', 'Tirai Bambu', 'Karpet Lantai 3x4',
                'Bantal Memory Foam', 'Guling Dacron', 'Bed Cover Premium',
                'Rak Dinding Minimalis', 'Lemari Plastik 5 Susun', 'Meja Lipat Multifungsi',
                'Lampu Tidur LED', 'Lampu Hias Gantung', 'Lampu Meja Belajar',
                'Stop Kontak 6 Lubang', 'Kabel Roll 10M', 'Saklar Listrik Broco',
            ],
            'Olahraga & Outdoor' => [
                'Yonex Nanoray 10', 'Lining G-Force Badminton', 'PRO Knight Sepatu Badminton',
                'Mizuno Sepatu Lari Wave', 'Nike Dri-FIT Jersey', 'Adidas Tracksuit 3-Stripes',
                'Everlast Hand Wraps', 'RDX Boxing Gloves 12oz', 'Matras Yoga Premium',
                'Barbell Set 20kg', 'Dumbbell 10kg Pair', 'Kettlebell 12kg',
                'Jersey Bola Grade Ori', 'Bola Adidas World Cup', 'Sepatu Futsal Specs',
                'Tas Carrier Eiger 60L', 'Tenda Dome Consina 4P', 'Sleeping Bag Arctic',
                'Kompor Portable Camping', 'Nesting Mess Set', 'Headlamp Outdoor LED',
            ],
            'Otomotif' => [
                'Oli Mobil Castrol GTX 20W-50', 'Oli Motor Yamalube 10W-40',
                'Ban Michelin Energy XM2+', 'Ban Bridgestone Turanza', 'Aki Mobil GS Astra',
                'Aki Motor Yuasa YTX', 'Kampas Rem Bosch', 'Filter Udara Honda Genuine',
                'Busi NGK Iridium', 'Lampu LED Mobil 9005', 'Pedal Mobil Racing',
                'Sarung Jok Mobil Kulit', 'Karpet Mobil Karet', 'Wiper Mobil 24\" Bosch',
                'Spion Mobil Kanvas', 'Kunci Roda Impact', 'Dongkrak Mobil Hydraulic',
                'Sticker Mobil Carbon', 'Shockbreaker Bilstein', 'Velg Racing Ring 17',
            ],
            'Buku & Alat Tulis' => [
                'Buku Tulis SIDU 38 Lembar', 'Buku Gambar A4 Kiky', 'Buku Agenda Hard Cover',
                'Pena Pilot G-2 07mm', 'Pensil 2B Faber-Castell', 'Spidol Snowman Permanent',
                'Stabilo Highlighter Color', 'Penghapus Joyko', 'Rautan Pensil Geda',
                'Penggaris Besi 30cm Butterfly', 'Cutter A-300 Kenko', 'Lem Fox Putih',
                'Kertas HVS A4 80gr PaperOne', 'Amplop Cokelat 104', 'Map Snelhecter Plastik',
                'Novel Laskar Pelangi', 'Buku Atomic Habits', 'Kamus Bahasa Inggris Oxford',
                'Buku Resep Masakan Indonesia', 'Al Quran Tajwid Warna', 'Buku Tahunan Sekolah',
            ],
            'Mainan & Hobi' => [
                'LEGO Technic Porsche 911', 'LEGO Icons Titanic', 'Gunpla RX-78-2 Entry Grade',
                'Gunpla MG Strike Freedom', 'Hot Wheels Mainline 2025', 'Matchbox Toyota Land Cruiser',
                'Puzzle 1000pc Panorama', 'UNO Card Game', 'Monopoly Indonesia Edition',
                'Jenga Classic', 'Rubik 3x3 Gan 12', 'Boneka Teddy Bear 100cm',
                'Boneka Pikachu 40cm', 'Nerf Elite 2.0', 'Water Gun Super Soaker',
                'Drone Mainan Mini RC', 'Mobil Remote Control', 'Kapal Remote Control',
                'Play-Doh Set 10 Warna', 'Slime Unicorn Warna-Warni', 'Yo-Yo Profesional',
            ],
            'Peralatan Dapur' => [
                'Panci Set 5 Pcs Stainless', 'Wajan Teflon 28cm Oxone', 'Pisau Dapur Set 6 in 1',
                'Talenan Kayu Jati', 'Spatula Silicone Tahan Panas', 'Blender Sharp 1.5L',
                'Rice Cooker Cosmos 1.8L', 'Miyako Kompor Gas 2 Tungku', 'Maxim Juicer Slow',
                'Philips Air Fryer XXL', 'Oxone Oven Listrik 45L', 'Tupperware Mangkuk Set',
                'Gelas Kaca Duralex 6pcs', 'Piring Keramik Set 12pcs', 'Sendok Garpu Stainless 12pcs',
                'Termos Air Panas 2L', 'Botol Minum Tumbler', 'Tempat Bekal Bento 3in1',
                'Saringan Minyak Gantung', 'Parutan Kelapa Multifungsi', 'Cowet Set Batu Granit',
            ],
            'Aksesoris HP' => [
                'Tempered Glass Anti Gores', 'Softcase Silicone Transparant', 'Casing HP Anti Shock',
                'Charger Fast Charging 65W', 'Power Bank 20.000mAh Xiaomi', 'Kabel USB-C 2M Braided',
                'Magnetic Car Mount Holder', 'Ring Holder HP Metal', 'Popup Grip Holder',
                'Wireless Charger Pad 15W', 'Earphone JBL Tune 110', 'TWS True Wireless Samsung',
                'OTG Adapter USB C', 'Card Holder Back Case', 'Gamepad Mobile Controller',
                'Lens Wide Angle Clip', 'Mini Tripod Smartphone', 'Selfie Stick Bluetooth',
                'Anti Spy Screen Protector', 'Liquid Silicone Case', 'Hardcase Transparant Clear',
            ],
            'Souvenir & Hadiah' => [
                'Box Kado Wedding Mewah', 'Kertas Kado Premium', 'Pita Kado Satin Warna',
                'Goodie Bag Souvenir Kanvas', 'Hampers Snack Lebaran', 'Keranjang Hadiah Rotan',
                'Mug Kopi Custom Nama', 'Gantungan Kunci Akrilik', 'Pin Name Tag Custom',
                'Tas Souvenir Ultah Anak', 'Boneka Souvenir Mini', 'Sticker Pack Souvenir',
                'Plakat Akrilik Trophy', 'Piala Kaca Trophy', 'Sertifikat Kosong Premium',
                'Mini Jam Pasir Souvenir', 'Lilin Aromatherapy Hadiah', 'Sabun Organik Gift Set',
                'Coklat Belgian Gift Box', 'Tea Set Premium Hadiah', 'Buku Tahunan Custom',
            ],
            'Produk Bayi & Anak' => [
                'Popok Merries NB 60', 'Popok Sweety XL 52', 'Popok Makuku XXL 40',
                'Susu SGM 0-6 Bulan 400gr', 'Susu Bebelac 3 Vanila 600gr', 'Susu Lactogen 2 900gr',
                'Minyak Telon Lang 100ml', 'Baby Oil Cussons 150ml', 'Bedak Bayi Johnson',
                'Pampers Pants Training', 'Tisu Basah Mamy Poko', 'Tisu Kering Pas Bayi',
                'Baju Bayi Set 3 Pcs', 'Selimut Bayi Flannel', 'Bedong Bayi Kain Katun',
                'Stroller Lipat Ringan', 'Car Seat Bayi 0-12th', 'Baby Walker Multifungsi',
                'Mainan Edukasi Montessori', 'Boneka Soft Bayi', 'Bola Sensor Bayi',
                'Termometer Suhu Bayi', 'Suction Bulb Pembersih', 'Gigi Teether Silicone',
            ],
            'Hewan Peliharaan' => [
                'Whiskas Makanan Kucing 1kg', 'Whiskas Tuna Basah 80gr', 'Royal Canin Kitten 2kg',
                'Pedigree Daging Sapi 1kg', 'Pro Plan Dog Adult 3kg', 'Happy Dog Junior 5kg',
                'Kandang Anjing Lipat', 'Kandang Kucing 2 Lantai', 'Carrier Pet Bag',
                'Litter Box Tertutup', 'Pasir Kucing Silica 5L', 'Tofu Cat Litter 10L',
                'Tali Leher Anjing Kulit', 'Kerah Kucing Anti Kutu', 'Harness Anjing Adjustable',
                'Mangkuk Makan Double', 'Minum Pet Dispenser', 'Matras Tidur Anjing',
                'Shampoo Kucing Anti Kutu', 'Sikat Bulu Hewan', 'Mainan Kucing Teaser Wand',
                'Buku Kesehatan Kucing', 'Vitamin Kucing Bio Cat', 'Obat Cacing Hewan',
            ],
            'Lainnya' => [
                'Tisu Basah 200 Lembar', 'Lilin Aromatherapy Lavender', 'Pembersih Lantai Pine',
                'Penyegar Ruangan Spray', 'Penghilang Bau Badan', 'Karbol Pink 1L',
                'Kain Lap Mikrofiber', 'Spons Cuci Piring', 'Sabun Cuci Piring Cair',
                'Pewangi Pakaian Konsentrat', 'Pemutih Pakaian', 'Pelembut Pakaian Premium',
                'Lakban Bening 2 Inch', 'Double Tape Foam 3M', 'Lem Tembak Lilin',
                'Karet Gelang Warna', 'Klip Kertas Joyko 100pcs', 'Kertas Stiker Label',
                'Kantong Plastik 12x25', 'Tali Rafia Warna', 'Kardus Packing 40x30',
                'Bubble Wrap 20M', 'Stiker FRAGILE', 'Box Packing Dus 60x40',
            ],
        ];

        $pool = $pools[$category] ?? $pools['Lainnya'];

        return $pool[array_rand($pool)];
    }

    private function randomPrice(string $category): int
    {
        return match ($category) {
            'Makanan & Minuman' => fake()->randomElement([3000, 5000, 7000, 10000, 12000, 15000, 20000, 25000]),
            'Elektronik & Gadget' => fake()->randomElement([100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000, 15000000, 25000000]),
            'Fashion & Aksesoris' => fake()->randomElement([30000, 50000, 75000, 100000, 150000, 250000, 500000, 1000000]),
            'Kesehatan & Kecantikan' => fake()->randomElement([10000, 20000, 35000, 50000, 75000, 100000, 150000, 250000]),
            'Perlengkapan Rumah' => fake()->randomElement([15000, 25000, 50000, 75000, 100000, 150000, 250000, 500000]),
            'Olahraga & Outdoor' => fake()->randomElement([50000, 75000, 100000, 200000, 350000, 500000, 1000000, 2000000]),
            'Otomotif' => fake()->randomElement([25000, 50000, 100000, 200000, 350000, 500000, 1000000, 2000000]),
            'Buku & Alat Tulis' => fake()->randomElement([5000, 10000, 20000, 35000, 50000, 75000, 100000, 150000]),
            'Mainan & Hobi' => fake()->randomElement([25000, 50000, 75000, 100000, 200000, 350000, 500000, 1000000]),
            'Peralatan Dapur' => fake()->randomElement([15000, 30000, 50000, 75000, 100000, 200000, 350000, 500000]),
            'Aksesoris HP' => fake()->randomElement([10000, 20000, 35000, 50000, 75000, 100000, 150000, 250000]),
            'Souvenir & Hadiah' => fake()->randomElement([5000, 10000, 20000, 30000, 50000, 75000, 100000, 150000]),
            'Produk Bayi & Anak' => fake()->randomElement([15000, 25000, 40000, 60000, 80000, 120000, 180000, 250000]),
            'Hewan Peliharaan' => fake()->randomElement([10000, 20000, 35000, 50000, 75000, 100000, 150000, 200000]),
            default => fake()->randomElement([5000, 10000, 15000, 25000, 50000, 100000]),
        };
    }

    private function getRandomVariantNames(int $count): array
    {
        $all = [
            'Small', 'Medium', 'Large', 'Extra Large',
            'Hitam', 'Putih', 'Merah', 'Biru', 'Hijau', 'Kuning', 'Coklat', 'Abu-abu',
            'Pasir', 'Silver', 'Gold', 'Rose Gold',
            'Ukuran S', 'Ukuran M', 'Ukuran L', 'Ukuran XL',
            'Regular', 'Premium', 'Ekonomis',
            'Tipe A', 'Tipe B', 'Tipe C',
            'Pendek', 'Panjang', 'Besar', 'Kecil',
            'Original', 'KW Super', 'Grade A', 'Grade B',
        ];
        shuffle($all);

        return array_slice($all, 0, $count);
    }

    private function getRandomExtraNames(int $count): array
    {
        $all = [
            'Garansi 1 Tahun', 'Garansi 3 Bulan', 'Tambahan Garansi',
            'Bubble Wrap + Kardus', 'Free Ongkir', 'Asuransi Pengiriman',
            'Kartu Garansi', 'Kardus Gift Box', 'Pita Kado',
            'Stiker Gratis', 'Kartu Ucapan', 'Nota Hadiah',
            'Tisu Basah (Gratis)', 'Bonus Stiker', 'Kupon Diskon',
            'Katalog Produk', 'Kalender Gratis', 'Sample Produk',
            'Instalasi Gratis', 'Setup Awal Gratis', 'Training 1 Jam',
            'Free Konsultasi', 'Layanan Premium 24 Jam', 'Prioritas',
        ];
        shuffle($all);

        return array_slice($all, 0, $count);
    }
}
