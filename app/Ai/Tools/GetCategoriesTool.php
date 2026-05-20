<?php

namespace App\Ai\Tools;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetCategoriesTool implements Tool
{
    public function description(): Stringable|string
    {
        return 'Mengambil daftar kategori produk. Bisa filter berdasarkan nama kategori.';
    }

    public function handle(Request $request): Stringable|string
    {
        $query = Category::query();

        if (! empty($request['search'])) {
            $query->where('name', 'like', '%'.$request['search'].'%');
        }

        $categories = $query->latest()->get()->map(fn ($c) => [
            'id' => $c->id,
            'nama' => $c->name,
            'deskripsi' => $c->description ?? '-',
            'jumlah_produk' => Product::where('category_id', $c->id)->count(),
        ]);

        if ($categories->isEmpty()) {
            return 'Tidak ada kategori ditemukan.';
        }

        return json_encode($categories->toArray(), JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'search' => $schema->string()->nullable()->description('Cari kategori berdasarkan nama'),
        ];
    }
}
