<?php
namespace App\Modules\ServiceDesk\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TipoEquipo extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'sd_tipos_equipo';

    protected $fillable = [
        'tenant_id', 'nombre', 'slug', 'familia', 'descripcion', 'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function modelos()
    {
        return $this->hasMany(Modelo::class, 'tipo_equipo_id');
    }
}
