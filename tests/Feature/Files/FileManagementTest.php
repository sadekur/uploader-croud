<?php

namespace Tests\Feature\Files;

use App\Models\Upload;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FileManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get('/files')->assertRedirect('/login');
        $this->get('/files/create')->assertRedirect('/login');
    }

    public function test_users_only_see_their_own_files()
    {
        $user = User::factory()->create();
        Upload::factory()->for($user)->create(['title' => 'Mine']);
        Upload::factory()->create(['title' => 'Someone else']);

        $this->actingAs($user)
            ->get('/files')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('files/index')
                ->has('uploads.data', 1)
                ->where('uploads.data.0.title', 'Mine')
                ->missing('uploads.data.0.path')
                ->missing('uploads.data.0.share_token')
            );
    }

    public function test_non_admins_cannot_widen_the_scope_to_all_users()
    {
        $user = User::factory()->create();
        Upload::factory()->create();

        $this->actingAs($user)
            ->get('/files?scope=all')
            ->assertInertia(fn (Assert $page) => $page
                ->has('uploads.data', 0)
                ->where('filters.scope', 'mine')
            );
    }

    public function test_admins_can_list_every_users_files()
    {
        $admin = User::factory()->admin()->create();
        Upload::factory()->count(2)->create();

        $this->actingAs($admin)
            ->get('/files?scope=all')
            ->assertInertia(fn (Assert $page) => $page
                ->has('uploads.data', 2)
                ->where('filters.scope', 'all')
            );
    }

    public function test_files_can_be_searched()
    {
        $user = User::factory()->create();
        Upload::factory()->for($user)->create(['title' => 'Annual report']);
        Upload::factory()->for($user)->create(['title' => 'Holiday photos']);

        $this->actingAs($user)
            ->get('/files?search=report')
            ->assertInertia(fn (Assert $page) => $page
                ->has('uploads.data', 1)
                ->where('uploads.data.0.title', 'Annual report')
            );
    }

    public function test_users_can_upload_a_file()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/files', [
                'title' => 'Report',
                'description' => 'Q3 numbers',
                'file' => UploadedFile::fake()->create('report.pdf', 120, 'application/pdf'),
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/files');

        $upload = Upload::sole();

        $this->assertSame('Report', $upload->title);
        $this->assertSame('report.pdf', $upload->original_name);
        $this->assertSame('application/pdf', $upload->mime_type);
        $this->assertTrue($upload->user->is($user));
        Storage::disk('local')->assertExists($upload->path);
    }

    public function test_drag_and_drop_uploads_return_json_and_default_the_title_to_the_file_name()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/files', ['file' => UploadedFile::fake()->create('holiday-photo.jpg', 50, 'image/jpeg')])
            ->assertCreated()
            ->assertJsonPath('upload.title', 'holiday-photo')
            ->assertJsonPath('upload.previewable', true)
            ->assertJsonMissingPath('upload.path');
    }

    public function test_json_uploads_report_validation_errors()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/files', ['file' => UploadedFile::fake()->create('big.zip', 10241)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');

        $this->assertSame(0, Upload::count());
    }

    public function test_users_can_update_their_file_without_replacing_it()
    {
        $user = User::factory()->create();
        $upload = $this->storeUpload($user);
        $path = $upload->path;

        $this->actingAs($user)
            ->put("/files/{$upload->id}", ['title' => 'Renamed', 'description' => null])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/files');

        $upload->refresh();

        $this->assertSame('Renamed', $upload->title);
        $this->assertSame($path, $upload->path);
        Storage::disk('local')->assertExists($path);
    }

    public function test_replacing_the_file_removes_the_old_one()
    {
        $user = User::factory()->create();
        $upload = $this->storeUpload($user);
        $oldPath = $upload->path;

        $this->actingAs($user)
            ->put("/files/{$upload->id}", [
                'title' => $upload->title,
                'file' => UploadedFile::fake()->create('new.txt', 5, 'text/plain'),
            ])
            ->assertSessionHasNoErrors();

        $upload->refresh();

        $this->assertSame('new.txt', $upload->original_name);
        Storage::disk('local')->assertMissing($oldPath);
        Storage::disk('local')->assertExists($upload->path);
    }

    public function test_admins_editing_someone_elses_file_return_to_the_all_users_list()
    {
        $admin = User::factory()->admin()->create();
        $upload = $this->storeUpload(User::factory()->create());

        $this->actingAs($admin)
            ->put("/files/{$upload->id}", ['title' => 'Fixed by admin'])
            ->assertRedirect('/files?scope=all');

        $this->assertSame('Fixed by admin', $upload->fresh()->title);
    }

    public function test_users_cannot_touch_other_users_files()
    {
        $user = User::factory()->create();
        $upload = $this->storeUpload(User::factory()->create());

        $this->actingAs($user)->get("/files/{$upload->id}/edit")->assertForbidden();
        $this->actingAs($user)->put("/files/{$upload->id}", ['title' => 'Hacked'])->assertForbidden();
        $this->actingAs($user)->delete("/files/{$upload->id}")->assertForbidden();
        $this->actingAs($user)->get("/files/{$upload->id}/download")->assertForbidden();
        $this->actingAs($user)->get("/files/{$upload->id}/preview")->assertForbidden();
        $this->actingAs($user)->post("/files/{$upload->id}/share")->assertForbidden();

        $this->assertSame('Original', $upload->fresh()->title);
        $this->assertNull($upload->fresh()->share_token);
    }

    public function test_users_can_download_their_file_under_its_original_name()
    {
        $user = User::factory()->create();
        $upload = $this->storeUpload($user);

        $this->actingAs($user)
            ->get("/files/{$upload->id}/download")
            ->assertOk()
            ->assertDownload('original.txt');
    }

    public function test_images_and_pdfs_can_be_previewed_inline()
    {
        $user = User::factory()->create();
        $upload = $this->storeUpload($user, UploadedFile::fake()->create('photo.png', 20, 'image/png'));

        $response = $this->actingAs($user)->get("/files/{$upload->id}/preview");

        $response->assertOk();
        $response->assertHeader('Content-Type', 'image/png');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->assertStringStartsWith('inline', $response->headers->get('Content-Disposition'));
    }

    public function test_other_file_types_cannot_be_previewed()
    {
        $user = User::factory()->create();
        $upload = $this->storeUpload($user, UploadedFile::fake()->create('page.html', 1, 'text/html'));

        $this->actingAs($user)->get("/files/{$upload->id}/preview")->assertNotFound();
    }

    /**
     * Create an upload through the real endpoint so a file exists on the fake disk.
     */
    private function storeUpload(User $owner, ?UploadedFile $file = null): Upload
    {
        $this->actingAs($owner)->post('/files', [
            'title' => 'Original',
            'file' => $file ?? UploadedFile::fake()->create('original.txt', 5, 'text/plain'),
        ]);

        return Upload::latest('id')->first();
    }
}
