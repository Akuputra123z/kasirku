<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Nama role yang dilarang dibuat/dipakai tenant.
     */
    protected const RESERVED_ROLE_NAMES = ['super-admin'];

    public function index(): Response
    {
        $roles = Role::where('guard_name', 'web')
            ->where('name', '!=', 'super-admin')
            ->where('tenant_id', tenant_id())
            ->with('permissions')
            ->get()
            ->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ]);

        $permissions = Permission::where('guard_name', 'web')
            ->where('name', '!=', 'manage-tenants')
            ->where('name', '!=', 'view-platform-dashboard')
            ->pluck('name');

        return Inertia::render('roles/index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'not_in:'.implode(',', self::RESERVED_ROLE_NAMES),
                Rule::unique('roles', 'name')->where('tenant_id', tenant_id()),
            ],
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
            'tenant_id' => tenant_id(),
        ]);

        $role->syncPermissions($this->sanitizeTenantPermissions($validated['permissions']));

        return back()->with('flash', [
            'success' => 'Role berhasil ditambahkan.',
        ]);
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        // Wajib milik tenant aktif — tidak boleh menyentuh role tenant lain
        // atau role global (super-admin).
        $role = Role::where('tenant_id', tenant_id())->findOrFail($role->id);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'not_in:'.implode(',', self::RESERVED_ROLE_NAMES),
                Rule::unique('roles', 'name')
                    ->where('tenant_id', tenant_id())
                    ->ignore($role->id),
            ],
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role->update(['name' => $validated['name']]);
        $role->syncPermissions($this->sanitizeTenantPermissions($validated['permissions']));

        return back()->with('flash', [
            'success' => 'Role berhasil diperbarui.',
        ]);
    }

    public function destroy(Role $role): RedirectResponse
    {
        Role::where('tenant_id', tenant_id())->findOrFail($role->id)->delete();

        return back()->with('flash', [
            'success' => 'Role berhasil dihapus.',
        ]);
    }

    /**
     * Tenant tidak boleh diberikan permission platform-level.
     */
    protected function sanitizeTenantPermissions(array $permissionNames): array
    {
        return array_values(array_filter($permissionNames, function (string $name) {
            return ! in_array($name, ['manage-tenants', 'view-platform-dashboard']);
        }));
    }
}
