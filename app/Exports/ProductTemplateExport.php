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
            'cost_price',
            'stock',
            'barcode',
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
                4000,
                100,
                '8991234567890',
                'Minuman Ringan',
                '',
                'active',
            ],
            [
                'Keripik Singkong',
                'Keripik singkong original 200gr',
                3500,
                2500,
                50,
                '',
                'Makanan Ringan',
                '',
                'active',
            ],
        ];
    }
}
