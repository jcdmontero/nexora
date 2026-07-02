<?php
namespace App\Modules\ServiceDesk\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Modelo extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'sd_modelos';

    protected $fillable = [
        'tenant_id', 'marca_id', 'tipo_equipo_id', 'nombre', 'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function marca()
    {
        return $this->belongsTo(Marca::class, 'marca_id');
    }

    public function tipoEquipo()
    {
        return $this->belongsTo(TipoEquipo::class, 'tipo_equipo_id');
    }
}
