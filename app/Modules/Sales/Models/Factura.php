<?php

namespace App\Modules\Sales\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Core\Models\Sede;
use App\Core\Models\Tenant;
use App\Models\User;
use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Crm\Models\Cliente;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Factura extends Model
{
    use HasFactory, BelongsToTenant, Auditable;

    protected $table = 'sales_facturas';

    protected $guarded = ['id'];

    protected static function booted()
    {
        static::creating(function ($model) {
            $model->verification_token = (string) \Illuminate\Support\Str::uuid();
        });
    }

    protected $fillable = [
        'tenant_id',
        'sede_id',
        'cliente_id',
        'user_id',
        'numero',
        'subtotal',
        'impuestos',
        'descuento',
        'total',
        'estado',
        'metodo_pago',
        'notas',
        // 'fecha_emision' and 'fecha_vencimiento' are not present
        // in the `sales_facturas` table migration and must not
        // be mass-assigned here.
        'cufe',
        'qr_code',
        'tipo_documento',
        'dian_estado',
        'dian_mensaje',
        'dian_fecha_envio',
        'dian_track_id',
        'resolucion_id',
        'factura_origen_id',
        'orden_id',
        'anulada',
        'anulada_at',
        'anulada_por',
        'verification_token',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'impuestos' => 'decimal:2',
        'descuento' => 'decimal:2',
        'total' => 'decimal:2',
        'anulada' => 'boolean',
        'anulada_at' => 'datetime',
    ];

    public function scopeNoAnuladas($query)
    {
        return $query->where('anulada', false);
    }

    public function esAnulable(): bool
    {
        return !$this->anulada;
    }

    public function anulador(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'anulada_por');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function sede(): BelongsTo
    {
        return $this->belongsTo(Sede::class);
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(FacturaItem::class);
    }

    public function orden(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\ServiceDesk\Models\OrdenReparacion::class, 'orden_id');
    }

    public function asientos(): MorphMany
    {
        return $this->morphMany(AsientoContable::class, 'referencia');
    }

    /**
     * Cuenta por cobrar asociada a esta factura (venta a crédito).
     */
    public function cuentaPorCobrar()
    {
        return $this->morphOne(\App\Modules\Accounting\Models\CuentaPorCobrar::class, 'documentoOrigen');
    }
}
