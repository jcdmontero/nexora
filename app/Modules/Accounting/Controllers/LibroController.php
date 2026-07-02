<?php

namespace App\Modules\Accounting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Accounting\Models\AsientoLinea;
use App\Modules\Accounting\Models\LibroContable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LibroController extends Controller
{
    /**
     * Lista los libros contables del tenant.
     */
    public function index()
    {
        $libros = LibroContable::where('activo', true)->get()->map(fn ($l) => [
            'id' => $l->id,
            'codigo' => $l->codigo,
            'nombre' => $l->nombre,
            'tipo' => $l->tipo,
            'descripcion' => $l->descripcion,
            'is_sistema' => $l->is_sistema,
        ]);

        return Inertia::render('Modules/Accounting/Libros/Index', [
            'libros' => $libros,
        ]);
    }

    /**
     * Muestra el contenido de un libro (asientos filtrados).
     */
    public function show(Request $request, LibroContable $libro)
    {
        $query = AsientoContable::with(['lineas.cuenta', 'registrador'])
            ->where('estado', 'contabilizado')
            ->orderBy('fecha', 'desc')
            ->orderBy('id', 'desc');

        // Aplicar filtro de cuentas (ej: "1105%" para libro caja)
        if ($libro->filtro_cuentas) {
            $patron = str_replace('%', '%%', $libro->filtro_cuentas);
            $query->whereHas('lineas.cuenta', function ($q) use ($patron) {
                $q->where('codigo', 'like', $patron);
            });
        }

        // Aplicar filtro de módulo origen (ej: "ventas,service-desk")
        if ($libro->filtro_modulo) {
            $modulos = array_map('trim', explode(',', $libro->filtro_modulo));
            $query->whereIn('modulo_origen', $modulos);
        }

        // Filtros adicionales desde request
        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha', '>=', $request->fecha_desde);
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha', '<=', $request->fecha_hasta);
        }
        if ($request->filled('cuenta_codigo')) {
            $query->whereHas('lineas.cuenta', function ($q) use ($request) {
                $q->where('codigo', 'like', $request->cuenta_codigo . '%');
            });
        }

        $asientos = $query->paginate(20)->through(fn ($a) => [
            'id' => $a->id,
            'numero' => $a->numero,
            'fecha' => $a->fecha->format('Y-m-d'),
            'concepto' => $a->concepto,
            'modulo_origen' => $a->modulo_origen,
            'documento' => ($a->documento_prefijo ?? '') . ($a->documento_numero ?? ''),
            'registrado_por' => $a->registrador?->name,
            'total_debito' => (float) $a->lineas->sum('debito'),
            'total_credito' => (float) $a->lineas->sum('credito'),
            'lineas' => $a->lineas->map(fn ($l) => [
                'cuenta_codigo' => $l->cuenta?->codigo,
                'cuenta_nombre' => $l->cuenta?->nombre,
                'debito' => (float) $l->debito,
                'credito' => (float) $l->credito,
                'descripcion' => $l->descripcion,
            ]),
        ]);

        return Inertia::render('Modules/Accounting/Libros/Show', [
            'libro' => [
                'id' => $libro->id,
                'codigo' => $libro->codigo,
                'nombre' => $libro->nombre,
                'tipo' => $libro->tipo,
                'descripcion' => $libro->descripcion,
                'filtro_cuentas' => $libro->filtro_cuentas,
                'filtro_modulo' => $libro->filtro_modulo,
            ],
            'asientos' => $asientos,
            'filters' => $request->only(['fecha_desde', 'fecha_hasta', 'cuenta_codigo']),
        ]);
    }
}
