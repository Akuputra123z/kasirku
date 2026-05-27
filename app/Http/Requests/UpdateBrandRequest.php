<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBrandRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $brandId = $this->route('brand');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('brands', 'name')->whereNull('deleted_at')->where('tenant_id', tenant_id())->ignore($brandId)],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }
}
