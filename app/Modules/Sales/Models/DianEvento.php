<?php

namespace App\Modules\Sales\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DianEvento extends Model
{
    protected $table = 'sales_dian_eventos';

    protected $fillable = [
        'factura_id',
        'estado',
        'mensaje',
        'xml_enviado',
        'xml_respuesta',
    ];

    public function factura(): BelongsTo
    {
        return $this->belongsTo(Factura::class);
    }
}
