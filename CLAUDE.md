# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Built on the official Laravel 12 React starter kit: Laravel + Inertia.js v2 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui. On top of the starter kit's auth and settings, it's a file uploader. Users upload, preview, share (by expiring public link) and trash their own files. Admins can also manage every file and every user.

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
npm run format:check         # Prettier check without writing
vendor/bin/pint --test       # Pint check without writing
```

The `lint.yml` workflow runs the fixers (`pint`, `npm run format`, `npm run lint`), not the check variants, and its auto-commit step is commented out. So it never fails on style problems. Use the check commands above to verify style. CI runs PHP 8.4.

Feature tests that render an Inertia page go through `app.blade.php`'s `@vite` directive. They fail with a missing-manifest error unless `public/build/manifest.json` exists (from `npm run build`) or the Vite dev server is running. `TestCase` doesn't call `withoutVite()`. After adding a new page, rebuild before running tests.

Tests are PHPUnit class-style (`Tests\TestCase`, `RefreshDatabase`). `tests/Pest.php` exists, but Pest isn't installed, so don't write Pest-style tests unless you add `pestphp/pest` first. `phpunit.xml` runs tests against in-memory SQLite with array cache, session and mail drivers and the sync queue.

`.env.example` defaults to SQLite (`database/database.sqlite`). The local `.env` uses MySQL.

The CI workflows in `.github/workflows` run on `main`/`develop`, but this repo's branch is `master`, so CI won't run on pushes here until that's fixed.

## Architecture

**Inertia request flow:** Laravel routes return `Inertia::render('<page>')` instead of Blade views. The page name maps to `resources/js/pages/<page>.tsx`, so `'settings/profile'` resolves to `pages/settings/profile.tsx`. Both `resources/js/app.tsx` (client) and `resources/js/ssr.jsx` (SSR) resolve pages by globbing `./pages/**/*.tsx`. `resources/views/app.blade.php` is the only Blade root template.

**Shared props:** `app/Http/Middleware/HandleInertiaRequests.php::share()` adds `name`, `quote`, `auth.user` and `flash.success` to every page. Controllers set the flash with `->with('success', ...)`, and `components/flash-message.tsx` displays it. If you add a shared prop, also update the `SharedData` interface in `resources/js/types/index.ts`. Pages read shared props with `usePage<SharedData>().props`.

**Routing:** `routes/web.php` includes `routes/auth.php` (login, registration, password reset, email verification) `routes/settings.php` (profile, password, appearance), `routes/files.php` (file CRUD, trash, sharing and the public `/s/{token}` share pages) and `routes/admin.php`. Ziggy provides a global `route()` helper in TS (declared in `app.tsx`), so the frontend refers to Laravel named routes, e.g. `route('dashboard')`. Middleware is registered in `bootstrap/app.php` (Laravel 12 style; there's no `Kernel.php`).

**Frontend layout:**
- `@/*` → `resources/js/*` (tsconfig alias)
- `components/ui/` holds shadcn/ui primitives (configured in `components.json`). Add new ones with the shadcn CLI rather than writing them by hand. Pipe a newline into it (`printf '\n' | npx shadcn@2.4.0 add <name> --yes`) to get past its React 19 prompt. Afterwards, check the generated imports: it has written `import { cn } from "cn"` and installed an unrelated npm package called `cn`. The import should be `@/lib/utils`.
- Pages wrap themselves in a layout: `layouts/app-layout.tsx` (takes `breadcrumbs`) for authenticated pages, `layouts/auth-layout.tsx` for auth screens, and `layouts/settings/layout.tsx` for the settings sub-nav. `app-layout` delegates to `layouts/app/app-sidebar-layout.tsx`. Change that import to switch to the header layout.
- Sidebar navigation items are defined in `components/app-sidebar.tsx`. It computes each item's `isActive` itself, because several items share the `/files` path. NavMain falls back to URL matching when `isActive` isn't set.
- Reusable list UI: `components/pagination.tsx`, `components/search-input.tsx` (debounced, keeps other query params), `components/confirm-dialog.tsx` and `components/files/*`.
- `hooks/use-appearance.tsx` handles light/dark/system theme, stored in localStorage and a cookie. `initializeTheme()` runs on boot.
- Forms use Inertia's `useForm`. Validation errors come back as `errors` and are shown with `components/input-error.tsx`.

**Files:** `Upload` is the core model. Files are stored on the private `local` disk (`storage/app/private`) and are only served through controller routes (`files.download`, `files.preview`, `shared.*`). `path`, `disk` and `share_token` are hidden from serialization. `previewable` and `share_url` are appended accessors.
- **Access control:** one set of pages under `/files` serves everyone. `UploadPolicy` allows the owner, and its `before()` lets admins do anything. Controllers call `Gate::authorize()`. Lists use the `visibleTo($user, $all)` scope. `?scope=all` only widens the list for admins, and the `all` vs `mine` value is passed to pages as `filters.scope`.
- **Trash:** `SoftDeletes`. The stored file is removed only on `forceDeleted`, not on soft delete. `Prunable` deletes trash older than `Upload::TRASH_DAYS`, run by `Schedule::command('model:prune')->daily()` in `routes/console.php`. That needs `php artisan schedule:work` locally or a cron entry for `schedule:run`. Trash routes use `->withTrashed()` and are registered before the `files` resource.
- **Sharing:** a single `share_token`/`share_expires_at` pair on the upload. Creating a new link replaces the old one. The public `SharedFileController` returns 404 for expired links, turned-off links and trashed files.
- **Uploading:** `components/files/upload-dropzone.tsx` posts one file at a time with `XMLHttpRequest`, to get progress for each file. It sends `Accept: application/json` and an `X-XSRF-TOKEN` read from the cookie. `UploadController::store` answers JSON requests with 201 and the upload, or 422 with errors, and normal form posts with a redirect. `mime_type` is detected server-side with `getMimeType()`, not trusted from the client, because previews are served inline. Only the types in `Upload::PREVIEWABLE_TYPES` are previewable, and SVG/HTML are deliberately excluded. Edits that include a file are sent as `POST` with `_method: 'put'`, because PHP doesn't parse multipart PUT bodies. The size limit is `StoreUploadRequest::MAX_FILE_SIZE` (KB), and PHP's `upload_max_filesize`/`post_max_size` must be at least that high.

**Admin panel:** Admin access comes from `users.is_admin`. The column isn't mass-assignable, so promote users with `php artisan user:make-admin <email>` or `User::factory()->admin()`. The `admin` middleware alias (`EnsureUserIsAdmin`) protects `routes/admin.php`, which holds user management (`Admin\UserController`) and a redirect from `/admin/uploads` to `/files?scope=all`. Admins can't remove their own admin access or delete themselves there. Deleting a user keeps their files, with `user_id` set to null.

**Backend:** Controllers live in `app/Http/Controllers` (files, trash, share links, public shared files, dashboard), plus the `Auth`, `Settings` and `Admin` subfolders. Validation lives in FormRequests under `app/Http/Requests`.
