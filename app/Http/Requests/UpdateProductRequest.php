<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->brand_id === '' || $this->brand_id === 'null' || $this->brand_id === 'none') {
            $this->merge(['brand_id' => null]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'category_id' => ['required', 'exists:categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
            'barcode' => ['nullable', 'string', 'max:100', Rule::unique('products')->ignore($this->route('product'))->where(fn ($q) => $q->where('tenant_id', tenant_id()))],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'variants' => ['nullable', 'array'],
            'variants.*.id' => ['nullable', 'exists:product_variants,id'],
            'variants.*.name' => ['required_with:variants', 'string', 'max:255'],
            'variants.*.additional_price' => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.stock' => ['nullable', 'integer', 'min:0'],
            'variants.*.sku' => ['nullable', 'string', 'max:100'],
            'extras' => ['nullable', 'array'],
            'extras.*.id' => ['nullable', 'exists:product_extras,id'],
            'extras.*.name' => ['required_with:extras', 'string', 'max:255'],
            'extras.*.price' => ['required_with:extras', 'numeric', 'min:0'],
        ];
    }
}
