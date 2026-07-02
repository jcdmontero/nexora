<?php
namespace App\Modules\ServiceDesk\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Servicio extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'sd_servicios';

    protected $fillable = [
        'tenant_id', 'tipo_equipo_id', 'nombre', 'codigo', 'descripcion',
        'imagen_url',
        'precio_base', 'costo_tecnico_base', 'tipo_comision_tecnico',
        'tiempo_estimado', 'requiere_repuestos', 'activo',
    ];

    protected $casts = [
        'precio_base' => 'decimal:2',
        'costo_tecnico_base' => 'decimal:2',
        'requiere_repuestos' => 'boolean',
        'activo' => 'boolean',
    ];

    public function tipoEquipo()
    {
        return $this->belongsTo(TipoEquipo::class, 'tipo_equipo_id');
    }
}
