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
    protected const RESERVED_ROLE_NAMES = ['super-admin'];

    public function index(Request $request): Response
    {
        $search = $request->get('search');

        $tenant = tenant();

        $tenantUserIds = TenantUser::where('tenant_id', $tenant?->id)
            ->pluck('user_id');

        $users = User::whereIn('id', $tenantUserIds)
            ->when($search, function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->with('roles', 'tenantUsers')
            ->latest()
            ->paginate(10);

        $roles = Role::where('guard_name', 'web')
            ->where('name', '!=', 'super-admin')
            ->where('tenant_id', $tenant?->id)
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
            'role' => [
                'required',
                'string',
                'not_in:'.implode(',', self::RESERVED_ROLE_NAMES),
                Rule::exists('roles', 'name')->where('tenant_id', tenant_id()),
            ],
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

        $this->assignTenantRole($user, $validated['role']);

        return redirect()->back()->with('flash', [
            'success' => 'Pengguna berhasil ditambahkan.',
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        // Target user wajib menjadi anggota tenant aktif (anti cross-tenant).
        $this->assertMemberOfTenant($user);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'role' => [
                'required',
                'string',
                'not_in:'.implode(',', self::RESERVED_ROLE_NAMES),
                Rule::exists('roles', 'name')->where('tenant_id', tenant_id()),
            ],
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

        $this->assignTenantRole($user, $validated['role']);

        return redirect()->back()->with('flash', [
            'success' => 'Pengguna berhasil diperbarui.',
        ]);
    }

    public function destroy(User $user): RedirectResponse
    {
        // Hanya boleh menghapus keanggotaan dari tenant aktif.
        $this->assertMemberOfTenant($user);

        TenantUser::where('user_id', $user->id)
            ->where('tenant_id', tenant()?->id)
            ->delete();

        $remainingMemberships = TenantUser::where('user_id', $user->id)->exists();

        // Akun yang masih dipakai toko lain tidak boleh ikut terhapus.
        if (! $remainingMemberships) {
            $user->delete();
        }

        return redirect()->back()->with('flash', [
            'success' => 'Pengguna berhasil dihapus dari toko ini.',
        ]);
    }

    /**
     * Sync role spatie dengan instance role milik tenant aktif, bukan lookup
     * nama global (spatie teams nonaktif → lookup nama bisa mengenai role
     * tenant lain).
     */
    protected function assignTenantRole(User $user, string $roleName): void
    {
        $role = Role::where('guard_name', 'web')
            ->where('tenant_id', tenant()?->id)
            ->where('name', $roleName)
            ->first();

        if (! $role) {
            return;
        }

        $user->syncRoles([$role]);
    }

    protected function assertMemberOfTenant(User $user): void
    {
        $isMember = TenantUser::where('user_id', $user->id)
            ->where('tenant_id', tenant()?->id)
            ->exists();

        abort_unless($isMember, 403, 'Pengguna ini bukan anggota toko Anda.');
    }
}
