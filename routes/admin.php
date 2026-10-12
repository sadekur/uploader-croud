<?php

use App\Http\Controllers\Admin\UploadController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::redirect('/', 'admin/uploads')->name('index');

    Route::get('uploads/{upload}/download', [UploadController::class, 'download'])->name('uploads.download');
    Route::resource('uploads', UploadController::class)->except('show');
});
