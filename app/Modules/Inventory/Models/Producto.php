<?php
namespace App\Modules\Inventory\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Producto extends Model
{
    use HasFactory, BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'inventory_productos';

    protected $fillable = [
        'tenant_id',
        'codigo',
        'nombre',
        'imagenes',
        'descripcion',
        'categoria_id',
        'marca_id',
        'unidad_medida',
        'precio_venta',
        'costo_promedio',
        'stock_actual',
        'stock_minimo',
        'is_active',
    ];

    protected $casts = [
        'precio_venta' => 'decimal:2',
        'costo_promedio' => 'decimal:2',
        'stock_actual' => 'decimal:4',
        'stock_minimo' => 'decimal:4',
        'is_active' => 'boolean',
        'imagenes' => 'array',
    ];

    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }

    public function marca()
    {
        return $this->belongsTo(Marca::class, 'marca_id');
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class, 'producto_id');
    }

    public function packs()
    {
        return $this->hasMany(ProductPack::class, 'producto_id');
    }

    public function adjustments()
    {
        return $this->hasMany(InventoryAdjustment::class, 'producto_id');
    }

    public function getStockBajoAttribute(): bool
    {
        return $this->stock_actual <= $this->stock_minimo;
    }
}
