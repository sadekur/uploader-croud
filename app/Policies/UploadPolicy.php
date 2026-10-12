<?php

namespace App\Policies;

use App\Models\Upload;
use App\Models\User;

class UploadPolicy
{
    /**
     * Admins can manage every file.
     */
    public function before(User $user): ?bool
    {
        return $user->is_admin ? true : null;
    }

    /**
     * View, download or preview the file.
     */
    public function view(User $user, Upload $upload): bool
    {
        return $upload->user_id === $user->id;
    }

    /**
     * Edit the file's details, replace it, or manage its share link.
     */
    public function update(User $user, Upload $upload): bool
    {
        return $upload->user_id === $user->id;
    }

    /**
     * Move the file to the trash.
     */
    public function delete(User $user, Upload $upload): bool
    {
        return $upload->user_id === $user->id;
    }

    /**
     * Restore the file from the trash.
     */
    public function restore(User $user, Upload $upload): bool
    {
        return $upload->user_id === $user->id;
    }

    /**
     * Delete the file permanently.
     */
    public function forceDelete(User $user, Upload $upload): bool
    {
        return $upload->user_id === $user->id;
    }
}
