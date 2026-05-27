<?php

namespace App\Http\Controllers;

use App\Exports\BrandTemplateExport;
use App\Http\Requests\StoreBrandRequest;
use App\Http\Requests\UpdateBrandRequest;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BrandController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('manage-brands');

        $search = $request->get('search');

        $brands = Brand::when($search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('brands/index', [
            'brands' => $brands,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(StoreBrandRequest $request)
    {
        Gate::authorize('manage-brands');

        Brand::create($request->validated());

        return redirect()->back()->with('success', 'Brand created successfully.');
    }

    public function update(UpdateBrandRequest $request, Brand $brand)
    {
        Gate::authorize('manage-brands');

        $brand->update($request->validated());

        return redirect()->back()->with('success', 'Brand updated successfully.');
    }

    public function destroy(Brand $brand)
    {
        Gate::authorize('manage-brands');

        if ($brand->products()->exists()) {
            return redirect()->back()->with('error', 'Brand masih memiliki produk terkait. Pindahkan atau hapus produk terlebih dahulu.');
        }

        $brand->delete();

        return redirect()->back()->with('success', 'Brand deleted successfully.');
    }

    public function import(Request $request)
    {
        Gate::authorize('manage-brands');

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ]);

        $imported = 0;
        $errors = [];
        $rowNumber = 0;

        $rows = Excel::toArray(new class implements ToArray
        {
            public function array(array $array): void {}
        }, $request->file('file'));

        $rows = $rows[0] ?? [];

        if (empty($rows)) {
            return redirect()->back()->with('import', [
                'imported' => 0,
                'errors' => ['File Excel kosong atau tidak valid.'],
            ]);
        }

        $headers = array_map('trim', array_map('strval', $rows[0]));

        foreach (array_slice($rows, 1) as $row) {
            $rowNumber++;
            $row = array_map('trim', array_map('strval', $row));

            if (count($headers) !== count($row)) {
                $errors[] = "Baris {$rowNumber}: Jumlah kolom tidak sesuai.";

                continue;
            }

            $rowData = array_combine($headers, $row);

            if (blank($rowData['name'] ?? null)) {
                $errors[] = "Baris {$rowNumber}: Nama brand wajib diisi.";

                continue;
            }

            if (Brand::withTrashed()->where('name', $rowData['name'])->exists()) {
                $errors[] = "Baris {$rowNumber}: Brand '{$rowData['name']}' sudah ada.";

                continue;
            }

            Brand::create([
                'name' => $rowData['name'],
                'description' => $rowData['description'] ?? null,
            ]);

            $imported++;
        }

        return redirect()->back()->with('import', compact('imported', 'errors'));
    }

    public function downloadTemplate(): BinaryFileResponse
    {
        return Excel::download(new BrandTemplateExport, 'template-brand.xlsx');
    }
}
