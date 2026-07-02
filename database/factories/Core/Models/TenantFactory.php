<?php

namespace Database\Factories\Core\Models;

use App\Core\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'slug' => fake()->unique()->slug(),
            'email' => fake()->companyEmail(),
        ];
    }
}
