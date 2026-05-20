<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ProductTemplateExport implements FromArray, WithHeadings
{
    public function headings(): array
    {
        return [
            'name',
            'description',
            'price',
            'stock',
            'category',
            'status',
        ];
    }

    public function array(): array
    {
        return [
            ['Teh Botol', 'Minuman teh botol 350ml', 5000, 100, 'Minuman Ringan', 'active'],
            ['Keripik Singkong', 'Keripik singkong original 200gr', 3500, 50, 'Makanan Ringan', 'active'],
        ];
    }
}
