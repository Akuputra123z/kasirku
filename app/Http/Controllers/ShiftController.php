<?php

namespace App\Http\Controllers;

use App\Http\Requests\CloseShiftRequest;
use App\Http\Requests\StartShiftRequest;
use App\Models\PaymentMethod;
use App\Models\Shift;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ShiftController extends Controller
{
    public function index()
    {
        $shifts = Shift::with('user')
            ->withCount('transactions')
            ->withSum('transactions', 'total_amount')
            ->latest()
            ->paginate(10);

        $activeShift = Shift::with('user')
            ->withCount('transactions')
            ->withSum('transactions', 'total_amount')
            ->where('user_id', Auth::id())
            ->whereNull('end_time')
            ->first();

        if ($activeShift) {
            $cashTotal = Transaction::where('shift_id', $activeShift->id)
                ->where('payment_method_id', PaymentMethod::where('name', 'Cash')->value('id'))
                ->sum('total_amount');
            $activeShift->expected_cash = $activeShift->starting_cash + (float) $cashTotal;
        }

        return Inertia::render('shifts/index', [
            'shifts' => $shifts,
            'active_shift' => $activeShift,
        ]);
    }

    public function start(StartShiftRequest $request)
    {
        // Proteksi: Cek apakah user sudah memiliki shift yang masih aktif
        $activeShift = Shift::where('user_id', Auth::id())
            ->whereNull('end_time')
            ->exists();

        if ($activeShift) {
            return Redirect::back()->with('error', 'Anda masih memiliki shift yang belum ditutup.');
        }

        // Buat Shift Baru
        Shift::create([
            'user_id' => Auth::id(),
            'start_time' => now(),
            'starting_cash' => $request->starting_cash,
        ]);

        return Redirect::back()->with('success', 'Shift berhasil dimulai.');
    }

    public function close(CloseShiftRequest $request, Shift $shift)
    {
        // Proteksi Keamanan:
        // Pastikan shift ini milik user yang sedang login dan shift tersebut memang belum ditutup
        if ($shift->user_id !== Auth::id() || $shift->end_time !== null) {
            return Redirect::back()->with('error', 'Tindakan tidak valid atau shift sudah ditutup sebelumnya.');
        }

        $totalCashTransactions = Transaction::where('shift_id', $shift->id)
            ->where('payment_method_id', PaymentMethod::where('name', 'Cash')->value('id'))
            ->sum('total_amount');

        $expected = $shift->starting_cash + $totalCashTransactions;

        // Update Data Shift
        $shift->update([
            'end_time' => now(),
            'expected_cash' => $expected,
            'actual_cash' => $request->actual_cash,
            'notes' => $request->notes,
        ]);

        return Redirect::back()->with('success', 'Shift berhasil ditutup.');
    }
}
