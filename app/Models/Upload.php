<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Upload extends Model
{
    /** @use HasFactory<\Database\Factories\UploadFactory> */
    use HasFactory, Prunable, SoftDeletes;

    /**
     * Days a file stays in the trash before it is removed for good.
     */
    public const TRASH_DAYS = 30;

    /**
     * Types that are safe to show inline in the browser. SVG and HTML are
     * deliberately left out because they can run scripts.
     *
     * @var list<string>
     */
    public const PREVIEWABLE_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
    ];

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
        'share_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'previewable',
        'share_url',
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
            'share_expires_at' => 'datetime',
        ];
    }

    /**
     * Remove the stored file only when the record is permanently deleted;
     * a soft delete just moves it to the trash.
     */
    protected static function booted(): void
    {
        static::forceDeleted(function (Upload $upload) {
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
     * Uploads visible to the given user: their own, or everyone's for an
     * admin who asked for all of them.
     *
     * @param  Builder<Upload>  $query
     */
    public function scopeVisibleTo(Builder $query, User $user, bool $all = false): void
    {
        if (! ($all && $user->is_admin)) {
            $query->whereBelongsTo($user);
        }
    }

    /**
     * Trashed uploads that are old enough to be removed by `model:prune`.
     *
     * @return Builder<Upload>
     */
    public function prunable(): Builder
    {
        return static::onlyTrashed()->where('deleted_at', '<=', now()->subDays(self::TRASH_DAYS));
    }

    /**
     * Whether the file can be shown inline in the browser.
     *
     * @return Attribute<bool, never>
     */
    protected function previewable(): Attribute
    {
        return Attribute::get(fn () => in_array($this->mime_type, self::PREVIEWABLE_TYPES, true));
    }

    /**
     * The public share URL, or null when the file isn't shared or the link expired.
     *
     * @return Attribute<string|null, never>
     */
    protected function shareUrl(): Attribute
    {
        return Attribute::get(fn () => $this->hasActiveShareLink()
            ? route('shared.show', $this->share_token)
            : null);
    }

    /**
     * Whether the file currently has a working share link.
     */
    public function hasActiveShareLink(): bool
    {
        return $this->share_token !== null
            && ($this->share_expires_at === null || $this->share_expires_at->isFuture());
    }

    /**
     * Create a new share link, replacing any existing one.
     */
    public function share(?int $days): void
    {
        $this->forceFill([
            'share_token' => Str::random(40),
            'share_expires_at' => $days ? now()->addDays($days) : null,
        ])->save();
    }

    /**
     * Turn off the share link.
     */
    public function unshare(): void
    {
        $this->forceFill([
            'share_token' => null,
            'share_expires_at' => null,
        ])->save();
    }

    /**
     * Delete the stored file from its disk.
     */
    public function deleteFile(): void
    {
        Storage::disk($this->disk)->delete($this->path);
    }
}
