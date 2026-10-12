<?php

namespace Tests\Feature\Admin;

use App\Models\Upload;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UploadManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get('/admin/uploads')->assertRedirect('/login');
    }

    public function test_non_admins_cannot_access_the_admin_panel()
    {
        $user = User::factory()->create();
        $upload = Upload::factory()->create();

        $this->actingAs($user)->get('/admin/uploads')->assertForbidden();
        $this->actingAs($user)->get('/admin/uploads/create')->assertForbidden();
        $this->actingAs($user)->post('/admin/uploads', ['title' => 'x'])->assertForbidden();
        $this->actingAs($user)->get("/admin/uploads/{$upload->id}/download")->assertForbidden();
        $this->actingAs($user)->delete("/admin/uploads/{$upload->id}")->assertForbidden();

        $this->assertNotNull($upload->fresh());
    }

    public function test_admin_index_redirects_to_uploads()
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get('/admin')->assertRedirect('/admin/uploads');
    }

    public function test_admins_can_list_and_search_uploads()
    {
        $admin = User::factory()->admin()->create();
        Upload::factory()->create(['title' => 'Annual report']);
        Upload::factory()->create(['title' => 'Holiday photos']);

        $this->actingAs($admin)
            ->get('/admin/uploads')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/uploads/index')
                ->has('uploads.data', 2)
                ->missing('uploads.data.0.path')
            );

        $this->actingAs($admin)
            ->get('/admin/uploads?search=report')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('uploads.data', 1)
                ->where('uploads.data.0.title', 'Annual report')
                ->where('filters.search', 'report')
            );
    }

    public function test_admins_can_upload_a_file()
    {
        $admin = User::factory()->admin()->create();
        $file = UploadedFile::fake()->create('report.pdf', 120, 'application/pdf');

        $this->actingAs($admin)
            ->post('/admin/uploads', [
                'title' => 'Report',
                'description' => 'Q3 numbers',
                'file' => $file,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/admin/uploads');

        $upload = Upload::sole();

        $this->assertSame('Report', $upload->title);
        $this->assertSame('Q3 numbers', $upload->description);
        $this->assertSame('report.pdf', $upload->original_name);
        $this->assertSame('application/pdf', $upload->mime_type);
        $this->assertSame($admin->id, $upload->user_id);
        Storage::disk('local')->assertExists($upload->path);
    }

    public function test_a_file_and_title_are_required()
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->post('/admin/uploads', [])
            ->assertSessionHasErrors(['title', 'file']);

        $this->assertSame(0, Upload::count());
    }

    public function test_files_over_the_size_limit_are_rejected()
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->post('/admin/uploads', [
                'title' => 'Too big',
                'file' => UploadedFile::fake()->create('big.zip', 10241),
            ])
            ->assertSessionHasErrors('file');
    }

    public function test_admins_can_update_details_without_replacing_the_file()
    {
        $admin = User::factory()->admin()->create();
        $upload = $this->storeUpload($admin);
        $originalPath = $upload->path;

        $this->actingAs($admin)
            ->put("/admin/uploads/{$upload->id}", [
                'title' => 'Renamed',
                'description' => null,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/admin/uploads');

        $upload->refresh();

        $this->assertSame('Renamed', $upload->title);
        $this->assertNull($upload->description);
        $this->assertSame($originalPath, $upload->path);
        Storage::disk('local')->assertExists($originalPath);
    }

    public function test_replacing_the_file_removes_the_old_one()
    {
        $admin = User::factory()->admin()->create();
        $upload = $this->storeUpload($admin);
        $oldPath = $upload->path;

        $this->actingAs($admin)
            ->put("/admin/uploads/{$upload->id}", [
                'title' => $upload->title,
                'file' => UploadedFile::fake()->create('new.txt', 5, 'text/plain'),
            ])
            ->assertSessionHasNoErrors();

        $upload->refresh();

        $this->assertSame('new.txt', $upload->original_name);
        $this->assertNotSame($oldPath, $upload->path);
        Storage::disk('local')->assertMissing($oldPath);
        Storage::disk('local')->assertExists($upload->path);
    }

    public function test_admins_can_delete_an_upload_and_its_file()
    {
        $admin = User::factory()->admin()->create();
        $upload = $this->storeUpload($admin);

        $this->actingAs($admin)
            ->delete("/admin/uploads/{$upload->id}")
            ->assertRedirect('/admin/uploads');

        $this->assertNull($upload->fresh());
        Storage::disk('local')->assertMissing($upload->path);
    }

    public function test_admins_can_download_a_file_under_its_original_name()
    {
        $admin = User::factory()->admin()->create();
        $upload = $this->storeUpload($admin);

        $this->actingAs($admin)
            ->get("/admin/uploads/{$upload->id}/download")
            ->assertOk()
            ->assertDownload('original.txt');
    }

    public function test_admin_edit_page_is_displayed()
    {
        $admin = User::factory()->admin()->create();
        $upload = $this->storeUpload($admin);

        $this->actingAs($admin)
            ->get("/admin/uploads/{$upload->id}/edit")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/uploads/edit')
                ->where('upload.id', $upload->id)
            );
    }

    public function test_make_admin_command_promotes_a_user()
    {
        $user = User::factory()->create(['email' => 'someone@example.com']);

        $this->artisan('user:make-admin', ['email' => 'someone@example.com'])->assertSuccessful();
        $this->assertTrue($user->fresh()->is_admin);

        $this->artisan('user:make-admin', ['email' => 'nobody@example.com'])->assertFailed();
    }

    /**
     * Create an upload through the real endpoint so a file exists on the fake disk.
     */
    private function storeUpload(User $admin): Upload
    {
        $this->actingAs($admin)->post('/admin/uploads', [
            'title' => 'Original',
            'file' => UploadedFile::fake()->create('original.txt', 5, 'text/plain'),
        ]);

        return Upload::sole();
    }
}
