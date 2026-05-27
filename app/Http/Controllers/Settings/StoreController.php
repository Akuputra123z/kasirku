<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    public function edit(Request $request): Response
    {
        if (! tenant()) {
            abort(404);
        }

        return Inertia::render('settings/store');
    }

    public function update(Request $request): RedirectResponse
    {
        $tenant = tenant();

        if (! $tenant) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:50'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'color_theme' => ['nullable', 'string', 'in:default,emerald,violet,amber,rose,blue,slate'],
            'points_per_currency' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'point_value' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'min_redeem_points' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'receipt_footer' => ['nullable', 'string', 'max:200'],
        ]);

        $tenant->name = $validated['name'];
        $tenant->address = $validated['address'] ?? '';
        $tenant->phone = $validated['phone'] ?? '';

        if ($request->hasFile('logo')) {
            if ($tenant->logo) {
                Storage::disk('public')->delete($tenant->logo);
            }
            $tenant->logo = $request->file('logo')->store('logos', 'public');
        }

        if (isset($validated['color_theme'])) {
            $tenant->color_theme = $validated['color_theme'];
        }

        $settings = array_merge($tenant->settings ?? [], [
            'points_per_currency' => (int) ($validated['points_per_currency'] ?? 10000),
            'point_value' => (int) ($validated['point_value'] ?? 100),
            'min_redeem_points' => (int) ($validated['min_redeem_points'] ?? 100),
            'receipt_footer' => $validated['receipt_footer'] ?? 'TERIMA KASIH',
        ]);
        $tenant->settings = $settings;

        $tenant->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profil toko berhasil diperbarui.')]);

        return to_route('settings.store');
    }
}
