<?php

namespace App\Http\Requests\Uploads;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreUploadRequest extends FormRequest
{
    /**
     * Largest accepted file, in kilobytes (10 MB).
     */
    public const MAX_FILE_SIZE = 10240;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Optional: drag-and-drop uploads fall back to the file name.
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'file' => ['required', 'file', 'max:'.self::MAX_FILE_SIZE],
        ];
    }
}
