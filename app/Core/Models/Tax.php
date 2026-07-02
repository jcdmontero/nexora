<?php
namespace App\Core\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Tax extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'codigo',
        'nombre',
        'porcentaje',
        'tipo',
        'aplica_a',
        'activo',
    ];

    protected $casts = [
        'porcentaje' => 'decimal:2',
        'activo' => 'boolean',
    ];

    public function tenant()
    {
        return $this->belongsTo(\App\Core\Models\Tenant::class);
    }

    // ─── Scopes ───

    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    public function scopeDeTipo($query, string $tipo)
    {
        return $query->where('tipo', $tipo);
    }

    public function scopeAplicaA($query, string $aplica)
    {
        return $query->where('aplica_a', $aplica);
    }

    // ─── Helpers ───

    /**
     * Calcula el valor del impuesto sobre una base dada.
     */
    public function calcular(float $base): float
    {
        return round($base * ($this->porcentaje / 100), 2);
    }

    /**
     * Catálogo de tipos de impuesto soportados.
     */
    public static function tipos(): array
    {
        return [
            'IVA' => 'IVA',
            'RETE_FUENTE' => 'Retención en la Fuente',
            'RETE_IVA' => 'Retención de IVA',
            'RETE_ICA' => 'Retención de ICA',
            'ICA' => 'Industria y Comercio',
        ];
    }

    /**
     * Ámbitos de aplicación del impuesto.
     */
    public static function ambitos(): array
    {
        return [
            'venta' => 'Ventas',
            'compra' => 'Compras',
            'ambos' => 'Ambos',
        ];
    }
}
