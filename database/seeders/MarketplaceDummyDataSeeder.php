<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\MarketplaceCategory;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MarketplaceDummyDataSeeder extends Seeder
{
    private array $marketplaceCatMap = [];

    private const array CATEGORY_MARKETPLACE_MAP = [
        'Makanan & Minuman' => 'Kuliner',
        'Elektronik & Gadget' => 'Elektronik',
        'Fashion & Aksesoris' => 'Fashion',
        'Kesehatan & Kecantikan' => 'Kecantikan',
        'Perlengkapan Rumah' => 'Rumah Tangga',
        'Olahraga & Outdoor' => 'Olahraga',
        'Otomotif' => 'Lainnya',
        'Buku & Alat Tulis' => 'Lainnya',
        'Mainan & Hobi' => 'Lainnya',
        'Peralatan Dapur' => 'Rumah Tangga',
        'Aksesoris HP' => 'Elektronik',
        'Souvenir & Hadiah' => 'Lainnya',
        'Produk Bayi & Anak' => 'Lainnya',
        'Hewan Peliharaan' => 'Lainnya',
        'Lainnya' => 'Lainnya',
    ];

    private const array STORES = [
        ['name' => 'Elektronik Jaya', 'city' => 'Jakarta', 'province' => 'DKI Jakarta', 'desc' => 'Toko elektronik & gadget original dengan harga termurah.'],
        ['name' => 'Fashion Muslimah Studio', 'city' => 'Bandung', 'province' => 'Jawa Barat', 'desc' => 'Fashion muslim modern untuk wanita Indonesia.'],
        ['name' => 'Dapur & Rumah Tangga', 'city' => 'Surabaya', 'province' => 'Jawa Timur', 'desc' => 'Perlengkapan rumah tangga dan dapur lengkap.'],
        ['name' => 'Sport & Outdoor Pro', 'city' => 'Yogyakarta', 'province' => 'DIY', 'desc' => 'Pusat alat olahraga dan perlengkapan outdoor.'],
        ['name' => 'Beauty Glowing', 'city' => 'Jakarta', 'province' => 'DKI Jakarta', 'desc' => 'Skincare & kosmetik original terpercaya.'],
        ['name' => 'Aneka Kuliner Nusantara', 'city' => 'Semarang', 'province' => 'Jawa Tengah', 'desc' => 'Makanan & minuman khas Nusantara.'],
        ['name' => 'Gadget & Komputer', 'city' => 'Tangerang', 'province' => 'Banten', 'desc' => 'Laptop, PC, dan aksesoris gadget terlengkap.'],
        ['name' => 'Buku Stationery Murah', 'city' => 'Bandung', 'province' => 'Jawa Barat', 'desc' => 'Buku pelajaran, novel, alat tulis kantor.'],
        ['name' => 'Bayi & Anak Bahagia', 'city' => 'Jakarta', 'province' => 'DKI Jakarta', 'desc' => 'Perlengkapan bayi dan mainan edukatif.'],
        ['name' => 'Pet Lovers Store', 'city' => 'Surabaya', 'province' => 'Jawa Timur', 'desc' => 'Kebutuhan hewan peliharaan lengkap.'],
        ['name' => 'Fashion Trendy', 'city' => 'Jakarta', 'province' => 'DKI Jakarta', 'desc' => 'Fashion kekinian untuk pria dan wanita.'],
        ['name' => 'Rumah Tangga Modern', 'city' => 'Medan', 'province' => 'Sumatera Utara', 'desc' => 'Furniture dan perlengkapan rumah minimalis.'],
        ['name' => 'Kuliner Sehat', 'city' => 'Bali', 'province' => 'Bali', 'desc' => 'Makanan sehat, frozen food, dan minuman organik.'],
        ['name' => 'Olahraga & Fitness', 'city' => 'Makassar', 'province' => 'Sulawesi Selatan', 'desc' => 'Alat fitness dan perlengkapan gym.'],
        ['name' => 'Mainan & Hobi', 'city' => 'Palembang', 'province' => 'Sumatera Selatan', 'desc' => 'Mainan anak, koleksi, dan hobi seru.'],
        ['name' => 'Otomotif Mandiri', 'city' => 'Jakarta', 'province' => 'DKI Jakarta', 'desc' => 'Aksesoris dan perlengkapan otomotif.'],
        ['name' => 'Taman & Agribisnis', 'city' => 'Malang', 'province' => 'Jawa Timur', 'desc' => 'Bibit tanaman, pupuk, dan perlengkapan kebun.'],
        ['name' => 'Toko Serba Guna', 'city' => 'Bekasi', 'province' => 'Jawa Barat', 'desc' => 'Aneka souvenir, hadiah, dan kebutuhan sehari-hari.'],
    ];

    private const array BRANDS = [
        'Samsung', 'Apple', 'Xiaomi', 'Nike', 'Adidas', 'H&M', 'Uniqlo',
        'Wardah', 'Mustika Ratu', 'The Body Shop', 'Indofood', 'Mayora',
        'Nestle', 'IKEA', 'Oxone', 'Maspion', 'Yonex', 'Eiger',
        'LEGO', 'Hot Wheels', 'Sharp', 'Panasonic', 'Cosmos',
        'Castrol', 'Shell', 'Dell', 'HP', 'Lenovo', 'Logitech',
    ];

    public function run(): void
    {
        $this->command?->info('■■■ MEMULAI SEEDER MARKETPLACE ■■■');

        // ── 0. Marketplace Categories ─────────────────────────
        $this->command?->info('0/5 Memuat kategori marketplace...');
        $this->call(MarketplaceCategorySeeder::class);
        $this->loadMarketplaceCategoryMap();
        $this->command?->info('   ✓ '.count($this->marketplaceCatMap).' kategori marketplace dimuat');

        // ── 1. Tenants (stores) ────────────────────────────────
        $this->command?->info('1/5 Membuat toko marketplace...');
        $now = now();
        $tenants = [];

        foreach (self::STORES as $i => $store) {
            $slug = 'market-'.Str::slug($store['name']).'-'.($i + 1);

            $tenant = Tenant::create([
                'slug' => $slug,
                'name' => $store['name'],
                'address' => fake()->address(),
                'city' => $store['city'],
                'province' => $store['province'],
                'phone' => fake()->phoneNumber(),
                'store_description' => $store['desc'],
                'shipping_cost' => fake()->randomElement([5000, 7000, 8000, 10000, 15000]),
                'subscription_status' => 'active',
                'subscription_tier' => 'premium',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $tenants[] = $tenant;
        }
        $this->command?->info('   ✓ '.count($tenants).' toko marketplace created');

        // ── 2. Users (owners) + Roles ──────────────────────────
        $this->command?->info('2/5 Membuat owner & roles...');
        $roleData = [];

        foreach ($tenants as $tenant) {
            $user = User::create([
                'name' => "Owner {$tenant->name}",
                'email' => "owner-{$tenant->slug}@test.com",
                'password' => bcrypt('password'),
                'email_verified_at' => $now,
            ]);

            TenantUser::create([
                'user_id' => $user->id,
                'tenant_id' => $tenant->id,
                'role' => 'owner',
                'is_active' => true,
            ]);

            $adminRoleId = DB::table('roles')->insertGetId([
                'name' => 'admin',
                'guard_name' => 'web',
                'tenant_id' => $tenant->id,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $roleData[] = [
                'role_id' => $adminRoleId,
                'model_type' => 'App\Models\User',
                'model_id' => $user->id,
            ];
        }

        DB::table('model_has_roles')->insert($roleData);
        $this->command?->info('   ✓ Owner & roles selesai');

        // ── 3. Categories + Brands ─────────────────────────────
        $this->command?->info('3/5 Membuat kategori & brand...');
        $catRows = [];
        $brandRows = [];
        $tenantCategoryMap = [];

        foreach ($tenants as $tenant) {
            $focusCats = $this->getStoreCategories($tenant->name);

            foreach ($focusCats as $catName) {
                $catRows[] = [
                    'tenant_id' => $tenant->id,
                    'name' => $catName,
                    'marketplace_category_id' => $this->marketplaceCatMap[self::CATEGORY_MARKETPLACE_MAP[$catName]] ?? null,
                    'description' => fake()->sentence(rand(4, 8)),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            foreach (self::BRANDS as $brand) {
                $brandRows[] = [
                    'tenant_id' => $tenant->id,
                    'name' => $brand,
                    'description' => "Brand $brand terpercaya.",
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        DB::table('categories')->insert($catRows);
        DB::table('brands')->insert($brandRows);

        // Build maps
        $tenantIds = collect($tenants)->pluck('id');
        $allCats = Category::whereIn('tenant_id', $tenantIds)->get(['id', 'tenant_id', 'name']);
        foreach ($allCats as $c) {
            $tenantCategoryMap[$c->tenant_id][$c->name] = $c->id;
        }

        $allBrands = Brand::whereIn('tenant_id', $tenantIds)->get(['id', 'tenant_id', 'name']);
        $tenantBrandMap = [];
        foreach ($allBrands as $b) {
            $tenantBrandMap[$b->tenant_id][$b->name] = $b->id;
        }

        $this->command?->info('   ✓ '.count($catRows).' kategori + '.count($brandRows).' brand selesai');

        // ── 4. Products ────────────────────────────────────────
        $this->command?->info('4/5 Membuat produk marketplace...');
        $totalProducts = 0;
        $totalVariants = 0;
        $totalExtras = 0;
        $variantRows = [];
        $extraRows = [];

        foreach ($tenants as $tenant) {
            $catIds = $tenantCategoryMap[$tenant->id] ?? [];
            $brandIds = $tenantBrandMap[$tenant->id] ?? [];
            $productCount = rand(15, 25);

            for ($p = 0; $p < $productCount; $p++) {
                $catName = array_rand($catIds);
                $brandName = array_rand($brandIds);
                $name = $this->randomProductName($catName);
                $basePrice = $this->randomPrice($catName);

                $product = Product::create([
                    'tenant_id' => $tenant->id,
                    'name' => $name,
                    'slug' => Str::slug($name.'-'.$tenant->id.'-'.$p),
                    'description' => fake()->sentence(rand(6, 15)),
                    'price' => $basePrice,
                    'cost_price' => (int) round($basePrice * rand(55, 80) / 100),
                    'stock' => rand(10, 300),
                    'category_id' => $catIds[$catName],
                    'brand_id' => $brandIds[$brandName],
                    'status' => 'active',
                    'visible_online' => true,
                    'online_price' => $basePrice,
                    'stock_online' => rand(5, 150),
                    'weight' => rand(50, 5000),
                    'sku' => 'MP-'.$tenant->id.'-'.str_pad((string) $p, 3, '0', STR_PAD_LEFT),
                    'barcode' => fake()->ean13(),
                ]);

                $totalProducts++;

                // Variants (2-3 per product)
                $vCount = rand(2, 3);
                $vNames = $this->getRandomVariants($vCount);
                foreach ($vNames as $vName) {
                    $variantRows[] = [
                        'tenant_id' => $product->tenant_id,
                        'product_id' => $product->id,
                        'name' => $vName,
                        'additional_price' => fake()->randomElement([0, 2000, 3000, 5000, 7000, 10000]),
                        'stock' => rand(0, 50),
                        'sku' => 'MP-VAR-'.$product->id.'-'.Str::slug($vName),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                    $totalVariants++;
                }

                // Extras (1-3 per product)
                $eCount = rand(1, 3);
                $eNames = $this->getRandomExtras($eCount);
                foreach ($eNames as $eName) {
                    $extraRows[] = [
                        'tenant_id' => $product->tenant_id,
                        'product_id' => $product->id,
                        'name' => $eName,
                        'price' => fake()->randomElement([2000, 3000, 5000, 7500, 10000, 15000]),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                    $totalExtras++;
                }
            }
        }

        if ($variantRows) {
            DB::table('product_variants')->insert($variantRows);
        }
        if ($extraRows) {
            DB::table('product_extras')->insert($extraRows);
        }

        $this->command?->info('   ✓ '.$totalProducts.' produk + '.$totalVariants.' varian + '.$totalExtras.' extra selesai');

        // ── Selesai ──────────────────────────────────────────────
        $this->command?->info('');
        $this->command?->info('■■■ SEEDER MARKETPLACE SELESAI ■■■');
        $this->command?->info('Login: owner-market-{nama-toko}@test.com / password');
        $this->command?->info('Contoh: owner-market-elektronik-jaya-1@test.com / password');
    }

    private function loadMarketplaceCategoryMap(): void
    {
        $categories = MarketplaceCategory::whereNull('parent_id')->get(['id', 'name']);
        foreach ($categories as $cat) {
            $this->marketplaceCatMap[$cat->name] = $cat->id;
        }
    }

    private function getStoreCategories(string $storeName): array
    {
        $map = [
            'Elektronik Jaya' => ['Elektronik & Gadget', 'Aksesoris HP'],
            'Fashion Muslimah Studio' => ['Fashion & Aksesoris'],
            'Dapur & Rumah Tangga' => ['Perlengkapan Rumah', 'Peralatan Dapur'],
            'Sport & Outdoor Pro' => ['Olahraga & Outdoor'],
            'Beauty Glowing' => ['Kesehatan & Kecantikan'],
            'Aneka Kuliner Nusantara' => ['Makanan & Minuman'],
            'Gadget & Komputer' => ['Elektronik & Gadget', 'Aksesoris HP'],
            'Buku Stationery Murah' => ['Buku & Alat Tulis', 'Souvenir & Hadiah'],
            'Bayi & Anak Bahagia' => ['Produk Bayi & Anak', 'Mainan & Hobi'],
            'Pet Lovers Store' => ['Hewan Peliharaan'],
            'Fashion Trendy' => ['Fashion & Aksesoris'],
            'Rumah Tangga Modern' => ['Perlengkapan Rumah', 'Peralatan Dapur'],
            'Kuliner Sehat' => ['Makanan & Minuman'],
            'Olahraga & Fitness' => ['Olahraga & Outdoor'],
            'Mainan & Hobi' => ['Mainan & Hobi'],
            'Otomotif Mandiri' => ['Otomotif'],
            'Taman & Agribisnis' => ['Lainnya'], // Agribisnis fallback
            'Toko Serba Guna' => ['Souvenir & Hadiah', 'Lainnya'],
        ];

        return $map[$storeName] ?? ['Lainnya'];
    }

    private function randomProductName(string $category): string
    {
        $pools = [
            'Makanan & Minuman' => [
                'Indomie Goreng Spesial', 'Mie Sedap Ayam Bawang', 'Chitato Sapi Panggang',
                'Kopiko 78 Coffee Candy', 'Silver Queen Dark', 'Oreo Original',
                'Good Day Cappuccino', 'Nescafe Classic', 'Teh Botol Sosro',
                'Pocari Sweat 500ml', 'Aqua 600ml', 'Coca Cola 390ml',
                'Ultra Milk Full Cream', 'Milo Active Go', 'Roma Malkist Crackers',
                'Pop Mie Kari Ayam', 'Qtela Balado', 'Taro Net Seaweed',
                'Kacang Garuda', 'Beng Beng White',
            ],
            'Elektronik & Gadget' => [
                'Samsung Galaxy S25 5G', 'iPhone 16 Pro Max', 'Xiaomi 14T Pro',
                'Samsung Galaxy Tab S10', 'MacBook Air M4', 'ASUS ROG Ally X',
                'Sony WH-1000XM6', 'AirPods Pro 3', 'JBL Flip 7',
                'Samsung Galaxy Watch 7', 'Apple Watch Ultra 3', 'Xiaomi Band 9',
                'Canon EOS R6 II', 'DJI Mini 4 Pro', 'LG OLED C4 65"',
                'PlayStation 6', 'Steam Deck OLED', 'Nintendo Switch OLED',
            ],
            'Fashion & Aksesoris' => [
                'Nike Air Max 270', 'Adidas Ultraboost 25', 'New Balance 990v6',
                'Converse Chuck 70', 'Vans Old Skool', 'Puma Suede Classic',
                'H&M Kemeja Slim Fit', 'Uniqlo Airism T-Shirt', 'Hijab Pashmina Ceruti',
                'Baju Koko Modern', 'Tas Ransel Eiger', 'Jam Tangan Casio G-Shock',
                'Kacamata Rayban Aviator', 'Ikat Pinggang Kulit', 'Cincin Emas 24K',
                'Hijab Segi Empat', 'Brooch Hijab', 'Sepatu Sneakers Casual',
            ],
            'Kesehatan & Kecantikan' => [
                'Wardah Lightening Day Cream', 'Mustika Ratu Bedak', 'Ponds Bright Beauty',
                'The Body Shop Tea Tree Oil', 'Scarlett Whitening Body Lotion',
                'MS Glow Moisturizer', 'Emina Sun Protection SPF 30', 'Garnier Micellar Water',
                'Lipstik Wardah Exclusive', 'Serum Vitamin C', 'Collagen Drink',
                'Sunscreen SPF 50', 'Face Wash Brightening', 'Toner Wajah',
            ],
            'Perlengkapan Rumah' => [
                'Sapu Lantai Lipat', 'Pel Lantai Mop', 'Kemoceng Bulu',
                'Gorden Blackout 120x200', 'Karpet Lantai 3x4', 'Bantal Memory Foam',
                'Bed Cover Premium', 'Rak Dinding Minimalis', 'Lemari Plastik 5 Susun',
                'Lampu Tidur LED', 'Lampu Hias Gantung', 'Stop Kontak 6 Lubang',
                'Sikat WC Gagang Panjang', 'Pengharum Ruangan Elektrik',
            ],
            'Olahraga & Outdoor' => [
                'Yonex Nanoray 10', 'Sepatu Badminton PRO Knight', 'Mizuno Sepatu Lari Wave',
                'Nike Dri-FIT Jersey', 'Adidas Tracksuit 3-Stripes', 'Matras Yoga Premium',
                'Barbell Set 20kg', 'Dumbbell 10kg Pair', 'Kettlebell 12kg',
                'Tas Carrier Eiger 60L', 'Tenda Dome Consina 4P', 'Kompor Portable Camping',
                'Bola Adidas World Cup', 'Jersey Bola Grade Ori',
            ],
            'Otomotif' => [
                'Oli Mobil Castrol GTX 20W-50', 'Oli Motor Yamalube 10W-40',
                'Ban Michelin Energy XM2+', 'Aki Mobil GS Astra', 'Aki Motor Yuasa YTX',
                'Kampas Rem Bosch', 'Busi NGK Iridium', 'Lampu LED Mobil 9005',
                'Sarung Jok Mobil Kulit', 'Karpet Mobil Karet', 'Wiper Mobil Bosch',
                'Velg Racing Ring 17', 'Shockbreaker Bilstein',
            ],
            'Buku & Alat Tulis' => [
                'Buku Tulis SIDU 38 Lembar', 'Buku Gambar A4 Kiky', 'Pena Pilot G-2 07mm',
                'Pensil 2B Faber-Castell', 'Spidol Snowman Permanent', 'Stabilo Highlighter',
                'Kertas HVS A4 80gr PaperOne', 'Map Snelhecter Plastik', 'Lem Fox Putih',
                'Novel Laskar Pelangi', 'Buku Atomic Habits', 'Kamus Bahasa Inggris Oxford',
            ],
            'Mainan & Hobi' => [
                'LEGO Technic Porsche 911', 'Gunpla MG Strike Freedom', 'Hot Wheels Mainline',
                'Puzzle 1000pc Panorama', 'UNO Card Game', 'Monopoly Indonesia Edition',
                'Rubik 3x3 Gan 12', 'Boneka Teddy Bear 100cm', 'Nerf Elite 2.0',
                'Drone Mainan Mini RC', 'Mobil Remote Control', 'Boneka Pikachu 40cm',
            ],
            'Peralatan Dapur' => [
                'Panci Set 5 Pcs Stainless', 'Wajan Teflon 28cm Oxone', 'Pisau Dapur Set',
                'Blender Sharp 1.5L', 'Rice Cooker Cosmos 1.8L', 'Philips Air Fryer XXL',
                'Oxone Oven Listrik 45L', 'Gelas Kaca Duralex 6pcs', 'Piring Keramik Set 12pcs',
                'Tupperware Mangkuk Set', 'Termos Air Panas 2L',
            ],
            'Aksesoris HP' => [
                'Tempered Glass Anti Gores', 'Softcase Silicone Transparant', 'Casing HP Anti Shock',
                'Charger Fast Charging 65W', 'Power Bank 20.000mAh', 'Kabel USB-C 2M Braided',
                'Magnetic Car Mount', 'Wireless Charger Pad 15W', 'TWS True Wireless Samsung',
                'Gamepad Mobile Controller', 'Mini Tripod Smartphone',
            ],
            'Souvenir & Hadiah' => [
                'Box Kado Wedding Mewah', 'Kertas Kado Premium', 'Goodie Bag Souvenir Kanvas',
                'Hampers Snack Lebaran', 'Keranjang Hadiah Rotan', 'Mug Kopi Custom Nama',
                'Gantungan Kunci Akrilik', 'Plakat Akrilik Trophy', 'Piala Kaca Trophy',
                'Lilin Aromatherapy Hadiah', 'Coklat Belgian Gift Box',
            ],
            'Produk Bayi & Anak' => [
                'Popok Merries NB 60', 'Popok Sweety XL 52', 'Susu SGM 0-6 Bulan 400gr',
                'Susu Bebelac 3 Vanila', 'Minyak Telon Lang 100ml', 'Baby Oil Cussons',
                'Baju Bayi Set 3 Pcs', 'Selimut Bayi Flannel', 'Stroller Lipat Ringan',
                'Car Seat Bayi', 'Mainan Edukasi Montessori',
            ],
            'Hewan Peliharaan' => [
                'Whiskas Makanan Kucing 1kg', 'Royal Canin Kitten 2kg', 'Pedigree Daging Sapi',
                'Pro Plan Dog Adult 3kg', 'Kandang Kucing 2 Lantai', 'Litter Box Tertutup',
                'Pasir Kucing Silica 5L', 'Tali Leher Anjing Kulit', 'Harness Anjing Adjustable',
                'Shampoo Kucing Anti Kutu', 'Mainan Kucing Teaser Wand',
            ],
            'Lainnya' => [
                'Tisu Basah 200 Lembar', 'Lilin Aromatherapy Lavender', 'Pembersih Lantai',
                'Kain Lap Mikrofiber', 'Spons Cuci Piring', 'Sabun Cuci Piring Cair',
                'Lakban Bening 2 Inch', 'Double Tape Foam 3M', 'Kantong Plastik 12x25',
                'Bubble Wrap 20M', 'Box Packing Dus 60x40',
            ],
        ];

        $pool = $pools[$category] ?? $pools['Lainnya'];

        return $pool[array_rand($pool)];
    }

    private function randomPrice(string $category): int
    {
        return match ($category) {
            'Makanan & Minuman' => fake()->randomElement([3000, 5000, 7000, 10000, 12000, 15000, 20000, 25000]),
            'Elektronik & Gadget' => fake()->randomElement([100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000]),
            'Fashion & Aksesoris' => fake()->randomElement([30000, 50000, 75000, 100000, 150000, 250000, 500000]),
            'Kesehatan & Kecantikan' => fake()->randomElement([10000, 20000, 35000, 50000, 75000, 100000, 150000]),
            'Perlengkapan Rumah' => fake()->randomElement([15000, 25000, 50000, 75000, 100000, 150000, 250000, 500000]),
            'Olahraga & Outdoor' => fake()->randomElement([50000, 75000, 100000, 200000, 350000, 500000, 1000000]),
            'Otomotif' => fake()->randomElement([25000, 50000, 100000, 200000, 350000, 500000, 1000000]),
            'Buku & Alat Tulis' => fake()->randomElement([5000, 10000, 20000, 35000, 50000, 75000, 100000]),
            'Mainan & Hobi' => fake()->randomElement([25000, 50000, 75000, 100000, 200000, 350000, 500000]),
            'Peralatan Dapur' => fake()->randomElement([15000, 30000, 50000, 75000, 100000, 200000, 350000]),
            'Aksesoris HP' => fake()->randomElement([10000, 20000, 35000, 50000, 75000, 100000, 150000]),
            'Souvenir & Hadiah' => fake()->randomElement([5000, 10000, 20000, 30000, 50000, 75000, 100000]),
            'Produk Bayi & Anak' => fake()->randomElement([15000, 25000, 40000, 60000, 80000, 120000, 180000]),
            'Hewan Peliharaan' => fake()->randomElement([10000, 20000, 35000, 50000, 75000, 100000, 150000]),
            default => fake()->randomElement([5000, 10000, 15000, 25000, 50000, 100000]),
        };
    }

    private function getRandomVariants(int $count): array
    {
        $all = [
            'Small', 'Medium', 'Large', 'Extra Large',
            'Hitam', 'Putih', 'Merah', 'Biru', 'Hijau', 'Kuning',
            'Silver', 'Gold', 'Rose Gold',
            'Ukuran S', 'Ukuran M', 'Ukuran L', 'Ukuran XL',
            'Regular', 'Premium', 'Ekonomis',
            'Tipe A', 'Tipe B', 'Tipe C',
            'Original', 'KW Super', 'Grade A', 'Grade B',
        ];
        shuffle($all);

        return array_slice($all, 0, $count);
    }

    private function getRandomExtras(int $count): array
    {
        $all = [
            'Garansi 1 Tahun', 'Garansi 3 Bulan', 'Tambahan Garansi',
            'Bubble Wrap + Kardus', 'Free Ongkir', 'Asuransi Pengiriman',
            'Kardus Gift Box', 'Pita Kado', 'Stiker Gratis',
            'Kupon Diskon', 'Katalog Produk', 'Sample Produk',
            'Free Konsultasi', 'Layanan Premium 24 Jam',
        ];
        shuffle($all);

        return array_slice($all, 0, $count);
    }
}
