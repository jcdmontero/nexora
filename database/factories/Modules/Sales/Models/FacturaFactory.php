<?php

namespace Database\Factories\Modules\Sales\Models;

use App\Modules\Sales\Models\Factura;
use App\Modules\Sales\Models\FacturaItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Factura>
 */
class FacturaFactory extends Factory
{
    protected $model = Factura::class;

    public function definition(): array
    {
        return [
            'tenant_id' => null,
            'user_id' => \App\Models\User::factory(),
            'cliente_id' => null,
            'numero' => 'POS-' . now()->format('Ymd') . '-' . fake()->unique()->numberBetween(100, 999),
            'subtotal' => fake()->randomFloat(2, 10000, 500000),
            'impuestos' => 0,
            'descuento' => 0,
            'total' => fake()->randomFloat(2, 10000, 600000),
            'estado' => 'pagada',
            'metodo_pago' => 'efectivo',
            'notas' => null,
            'tipo_documento' => 'pos',
            'dian_estado' => 'borrador',
        ];
    }

    public function pendiente(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'pendiente',
            'metodo_pago' => 'credito',
        ]);
    }

    public function anulada(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'anulada',
            'anulada' => true,
            'anulada_at' => now(),
        ]);
    }

    public function conIva(): static
    {
        return $this->state(function (array $attributes) {
            $subtotal = $attributes['subtotal'] ?? 100000;
            $iva = round($subtotal * 0.19, 2);
            return [
                'subtotal' => $subtotal,
                'impuestos' => $iva,
                'total' => $subtotal + $iva,
            ];
        });
    }
}