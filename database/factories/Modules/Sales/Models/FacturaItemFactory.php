<?php

namespace Database\Factories\Modules\Sales\Models;

use App\Modules\Sales\Models\FacturaItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FacturaItem>
 */
class FacturaItemFactory extends Factory
{
    protected $model = FacturaItem::class;

    public function definition(): array
    {
        $cantidad = fake()->numberBetween(1, 10);
        $precioUnitario = fake()->randomFloat(2, 5000, 100000);
        $subtotal = $cantidad * $precioUnitario;

        return [
            'factura_id' => null,
            'producto_id' => null,
            'descripcion' => fake()->words(3, true),
            'cantidad' => $cantidad,
            'precio_unitario' => $precioUnitario,
            'tasa_impuesto' => 0,
            'subtotal' => $subtotal,
            'impuesto_total' => 0,
            'total' => $subtotal,
        ];
    }

    public function withIva(): static
    {
        return $this->state(function (array $attributes) {
            $subtotal = $attributes['subtotal'] ?? 100000;
            $iva = round($subtotal * 0.19, 2);
            return [
                'tasa_impuesto' => 19.00,
                'impuesto_total' => $iva,
                'total' => $subtotal + $iva,
            ];
        });
    }
}