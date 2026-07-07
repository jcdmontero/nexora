<?php
namespace App\Modules\Inventory\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class ProductPack extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'inventory_product_packs';

    protected $fillable = [
        'tenant_id',
        'producto_id',
        'nombre',
        'unidad_medida',
        'factor_conversion',
        'codigo_barras',
        'precio_venta',
    ];

    protected $casts = [
        'factor_conversion' => 'decimal:4',
        'precio_venta' => 'decimal:2',
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
