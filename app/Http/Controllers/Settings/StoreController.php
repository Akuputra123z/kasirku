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

        $tenant->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profil toko berhasil diperbarui.')]);

        return to_route('settings.store');
    }
}
