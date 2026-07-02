<?php
namespace App\Modules\Inventory\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Marca extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'inventory_marcas';

    protected $fillable = [
        'tenant_id',
        'nombre',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function productos()
    {
        return $this->hasMany(Producto::class, 'marca_id');
    }
}
