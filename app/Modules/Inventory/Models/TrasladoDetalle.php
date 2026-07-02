<?php
namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;

class TrasladoDetalle extends Model
{
    protected $table = 'inventory_traslado_detalles';

    protected $fillable = [
        'traslado_id',
        'producto_id',
        'cantidad',
    ];

    protected $casts = [
        'cantidad' => 'decimal:4',
    ];

    public function traslado()
    {
        return $this->belongsTo(Traslado::class, 'traslado_id');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
