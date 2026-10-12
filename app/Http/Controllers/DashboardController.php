<?php

namespace App\Http\Controllers;

use App\Models\Upload;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the user's file stats, plus site-wide totals for admins.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $mine = Upload::query()->whereBelongsTo($user);

        return Inertia::render('dashboard', [
            'stats' => [
                'files' => (clone $mine)->count(),
                'storage' => (int) (clone $mine)->sum('size'),
                'this_week' => (clone $mine)->where('created_at', '>=', now()->subDays(7))->count(),
                'shared' => (clone $mine)->whereNotNull('share_token')
                    ->where(fn ($query) => $query->whereNull('share_expires_at')->orWhere('share_expires_at', '>', now()))
                    ->count(),
                'trashed' => Upload::onlyTrashed()->whereBelongsTo($user)->count(),
            ],
            'recent' => (clone $mine)->latest()->limit(5)->get(),
            'site' => $user->is_admin ? [
                'users' => User::count(),
                'files' => Upload::count(),
                'storage' => (int) Upload::sum('size'),
            ] : null,
        ]);
    }
}
