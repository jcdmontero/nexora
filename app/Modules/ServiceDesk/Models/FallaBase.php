<?php
namespace App\Modules\ServiceDesk\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FallaBase extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'sd_fallas_base';

    protected $fillable = [
        'tenant_id', 'tipo_equipo_id', 'nombre', 'descripcion',
        'solucion_sugerida', 'tiempo_estimado', 'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function tipoEquipo()
    {
        return $this->belongsTo(TipoEquipo::class, 'tipo_equipo_id');
    }
}
