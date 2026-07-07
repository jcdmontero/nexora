<?php

namespace App\Modules\Cash\Services;

use App\Core\Concerns\BelongsToTenant;
use App\Modules\Cash\Models\Arqueo;
use App\Modules\Cash\Models\ArqueoDetalle;
use App\Modules\Cash\Models\Caja;
use App\Modules\Cash\Models\CajaSesion;
use App\Modules\Cash\Models\Denominacion;
use App\Modules\Cash\Models\MovimientoCaja;
use App\Modules\Cash\Models\Transferencia;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class CajaService
{
    /**
     * Lista las cajas activas disponibles para abrir turno.
     */
    public function cajasDisponibles(): \Illuminate\Database\Eloquent\Collection
    {
        return Caja::where('activa', true)->orderBy('nombre')->get();
    }

    /**
     * Sesión de caja abierta para el usuario (regla: 1 sesión por usuario).
     */
    public function getSesionAbierta($userId): ?CajaSesion
    {
        return CajaSesion::where('user_id', $userId)
            ->where('estado', 'abierta')
            ->with('caja')
            ->first();
    }

    /**
     * Abre una nueva sesión de caja en la caja indicada.
     *
     * @throws \Exception si el usuario ya tiene un turno abierto o la caja está ocupada.
     */
    public function abrirCaja(int $userId, int $cajaId, float $saldoInicial, ?string $notas = null): CajaSesion
    {
        return DB::transaction(function () use ($userId, $cajaId, $saldoInicial, $notas) {
            // Regla multicaja: un usuario solo puede tener UN turno abierto.
            if ($this->getSesionAbierta($userId)) {
                throw new \Exception('El usuario ya tiene una caja abierta.');
            }

            $caja = Caja::where('activa', true)->findOrFail($cajaId);

            // La caja no puede tener dos sesiones abiertas simultáneas.
            if (CajaSesion::where('caja_id', $cajaId)->where('estado', 'abierta')->exists()) {
                throw new \Exception('Esta caja ya tiene un turno abierto por otro usuario.');
            }

            return CajaSesion::create([
                'caja_id' => $cajaId,
                'user_id' => $userId,
                'fecha_apertura' => now(),
                'saldo_inicial' => $saldoInicial,
                'estado' => 'abierta',
                'notas' => $notas,
                'ingresos_totales' => 0,
                'egresos_totales' => 0,
            ]);
        });
    }

    /**
     * Registra un movimiento en la sesión y actualiza los totales de la sesión.
     *
     * @param CajaSesion  $sesion
     * @param string      $tipo        'ingreso' | 'egreso'
     * @param float       $monto
     * @param string      $metodoPago  efectivo | tarjeta | transferencia
     * @param string      $concepto
     * @param object|null $referencia  Modelo polimórfico (Factura, OrdenReparacion, ...)
     */
    public function registrarMovimiento(CajaSesion $sesion, string $tipo, float $monto, string $metodoPago, string $concepto, $referencia = null): MovimientoCaja
    {
        if ($sesion->estado !== 'abierta') {
            throw new \Exception('No se puede registrar movimientos en una caja cerrada.');
        }

        if ($monto <= 0) {
            throw new \Exception('El monto del movimiento debe ser mayor a cero.');
        }

        if (!in_array($tipo, ['ingreso', 'egreso'])) {
            throw new \Exception('El tipo de movimiento debe ser "ingreso" o "egreso".');
        }

        return DB::transaction(function () use ($sesion, $tipo, $monto, $metodoPago, $concepto, $referencia) {
            // M1: Bloqueo pesimista de la sesión dentro de la transacción
            $sesionLocked = CajaSesion::where('id', $sesion->id)->lockForUpdate()->first();
            
            if (!$sesionLocked || $sesionLocked->estado !== 'abierta') {
                throw new \Exception('No se puede registrar movimientos en una caja cerrada o inexistente.');
            }
            $movimiento = MovimientoCaja::create([
                'tenant_id' => $sesion->tenant_id,
                'sesion_id' => $sesion->id,
                'tipo' => $tipo,
                'monto' => $monto,
                'metodo_pago' => $metodoPago,
                'concepto' => $concepto,
                'referencia_type' => $referencia ? get_class($referencia) : null,
                'referencia_id' => $referencia ? $referencia->id : null,
            ]);

            // Mantener totales de la sesión sincronizados para el cuadre usando la instancia bloqueada.
            if ($tipo === 'ingreso') {
                $sesionLocked->increment('ingresos_totales', $monto);
                $sesion->ingresos_totales += $monto;
            } else {
                $sesionLocked->increment('egresos_totales', $monto);
                $sesion->egresos_totales += $monto;
            }

            return $movimiento;
        });
    }

    /**
     * Cierra una sesión de caja calculando la diferencia contra el saldo del sistema.
     */
    public function cerrarSesion(CajaSesion $sesion, float $saldoFinal, ?string $observaciones = null): CajaSesion
    {
        if ($sesion->estado === 'cerrada') {
            throw new \Exception('La caja ya está cerrada.');
        }

        $saldoSistema = $sesion->saldo_sistema;
        $diferencia = round($saldoFinal - $saldoSistema, 2);

        $sesion->update([
            'fecha_cierre' => now(),
            'saldo_final' => $saldoFinal,
            'diferencia' => $diferencia,
            'estado' => 'cerrada',
            'observaciones_cierre' => $observaciones,
        ]);

        return $sesion;
    }

    /**
     * Realiza el arqueo (conteo físico) de una sesión y persiste el detalle.
     *
     * @param array $detalles  [['denominacion_id' => int, 'cantidad' => int], ...]
     */
    public function arquearSesion(CajaSesion $sesion, array $detalles, ?string $observaciones = null): Arqueo
    {
        return DB::transaction(function () use ($sesion, $detalles, $observaciones) {
            $denominaciones = Denominacion::whereIn('id', collect($detalles)->pluck('denominacion_id'))
                ->get()
                ->keyBy('id');

            $totalContado = 0;
            $filas = [];

            foreach ($detalles as $d) {
                $denom = $denominaciones->get($d['denominacion_id']);
                if (!$denom) {
                    continue;
                }
                $cantidad = (int) ($d['cantidad'] ?? 0);
                $subtotal = round((float) $denom->valor * $cantidad, 2);
                $totalContado += $subtotal;
                $filas[] = [
                    'denominacion_id' => $denom->id,
                    'cantidad' => $cantidad,
                    'subtotal' => $subtotal,
                ];
            }

            $totalSistema = (float) $sesion->saldo_sistema;

            $arqueo = Arqueo::create([
                'sesion_id' => $sesion->id,
                'user_id' => auth()->id(),
                'total_sistema' => $totalSistema,
                'total_contado' => $totalContado,
                'diferencia' => round($totalContado - $totalSistema, 2),
                'observaciones' => $observaciones,
            ]);

            foreach ($filas as $fila) {
                $fila['arqueo_id'] = $arqueo->id;
                ArqueoDetalle::create($fila);
            }

            $sesion->update(['arqueado' => true]);

            return $arqueo;
        });
    }

    /**
     * Transfiere efectivo entre dos cajas. Requiere sesión abierta en el origen;
     * si el destino también tiene sesión abierta, se registra el ingreso.
     */
    public function transferirEntreCajas(int $cajaOrigenId, int $cajaDestinoId, float $monto, ?string $concepto = null): Transferencia
    {
        if ($cajaOrigenId === $cajaDestinoId) {
            throw new \Exception('La caja de origen y destino deben ser distintas.');
        }
        if ($monto <= 0) {
            throw new \Exception('El monto a transferir debe ser mayor a cero.');
        }

        return DB::transaction(function () use ($cajaOrigenId, $cajaDestinoId, $monto, $concepto) {
            $sesionOrigen = CajaSesion::where('caja_id', $cajaOrigenId)
                ->where('estado', 'abierta')
                ->first();

            if (!$sesionOrigen) {
                throw new \Exception('No hay un turno abierto en la caja de origen.');
            }

            $sesionDestino = CajaSesion::where('caja_id', $cajaDestinoId)
                ->where('estado', 'abierta')
                ->first();

            // Verificar que ambas cajas pertenezcan al mismo tenant
            if ($sesionDestino && $sesionOrigen->tenant_id !== $sesionDestino->tenant_id) {
                throw new \Exception('No se pueden transferir fondos entre cajas de diferentes empresas.');
            }

            if (!$sesionDestino) {
                throw new \Exception('La caja de destino no tiene un turno abierto. Abre un turno en la caja destino antes de transferir.');
            }

            // Egreso en la caja origen.
            $this->registrarMovimiento(
                $sesionOrigen,
                'egreso',
                $monto,
                'efectivo',
                'Transferencia a caja destino: ' . ($concepto ?? 'Traslado de efectivo'),
            );

            // Ingreso en la caja destino.
            $this->registrarMovimiento(
                $sesionDestino,
                'ingreso',
                $monto,
                'efectivo',
                'Transferencia recibida de otra caja: ' . ($concepto ?? 'Traslado de efectivo'),
            );

            return Transferencia::create([
                'caja_origen_id' => $cajaOrigenId,
                'caja_destino_id' => $cajaDestinoId,
                'sesion_origen_id' => $sesionOrigen->id,
                'sesion_destino_id' => $sesionDestino?->id,
                'user_id' => auth()->id(),
                'monto' => $monto,
                'concepto' => $concepto,
                'estado' => 'completada',
            ]);
        });
    }

    /**
     * Reporte consolidado de cajas: totales de ingresos/egresos/saldo por caja
     * en un rango de fechas.
     */
    public function reporteConsolidado(?\DateTimeInterface $desde = null, ?\DateTimeInterface $hasta = null, ?int $sedeId = null): array
    {
        $desde ??= now()->startOfMonth();
        $hasta ??= now()->endOfDay();

        $tenantId = app('current_tenant')->id ?? 0;
        $cacheKey = "cash_reporte_consolidado_{$tenantId}_" . $desde->format('Y-m-d') . '_' . $hasta->format('Y-m-d') . '_' . ($sedeId ?? 'all');

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($desde, $hasta, $sedeId) {
            $query = Caja::with(['sesionActual.usuario', 'sede'])
            ->withCount([
                'sesiones as sesiones_periodo' => fn (Builder $q) => $q
                    ->whereBetween('fecha_apertura', [$desde, $hasta]),
            ]);

        if ($sedeId) {
            $query->where('sede_id', $sedeId);
        }

        $cajas = $query->orderBy('nombre')->get()->map(function (Caja $caja) use ($desde, $hasta) {
            $sesiones = $caja->sesiones()
                ->whereBetween('fecha_apertura', [$desde, $hasta])
                ->get();

            return [
                'id' => $caja->id,
                'nombre' => $caja->nombre,
                'sede' => $caja->sede?->nombre,
                'activa' => $caja->activa,
                'sesiones_periodo' => $sesiones->count(),
                'ingresos' => (float) $sesiones->sum('ingresos_totales'),
                'egresos' => (float) $sesiones->sum('egresos_totales'),
                'saldo_actual' => $caja->saldo_actual,
                'cajero_actual' => $caja->sesionActual?->usuario?->name,
            ];
        });

            return [
                'desde' => $desde->format('Y-m-d'),
                'hasta' => $hasta->format('Y-m-d'),
                'cajas' => $cajas->values()->all(),
                'totales' => [
                    'ingresos' => (float) $cajas->sum('ingresos'),
                    'egresos' => (float) $cajas->sum('egresos'),
                    'saldo_actual' => (float) $cajas->sum('saldo_actual'),
                ],
            ];
        });
    }
}
