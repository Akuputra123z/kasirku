<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class BrandTemplateExport implements FromArray, WithHeadings
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
            ['ASUS', 'Brand laptop dan komponen komputer'],
            ['Logitech', 'Brand aksesoris keyboard, mouse, dan audio'],
        ];
    }
}
