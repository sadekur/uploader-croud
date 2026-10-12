<?php

namespace Tests\Feature\Admin;

use App\Models\Upload;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admins_cannot_access_the_admin_panel()
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($user)->get('/admin/users')->assertForbidden();
        $this->actingAs($user)->get("/admin/users/{$other->id}/edit")->assertForbidden();
        $this->actingAs($user)->put("/admin/users/{$other->id}", ['name' => 'x', 'email' => 'x@example.com', 'is_admin' => true])->assertForbidden();
        $this->actingAs($user)->delete("/admin/users/{$other->id}")->assertForbidden();

        $this->assertFalse($user->fresh()->is_admin);
        $this->assertNotNull($other->fresh());
    }

    public function test_old_admin_urls_redirect_to_the_new_pages()
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get('/admin')->assertRedirect('/admin/users');
        $this->actingAs($admin)->get('/admin/uploads')->assertRedirect('/files?scope=all');
    }

    public function test_admins_can_list_and_search_users_with_their_file_totals()
    {
        $admin = User::factory()->admin()->create(['name' => 'Ada Admin']);
        $user = User::factory()->create(['name' => 'Bob Builder']);
        Upload::factory()->for($user)->count(2)->create(['size' => 1000]);

        $this->actingAs($admin)
            ->get('/admin/users?search=bob')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/users/index')
                ->has('users.data', 1)
                ->where('users.data.0.name', 'Bob Builder')
                ->where('users.data.0.uploads_count', 2)
                ->where('users.data.0.uploads_sum_size', 2000)
                ->missing('users.data.0.password')
            );
    }

    public function test_admins_can_edit_a_user_and_grant_admin_access()
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $this->actingAs($admin)->get("/admin/users/{$user->id}/edit")->assertOk();

        $this->actingAs($admin)
            ->put("/admin/users/{$user->id}", [
                'name' => 'New Name',
                'email' => 'new@example.com',
                'is_admin' => true,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/admin/users');

        $user->refresh();

        $this->assertSame('New Name', $user->name);
        $this->assertSame('new@example.com', $user->email);
        $this->assertTrue($user->is_admin);
        $this->assertNull($user->email_verified_at);
    }

    public function test_admins_can_remove_admin_access_from_others()
    {
        $admin = User::factory()->admin()->create();
        $other = User::factory()->admin()->create();

        $this->actingAs($admin)->put("/admin/users/{$other->id}", [
            'name' => $other->name,
            'email' => $other->email,
            'is_admin' => false,
        ])->assertSessionHasNoErrors();

        $this->assertFalse($other->fresh()->is_admin);
        $this->assertNotNull($other->fresh()->email_verified_at);
    }

    public function test_admins_cannot_remove_their_own_admin_access()
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->put("/admin/users/{$admin->id}", [
                'name' => $admin->name,
                'email' => $admin->email,
                'is_admin' => false,
            ])
            ->assertSessionHasErrors('is_admin');

        $this->assertTrue($admin->fresh()->is_admin);
    }

    public function test_emails_must_stay_unique()
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $this->actingAs($admin)
            ->put("/admin/users/{$user->id}", [
                'name' => $user->name,
                'email' => $admin->email,
                'is_admin' => false,
            ])
            ->assertSessionHasErrors('email');
    }

    public function test_admins_can_delete_a_user_and_their_files_are_kept()
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();
        $upload = Upload::factory()->for($user)->create();

        $this->actingAs($admin)
            ->delete("/admin/users/{$user->id}")
            ->assertRedirect('/admin/users');

        $this->assertModelMissing($user);
        $this->assertNull($upload->fresh()->user_id);
    }

    public function test_admins_cannot_delete_themselves_here()
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->from('/admin/users')
            ->delete("/admin/users/{$admin->id}")
            ->assertSessionHasErrors('user');

        $this->assertNotNull($admin->fresh());
    }

    public function test_make_admin_command_promotes_a_user()
    {
        $user = User::factory()->create(['email' => 'someone@example.com']);

        $this->artisan('user:make-admin', ['email' => 'someone@example.com'])->assertSuccessful();
        $this->assertTrue($user->fresh()->is_admin);

        $this->artisan('user:make-admin', ['email' => 'nobody@example.com'])->assertFailed();
    }
}
