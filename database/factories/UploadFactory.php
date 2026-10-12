<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Upload>
 */
class UploadFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->paragraph(),
            'disk' => 'local',
            'path' => 'uploads/'.Str::random(40).'.txt',
            'original_name' => fake()->word().'.txt',
            'mime_type' => 'text/plain',
            'size' => fake()->numberBetween(100, 100_000),
        ];
    }
}
