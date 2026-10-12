<?php

namespace App\Http\Controllers;

use App\Http\Requests\Uploads\StoreUploadRequest;
use App\Http\Requests\Uploads\UpdateUploadRequest;
use App\Models\Upload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UploadController extends Controller
{
    /**
     * Disk that uploaded files are stored on. "local" is private, so files
     * are only reachable through the download and preview actions.
     */
    private const DISK = 'local';

    /**
     * List the user's files, or everyone's for an admin with ?scope=all.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->query('search', ''));
        $all = $user->is_admin && $request->query('scope') === 'all';

        $uploads = Upload::query()
            ->visibleTo($user, $all)
            ->with('user:id,name')
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('original_name', 'like', "%{$search}%");
            }))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('files/index', [
            'uploads' => $uploads,
            'filters' => ['search' => $search, 'scope' => $all ? 'all' : 'mine'],
        ]);
    }

    /**
     * Show the drag-and-drop upload page.
     */
    public function create(): Response
    {
        return Inertia::render('files/create', [
            'maxFileSize' => StoreUploadRequest::MAX_FILE_SIZE,
        ]);
    }

    /**
     * Store one uploaded file. The drag-and-drop page sends files one at a
     * time as JSON requests so it can show progress for each.
     */
    public function store(StoreUploadRequest $request): RedirectResponse|JsonResponse
    {
        $file = $request->file('file');

        $upload = new Upload([
            'title' => $request->validated('title') ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'description' => $request->validated('description'),
        ]);
        $upload->fill($this->storeFile($file));
        $upload->user()->associate($request->user());
        $upload->save();

        if ($request->wantsJson()) {
            return response()->json(['upload' => $upload], 201);
        }

        return to_route('files.index')->with('success', 'File uploaded.');
    }

    /**
     * Show the form for editing a file's details.
     */
    public function edit(Upload $upload): Response
    {
        Gate::authorize('update', $upload);

        return Inertia::render('files/edit', [
            'upload' => $upload->load('user:id,name'),
            'maxFileSize' => StoreUploadRequest::MAX_FILE_SIZE,
        ]);
    }

    /**
     * Update a file's details, replacing the file itself if a new one was sent.
     */
    public function update(UpdateUploadRequest $request, Upload $upload): RedirectResponse
    {
        Gate::authorize('update', $upload);

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

        return to_route('files.index', $this->scopeFor($request, $upload))->with('success', 'File updated.');
    }

    /**
     * Move a file to the trash.
     */
    public function destroy(Request $request, Upload $upload): RedirectResponse
    {
        Gate::authorize('delete', $upload);

        $upload->delete();

        return back()->with('success', 'Moved to trash. Files are deleted for good after '.Upload::TRASH_DAYS.' days.');
    }

    /**
     * Download the stored file under its original name.
     */
    public function download(Upload $upload): StreamedResponse
    {
        Gate::authorize('view', $upload);

        return Storage::disk($upload->disk)->download($upload->path, $upload->original_name);
    }

    /**
     * Show an image or PDF inline in the browser.
     */
    public function preview(Upload $upload): StreamedResponse
    {
        Gate::authorize('view', $upload);

        abort_unless($upload->previewable, 404);

        return Storage::disk($upload->disk)->response($upload->path, $upload->original_name, [
            'Content-Type' => $upload->mime_type,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    /**
     * Keep admins on the "All users" list after editing someone else's file.
     *
     * @return array<string, string>
     */
    private function scopeFor(Request $request, Upload $upload): array
    {
        return $upload->user_id !== $request->user()->id ? ['scope' => 'all'] : [];
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
            // Detected from the file's contents, not trusted from the browser,
            // because previews are served inline based on this value.
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ];
    }
}
