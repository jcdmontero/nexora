<?php
namespace App\Modules\Inventory\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class InventoryAdjustment extends Model
{
    use BelongsToTenant;

    protected $table = 'inventory_adjustments';

    protected $fillable = [
        'tenant_id',
        'producto_id',
        'pack_id',
        'bodega_id',
        'tipo',
        'cantidad',
        'factor_conversion',
        'cantidad_base',
        'costo_unitario',
        'observaciones',
        'referencia_id',
        'referencia_type',
        'created_by'
    ];

    protected $casts = [
        'cantidad' => 'decimal:4',
        'factor_conversion' => 'decimal:4',
        'cantidad_base' => 'decimal:4',
        'costo_unitario' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->created_by && auth()->check()) {
                $model->created_by = auth()->id();
            }
        });
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function pack()
    {
        return $this->belongsTo(ProductPack::class, 'pack_id');
    }

    public function bodega()
    {
        return $this->belongsTo(Bodega::class, 'bodega_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function referencia()
    {
        return $this->morphTo();
    }
}
