<?php
namespace App\Modules\ServiceDesk\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChecklistItem extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'sd_checklist_items';

    protected $fillable = [
        'tenant_id', 'tipo_equipo_id', 'categoria', 'subtipo',
        'nombre', 'icono', 'descripcion', 'orden', 'activo',
    ];

    protected $casts = [
        'orden' => 'integer',
        'activo' => 'boolean',
    ];

    public function tipoEquipo()
    {
        return $this->belongsTo(TipoEquipo::class, 'tipo_equipo_id');
    }

    public function scopeFallas(Builder $query): Builder
    {
        return $query->where('categoria', 'fallas');
    }

    public function scopeAccesorios(Builder $query): Builder
    {
        return $query->where('categoria', 'accesorios');
    }

    public function scopeActivos(Builder $query): Builder
    {
        return $query->where('activo', true);
    }

    public function scopeOrdenado(Builder $query): Builder
    {
        return $query->orderBy('orden');
    }
}
