<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\StoreCustomer;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('manage-customers');

        $search = $request->get('search');
        $tenantId = tenant_id();

        $customers = Customer::whereHas('stores', fn ($q) => $q->where('tenant_id', $tenantId))
            ->with(['storeCustomer' => fn ($q) => $q->where('tenant_id', $tenantId)])
            ->when($search, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            })
            ->withCount('transactions')
            ->latest()
            ->paginate(10);

        $pointConfig = [];
        $currentTenant = tenant();
        if ($currentTenant instanceof Tenant) {
            $pointConfig = $currentTenant->getPointConfig();
        }

        return Inertia::render('customers/index', [
            'customers' => $customers,
            'filters' => ['search' => $search],
            'pointConfig' => $pointConfig,
        ]);
    }

    public function updatePointConfig(Request $request)
    {
        Gate::authorize('manage-customers');

        $validated = $request->validate([
            'points_per_currency' => ['required', 'integer', 'min:1', 'max:1000000'],
            'point_value' => ['required', 'integer', 'min:1', 'max:100000'],
            'min_redeem_points' => ['required', 'integer', 'min:1', 'max:100000'],
        ]);

        $tenant = tenant();
        if (! $tenant) {
            abort(404);
        }

        $settings = array_merge($tenant->settings ?? [], $validated);
        $tenant->settings = $settings;
        $tenant->save();

        return redirect()->back()->with('success', 'Konfigurasi poin berhasil diperbarui.');
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-customers');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['nullable', 'email'],
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        $customer = Customer::create($validated);

        StoreCustomer::create([
            'customer_id' => $customer->id,
            'tenant_id' => tenant_id(),
            'loyalty_points' => 0,
        ]);

        if (! $request->header('X-Inertia') && $request->wantsJson()) {
            $storeCustomer = StoreCustomer::where('customer_id', $customer->id)
                ->where('tenant_id', tenant_id())
                ->first();

            return response()->json([
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'loyalty_points' => $storeCustomer?->loyalty_points ?? 0,
            ], 201);
        }

        return redirect()->back()->with('success', 'Pelanggan berhasil ditambahkan.');
    }

    public function update(Request $request, Customer $customer)
    {
        Gate::authorize('manage-customers');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['nullable', 'email'],
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        $customer->update($validated);

        return redirect()->back()->with('success', 'Pelanggan berhasil diperbarui.');
    }

    public function destroy(Customer $customer)
    {
        Gate::authorize('manage-customers');

        StoreCustomer::where('customer_id', $customer->id)
            ->where('tenant_id', tenant_id())
            ->delete();

        $customer->delete();

        return redirect()->back()->with('success', 'Pelanggan berhasil dihapus.');
    }
}
