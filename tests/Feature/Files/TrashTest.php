<?php

namespace Tests\Feature\Files;

use App\Models\Upload;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TrashTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    public function test_deleting_moves_a_file_to_the_trash_and_keeps_it_on_disk()
    {
        $user = User::factory()->create();
        $upload = $this->storeUpload($user);

        $this->actingAs($user)
            ->from('/files')
            ->delete("/files/{$upload->id}")
            ->assertRedirect('/files');

        $this->assertSoftDeleted($upload);
        Storage::disk('local')->assertExists($upload->path);

        $this->actingAs($user)
            ->get('/files')
            ->assertInertia(fn (Assert $page) => $page->has('uploads.data', 0));

        $this->actingAs($user)
            ->get('/files/trash')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('files/trash')
                ->has('uploads.data', 1)
                ->where('uploads.data.0.id', $upload->id)
            );
    }

    public function test_trashed_files_can_be_restored()
    {
        $user = User::factory()->create();
        $upload = $this->storeUpload($user);
        $upload->delete();

        $this->actingAs($user)
            ->patch("/files/trash/{$upload->id}")
            ->assertSessionHasNoErrors();

        $this->assertNotSoftDeleted($upload);
    }

    public function test_trashed_files_can_be_deleted_forever()
    {
        $user = User::factory()->create();
        $upload = $this->storeUpload($user);
        $upload->delete();

        $this->actingAs($user)->delete("/files/trash/{$upload->id}");

        $this->assertModelMissing($upload);
        Storage::disk('local')->assertMissing($upload->path);
    }

    public function test_users_cannot_see_or_restore_other_users_trash()
    {
        $user = User::factory()->create();
        $upload = $this->storeUpload(User::factory()->create());
        $upload->delete();

        $this->actingAs($user)
            ->get('/files/trash')
            ->assertInertia(fn (Assert $page) => $page->has('uploads.data', 0));

        $this->actingAs($user)->patch("/files/trash/{$upload->id}")->assertForbidden();
        $this->actingAs($user)->delete("/files/trash/{$upload->id}")->assertForbidden();

        $this->assertSoftDeleted($upload);
    }

    public function test_trashed_files_cannot_be_downloaded()
    {
        $user = User::factory()->create();
        $upload = $this->storeUpload($user);
        $upload->delete();

        $this->actingAs($user)->get("/files/{$upload->id}/download")->assertNotFound();
    }

    public function test_old_trash_is_pruned_but_recent_trash_is_kept()
    {
        $user = User::factory()->create();
        $old = $this->storeUpload($user);
        $recent = $this->storeUpload($user);

        $this->travel(-31)->days();
        $old->delete();
        $this->travelBack();
        $recent->delete();

        $this->artisan('model:prune', ['--model' => Upload::class])->assertSuccessful();

        $this->assertModelMissing($old);
        Storage::disk('local')->assertMissing($old->path);
        $this->assertSoftDeleted($recent);
        Storage::disk('local')->assertExists($recent->path);
    }

    private function storeUpload(User $owner): Upload
    {
        $this->actingAs($owner)->post('/files', [
            'file' => UploadedFile::fake()->create('notes.txt', 5, 'text/plain'),
        ]);

        return Upload::latest('id')->first();
    }
}
