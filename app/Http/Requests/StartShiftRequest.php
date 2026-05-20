<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StartShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'starting_cash' => ['required', 'numeric', 'min:0'],
        ];
    }
}
