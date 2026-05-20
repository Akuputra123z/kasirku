<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class CategoryTemplateExport implements FromArray, WithHeadings
{
    public function headings(): array
    {
        return [
            'name',
            'description',
        ];
    }

    public function array(): array
    {
        return [
            ['Minuman Ringan', 'Kategori untuk minuman kemasan dan botol'],
            ['Makanan Ringan', 'Kategori untuk snack dan cemilan'],
        ];
    }
}
