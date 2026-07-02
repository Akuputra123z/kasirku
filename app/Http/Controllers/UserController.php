<?php

namespace App\Http\Controllers;

use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->get('search');

        $tenant = tenant();

        $tenantUserIds = TenantUser::where('tenant_id', $tenant?->id)
            ->pluck('user_id');

        $users = User::whereIn('id', $tenantUserIds)
            ->when($search, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->with('roles', 'tenantUsers')
            ->latest()
            ->paginate(10);

        $roles = Role::where('guard_name', 'web')
            ->where('name', '!=', 'super-admin')
            ->pluck('name');

        return Inertia::render('users/index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')],
            'password' => 'required|string|min:8',
            'role' => 'required|string|exists:roles,name',
        ]);

        $tenant = tenant();
        if ($tenant && $tenant->staffUsers()->count() >= $tenant->maxStaff()) {
            return redirect()->back()->with('flash', [
                'error' => 'Batas staff gratis ('.$tenant->maxStaff().') telah tercapai. Upgrade ke Premium untuk staff unlimited.',
            ]);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
        ]);

        TenantUser::create([
            'user_id' => $user->id,
            'tenant_id' => $tenant?->id,
            'role' => $validated['role'],
        ]);

        $user->assignRole($validated['role']);

        return redirect()->back()->with('flash', [
            'success' => 'Pengguna berhasil ditambahkan.',
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'role' => 'required|string|exists:roles,name',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'] ? bcrypt($validated['password']) : $user->password,
        ]);

        $tenantUser = TenantUser::where('user_id', $user->id)
            ->where('tenant_id', tenant()?->id)
            ->first();

        if ($tenantUser) {
            $tenantUser->update(['role' => $validated['role']]);
        }

        $user->syncRoles([$validated['role']]);

        return redirect()->back()->with('flash', [
            'success' => 'Pengguna berhasil diperbarui.',
        ]);
    }

    public function destroy(User $user): RedirectResponse
    {
        TenantUser::where('user_id', $user->id)
            ->where('tenant_id', tenant()?->id)
            ->delete();

        $user->delete();

        return redirect()->back()->with('flash', [
            'success' => 'Pengguna berhasil dihapus.',
        ]);
    }
}
