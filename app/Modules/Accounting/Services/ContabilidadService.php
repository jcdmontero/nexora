<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Accounting\Models\AsientoLinea;
use App\Modules\Accounting\Models\CuentaContable;
use App\Modules\Accounting\Models\PeriodoContable;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ContabilidadService
{
    public function getCuenta(string $codigo): ?CuentaContable
    {
        $query = CuentaContable::where('codigo', $codigo);

        $tenantId = tenantId();
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        return $query->first();
    }

    public function registrarAsiento(array $cabecera, array $lineas): AsientoContable
    {
        if (count($lineas) < 2) {
            throw new \Exception('Un asiento contable debe tener minimo dos lineas.');
        }

        $fecha = Carbon::parse($cabecera['fecha'] ?? now()->toDateString());
        $periodo = $this->resolverPeriodoAbierto($fecha);

        $totalDebito = round(array_sum(array_map(fn ($linea) => (float) ($linea['debito'] ?? 0), $lineas)), 2);
        $totalCredito = round(array_sum(array_map(fn ($linea) => (float) ($linea['credito'] ?? 0), $lineas)), 2);

        if (round($totalDebito - $totalCredito, 2) !== 0.0) {
            throw new \Exception("Asiento descuadrado (Debitos: {$totalDebito} / Creditos: {$totalCredito}).");
        }

        $lineas = array_map(function (array $linea) use ($cabecera) {
            $linea['tercero_tipo_documento'] ??= $cabecera['tercero_tipo_documento'] ?? null;
            $linea['tercero_numero_documento'] ??= $cabecera['tercero_numero_documento'] ?? null;
            $linea['tercero_nombre'] ??= $cabecera['tercero_nombre'] ?? null;

            return $linea;
        }, $lineas);

        foreach ($lineas as $linea) {
            $this->validarLinea($linea);
        }

        return DB::transaction(function () use ($cabecera, $lineas, $fecha, $periodo) {
            $asiento = AsientoContable::create([
                'periodo_contable_id' => $periodo->id,
                'fecha' => $fecha->toDateString(),
                'numero' => $cabecera['numero'] ?? $this->siguienteNumero($fecha),
                'concepto' => $cabecera['concepto'] ?? '',
                'estado' => 'contabilizado',
                'modulo_origen' => $cabecera['modulo_origen'] ?? null,
                'documento_tipo' => $cabecera['documento_tipo'] ?? null,
                'documento_prefijo' => $cabecera['documento_prefijo'] ?? null,
                'documento_numero' => $cabecera['documento_numero'] ?? null,
                'tercero_tipo_documento' => $cabecera['tercero_tipo_documento'] ?? null,
                'tercero_numero_documento' => $cabecera['tercero_numero_documento'] ?? null,
                'tercero_nombre' => $cabecera['tercero_nombre'] ?? null,
                'referencia_id' => $cabecera['referencia_id'] ?? null,
                'referencia_type' => $cabecera['referencia_type'] ?? null,
                'reverso_de_id' => $cabecera['reverso_de_id'] ?? null,
                'registrado_por' => $cabecera['registrado_por'] ?? auth()->id(),
                'contabilizado_at' => now(),
            ]);

            foreach ($lineas as $linea) {
                AsientoLinea::create([
                    'asiento_contable_id' => $asiento->id,
                    'cuenta_contable_id' => $linea['cuenta_contable_id'],
                    'centro_costo_id' => $linea['centro_costo_id'] ?? null,
                    'tercero_tipo_documento' => $linea['tercero_tipo_documento'] ?? $asiento->tercero_tipo_documento,
                    'tercero_numero_documento' => $linea['tercero_numero_documento'] ?? $asiento->tercero_numero_documento,
                    'tercero_nombre' => $linea['tercero_nombre'] ?? $asiento->tercero_nombre,
                    'debito' => $linea['debito'] ?? 0,
                    'credito' => $linea['credito'] ?? 0,
                    'base_gravable' => $linea['base_gravable'] ?? null,
                    'impuesto_tipo' => $linea['impuesto_tipo'] ?? null,
                    'impuesto_tarifa' => $linea['impuesto_tarifa'] ?? null,
                    'descripcion' => $linea['descripcion'] ?? null,
                ]);
            }

            return $asiento;
        });
    }

    public function revertirAsiento(string $modulo, string $referenciaType, int $referenciaId, string $motivo): bool
    {
        $asientoOriginal = AsientoContable::with('lineas')
            ->where('modulo_origen', $modulo)
            ->where('referencia_type', $referenciaType)
            ->where('referencia_id', $referenciaId)
            ->first();

        if (!$asientoOriginal) {
            return false;
        }

        if ($asientoOriginal->estado === 'reversado') {
            throw new \Exception('El asiento ya fue reversado.');
        }

        DB::transaction(function () use ($asientoOriginal, $motivo) {
            $lineas = $asientoOriginal->lineas->map(fn ($linea) => [
                'cuenta_contable_id' => $linea->cuenta_contable_id,
                'centro_costo_id' => $linea->centro_costo_id,
                'tercero_tipo_documento' => $linea->tercero_tipo_documento,
                'tercero_numero_documento' => $linea->tercero_numero_documento,
                'tercero_nombre' => $linea->tercero_nombre,
                'debito' => $linea->credito,
                'credito' => $linea->debito,
                'base_gravable' => $linea->base_gravable,
                'impuesto_tipo' => $linea->impuesto_tipo,
                'impuesto_tarifa' => $linea->impuesto_tarifa,
                'descripcion' => 'Reverso: ' . $linea->descripcion,
            ])->all();

            $this->registrarAsiento([
                'fecha' => now()->toDateString(),
                'concepto' => 'REVERSO: ' . $asientoOriginal->concepto . ' (' . $motivo . ')',
                'modulo_origen' => $asientoOriginal->modulo_origen,
                'documento_tipo' => $asientoOriginal->documento_tipo,
                'documento_prefijo' => $asientoOriginal->documento_prefijo,
                'documento_numero' => $asientoOriginal->documento_numero,
                'tercero_tipo_documento' => $asientoOriginal->tercero_tipo_documento,
                'tercero_numero_documento' => $asientoOriginal->tercero_numero_documento,
                'tercero_nombre' => $asientoOriginal->tercero_nombre,
                'referencia_id' => $asientoOriginal->referencia_id,
                'referencia_type' => $asientoOriginal->referencia_type,
                'reverso_de_id' => $asientoOriginal->id,
                'registrado_por' => auth()->id(),
            ], $lineas);

            $asientoOriginal->update(['estado' => 'reversado']);
        });

        return true;
    }

    private function validarLinea(array $linea): void
    {
        if (empty($linea['cuenta_contable_id'])) {
            throw new \Exception('Cada linea del asiento debe tener una cuenta contable.');
        }

        $debito = (float) ($linea['debito'] ?? 0);
        $credito = (float) ($linea['credito'] ?? 0);

        if ($debito <= 0 && $credito <= 0) {
            throw new \Exception('Cada linea debe tener un valor en debito o credito.');
        }

        if ($debito > 0 && $credito > 0) {
            throw new \Exception('Una linea no puede tener debito y credito al mismo tiempo.');
        }

        $cuenta = CuentaContable::find($linea['cuenta_contable_id']);
        if (!$cuenta) {
            throw new \Exception('La cuenta contable seleccionada no existe para esta empresa.');
        }

        if (!$cuenta->acepta_movimientos) {
            throw new \Exception("La cuenta {$cuenta->codigo} es agrupadora y no acepta movimientos.");
        }

        if ($cuenta->requiere_tercero && empty($linea['tercero_numero_documento'])) {
            throw new \Exception("La cuenta {$cuenta->codigo} requiere tercero.");
        }

        if ($cuenta->requiere_centro_costo && empty($linea['centro_costo_id'])) {
            throw new \Exception("La cuenta {$cuenta->codigo} requiere centro de costo.");
        }
    }

    private function resolverPeriodoAbierto(Carbon $fecha): PeriodoContable
    {
        $tenantId = tenantId();

        // 1. Validar que la fecha no esté antes del ÚLTIMO periodo cerrado del tenant.
        $ultimoCerrado = PeriodoContable::query()
            ->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
            ->where('estado', 'cerrado')
            ->orderByDesc('anio')
            ->orderByDesc('mes')
            ->first();

        if ($ultimoCerrado) {
            $finUltimoCerrado = Carbon::create($ultimoCerrado->anio, $ultimoCerrado->mes, 1)->endOfMonth();
            if ($fecha->lessThanOrEqualTo($finUltimoCerrado)) {
                throw new \Exception('No se puede contabilizar en una fecha que corresponde a un periodo ya cerrado.');
            }
        }

        // 2. Resolver o crear el periodo del tenant actual
        $criterioBusqueda = [
            'anio' => (int) $fecha->format('Y'),
            'mes' => (int) $fecha->format('m'),
        ];
        if ($tenantId) {
            $criterioBusqueda['tenant_id'] = $tenantId;
        }

        $periodo = PeriodoContable::firstOrCreate(
            $criterioBusqueda,
            [
                'fecha_inicio' => $fecha->copy()->startOfMonth()->toDateString(),
                'fecha_fin' => $fecha->copy()->endOfMonth()->toDateString(),
                'estado' => 'abierto',
            ]
        );

        if ($periodo->estaCerrado()) {
            throw new \Exception('No se puede contabilizar en el periodo actual porque se encuentra cerrado.');
        }

        return $periodo;
    }

    private function siguienteNumero(Carbon $fecha): string
    {
        $prefix = 'COM-' . $fecha->format('Ym') . '-';
        // lockForUpdate evita que transacciones concurrentes generen el mismo número
        $ultimo = AsientoContable::where('numero', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderByDesc('numero')
            ->value('numero');

        $secuencia = $ultimo ? ((int) substr($ultimo, -6)) + 1 : 1;

        return $prefix . str_pad((string) $secuencia, 6, '0', STR_PAD_LEFT);
    }
}
