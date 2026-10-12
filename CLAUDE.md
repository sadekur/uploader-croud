# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Built on the official Laravel 12 React starter kit: Laravel + Inertia.js v2 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui. The app-specific "uploader" features haven't been written yet. What exists now is the starter kit's auth, dashboard and settings scaffolding.

## Commands

```bash
composer dev                 # runs php artisan serve, queue:listen, pail (logs) and vite together
npm run dev                  # Vite dev server only
npm run build                # production asset build (CI builds this before running tests)
npm run build:ssr            # client + SSR bundles (SSR entry: resources/js/ssr.jsx)

./vendor/bin/phpunit                                   # all tests (CI uses this)
./vendor/bin/phpunit --filter=DashboardTest            # one test class
./vendor/bin/phpunit --filter=test_guests_are_redirected_to_the_login_page
./vendor/bin/phpunit --testsuite=Feature
php artisan test             # same tests, Laravel-styled output

vendor/bin/pint              # PHP formatting (Laravel Pint)
npm run lint                 # ESLint with --fix
npm run format               # Prettier on resources/ (sorts imports and Tailwind classes)
npx tsc --noEmit             # TypeScript type check (no npm script for it; Vite does not type-check)
npm run format:check
```

Tests are PHPUnit class-style (`Tests\TestCase`, `RefreshDatabase`). `tests/Pest.php` exists, but Pest isn't installed, so don't write Pest-style tests unless you add `pestphp/pest` first. `phpunit.xml` runs tests against in-memory SQLite with array cache, session and mail drivers and the sync queue.

`.env.example` defaults to SQLite (`database/database.sqlite`). The local `.env` uses MySQL.

The CI workflows in `.github/workflows` run on `main`/`develop`, but this repo's branch is `master`, so CI won't run on pushes here until that's fixed.

## Architecture

**Inertia request flow:** Laravel routes return `Inertia::render('<page>')` instead of Blade views. The page name maps to `resources/js/pages/<page>.tsx`, so `'settings/profile'` resolves to `pages/settings/profile.tsx`. Both `resources/js/app.tsx` (client) and `resources/js/ssr.jsx` (SSR) resolve pages by globbing `./pages/**/*.tsx`. `resources/views/app.blade.php` is the only Blade root template.

**Shared props:** `app/Http/Middleware/HandleInertiaRequests.php::share()` adds `name`, `quote` and `auth.user` to every page. If you add a shared prop, also update the `SharedData` interface in `resources/js/types/index.ts`. Pages read shared props with `usePage<SharedData>().props`.

**Routing:** `routes/web.php` includes `routes/auth.php` (login, registration, password reset, email verification) and `routes/settings.php` (profile, password, appearance). Ziggy provides a global `route()` helper in TS (declared in `app.tsx`), so the frontend refers to Laravel named routes, e.g. `route('dashboard')`. Middleware is registered in `bootstrap/app.php` (Laravel 12 style; there's no `Kernel.php`).

**Frontend layout:**
- `@/*` → `resources/js/*` (tsconfig alias)
- `components/ui/` holds shadcn/ui primitives (configured in `components.json`). Add new ones with the shadcn CLI rather than writing them by hand.
- Pages wrap themselves in a layout: `layouts/app-layout.tsx` (takes `breadcrumbs`) for authenticated pages, `layouts/auth-layout.tsx` for auth screens, and `layouts/settings/layout.tsx` for the settings sub-nav. `app-layout` delegates to `layouts/app/app-sidebar-layout.tsx`. Change that import to switch to the header layout.
- Sidebar navigation items are defined in `components/app-sidebar.tsx`.
- `hooks/use-appearance.tsx` handles light/dark/system theme, stored in localStorage and a cookie. `initializeTheme()` runs on boot.
- Forms use Inertia's `useForm`. Validation errors come back as `errors` and are shown with `components/input-error.tsx`.

**Backend:** Controllers are split into `app/Http/Controllers/Auth` and `app/Http/Controllers/Settings`. Validation lives in FormRequests under `app/Http/Requests`.
