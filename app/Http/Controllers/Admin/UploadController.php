<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUploadRequest;
use App\Http\Requests\Admin\UpdateUploadRequest;
use App\Models\Upload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UploadController extends Controller
{
    /**
     * Disk that uploaded files are stored on. "local" is private, so files
     * are only reachable through the download action below.
     */
    private const DISK = 'local';

    /**
     * List uploads, optionally filtered by a search term.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $uploads = Upload::query()
            ->with('user:id,name')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('original_name', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/uploads/index', [
            'uploads' => $uploads,
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Show the form for creating an upload.
     */
    public function create(): Response
    {
        return Inertia::render('admin/uploads/create', [
            'maxFileSize' => StoreUploadRequest::MAX_FILE_SIZE,
        ]);
    }

    /**
     * Store a newly uploaded file.
     */
    public function store(StoreUploadRequest $request): RedirectResponse
    {
        $upload = new Upload($request->safe()->only(['title', 'description']));
        $upload->fill($this->storeFile($request->file('file')));
        $upload->user()->associate($request->user());
        $upload->save();

        return to_route('admin.uploads.index')->with('success', 'Upload created.');
    }

    /**
     * Show the form for editing an upload.
     */
    public function edit(Upload $upload): Response
    {
        return Inertia::render('admin/uploads/edit', [
            'upload' => $upload->load('user:id,name'),
            'maxFileSize' => StoreUploadRequest::MAX_FILE_SIZE,
        ]);
    }

    /**
     * Update an upload, replacing its file if a new one was sent.
     */
    public function update(UpdateUploadRequest $request, Upload $upload): RedirectResponse
    {
        $upload->fill($request->safe()->only(['title', 'description']));

        $oldFile = null;

        if ($request->hasFile('file')) {
            $oldFile = ['disk' => $upload->disk, 'path' => $upload->path];
            $upload->fill($this->storeFile($request->file('file')));
        }

        $upload->save();

        // Only remove the previous file once the new one is safely recorded.
        if ($oldFile) {
            Storage::disk($oldFile['disk'])->delete($oldFile['path']);
        }

        return to_route('admin.uploads.index')->with('success', 'Upload updated.');
    }

    /**
     * Delete an upload and its stored file.
     */
    public function destroy(Upload $upload): RedirectResponse
    {
        $upload->delete();

        return to_route('admin.uploads.index')->with('success', 'Upload deleted.');
    }

    /**
     * Download the stored file under its original name.
     */
    public function download(Upload $upload): StreamedResponse
    {
        return Storage::disk($upload->disk)->download($upload->path, $upload->original_name);
    }

    /**
     * Put the file on disk and return the columns that describe it.
     *
     * @return array<string, mixed>
     */
    private function storeFile(UploadedFile $file): array
    {
        return [
            'disk' => self::DISK,
            'path' => $file->store('uploads', self::DISK),
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
        ];
    }
}
