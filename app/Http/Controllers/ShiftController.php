<?php

namespace App\Http\Controllers;

use App\Http\Requests\CloseShiftRequest;
use App\Http\Requests\StartShiftRequest;
use App\Models\PaymentMethod;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ShiftController extends Controller
{
    public function index()
    {
        $shifts = Shift::with('user')
            ->withCount(['transactions' => fn ($query) => $query->where('status', 'completed')])
            ->withSum(['transactions as transactions_sum_total_amount' => fn ($query) => $query->where('status', 'completed')], 'total_amount')
            ->latest()
            ->paginate(10);

        $activeShift = Shift::with('user')
            ->withCount(['transactions' => fn ($query) => $query->where('status', 'completed')])
            ->withSum(['transactions as transactions_sum_total_amount' => fn ($query) => $query->where('status', 'completed')], 'total_amount')
            ->where('user_id', Auth::id())
            ->whereNull('end_time')
            ->first();

        if ($activeShift) {
            $activeShift->expected_cash = $this->calculateExpectedCash($activeShift);
        }

        return Inertia::render('shifts/index', [
            'shifts' => $shifts,
            'active_shift' => $activeShift,
        ]);
    }

    public function start(StartShiftRequest $request)
    {
        $shift = null;

        DB::transaction(function () use ($request, &$shift) {
            // Serialisasi pembuatan shift per user: kunci row user agar dua
            // permintaan "start" bersamaan tidak membuat dua shift aktif.
            User::whereKey(Auth::id())->lockForUpdate()->first();

            if (Shift::where('user_id', Auth::id())->whereNull('end_time')->exists()) {
                return;
            }

            $shift = Shift::create([
                'user_id' => Auth::id(),
                'start_time' => now(),
                'starting_cash' => $request->starting_cash,
            ]);
        });

        if (! $shift) {
            return Redirect::back()->with('error', 'Anda masih memiliki shift yang belum ditutup.');
        }

        return Redirect::back()->with('success', 'Shift berhasil dimulai.');
    }

    public function close(CloseShiftRequest $request, Shift $shift)
    {
        $closed = false;

        DB::transaction(function () use ($shift, $request, &$closed) {
            // Kunci baris shift di dalam transaksi: dua permintaan "close"
            // bersamaan hanya satu yang berhasil (double-close dicegah).
            $lockedShift = Shift::whereKey($shift->id)->lockForUpdate()->first();

            // Shift harus milik user yang login dan memang belum ditutup
            if (! $lockedShift || $lockedShift->user_id !== Auth::id() || $lockedShift->end_time !== null) {
                return;
            }

            $lockedShift->update([
                'end_time' => now(),
                'expected_cash' => $this->calculateExpectedCash($lockedShift),
                'actual_cash' => $request->actual_cash,
                'notes' => $request->notes,
            ]);

            $closed = true;
        });

        if (! $closed) {
            return Redirect::back()->with('error', 'Tindakan tidak valid atau shift sudah ditutup sebelumnya.');
        }

        return Redirect::back()->with('success', 'Shift berhasil ditutup.');
    }

    /**
     * Kas yang diharapkan = uang awal + transaksi metode Cash yang sudah completed.
     */
    protected function calculateExpectedCash(Shift $shift): float
    {
        $cashMethodIds = PaymentMethod::where('type', 'Cash')->pluck('id');

        if ($cashMethodIds->isEmpty()) {
            return (float) $shift->starting_cash;
        }

        $cashTotal = Transaction::where('shift_id', $shift->id)
            ->where('status', 'completed')
            ->whereIn('payment_method_id', $cashMethodIds)
            ->sum('total_amount');

        return (float) $shift->starting_cash + (float) $cashTotal;
    }
}
