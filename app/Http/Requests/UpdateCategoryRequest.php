<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $categoryId = $this->route('category');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('categories', 'name')->whereNull('deleted_at')->where('tenant_id', tenant_id())->ignore($categoryId)],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }
}
