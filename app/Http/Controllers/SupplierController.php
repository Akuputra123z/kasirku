<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('manage-suppliers');

        $search = $request->get('search');

        $suppliers = Supplier::when($search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")
            ->orWhere('email', 'like', "%{$s}%")
            ->orWhere('phone', 'like', "%{$s}%"))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('suppliers/index', [
            'suppliers' => $suppliers,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(StoreSupplierRequest $request)
    {
        Gate::authorize('manage-suppliers');

        Supplier::create($request->validated());

        return Redirect::back()->with('success', 'Supplier created successfully.');
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier)
    {
        Gate::authorize('manage-suppliers');

        $supplier->update($request->validated());

        return Redirect::back()->with('success', 'Supplier updated successfully.');
    }

    public function destroy(Supplier $supplier)
    {
        Gate::authorize('manage-suppliers');

        if ($supplier->purchaseOrders()->exists()) {
            return Redirect::back()->with('error', 'Cannot delete supplier with purchase orders. Set inactive instead.');
        }

        $supplier->delete();

        return Redirect::back()->with('success', 'Supplier deleted successfully.');
    }
}
