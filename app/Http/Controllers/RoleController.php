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
    public function index(): Response
    {
        $roles = Role::where('guard_name', 'web')
            ->where('name', '!=', 'super-admin')
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
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        $role->syncPermissions($validated['permissions']);

        return back()->with('flash', [
            'success' => 'Role berhasil ditambahkan.',
        ]);
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles')->ignore($role->id)],
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role->update(['name' => $validated['name']]);
        $role->syncPermissions($validated['permissions']);

        return back()->with('flash', [
            'success' => 'Role berhasil diperbarui.',
        ]);
    }

    public function destroy(Role $role): RedirectResponse
    {
        $role->delete();

        return back()->with('flash', [
            'success' => 'Role berhasil dihapus.',
        ]);
    }
}
