<?php
namespace App\Modules\ServiceDesk\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Inventory\Models\Producto;
use App\Modules\ServiceDesk\Enums\OrdenEstado;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Modules\ServiceDesk\Casts\SafeEncrypted;


class OrdenReparacion extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'sd_ordenes';

    protected $fillable = [
        'tenant_id', 'numero_orden', 'verification_token',
        'cliente_id', 'modelo_id', 'tipo_equipo_id', 'tipo_equipo_manual', 'numero_serie',
        'accesorios_equipo', 'observaciones_equipo', 'condicion_inicial',
        'fallas_checklist', 'accesorios_checklist', 'fallas_otras', 'accesorios_otros',
        'bloqueado', 'bloqueado_en', 'tipo_bloqueo', 'codigo_bloqueo',
        'estado', 'notas_fases', 'fecha_recibido', 'fecha_entregado',
        'tecnico_id', 'prestador_id',
        'tipo_comision', 'valor_comision_fijo', 'porcentaje_comision',
        'tipo_mano_obra', 'mano_obra_descripcion',
        'precio_cliente', 'costo_tecnico', 'costo_tecnico_manual',
        'costo_diagnostico', 'costo_revision', 'total_final', 'abono_inicial',
        'descuento', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'fecha_recibido' => 'datetime',
        'fecha_entregado' => 'datetime',
        'bloqueado' => 'boolean',
        'bloqueado_en' => 'datetime',
        'estado' => OrdenEstado::class,
        'notas_fases' => 'array',
        'fallas_checklist' => 'array',
        'accesorios_checklist' => 'array',
        'precio_cliente' => 'decimal:2',
        'costo_tecnico' => 'decimal:2',
        'costo_diagnostico' => 'decimal:2',
        'costo_revision' => 'decimal:2',
        'total_final' => 'decimal:2',
        'abono_inicial' => 'decimal:2',
        'descuento' => 'decimal:2',
        'costo_tecnico_manual' => 'boolean',
        'codigo_bloqueo' => SafeEncrypted::class,
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            $model->verification_token = (string) \Illuminate\Support\Str::uuid();
        });

        static::saving(function ($orden) {
            // Sincronizar prestador_id y tecnico_id para evitar inconsistencias
            if ($orden->prestador_id) {
                $prestador = Prestador::find($orden->prestador_id);
                $orden->tecnico_id = $prestador?->user_id;
            } else {
                $orden->tecnico_id = null;
            }
        });
    }

    // ───────── Relaciones ─────────
    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function modelo()
    {
        return $this->belongsTo(Modelo::class, 'modelo_id');
    }

    public function tipoEquipo()
    {
        return $this->belongsTo(TipoEquipo::class, 'tipo_equipo_id');
    }

    public function tecnico()
    {
        return $this->belongsTo(User::class, 'tecnico_id');
    }

    public function prestador()
    {
        return $this->belongsTo(Prestador::class, 'prestador_id');
    }

    public function creador()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function servicios()
    {
        return $this->belongsToMany(Servicio::class, 'sd_orden_servicio', 'orden_id', 'servicio_id')
            ->withPivot(['cantidad', 'precio_aplicado', 'costo_tecnico_aplicado', 'descripcion'])
            ->withTimestamps();
    }

    public function repuestos()
    {
        return $this->belongsToMany(Producto::class, 'sd_orden_repuesto', 'orden_id', 'producto_id')
            ->withPivot(['cantidad', 'precio_unitario', 'descripcion'])
            ->withTimestamps();
    }

    public function multimedia()
    {
        return $this->hasMany(OrdenMultimedia::class, 'orden_id');
    }

    public function factura()
    {
        return $this->hasOne(\App\Modules\Sales\Models\Factura::class, 'orden_id')->latestOfMany();
    }

    public function actividades()
    {
        return $this->hasMany(OrdenActividad::class, 'orden_id');
    }

    public function recibos()
    {
        return $this->morphMany(\App\Modules\Cash\Models\ReciboCaja::class, 'referencia');
    }

    // ───────── Helpers de notas por fase ─────────
    public function getNotaDeFase(string $fase): ?string
    {
        return ($this->notas_fases ?? [])[$fase] ?? null;
    }

    // ───────── Totales ─────────
    public function getTotalRepuestosAttribute(): float
    {
        return $this->repuestos->sum(fn ($r) => ($r->pivot->cantidad ?? 0) * ($r->pivot->precio_unitario ?? 0));
    }

    public function getTotalServiciosAttribute(): float
    {
        return $this->servicios->sum(fn ($s) => ($s->pivot->cantidad ?? 0) * ($s->pivot->precio_aplicado ?? 0));
    }

    public function getTotalClienteAttribute(): float
    {
        return (float) $this->precio_cliente + $this->total_servicios + $this->total_repuestos;
    }

    public function getTotalActividadesAttribute(): float
    {
        return $this->actividades->sum('costo_total');
    }

    public function getTotalComisionesAttribute(): float
    {
        return $this->actividades->sum('comision_valor');
    }

    public function getTotalHorasAttribute(): float
    {
        return $this->actividades->sum('horas_invertidas');
    }

    /**
     * Recalcula el costo total de técnicos desde las actividades.
     */
    public function recalcularCostoActividades(): void
    {
        $this->update([
            'costo_tecnico' => $this->total_actividades,
        ]);
    }

    // ───────── Scopes ─────────
    public function scopeActivas($query)
    {
        return $query->whereIn('estado', OrdenEstado::activos());
    }
}
