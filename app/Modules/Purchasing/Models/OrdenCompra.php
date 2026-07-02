<?php
namespace App\Modules\Purchasing\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrdenCompra extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'purchasing_ordenes';

    protected $fillable = [
        'tenant_id',
        'proveedor_id',
        'numero',
        'estado',
        'fecha_emision',
        'fecha_esperada',
        'subtotal',
        'impuestos',
        'total',
        'notas',
    ];

    protected $casts = [
        'fecha_emision' => 'date',
        'fecha_esperada' => 'date',
        'subtotal' => 'decimal:2',
        'impuestos' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    public function detalles()
    {
        return $this->hasMany(OrdenCompraDetalle::class, 'orden_compra_id');
    }
}
