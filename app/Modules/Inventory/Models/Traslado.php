<?php
namespace App\Modules\Inventory\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Traslado extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'inventory_traslados';

    protected $fillable = [
        'tenant_id',
        'bodega_origen_id',
        'bodega_destino_id',
        'numero',
        'fecha',
        'estado',
        'notas',
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    public function origen()
    {
        return $this->belongsTo(Bodega::class, 'bodega_origen_id');
    }

    public function destino()
    {
        return $this->belongsTo(Bodega::class, 'bodega_destino_id');
    }

    public function detalles()
    {
        return $this->hasMany(TrasladoDetalle::class, 'traslado_id');
    }
}
