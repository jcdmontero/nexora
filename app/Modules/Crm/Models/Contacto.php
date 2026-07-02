<?php

namespace App\Modules\Crm\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contacto extends Model
{
    use BelongsToTenant, Auditable, SoftDeletes;

    protected $table = 'crm_contactos';

    protected $fillable = [
        'tenant_id',
        'cliente_id',
        'nombre',
        'cargo',
        'email',
        'telefono',
        'is_principal',
    ];

    protected $casts = [
        'is_principal' => 'boolean',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }
}
