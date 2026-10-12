<?php

use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::redirect('/', 'admin/users')->name('index');

    // All files are managed from the shared file pages with the "All users" scope.
    Route::redirect('uploads', '/files?scope=all')->name('uploads.index');

    Route::resource('users', UserController::class)->only(['index', 'edit', 'update', 'destroy']);
});
