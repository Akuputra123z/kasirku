<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentMethodRequest;
use App\Http\Requests\UpdatePaymentMethodRequest;
use App\Models\PaymentMethod;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class PaymentMethodController extends Controller
{
    public function index()
    {
        Gate::authorize('manage-payment-methods');

        return Inertia::render('transactions/paymentMethods', [
            'methods' => PaymentMethod::all(),
        ]);
    }

    public function store(StorePaymentMethodRequest $request)
    {
        Gate::authorize('manage-payment-methods');

        PaymentMethod::create($request->validated());

        return Redirect::back()->with('success', 'Payment method added.');
    }

    public function update(UpdatePaymentMethodRequest $request, PaymentMethod $paymentMethod)
    {
        Gate::authorize('manage-payment-methods');

        $paymentMethod->update($request->validated());

        return Redirect::back()->with('success', 'Payment method updated.');
    }

    public function destroy(PaymentMethod $paymentMethod)
    {
        Gate::authorize('manage-payment-methods');

        $paymentMethod->delete();

        return Redirect::back()->with('success', 'Payment method deleted.');
    }
}
