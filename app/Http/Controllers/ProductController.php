<?php

namespace App\Http\Controllers;

use App\Exports\ProductTemplateExport;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ProductController extends Controller
{
    /**
     * Menampilkan daftar produk dengan relasi kategori.
     */
    public function index(): Response
    {
        Gate::authorize('manage-products');

        return Inertia::render('products/index', [
            'products' => Product::with(['category', 'variants'])->latest()->paginate(10),
            'categories' => Category::select('id', 'name')->get(),
        ]);
    }

    /**
     * Menyimpan produk baru beserta upload gambar.
     */
    public function store(StoreProductRequest $request)
    {
        Gate::authorize('manage-products');

        $validated = $request->validated();

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        $product = Product::create($validated);

        if (! empty($validated['variants'])) {
            $product->variants()->createMany($validated['variants']);
        }

        return Redirect::back()->with('success', 'Product created successfully.');
    }

    /**
     * Memperbarui data produk dan mengelola penggantian file gambar.
     */
    public function update(UpdateProductRequest $request, Product $product)
    {
        Gate::authorize('manage-products');

        $validated = $request->validated();

        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        $product->update($validated);

        if (isset($validated['variants'])) {
            $product->variants()->delete();
            $product->variants()->createMany($validated['variants']);
        }

        return Redirect::back()->with('success', 'Product updated successfully.');
    }

    /**
     * Menghapus produk dan file gambar terkait.
     */
    public function destroy(Product $product)
    {
        Gate::authorize('manage-products');

        if ($product->transactionDetails()->exists()) {
            return Redirect::back()->with('error', 'Cannot delete product with transaction history. Use "inactive" status instead.');
        }

        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }

        $product->delete();

        return Redirect::back()->with('success', 'Product deleted successfully.');
    }

    /**
     * Menghapus banyak produk sekaligus.
     */
    public function bulkDestroy(Request $request)
    {
        Gate::authorize('manage-products');

        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return Redirect::back()->with('error', 'Tidak ada produk yang dipilih.');
        }

        $products = Product::whereIn('id', $ids)->get();
        $deleted = 0;
        $skipped = 0;

        foreach ($products as $product) {
            if ($product->transactionDetails()->exists()) {
                $skipped++;

                continue;
            }

            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }

            $product->delete();
            $deleted++;
        }

        $message = $deleted.' produk berhasil dihapus.';
        if ($skipped > 0) {
            $message .= ' '.$skipped.' produk dilewati karena memiliki riwayat transaksi.';
        }

        return Redirect::back()->with('success', $message);
    }

    /**
     * Menampilkan detail produk.
     */
    public function show(Product $product)
    {
        Gate::authorize('manage-products');

        $product->load(['category', 'variants']);

        return Inertia::render('products/show', [
            'product' => $product,
        ]);
    }

    public function import(Request $request)
    {
        Gate::authorize('manage-products');

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
                $errors[] = "Baris {$rowNumber}: Nama produk wajib diisi.";

                continue;
            }

            if (! is_numeric($rowData['price'] ?? null) || (float) $rowData['price'] < 0) {
                $errors[] = "Baris {$rowNumber}: Harga harus berupa angka dan tidak boleh negatif.";

                continue;
            }

            $category = null;
            if (! blank($rowData['category'] ?? null)) {
                $category = Category::where('name', $rowData['category'])->first();

                if ($category === null) {
                    $errors[] = "Baris {$rowNumber}: Kategori '{$rowData['category']}' tidak ditemukan.";

                    continue;
                }
            }

            $status = ! blank($rowData['status'] ?? null) ? strtolower($rowData['status']) : 'active';

            if (! in_array($status, ['active', 'inactive'])) {
                $errors[] = "Baris {$rowNumber}: Status harus 'active' atau 'inactive'.";

                continue;
            }

            Product::create([
                'name' => $rowData['name'],
                'description' => $rowData['description'] ?? null,
                'price' => (float) $rowData['price'],
                'stock' => (int) ($rowData['stock'] ?? 0),
                'category_id' => $category?->id,
                'status' => $status,
            ]);

            $imported++;
        }

        return redirect()->back()->with('import', compact('imported', 'errors'));
    }

    public function downloadTemplate(): BinaryFileResponse
    {
        return Excel::download(new ProductTemplateExport, 'template-produk.xlsx');
    }
}
