<?php
namespace App\Modules\Purchasing\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Modules\Inventory\Models\Producto;
use Illuminate\Database\Eloquent\Model;

class OrdenCompraDetalle extends Model
{
    use BelongsToTenant;

    protected $table = 'purchasing_orden_detalles';

    protected $fillable = [
        'tenant_id',
        'orden_compra_id',
        'producto_id',
        'cantidad',
        'precio_unitario',
        'subtotal',
    ];

    protected $casts = [
        'cantidad' => 'decimal:4',
        'precio_unitario' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function orden()
    {
        return $this->belongsTo(OrdenCompra::class, 'orden_compra_id');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
