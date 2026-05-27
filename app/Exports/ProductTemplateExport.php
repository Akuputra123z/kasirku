<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ProductTemplateExport implements FromArray, WithHeadings
{
    /**
     * Menentukan judul kolom pada baris pertama Excel.
     */
    public function headings(): array
    {
        return [
            'name',
            'description',
            'price',
            'stock',
            'category',
            'brand',
            'status',
        ];
    }

    /**
     * Menyediakan data contoh di dalam template.
     */
    public function array(): array
    {
        return [
            [
                'Teh Botol', 
                'Minuman teh botol 350ml', 
                5000, 
                100, 
                'Minuman Ringan', 
                '', // Diisi kosong jika produk belum memiliki brand resmi
                'active'
            ],
            [
                'Keripik Singkong', 
                'Keripik singkong original 200gr', 
                3500, 
                50, 
                'Makanan Ringan', 
                '', 
                'active'
            ],
        ];
    }
}