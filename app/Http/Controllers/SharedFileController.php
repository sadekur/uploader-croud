<?php

namespace App\Http\Controllers;

use App\Models\Upload;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Public pages for files shared by link. No login is needed, so every
 * action looks the file up by its token and checks the link is still valid.
 */
class SharedFileController extends Controller
{
    /**
     * Show the shared file's details and a download button.
     */
    public function show(string $token): Response
    {
        $upload = $this->findShared($token);

        return Inertia::render('shared/show', [
            'file' => [
                'title' => $upload->title,
                'description' => $upload->description,
                'original_name' => $upload->original_name,
                'mime_type' => $upload->mime_type,
                'size' => $upload->size,
                'previewable' => $upload->previewable,
                'created_at' => $upload->created_at,
                'expires_at' => $upload->share_expires_at,
                'owner' => $upload->user?->name,
            ],
            'token' => $token,
        ]);
    }

    /**
     * Download the shared file.
     */
    public function download(string $token): StreamedResponse
    {
        $upload = $this->findShared($token);

        return Storage::disk($upload->disk)->download($upload->path, $upload->original_name);
    }

    /**
     * Show the shared image or PDF inline.
     */
    public function preview(string $token): StreamedResponse
    {
        $upload = $this->findShared($token);

        abort_unless($upload->previewable, 404);

        return Storage::disk($upload->disk)->response($upload->path, $upload->original_name, [
            'Content-Type' => $upload->mime_type,
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /**
     * Find a file by share token, treating trashed files and expired links as missing.
     */
    private function findShared(string $token): Upload
    {
        $upload = Upload::with('user:id,name')->where('share_token', $token)->first();

        abort_unless($upload?->hasActiveShareLink(), 404);

        return $upload;
    }
}
