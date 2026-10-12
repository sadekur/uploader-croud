<?php

namespace App\Http\Controllers;

use App\Models\Upload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TrashController extends Controller
{
    /**
     * List trashed files: the user's own, or everyone's for an admin with ?scope=all.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $all = $user->is_admin && $request->query('scope') === 'all';

        $uploads = Upload::onlyTrashed()
            ->visibleTo($user, $all)
            ->with('user:id,name')
            ->latest('deleted_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('files/trash', [
            'uploads' => $uploads,
            'filters' => ['scope' => $all ? 'all' : 'mine'],
            'trashDays' => Upload::TRASH_DAYS,
        ]);
    }

    /**
     * Put a trashed file back.
     */
    public function restore(Upload $upload): RedirectResponse
    {
        Gate::authorize('restore', $upload);

        $upload->restore();

        return back()->with('success', 'File restored.');
    }

    /**
     * Delete a trashed file and its stored data permanently.
     */
    public function destroy(Upload $upload): RedirectResponse
    {
        Gate::authorize('forceDelete', $upload);

        $upload->forceDelete();

        return back()->with('success', 'File deleted permanently.');
    }
}
