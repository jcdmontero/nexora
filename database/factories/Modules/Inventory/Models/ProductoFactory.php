<?php

namespace Database\Factories\Modules\Inventory\Models;

use App\Modules\Inventory\Models\Producto;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Producto>
 */
class ProductoFactory extends Factory
{
    protected $model = Producto::class;

    public function definition(): array
    {
        return [
            'tenant_id' => null,
            'codigo' => fake()->unique()->numerify('PROD-####'),
            'nombre' => fake()->words(3, true),
            'descripcion' => fake()->sentence(),
            'unidad_medida' => 'UND',
            'precio_venta' => fake()->randomFloat(2, 5000, 500000),
            'costo_promedio' => fake()->randomFloat(2, 1000, 200000),
            'stock_actual' => fake()->numberBetween(0, 200),
            'stock_minimo' => 5,
            'is_active' => true,
        ];
    }

    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => ['stock_actual' => 0]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => ['is_active' => false]);
    }
}