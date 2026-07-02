<?php
namespace App\Modules\Crm\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cliente extends Authenticatable
{
    use HasFactory, BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'crm_clientes';

    protected $fillable = [
        'tenant_id', 'tipo',
        'regimen_tributario',
        'porcentaje_retencion_fuente',
        'porcentaje_retencion_iva',
        'porcentaje_retencion_ica',
        'tipo_documento', 'numero_documento', 'nombres', 'apellidos',
        'razon_social', 'nit', 'nombre_contacto', 'telefono_contacto', 'cargo_contacto',
        'email', 'telefono', 'direccion', 'ciudad', 'notas', 'activo',
        'password', 'portal_active', 'last_login_at',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'porcentaje_retencion_fuente' => 'decimal:2',
        'porcentaje_retencion_iva' => 'decimal:2',
        'porcentaje_retencion_ica' => 'decimal:2',
    ];

    public function getNombreCompletoAttribute(): string
    {
        if ($this->tipo === 'juridico') {
            return $this->razon_social ?? '';
        }
        return trim(($this->nombres ?? '') . ' ' . ($this->apellidos ?? ''));
    }

    public function getDocumentoAttribute(): string
    {
        if ($this->tipo === 'juridico' && $this->nit) {
            return "NIT {$this->nit}";
        }
        $tipo = $this->tipo_documento ?? 'CC';
        return $this->numero_documento ? "{$tipo} {$this->numero_documento}" : '';
    }

    public function contactos()
    {
        return $this->hasMany(Contacto::class);
    }

    public function oportunidades()
    {
        return $this->hasMany(Oportunidad::class);
    }

    /**
     * Cuentas por cobrar asociadas a este cliente.
     */
    public function cuentasPorCobrar()
    {
        return $this->morphMany(\App\Modules\Accounting\Models\CuentaPorCobrar::class, 'deudor');
    }
}
