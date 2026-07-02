<?php

namespace Database\Factories\Modules\Cash\Models;

use App\Modules\Cash\Models\Caja;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Caja>
 */
class CajaFactory extends Factory
{
    protected $model = Caja::class;

    public function definition(): array
    {
        return [
            'tenant_id' => null,
            'nombre' => 'Caja ' . fake()->word(),
            'activa' => true,
        ];
    }
}