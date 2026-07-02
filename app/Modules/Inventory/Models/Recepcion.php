<?php
namespace App\Modules\Inventory\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Modules\Purchasing\Models\OrdenCompra;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Recepcion extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'inventory_recepciones';

    protected $fillable = [
        'tenant_id',
        'orden_compra_id',
        'bodega_id',
        'numero',
        'fecha',
        'notas',
        'metodo_pago',
        'monto_total',
        'caja_sesion_id',
    ];

    protected $casts = [
        'fecha' => 'date',
        'monto_total' => 'decimal:2',
    ];

    public function ordenCompra()
    {
        return $this->belongsTo(OrdenCompra::class, 'orden_compra_id');
    }

    public function detalles()
    {
        return $this->hasMany(RecepcionDetalle::class, 'recepcion_id');
    }

    public function bodega()
    {
        return $this->belongsTo(Bodega::class, 'bodega_id');
    }

    public function cajaSesion()
    {
        return $this->belongsTo(\App\Modules\Cash\Models\CajaSesion::class, 'caja_sesion_id');
    }
}
