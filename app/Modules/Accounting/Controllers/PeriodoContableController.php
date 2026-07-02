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
        if ($periodo->estado === 'cerrado') {
            return back()->with('error', 'El periodo ya se encuentra cerrado.');
        }

        // Para evitar huecos, validamos que no haya periodos anteriores ABIERTOS.
        $anterioresAbiertos = PeriodoContable::query()
            ->where('estado', 'abierto')
            ->where(function ($q) use ($periodo) {
                $q->where('anio', '<', $periodo->anio)
                  ->orWhere(function ($q2) use ($periodo) {
                      $q2->where('anio', $periodo->anio)
                         ->where('mes', '<', $periodo->mes);
                  });
            })
            ->exists();

        if ($anterioresAbiertos) {
            return back()->with('error', 'Existen periodos anteriores que aún están abiertos. Deben cerrarse en orden cronológico.');
        }

        // Verificar integridad débito = crédito en todos los asientos del periodo.
        $asientosDesbalanceados = AsientoContable::query()
            ->where('periodo_contable_id', $periodo->id)
            ->where('estado', '!=', 'reversado')
            ->whereRaw('(SELECT COALESCE(SUM(debito), 0) FROM asiento_lineas WHERE asiento_lineas.asiento_contable_id = asientos_contables.id) != '
                . '(SELECT COALESCE(SUM(credito), 0) FROM asiento_lineas WHERE asiento_lineas.asiento_contable_id = asientos_contables.id)')
            ->pluck('numero');

        if ($asientosDesbalanceados->isNotEmpty()) {
            $numeros = $asientosDesbalanceados->implode(', ');
            return back()->with('error', "No se puede cerrar el periodo. Los siguientes asientos tienen débito distinto del crédito: {$numeros}.");
        }

        $periodo->update([
            'estado' => 'cerrado',
            'cerrado_at' => now(),
            'cerrado_por' => auth()->id(),
        ]);

        return back()->with('success', "Periodo {$periodo->anio}-{$periodo->mes} cerrado exitosamente.");
    }

    public function reopen(PeriodoContable $periodo)
    {
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
