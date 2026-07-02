<?php
namespace App\Modules\ServiceDesk\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Marca extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'sd_marcas';

    protected $fillable = [
        'tenant_id', 'nombre', 'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function modelos()
    {
        return $this->hasMany(Modelo::class, 'marca_id');
    }
}
