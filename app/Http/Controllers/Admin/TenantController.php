<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Inertia\Response;

class TenantController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Tenant::query();

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('subscription_status', $status);
        }

        $tenants = $query->latest()->paginate(20);

        return Inertia::render('admin/tenants', [
            'tenants' => $tenants,
            'filters' => [
                'search' => $request->get('search'),
                'status' => $request->get('status'),
            ],
        ]);
    }

    public function edit(Tenant $tenant): RedirectResponse
    {
        return redirect()->route('admin.tenants');
    }

    public function update(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:20',
            'subscription_tier' => 'nullable|in:free,premium',
        ]);

        $tenant->update($validated);

        activity()
            ->causedBy(auth()->user())
            ->performedOn($tenant)
            ->withProperties(['ip' => $request->ip(), 'user_agent' => $request->userAgent()])
            ->event('updated')
            ->log("Updated store: {$tenant->name}");

        return redirect()->route('admin.tenants')
            ->with('success', "Store '{$tenant->name}' updated successfully.");
    }

    public function toggleStatus(Request $request, Tenant $tenant): RedirectResponse
    {
        $oldStatus = $tenant->subscription_status;
        $tenant->subscription_status = $oldStatus === 'active' ? 'suspended' : 'active';
        $tenant->save();

        activity()
            ->causedBy(auth()->user())
            ->performedOn($tenant)
            ->withProperties(['ip' => $request->ip(), 'user_agent' => $request->userAgent()])
            ->event($tenant->subscription_status === 'active' ? 'activated' : 'suspended')
            ->log("{$tenant->name} — {$oldStatus} → {$tenant->subscription_status}");

        return back();
    }

    public function bulkAction(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:tenants,id',
            'action' => 'required|in:activate,suspend,delete',
        ]);

        $tenants = Tenant::whereIn('id', $request->ids);
        $action = $request->action;

        if ($action === 'suspend') {
            $tenants->update(['subscription_status' => 'suspended']);
        } elseif ($action === 'activate') {
            $tenants->update(['subscription_status' => 'active']);
        } elseif ($action === 'delete') {
            $tenants->get()->each->delete();
        }

        activity()
            ->causedBy(auth()->user())
            ->withProperties(['ids' => $request->ids, 'ip' => $request->ip(), 'user_agent' => $request->userAgent()])
            ->event("bulk_{$action}")
            ->log(count($request->ids)." stores {$action}d");

        return back();
    }

    public function reset(Tenant $tenant): RedirectResponse
    {
        if ($tenant->subscription_status !== 'active') {
            return redirect()->route('admin.tenants')
                ->with('error', 'Cannot reset a suspended store. Activate it first.');
        }

        activity()
            ->causedBy(auth()->user())
            ->performedOn($tenant)
            ->withProperties(['ip' => request()->ip(), 'user_agent' => request()->userAgent()])
            ->event('reset')
            ->log("Force reset DB for store: {$tenant->name}");

        $tenant->run(function () {
            Artisan::call('migrate:fresh', [
                '--force' => true,
                '--path' => 'database/migrations/tenant',
            ]);

            Artisan::call('db:seed', [
                '--force' => true,
                '--class' => config('tenancy.seeder_parameters.class'),
            ]);
        });

        return redirect()->route('admin.tenants')
            ->with('success', "Store '{$tenant->name}' has been reset successfully.");
    }

    public function enter(string $slug): RedirectResponse
    {
        $tenant = Tenant::where('slug', $slug)->firstOrFail();

        if ($tenant->subscription_status !== 'active') {
            return redirect()->route('admin.tenants')
                ->with('error', 'This store is currently suspended. Activate it first to enter.');
        }

        activity()
            ->causedBy(auth()->user())
            ->performedOn($tenant)
            ->withProperties(['ip' => request()->ip(), 'user_agent' => request()->userAgent()])
            ->event('entered')
            ->log("Entered store: {$tenant->name}");

        session()->put('central_admin_id', auth()->id());
        session()->put('tenant_id', $tenant->id);

        app()->instance('current.tenant', $tenant);

        return redirect('/dashboard');
    }

    public function leave(): RedirectResponse
    {
        session()->forget('central_admin_id');
        session()->forget('tenant_id');

        if (app()->bound('current.tenant')) {
            app()->forgetInstance('current.tenant');
        }

        return redirect('/admin/tenants');
    }
}
