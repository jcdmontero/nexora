<?php

namespace App\Modules\Sales\Models;

use App\Core\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certificado extends Model
{
    protected $table = 'sales_certificados';

    protected $fillable = [
        'tenant_id',
        'nombre_archivo',
        'pfx_path',
        'password',
        'fecha_vencimiento',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'pfx_path',
    ];

    protected $casts = [
        'fecha_vencimiento' => 'date',
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
