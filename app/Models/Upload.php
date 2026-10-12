<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Upload extends Model
{
    /** @use HasFactory<\Database\Factories\UploadFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'description',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'disk',
        'path',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size' => 'integer',
        ];
    }

    /**
     * Remove the stored file when the record is deleted.
     */
    protected static function booted(): void
    {
        static::deleted(function (Upload $upload) {
            $upload->deleteFile();
        });
    }

    /**
     * The user who uploaded the file.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Delete the stored file from its disk.
     */
    public function deleteFile(): void
    {
        Storage::disk($this->disk)->delete($this->path);
    }
}
