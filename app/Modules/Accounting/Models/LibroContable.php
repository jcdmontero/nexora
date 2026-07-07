<?php

namespace App\Modules\Accounting\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class LibroContable extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'libros_contables';

    protected $fillable = [
        'tenant_id','codigo',
        'nombre',
        'tipo',
        'descripcion',
        'filtro_cuentas',
        'filtro_modulo',
        'is_sistema',
        'activo',
    ];

    protected $casts = [
        'is_sistema' => 'boolean',
        'activo' => 'boolean',
    ];

    const TIPOS = [
        'diario' => 'Diario General',
        'mayor' => 'Mayor y Balances',
        'caja' => 'Libro de Caja',
        'ventas' => 'Libro de Ventas',
    ];

    /**
     * Libros por defecto que se crean automáticamente para cada tenant.
     */
    const DEFAULT_BOOKS = [
        [
            'codigo' => 'DG',
            'nombre' => 'Diario General',
            'tipo' => 'diario',
            'descripcion' => 'Registra todos los asientos contables en orden cronológico.',
            'filtro_cuentas' => null,
            'filtro_modulo' => null,
        ],
        [
            'codigo' => 'MB',
            'nombre' => 'Mayor y Balances',
            'tipo' => 'mayor',
            'descripcion' => 'Acumula movimientos por cuenta contable.',
            'filtro_cuentas' => null,
            'filtro_modulo' => null,
        ],
        [
            'codigo' => 'CJ',
            'nombre' => 'Libro de Caja',
            'tipo' => 'caja',
            'descripcion' => 'Entradas y salidas de efectivo (cuentas 1105).',
            'filtro_cuentas' => '1105%',
            'filtro_modulo' => null,
        ],
        [
            'codigo' => 'VI',
            'nombre' => 'Libro de Ventas e Ingresos',
            'tipo' => 'ventas',
            'descripcion' => 'Registro de facturas de venta e ingresos.',
            'filtro_cuentas' => null,
            'filtro_modulo' => 'ventas,service-desk',
        ],
    ];
}
