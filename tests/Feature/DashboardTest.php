<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $this->actingAs($user = User::factory()->create());

        $this->get('/dashboard')->assertOk();
    }

    public function test_dashboard_shows_the_users_own_file_stats()
    {
        $user = User::factory()->create();
        Upload::factory()->for($user)->create(['size' => 1000]);
        Upload::factory()->for($user)->create(['size' => 500, 'created_at' => now()->subDays(30)]);
        Upload::factory()->for($user)->create()->delete();
        Upload::factory()->create(['size' => 99999]);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('stats.files', 2)
                ->where('stats.storage', 1500)
                ->where('stats.this_week', 1)
                ->where('stats.trashed', 1)
                ->has('recent', 2)
                ->where('site', null)
            );
    }

    public function test_admins_also_see_site_wide_totals()
    {
        $admin = User::factory()->admin()->create();
        Upload::factory()->count(3)->create(['size' => 100]);

        $this->actingAs($admin)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->where('site.files', 3)
                ->where('site.storage', 300)
                ->where('site.users', 4)
            );
    }
}
