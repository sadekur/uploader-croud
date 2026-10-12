<?php

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

// Permanently removes files that have been in the trash longer than Upload::TRASH_DAYS.
Schedule::command('model:prune')->daily();

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('user:make-admin {email}', function (string $email) {
    $user = User::where('email', $email)->first();

    if (! $user) {
        $this->error("No user found with email {$email}.");

        return 1;
    }

    $user->forceFill(['is_admin' => true])->save();

    $this->info("{$user->name} is now an administrator.");
})->purpose('Give an existing user access to the admin panel');
