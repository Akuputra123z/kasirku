<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TenantController extends Controller
{
    public function index(): Response
    {
        $tenants = Tenant::latest()->paginate(20);

        return Inertia::render('admin/tenants', [
            'tenants' => $tenants,
        ]);
    }

    public function enter(string $slug): RedirectResponse
    {
        $tenant = Tenant::where('slug', $slug)->firstOrFail();

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
