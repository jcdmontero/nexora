<?php
namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;

class RecepcionDetalle extends Model
{
    protected $table = 'inventory_recepcion_detalles';

    protected $fillable = [
        'recepcion_id',
        'producto_id',
        'cantidad',
    ];

    protected $casts = [
        'cantidad' => 'decimal:4',
    ];

    public function recepcion()
    {
        return $this->belongsTo(Recepcion::class, 'recepcion_id');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
