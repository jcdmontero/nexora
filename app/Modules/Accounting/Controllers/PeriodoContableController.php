<?php

namespace App\Modules\Accounting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Accounting\Models\PeriodoContable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PeriodoContableController extends Controller
{
    public function index()
    {
        $periodos = PeriodoContable::query()
            ->orderByDesc('anio')
            ->orderByDesc('mes')
            ->get();

        return Inertia::render('Modules/Accounting/Periodos/Index', [
            'periodos' => $periodos,
        ]);
    }

    public function close(PeriodoContable $periodo)
    {
        if ($periodo->tenant_id !== tenantId()) abort(403);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($periodo) {
            // Re-consultar con bloqueo pesimista para evitar condiciones de carrera
            $lockedPeriodo = PeriodoContable::where('id', $periodo->id)->lockForUpdate()->first();

            if ($lockedPeriodo->estado === 'cerrado') {
                return back()->with('error', 'El periodo ya se encuentra cerrado.');
            }

            // Para evitar huecos, validamos que no haya periodos anteriores ABIERTOS.
            $anterioresAbiertos = PeriodoContable::query()
                ->where('estado', 'abierto')
                ->where(function ($q) use ($lockedPeriodo) {
                    $q->where('anio', '<', $lockedPeriodo->anio)
                      ->orWhere(function ($q2) use ($lockedPeriodo) {
                          $q2->where('anio', $lockedPeriodo->anio)
                             ->where('mes', '<', $lockedPeriodo->mes);
                      });
                })
                ->exists();

            if ($anterioresAbiertos) {
                return back()->with('error', 'Existen periodos anteriores que aún están abiertos. Deben cerrarse en orden cronológico.');
            }

            // Verificar integridad débito = crédito en todos los asientos del periodo.
            // ACC-011: Usar JOIN + GROUP BY en vez de subqueries correlacionadas
            $asientosDesbalanceados = DB::table('asientos_contables')
                ->join('asiento_lineas', 'asientos_contables.id', '=', 'asiento_lineas.asiento_contable_id')
                ->where('asientos_contables.periodo_contable_id', $lockedPeriodo->id)
                ->where('asientos_contables.estado', '!=', 'reversado')
                ->groupBy('asientos_contables.id', 'asientos_contables.numero')
                ->havingRaw('ABS(SUM(asiento_lineas.debito) - SUM(asiento_lineas.credito)) > 0.01')
                ->pluck('asientos_contables.numero');

            if ($asientosDesbalanceados->isNotEmpty()) {
                $numeros = $asientosDesbalanceados->implode(', ');
                return back()->with('error', "No se puede cerrar el periodo. Los siguientes asientos tienen débito distinto del crédito: {$numeros}.");
            }

            $lockedPeriodo->update([
                'estado' => 'cerrado',
                'cerrado_at' => now(),
                'cerrado_por' => auth()->id(),
            ]);

            return back()->with('success', "Periodo {$lockedPeriodo->anio}-{$lockedPeriodo->mes} cerrado exitosamente.");
        });
    }

    public function reopen(PeriodoContable $periodo)
    {
        // A-07: Verificar si el año ya tiene un cierre anual (sin reversar).
        $cierreAnual = AsientoContable::query()
            ->where('concepto', 'like', "CIERRE ANUAL {$periodo->anio}%")
            ->where('estado', '!=', 'reversado')
            ->exists();

        if ($cierreAnual) {
            return back()->with('error', "No se puede reabrir el periodo porque el año {$periodo->anio} ya tiene un cierre anual. Revierta primero el asiento de cierre anual.");
        }

        // Solo puede reabrirse si es el ÚLTIMO periodo cerrado (no reabrir saltando periodos).
        $postCerrados = PeriodoContable::query()
            ->where('estado', 'cerrado')
            ->where(function ($q) use ($periodo) {
                $q->where('anio', '>', $periodo->anio)
                  ->orWhere(function ($q2) use ($periodo) {
                      $q2->where('anio', $periodo->anio)
                         ->where('mes', '>', $periodo->mes);
                  });
            })
            ->exists();

        if ($postCerrados) {
            return back()->with('error', 'No se puede reabrir porque existen periodos posteriores cerrados.');
        }

        $periodo->update([
            'estado' => 'abierto',
            'cerrado_at' => null,
            'cerrado_por' => null,
        ]);

        return back()->with('success', "Periodo {$periodo->anio}-{$periodo->mes} reabierto exitosamente.");
    }
}
