<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class VoucherController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('manage-vouchers');

        $search = $request->get('search');

        $vouchers = Voucher::when($search, fn ($q, $s) => $q->where('code', 'like', "%{$s}%")->orWhere('name', 'like', "%{$s}%"))
            ->latest()
            ->paginate(10);

        return Inertia::render('vouchers/index', [
            'vouchers' => $vouchers,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-vouchers');

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('vouchers', 'code')->whereNull('deleted_at')->where('tenant_id', tenant_id())],
            'name' => 'required|string|max:255',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after:valid_from',
            'is_active' => 'boolean',
        ]);

        Voucher::create($validated);

        return redirect()->back()->with('success', 'Voucher berhasil ditambahkan.');
    }

    public function update(Request $request, Voucher $voucher)
    {
        Gate::authorize('manage-vouchers');

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('vouchers', 'code')->whereNull('deleted_at')->where('tenant_id', tenant_id())->ignore($voucher->id)],
            'name' => 'required|string|max:255',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after:valid_from',
            'is_active' => 'boolean',
        ]);

        $voucher->update($validated);

        return redirect()->back()->with('success', 'Voucher berhasil diperbarui.');
    }

    public function destroy(Voucher $voucher)
    {
        Gate::authorize('manage-vouchers');

        $voucher->delete();

        return redirect()->back()->with('success', 'Voucher berhasil dihapus.');
    }

    public function validateCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:50',
            'order_amount' => 'required|numeric|min:0',
        ]);

        $voucher = Voucher::where('code', $request->code)->first();

        if (! $voucher) {
            return response()->json(['valid' => false, 'message' => 'Kode voucher tidak ditemukan.']);
        }

        if (! $voucher->isValid((float) $request->order_amount)) {
            return response()->json(['valid' => false, 'message' => 'Voucher sudah tidak berlaku atau tidak memenuhi syarat.']);
        }

        $discount = $voucher->calculateDiscount((float) $request->order_amount);

        return response()->json([
            'valid' => true,
            'voucher' => [
                'id' => $voucher->id,
                'code' => $voucher->code,
                'name' => $voucher->name,
                'type' => $voucher->type,
                'value' => $voucher->value,
                'discount' => $discount,
            ],
        ]);
    }
}
