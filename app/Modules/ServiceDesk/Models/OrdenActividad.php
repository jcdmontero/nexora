<?php

namespace App\Modules\ServiceDesk\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrdenActividad extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'sd_orden_actividades';

    protected $fillable = [
        'tenant_id', 'orden_id', 'prestador_id', 'servicio_id',
        'resultado',
        'horas_invertidas', 'costo_hora', 'costo_total',
        'comision_tipo', 'comision_valor',
        'descripcion',
    ];

    protected $casts = [
        'horas_invertidas' => 'decimal:2',
        'costo_hora' => 'decimal:2',
        'costo_total' => 'decimal:2',
        'comision_valor' => 'decimal:2',
    ];

    public const RESULTADOS = ['exitoso', 'fallido', 'pendiente'];

    public function orden()
    {
        return $this->belongsTo(OrdenReparacion::class, 'orden_id');
    }

    public function prestador()
    {
        return $this->belongsTo(Prestador::class, 'prestador_id');
    }

    public function servicio()
    {
        return $this->belongsTo(Servicio::class, 'servicio_id');
    }

    public function resultadoLabel(): string
    {
        return match ($this->resultado) {
            'exitoso' => 'Exitoso',
            'fallido' => 'Fallido',
            'pendiente' => 'Pendiente',
            default => $this->resultado,
        };
    }

    public function resultadoColor(): string
    {
        return match ($this->resultado) {
            'exitoso' => 'emerald',
            'fallido' => 'rose',
            'pendiente' => 'amber',
            default => 'slate',
        };
    }

    /**
     * Calcula el costo total basado en horas y costo por hora.
     */
    public function calcularCosto(): void
    {
        $this->costo_total = $this->horas_invertidas * $this->costo_hora;
    }

    /**
     * Calcula la comisión según el tipo configurado.
     * Si es PORCENTAJE, aplica el porcentaje sobre el costo_total.
     */
    public function calcularComision(float $porcentaje = 0): void
    {
        if ($this->comision_tipo === 'PORCENTAJE' && $porcentaje > 0) {
            $this->comision_valor = $this->costo_total * ($porcentaje / 100);
        }
        // FIJO y LIBRE se asignan manualmente
    }
}
