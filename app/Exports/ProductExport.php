<?php

namespace App\Exports;

use App\Models\Product;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ProductExport implements FromCollection, ShouldAutoSize, WithHeadings
{
    /**
     * Judul kolom pada baris pertama Excel — selaras dengan kolom template
     * impor (ditambah id) agar hasil ekspor bisa di-import ulang.
     */
    public function headings(): array
    {
        return [
            'id',
            'name',
            'description',
            'price',
            'cost_price',
            'stock',
            'weight',
            'barcode',
            'category',
            'brand',
            'status',
        ];
    }

    public function collection(): Collection
    {
        return Product::with(['category', 'brand'])
            ->latest()
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
                'cost_price' => $product->cost_price,
                'stock' => $product->stock,
                'weight' => $product->weight,
                'barcode' => $product->barcode,
                'category' => $product->category?->name,
                'brand' => $product->brand?->name,
                'status' => $product->status,
            ]);
    }
}
