<?php

use App\Http\Controllers\SharedFileController;
use App\Http\Controllers\ShareLinkController;
use App\Http\Controllers\TrashController;
use App\Http\Controllers\UploadController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    // Trash routes come before the resource so "trash" isn't taken for a file ID.
    Route::get('files/trash', [TrashController::class, 'index'])->name('files.trash');
    Route::patch('files/trash/{upload}', [TrashController::class, 'restore'])->withTrashed()->name('files.restore');
    Route::delete('files/trash/{upload}', [TrashController::class, 'destroy'])->withTrashed()->name('files.force-delete');

    Route::get('files/{upload}/download', [UploadController::class, 'download'])->name('files.download');
    Route::get('files/{upload}/preview', [UploadController::class, 'preview'])->name('files.preview');

    Route::post('files/{upload}/share', [ShareLinkController::class, 'store'])->name('files.share');
    Route::delete('files/{upload}/share', [ShareLinkController::class, 'destroy'])->name('files.unshare');

    Route::resource('files', UploadController::class)
        ->parameters(['files' => 'upload'])
        ->except('show');
});

// Public share links. No login needed; throttled to slow down token guessing.
Route::middleware('throttle:60,1')
    ->prefix('s/{token}')
    ->where(['token' => '[A-Za-z0-9]{40}'])
    ->name('shared.')
    ->group(function () {
        Route::get('/', [SharedFileController::class, 'show'])->name('show');
        Route::get('download', [SharedFileController::class, 'download'])->name('download');
        Route::get('preview', [SharedFileController::class, 'preview'])->name('preview');
    });
