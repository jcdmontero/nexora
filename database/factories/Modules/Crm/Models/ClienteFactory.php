<?php

namespace Database\Factories\Modules\Crm\Models;

use App\Modules\Crm\Models\Cliente;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Cliente>
 */
class ClienteFactory extends Factory
{
    protected $model = Cliente::class;

    public function definition(): array
    {
        $tipo = fake()->randomElement(['natural', 'juridico']);

        return [
            'tenant_id' => null, // set manually
            'tipo' => $tipo,
            'tipo_documento' => $tipo === 'natural' ? fake()->randomElement(['CC', 'CE', 'PA']) : 'NIT',
            'numero_documento' => $tipo === 'natural' ? fake()->numerify('##########') : fake()->numerify('##########-#'),
            'nombres' => $tipo === 'natural' ? fake()->firstName() : null,
            'apellidos' => $tipo === 'natural' ? fake()->lastName() : null,
            'razon_social' => $tipo === 'juridico' ? fake()->company() : null,
            'email' => fake()->safeEmail(),
            'telefono' => fake()->numerify('##########'),
            'direccion' => fake()->address(),
            'ciudad' => fake()->city(),
            'activo' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => ['activo' => false]);
    }
}