<?php
namespace App\Modules\Inventory\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Core\Models\Tenant;
use App\Core\Models\Sede;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bodega extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'inventory_bodegas';

    protected $fillable = [
        'tenant_id',
        'sede_id',
        'nombre',
        'direccion',
        'es_principal',
        'activo',
    ];

    protected $casts = [
        'es_principal' => 'boolean',
        'activo' => 'boolean',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function sede()
    {
        return $this->belongsTo(Sede::class, 'sede_id');
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class, 'bodega_id');
    }
}
