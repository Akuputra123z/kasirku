<?php

namespace Database\Seeders;

use App\Models\MarketplaceCategory;
use Illuminate\Database\Seeder;

class MarketplaceCategorySeeder extends Seeder
{
    public function run(): void
    {
        $parents = [
            [
                'name' => 'Rumah Tangga',
                'slug' => 'rumah-tangga',
                'icon' => 'Armchair',
                'sort_order' => 1,
                'children' => [
                    'Dekorasi' => [
                        'Cover Kipas Angin', 'Cover Kursi', 'Hiasan Dinding', 'Hiasan Natal',
                        'Jam Dinding', 'Jam Meja', 'Keset', 'Lampu Pohon Natal', 'Lilin',
                        'Lilin Aroma Terapi', 'Lukisan', 'Patung', 'Pohon Natal',
                        'Reed Diffuser', 'Slinger', 'Stiker Kaca', 'Tanaman Artifical',
                        'Taplak Meja', 'Tempat Lilin', 'Vas Bunga', 'Wall Sticker',
                    ],
                    'Furniture' => [
                        'Bedside Table', 'Cermin Badan', 'Kasur', 'Kursi', 'Kursi Bar',
                        'Kursi Goyang', 'Kursi Kantor', 'Kursi Makan', 'Kursi Malas',
                        'Lemari Pakaian', 'Meja Bar', 'Meja Kantor', 'Meja Makan',
                        'Meja Rias', 'Meja TV', 'Meja Tamu', 'Pengaman Furniture', 'Rak',
                        'Rangka Tempat Tidur', 'Sofa', 'Sofa Bed',
                    ],
                    'Kamar Mandi' => [
                        'Cermin Kamar Mandi', 'Dispenser Odol', 'Ember & Baskom',
                        'Gantungan Handuk', 'Gayung', 'Handuk Mandi', 'Keset Anti Slip',
                        'Kimono Mandi', 'Rak Toilet', 'Shower Curtain', 'Tempat Sabun',
                        'Tempat Sikat Gigi', 'Toilet Cover', 'Toilet Seat Anak', 'Tutup Wastafel',
                    ],
                    'Kamar Tidur' => [
                        'Bantal Kepala', 'Guling', 'Jepitan Sprei', 'Kelambu',
                        'Mattress Cover', 'Sarung Bantal', 'Selimut', 'Sprei & Bed Cover',
                    ],
                    'Kebersihan' => [
                        'Alat Pel', 'Asbak', 'High Pressure Cleaner', 'Kain Lap',
                        'Kantong Sampah', 'Kemoceng', 'Pengki', 'Sapu', 'Sapu Lidi',
                        'Sarung Tangan Karet', 'Selang Air', 'Sikat', 'Tempat Sampah',
                    ],
                    'Kebutuhan Rumah' => [
                        'Baterai', 'Baterai Jam', 'Humidifier', 'Payung',
                        'Pembatas Ruangan', 'Penahan Pintu', 'Termometer Ruangan',
                    ],
                    'Laundry' => [
                        'Alat Pelipat Baju', 'Bola Pencuci Baju', 'Cover Mesin Cuci',
                        'Gantungan Baju', 'Jaring Pakaian Mesin Cuci', 'Jemuran Baju',
                        'Jepit Jemuran', 'Laundry Bag', 'Meja Setrika', 'Papan Cuci Baju',
                        'Roll Pembersih Pakaian',
                    ],
                    'Ruang Tamu & Keluarga' => [
                        'Bantal Sofa', 'Bean Bag', 'Cover Sofa', 'Gorden',
                        'Karpet & Tikar', 'Sarung Bantal Sofa',
                    ],
                    'Taman' => [
                        'Air Sofa', 'Ayunan', 'Benih Bibit Tanaman', 'Garpu Taman',
                        'Hiasan Taman', 'Irigasi', 'Kursi Pantai', 'Media Tanam',
                        'Pemotong Rumput', 'Penyiram Tanaman', 'Pot Tanaman', 'Pupuk',
                        'Sekop Taman',
                    ],
                    'Penyimpanan' => [
                        'Botol', 'Brankas', 'Keranjang', 'Kotak', 'Kotak Baterai',
                        'Kotak Jam', 'Kotak Karton', 'Kotak Surat', 'Laci',
                        'Stand Hanger', 'Storage Box Multifungsi', 'Tempat Obat',
                        'Tempat Pakaian', 'Tempat Perhiasan & Aksesoris', 'Tempat Remote',
                        'Tempat Sepatu & Sandal', 'Tempat Tas', 'Tempat Tissue',
                    ],
                    'Travel' => [
                        'Bantal Leher', 'Gembok Koper', 'Koper', 'Luggage Cover',
                        'Luggage Strap', 'Luggage Tag', 'Passport Cover',
                        'Penutup Mata Tidur', 'Travel Bag', 'Travel Organizer',
                        'Travel Toiletries Kit', 'Universal Travel Adaptor',
                    ],
                ],
            ],
            [
                'name' => 'Fashion',
                'slug' => 'fashion',
                'icon' => 'Shirt',
                'sort_order' => 2,
                'children' => [
                    'Baju Wanita' => [
                        'Atasan Wanita', 'Bawahan Wanita', 'Gaun', 'Cardigan & Outerwear',
                        'Hijab & Jilbab', 'Baju Muslimah', 'Daster', 'Legging & Celana',
                        'Rok', 'Blazer Wanita', 'Baju Tidur Wanita', 'Baju Renang Wanita',
                        'Kaos Wanita', 'Kemeja Wanita', 'Sweater & Hoodie Wanita',
                    ],
                    'Baju Pria' => [
                        'Kemeja Pria', 'Kaos Pria', 'Batik Pria', 'Celana Pria',
                        'Jas & Blazer', 'Baju Koko', 'Sweater & Hoodie Pria',
                        'Jaket Pria', 'Baju Tidur Pria', 'Celana Jeans Pria',
                        'Celana Pendek Pria', 'Rompi Pria', 'Baju Renang Pria',
                    ],
                    'Hijab' => [
                        'Hijab Pashmina', 'Hijab Segi Empat', 'Hijab Instan',
                        'Ciput & Ninja', 'Aksesoris Hijab', 'Brooch Hijab',
                        'Magnet Hijab', 'Peniti Hijab',
                    ],
                    'Sepatu' => [
                        'Sepatu Sneakers', 'Sepatu Formal Pria', 'Sepatu Hak Tinggi',
                        'Flat Shoes', 'Sandals', 'Boots', 'Sepatu Olahraga',
                        'Sepatu Anak', 'Sepatu Pantofel', 'Selop & Mules',
                    ],
                    'Tas' => [
                        'Tas Ransel', 'Tas Selempang', 'Tas Tote', 'Tas Punggung',
                        'Dompet', 'Tas Wanita', 'Tas Kerja', 'Tas Travel',
                        'Tas Belanja', 'Tas Pinggang', 'Sling Bag',
                    ],
                    'Jam Tangan' => [
                        'Jam Tangan Pria', 'Jam Tangan Wanita', 'Jam Tangan Smartwatch',
                        'Jam Tangan Digital', 'Jam Tangan Analog', 'Jam Tangan Sport',
                    ],
                    'Aksesoris' => [
                        'Kalung', 'Gelang', 'Anting', 'Cincin',
                        'Ikat Pinggang', 'Kacamata', 'Topi', 'Kaos Kaki',
                        'Syal & Selendang', 'Masker Fashion',
                    ],
                    'Baju Anak' => [
                        'Baju Bayi', 'Baju Anak Laki', 'Baju Anak Perempuan',
                        'Sepatu Anak', 'Celana Anak', 'Dress Anak', 'Setelan Anak',
                        'Piyama Anak', 'Jaket Anak',
                    ],
                ],
            ],
            [
                'name' => 'Kuliner',
                'slug' => 'kuliner',
                'icon' => 'UtensilsCrossed',
                'sort_order' => 3,
                'children' => [
                    'Makanan Ringan' => [
                        'Keripik', 'Makaroni', 'Kacang', 'Biskuit', 'Wafer',
                        'Cokelat', 'Permen', 'Kue Kering', 'Roti', 'Kue Basah',
                        'Makanan Beku Siap Goreng', 'Makanan Ringan Sehat',
                    ],
                    'Makanan Berat' => [
                        'Mie Instan', 'Bubur Instan', 'Sarden', 'Nasi Instan',
                        'Lauk Siap Saji', 'Makanan Kaleng', 'Rendang Kemasan',
                        'Sambal Kemasan', 'Abon', 'Dendeng',
                    ],
                    'Minuman' => [
                        'Kopi Bubuk', 'Kopi Sachet', 'Teh Celup', 'Teh Botol',
                        'Sirup', 'Susu UHT', 'Susu Bubuk', 'Minuman Serbuk',
                        'Air Mineral', 'Jus Kemasan', 'Minuman Bersoda',
                        'Minuman Isotonik', 'Minuman Tradisional',
                    ],
                    'Bumbu & Rempah' => [
                        'Bumbu Masak Instan', 'Kecap', 'Saus Sambal', 'Minyak Goreng',
                        'Tepung', 'Garam', 'Gula', 'Bumbu Dapur', 'Rempah-rempah',
                        'Penyedap Rasa', 'Cuka', 'Margarin & Mentega',
                    ],
                    'Aneka Kue' => [
                        'Kue Tradisional', 'Kue Modern', 'Kue Ulang Tahun',
                        'Kue Basah', 'Brownies', 'Cheesecake', 'Donat',
                        'Pai & Tart', 'Bolu & Cake',
                    ],
                    'Frozen Food' => [
                        'Nugget', 'Sosis', 'Fish Fillet', 'Kentang Goreng Beku',
                        'Dimsum', 'Bakso', 'Pizza Beku', 'Es Krim',
                        'Sayuran Beku', 'Daging Beku',
                    ],
                ],
            ],
            [
                'name' => 'Kecantikan',
                'slug' => 'kecantikan',
                'icon' => 'Sparkles',
                'sort_order' => 4,
                'children' => [
                    'Skincare' => [
                        'Face Wash', 'Toner', 'Serum', 'Moisturizer', 'Sunscreen',
                        'Face Mask', 'Eye Cream', 'Nighting Cream', 'Lip Balm',
                        'Micellar Water', 'Scrub & Eksfoliator', 'Facial Wash',
                    ],
                    'Makeup' => [
                        'Foundation', 'BB Cream', 'Bedak', 'Lipstik', 'Lip Gloss',
                        'Eyeshadow', 'Eyeliner', 'Maskara', 'Blush On', 'Highlighter',
                        'Contour', 'Setting Spray', 'Makeup Brush Set',
                    ],
                    'Perawatan Rambut' => [
                        'Shampoo', 'Conditioner', 'Hair Mask', 'Hair Serum',
                        'Hair Oil', 'Hair Spray', 'Hair Tonic', 'Pewarna Rambut',
                        'Sisir & Sikat Rambut', 'Alat Catok Rambut',
                    ],
                    'Perawatan Tubuh' => [
                        'Body Wash', 'Body Lotion', 'Body Scrub', 'Deodorant',
                        'Sabun Mandi', 'Parfum', 'Body Spray', 'Hand Cream',
                        'Foot Cream', 'Body Serum',
                    ],
                    'Parfum' => [
                        'Parfum Wanita', 'Parfum Pria', 'Parfum Unisex',
                        'Parfum Travel Size', 'Minyak Wangi', 'Roll-on Parfum',
                    ],
                    'Alat Kecantikan' => [
                        'Beauty Blender', 'Kuas Makeup', 'Cermin Rias',
                        'Tas Makeup', 'Alat Facial', 'Steamer Wajah',
                        'Alat Pemanas Bulu Mata', 'Pinset Alis',
                    ],
                ],
            ],
            [
                'name' => 'Elektronik',
                'slug' => 'elektronik',
                'icon' => 'Laptop',
                'sort_order' => 5,
                'children' => [
                    'Handphone' => [
                        'Smartphone Android', 'iPhone', 'Handphone Entry Level',
                        'HP Gaming', 'HP Kamera', 'Second HP',
                    ],
                    'Laptop' => [
                        'Laptop Gaming', 'Laptop Ultrabook', 'Laptop Kantoran',
                        'MacBook', 'Laptop Multimedia', 'Laptop Murah',
                        'Chromebook', 'Second Laptop',
                    ],
                    'Tablet' => [
                        'iPad', 'Tablet Android', 'Tablet Gaming',
                        'Tablet Anak', 'Second Tablet',
                    ],
                    'Audio' => [
                        'Headphone', 'Earphone', 'TWS True Wireless', 'Speaker Bluetooth',
                        'Soundbar', 'Home Theater', 'Amplifier', 'Microphone',
                    ],
                    'Kamera' => [
                        'DSLR', 'Mirrorless', 'Kamera Pocket', 'Kamera Action',
                        'Kamera CCTV', 'Drone', 'Lensa Kamera', 'Tripod',
                    ],
                    'Smart Home' => [
                        'Smart TV', 'TV LED', 'TV OLED', 'TV QLED',
                        'TV Box', 'Smart Lamp', 'Smart Lock', 'Smart Speaker',
                        'Smart Plug', 'Robot Vacuum',
                    ],
                    'Aksesoris Gadget' => [
                        'Charger', 'Power Bank', 'Kabel Data', 'Adapter',
                        'Casing HP', 'Tempered Glass', 'Screen Protector',
                        'Card Reader', 'USB Hub', 'Cooling Pad',
                        'Keyboard Eksternal', 'Mouse', 'Mousepad',
                    ],
                ],
            ],
            [
                'name' => 'Agribisnis',
                'slug' => 'agribisnis',
                'icon' => 'Flower2',
                'sort_order' => 6,
                'children' => [
                    'Bibit Tanaman' => [
                        'Bibit Buah', 'Bibit Sayur', 'Bibit Bunga', 'Bibit Pohon',
                        'Benih Hidroponik', 'Stek Tanaman', 'Bibit Tanaman Hias',
                    ],
                    'Pupuk' => [
                        'Pupuk Organik', 'Pupuk Kimia', 'Pupuk Cair', 'Pupuk NPK',
                        'Pupuk Kandang', 'Pupuk Daun', 'Pupuk Buah',
                    ],
                    'Alat Pertanian' => [
                        'Cangkul', 'Sekop', 'Garpu Taman', 'Gunting Tanaman',
                        'Mesin Potong Rumput', 'Sprayer', 'Selang Air',
                        'Pompa Air', 'Traktor Mini', 'Alat Semprot Hama',
                    ],
                    'Pestisida' => [
                        'Pembasmi Hama', 'Fungisida', 'Insektisida', 'Herbisida',
                        'Rodentisida', 'Obat Tanaman',
                    ],
                    'Tanaman Hias' => [
                        'Tanaman Indoor', 'Tanaman Outdoor', 'Kaktus', 'Sukulen',
                        'Monstera', 'Aglaonema', 'Palem', 'Anggrek',
                        'Bonsai', 'Lidah Mertua',
                    ],
                    'Peralatan Ternak' => [
                        'Kandang Ternak', 'Pakan Ternak', 'Vitamin Ternak',
                        'Minum Ternak', 'Kandang Ayam', 'Kandang Kambing',
                        'Alat Penetas Telur', 'Timbangan Ternak',
                    ],
                ],
            ],
            [
                'name' => 'Olahraga',
                'slug' => 'olahraga',
                'icon' => 'Trophy',
                'sort_order' => 7,
                'children' => [
                    'Olahraga Lari' => [
                        'Sepatu Lari', 'Baju Lari', 'Celana Lari', 'Kaos Kaki Lari',
                        'Tas Lari', 'Armband HP', 'GPS Watch',
                    ],
                    'Fitness' => [
                        'Dumbbell', 'Barbell', 'Matras Yoga', 'Kettlebell',
                        'Resistance Band', 'Bola Gym', 'Sarung Tangan Gym',
                        'Bench Press', 'Pull Up Bar', 'Jump Rope',
                    ],
                    'Olahraga Air' => [
                        'Baju Renang', 'Kacamata Renang', 'Topi Renang', 'Fin Renang',
                        'Pelampung', 'Papan Selancar', 'Snorkel Set',
                    ],
                    'Olahraga Bola' => [
                        'Bola Sepak', 'Bola Basket', 'Bola Voli', 'Bola Futsal',
                        'Bola Tenis', 'Bola Golf', 'Sepatu Bola', 'Jersey Bola',
                        'Kaos Kaki Bola', 'Sarung Tangan Kiper',
                    ],
                    'Camping & Hiking' => [
                        'Tenda', 'Sleeping Bag', 'Tas Carrier', 'Kompor Portable',
                        'Nesting Set', 'Headlamp', 'Sepatu Hiking', 'Trekking Pole',
                        'Matras Lapangan', 'Waterproof Bag',
                    ],
                    'Perlengkapan Olahraga' => [
                        'Raket Badminton', 'Bet Tenis Meja', 'Stik Golf',
                        'Bola Bowling', 'Punching Bag', 'Boxing Gloves',
                        'Protector Set', 'Seragam Olahraga',
                    ],
                ],
            ],
            [
                'name' => 'Lainnya',
                'slug' => 'lainnya',
                'icon' => 'LayoutGrid',
                'sort_order' => 8,
                'children' => [
                    'Mainan' => [
                        'LEGO', 'Gunpla', 'Hot Wheels', 'Boneka', 'Puzzle',
                        'UNO Card', 'Monopoly', 'Rubik', 'Nerf Gun',
                        'Drone Mainan', 'Mobil Remote', 'Kapal Remote',
                        'Play-Doh', 'Slime', 'Yo-Yo',
                    ],
                    'Buku & Alat Tulis' => [
                        'Buku Tulis', 'Buku Gambar', 'Buku Agenda', 'Novel',
                        'Buku Pelajaran', 'Pena', 'Pensil', 'Spidol',
                        'Penghapus', 'Penggaris', 'Cutter', 'Lem',
                        'Kertas HVS', 'Map & Amplop',
                    ],
                    'Otomotif' => [
                        'Oli Mobil', 'Oli Motor', 'Ban Mobil', 'Ban Motor',
                        'Aki Mobil', 'Aki Motor', 'Kampas Rem', 'Filter Udara',
                        'Busi', 'Lampu LED Mobil', 'Sarung Jok', 'Karpet Mobil',
                    ],
                    'Souvenir' => [
                        'Box Kado', 'Kertas Kado', 'Goodie Bag', 'Hampers',
                        'Mug Custom', 'Gantungan Kunci', 'Plakat Akrilik',
                        'Piala Trophy', 'Lilin Aromatherapy',
                    ],
                    'Perlengkapan Bayi' => [
                        'Popok', 'Susu Formula', 'Minyak Telon', 'Bedak Bayi',
                        'Baju Bayi', 'Selimut Bayi', 'Stroller', 'Car Seat',
                        'Baby Walker', 'Mainan Edukasi',
                    ],
                    'Kebutuhan Hewan' => [
                        'Makanan Kucing', 'Makanan Anjing', 'Kandang Hewan',
                        'Pasir Kucing', 'Litter Box', 'Tali Anjing',
                        'Shampoo Hewan', 'Vitamin Hewan', 'Mainan Hewan',
                    ],
                    'Peralatan Dapur' => [
                        'Panci', 'Wajan', 'Pisau Dapur', 'Talenan', 'Blender',
                        'Rice Cooker', 'Kompor Gas', 'Air Fryer', 'Oven',
                        'Mangkuk', 'Piring', 'Gelas', 'Sendok Garpu',
                        'Termos', 'Botol Minum', 'Tempat Bekal',
                    ],
                ],
            ],
        ];

        $this->command?->info('■■■ Membuat Kategori Marketplace ■■■');

        foreach ($parents as $parentData) {
            $children = $parentData['children'] ?? [];
            unset($parentData['children']);

            $parent = MarketplaceCategory::create($parentData);

            if (! empty($children)) {
                $sort = 1;
                foreach ($children as $childName => $keywords) {
                    $child = $parent->children()->create([
                        'name' => $childName,
                        'slug' => str($childName)->slug(),
                        'sort_order' => $sort++,
                        'is_active' => true,
                    ]);

                    foreach ($keywords as $keyword) {
                        $child->keywords()->create(['keyword' => $keyword]);
                    }
                }
            }
        }

        $this->command?->info('   ✓ Kategori marketplace selesai');
    }
}
