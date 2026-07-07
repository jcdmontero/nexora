<?php

namespace App\Modules\Sales\Models;

use App\Core\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypto;

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

    /**
     * Encripta la contraseña al guardar en BD.
     */
    public function setPasswordAttribute(string $value): void
    {
        $this->attributes['password'] = $value === ''
            ? ''
            : Crypto::encrypt($value);
    }

    /**
     * Desencripta la contraseña al leer de BD.
     */
    public function getPasswordAttribute(): string
    {
        $encrypted = $this->attributes['password'] ?? '';

        if ($encrypted === '') {
            return '';
        }

        try {
            return Crypto::decrypt($encrypted);
        } catch (\Throwable) {
            // Si falla la desencriptación, asumir que está en texto plano
            // (datos migrados antes de la encriptación)
            return $encrypted;
        }
    }
}
