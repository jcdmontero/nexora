<?php

namespace App\Modules\Sales\Models;

use App\Modules\Inventory\Models\Producto;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacturaItem extends Model
{
    use HasFactory;

    protected $table = 'sales_factura_items';
    protected $guarded = ['id'];

    protected $casts = [
        'cantidad' => 'decimal:2',
        'precio_unitario' => 'decimal:2',
        'tasa_impuesto' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'impuesto_total' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function factura(): BelongsTo
    {
        return $this->belongsTo(Factura::class);
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }
}
