<?php
namespace App\Modules\Purchasing\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Proveedor extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'purchasing_proveedores';

    protected $fillable = [
        'tenant_id',
        'regimen_tributario',
        'porcentaje_retencion_fuente',
        'porcentaje_retencion_iva',
        'porcentaje_retencion_ica',
        'tipo_documento',
        'numero_documento',
        'razon_social',
        'nombre_contacto',
        'email',
        'telefono',
        'direccion',
        'ciudad',
        'notas',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'porcentaje_retencion_fuente' => 'decimal:2',
        'porcentaje_retencion_iva' => 'decimal:2',
        'porcentaje_retencion_ica' => 'decimal:2',
    ];

    public function getDocumentoAttribute(): string
    {
        if (!$this->tipo_documento && !$this->numero_documento) {
            return '';
        }
        $tipo = $this->tipo_documento ?? 'Doc';
        return "{$tipo} {$this->numero_documento}";
    }

    /**
     * Órdenes de compra asociadas a este proveedor.
     */
    public function ordenes()
    {
        return $this->hasMany(OrdenCompra::class, 'proveedor_id');
    }

    /**
     * Cuentas por pagar asociadas a este proveedor.
     */
    public function cuentasPorPagar()
    {
        return $this->morphMany(\App\Modules\Accounting\Models\CuentaPorPagar::class, 'acreedor');
    }
}
