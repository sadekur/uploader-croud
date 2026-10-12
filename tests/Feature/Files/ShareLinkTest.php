<?php

namespace Tests\Feature\Files;

use App\Models\Upload;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ShareLinkTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    public function test_owners_can_create_an_expiring_share_link()
    {
        $user = User::factory()->create();
        $upload = $this->storeUpload($user);

        $this->actingAs($user)
            ->post("/files/{$upload->id}/share", ['expires_in_days' => 7])
            ->assertSessionHasNoErrors();

        $upload->refresh();

        $this->assertNotNull($upload->share_token);
        $this->assertTrue($upload->share_expires_at->between(now()->addDays(7)->subMinute(), now()->addDays(7)->addMinute()));
        $this->assertSame(route('shared.show', $upload->share_token), $upload->share_url);
    }

    public function test_links_can_be_created_without_an_expiry()
    {
        $user = User::factory()->create();
        $upload = $this->storeUpload($user);

        $this->actingAs($user)->post("/files/{$upload->id}/share", ['expires_in_days' => null]);

        $this->assertNull($upload->fresh()->share_expires_at);
        $this->assertNotNull($upload->fresh()->share_url);
    }

    public function test_only_offered_expiry_periods_are_accepted()
    {
        $user = User::factory()->create();
        $upload = $this->storeUpload($user);

        $this->actingAs($user)
            ->post("/files/{$upload->id}/share", ['expires_in_days' => 365])
            ->assertSessionHasErrors('expires_in_days');
    }

    public function test_guests_can_view_and_download_a_shared_file()
    {
        $upload = $this->sharedUpload();

        auth()->logout();

        $this->get("/s/{$upload->share_token}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('shared/show')
                ->where('file.original_name', 'notes.txt')
                ->missing('file.path')
            );

        $this->get("/s/{$upload->share_token}/download")
            ->assertOk()
            ->assertDownload('notes.txt');
    }

    public function test_creating_a_new_link_disables_the_old_one()
    {
        $upload = $this->sharedUpload();
        $oldToken = $upload->share_token;

        $this->post("/files/{$upload->id}/share", ['expires_in_days' => 1]);

        $this->get("/s/{$oldToken}")->assertNotFound();
        $this->get('/s/'.$upload->fresh()->share_token)->assertOk();
    }

    public function test_turned_off_links_stop_working()
    {
        $upload = $this->sharedUpload();
        $token = $upload->share_token;

        $this->delete("/files/{$upload->id}/share")->assertSessionHasNoErrors();

        $this->assertNull($upload->fresh()->share_token);
        $this->get("/s/{$token}")->assertNotFound();
        $this->get("/s/{$token}/download")->assertNotFound();
    }

    public function test_expired_links_stop_working()
    {
        $upload = $this->sharedUpload(1);

        $this->travel(2)->days();

        $this->get("/s/{$upload->share_token}")->assertNotFound();
        $this->get("/s/{$upload->share_token}/download")->assertNotFound();
        $this->assertNull($upload->fresh()->share_url);
    }

    public function test_links_to_trashed_files_stop_working()
    {
        $upload = $this->sharedUpload();

        $upload->delete();

        $this->get("/s/{$upload->share_token}")->assertNotFound();
    }

    public function test_unknown_tokens_are_not_found()
    {
        $this->get('/s/'.str_repeat('a', 40))->assertNotFound();
    }

    private function storeUpload(User $owner): Upload
    {
        $this->actingAs($owner)->post('/files', [
            'file' => UploadedFile::fake()->create('notes.txt', 5, 'text/plain'),
        ]);

        return Upload::latest('id')->first();
    }

    private function sharedUpload(?int $days = null): Upload
    {
        $upload = $this->storeUpload(User::factory()->create());
        $upload->share($days);

        return $upload;
    }
}
