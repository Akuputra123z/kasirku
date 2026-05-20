<?php

namespace App\Http\Controllers;

use App\Exports\CategoryTemplateExport;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        Gate::authorize('manage-categories');

        $search = $request->get('search');

        $categories = Category::when($search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('categories/index', [
            'categories' => $categories,
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCategoryRequest $request)
    {
        Gate::authorize('manage-categories');

        Category::create($request->validated());

        return redirect()->back()->with('success', 'Category created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCategoryRequest $request, Category $category)
    {
        Gate::authorize('manage-categories');

        $category->update($request->validated());

        return redirect()->back()->with('success', 'Category updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category)
    {
        Gate::authorize('manage-categories');

        if ($category->products()->exists()) {
            return redirect()->back()->with('error', 'Kategori masih memiliki produk terkait. Pindahkan atau hapus produk terlebih dahulu.');
        }

        $category->delete();

        return redirect()->back()->with('success', 'Category deleted successfully.');
    }

    public function import(Request $request)
    {
        Gate::authorize('manage-categories');

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
                $errors[] = "Baris {$rowNumber}: Nama kategori wajib diisi.";

                continue;
            }

            if (Category::withTrashed()->where('name', $rowData['name'])->exists()) {
                $errors[] = "Baris {$rowNumber}: Kategori '{$rowData['name']}' sudah ada.";

                continue;
            }

            Category::create([
                'name' => $rowData['name'],
                'description' => $rowData['description'] ?? null,
            ]);

            $imported++;
        }

        return redirect()->back()->with('import', compact('imported', 'errors'));
    }

    public function downloadTemplate(): BinaryFileResponse
    {
        return Excel::download(new CategoryTemplateExport, 'template-kategori.xlsx');
    }
}
