<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.price' => ['required', 'numeric', 'min:0'],
            'items.*.variant_name' => ['nullable', 'string'],
            'items.*.extras_selected' => ['nullable', 'array'],
            'items.*.notes' => ['nullable', 'string'],
            'payment_method_id' => ['required', 'exists:payment_methods,id'],
            'subtotal_amount' => ['required', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'paid_amount' => ['required', 'numeric', 'min:0'],
            'change_amount' => ['nullable', 'numeric', 'min:0'],
            'order_type' => ['required', Rule::in(['dine_in', 'take_away', 'delivery'])],
            'table_number' => ['nullable', 'string'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'customer_name' => ['required_with:customer_id', 'string'],
        ];
    }
}
