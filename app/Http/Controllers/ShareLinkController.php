<?php

namespace App\Http\Controllers;

use App\Models\Upload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ShareLinkController extends Controller
{
    /**
     * Create (or replace) the file's public share link.
     */
    public function store(Request $request, Upload $upload): RedirectResponse
    {
        Gate::authorize('update', $upload);

        $validated = $request->validate([
            // Number of days the link works for; empty means it never expires.
            'expires_in_days' => ['nullable', 'integer', 'in:1,7,30'],
        ]);

        $upload->share($validated['expires_in_days'] ?? null);

        return back()->with('success', 'Share link created.');
    }

    /**
     * Turn off the file's share link.
     */
    public function destroy(Upload $upload): RedirectResponse
    {
        Gate::authorize('update', $upload);

        $upload->unshare();

        return back()->with('success', 'Share link turned off.');
    }
}
