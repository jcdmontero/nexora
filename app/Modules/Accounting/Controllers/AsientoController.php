<?php

namespace App\Modules\Accounting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Accounting\Models\CentroCosto;
use App\Modules\Accounting\Models\CuentaContable;
use App\Modules\Accounting\Services\ContabilidadService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AsientoController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $asientos = AsientoContable::query()
            ->with(['lineas.cuenta', 'periodo'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('concepto', 'ilike', "%{$search}%")
                        ->orWhere('numero', 'ilike', "%{$search}%")
                        ->orWhere('documento_numero', 'ilike', "%{$search}%")
                        ->orWhere('tercero_nombre', 'ilike', "%{$search}%")
                        ->orWhere('tercero_numero_documento', 'ilike', "%{$search}%")
                        ->orWhere('modulo_origen', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('fecha', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        $asientos->getCollection()->transform(function ($asiento) {
            $asiento->total_debito = $asiento->lineas->sum('debito');
            $asiento->total_credito = $asiento->lineas->sum('credito');

            return $asiento;
        });

        return Inertia::render('Modules/Accounting/Asientos/Index', [
            'asientos' => $asientos,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        $cuentas = CuentaContable::where('acepta_movimientos', true)
            ->orderBy('codigo')
            ->get(['id', 'codigo', 'nombre', 'requiere_tercero', 'requiere_centro_costo']);

        $centrosCosto = CentroCosto::orderBy('codigo')->get(['id', 'codigo', 'nombre']);

        return Inertia::render('Modules/Accounting/Asientos/Create', [
            'cuentas' => $cuentas,
            'centrosCosto' => $centrosCosto,
        ]);
    }

    public function store(Request $request, ContabilidadService $service)
    {
        $tenantId = tenantId();

        $validated = $request->validate([
            'fecha' => 'required|date',
            'concepto' => 'required|string|max:255',
            'documento_tipo' => 'nullable|string|max:50',
            'documento_prefijo' => 'nullable|string|max:10',
            'documento_numero' => 'nullable|string|max:50',
            'tercero_tipo_documento' => 'nullable|string|max:10',
            'tercero_numero_documento' => 'nullable|string|max:30',
            'tercero_nombre' => 'nullable|string|max:180',
            'referencia_id' => 'nullable|string',
            'referencia_type' => 'nullable|string',
            'lineas' => 'required|array|min:2|max:100',
            'lineas.*.cuenta_contable_id' => [
                'required',
                Rule::exists('cuentas_contables', 'id')->where('tenant_id', $tenantId),
            ],
            'lineas.*.centro_costo_id' => [
                'nullable',
                Rule::exists('centros_costo', 'id')->where('tenant_id', $tenantId),
            ],
            'lineas.*.tercero_tipo_documento' => 'nullable|string|max:10',
            'lineas.*.tercero_numero_documento' => 'nullable|string|max:30',
            'lineas.*.tercero_nombre' => 'nullable|string|max:180',
            'lineas.*.debito' => 'required|numeric|min:0',
            'lineas.*.credito' => 'required|numeric|min:0',
            'lineas.*.base_gravable' => 'nullable|numeric|min:0',
            'lineas.*.impuesto_tipo' => 'nullable|in:iva,retefuente,reteica,reteiva,ica,autorretencion',
            'lineas.*.impuesto_tarifa' => 'nullable|numeric|min:0',
            'lineas.*.descripcion' => 'nullable|string',
        ]);

        try {
            $service->registrarAsiento([
                'fecha' => $validated['fecha'],
                'concepto' => $validated['concepto'],
                'modulo_origen' => 'accounting_manual',
                'documento_tipo' => $validated['documento_tipo'] ?? null,
                'documento_prefijo' => $validated['documento_prefijo'] ?? null,
                'documento_numero' => $validated['documento_numero'] ?? null,
                'tercero_tipo_documento' => $validated['tercero_tipo_documento'] ?? null,
                'tercero_numero_documento' => $validated['tercero_numero_documento'] ?? null,
                'tercero_nombre' => $validated['tercero_nombre'] ?? null,
                'referencia_id' => $validated['referencia_id'] ?? null,
                'referencia_type' => $validated['referencia_type'] ?? null,
                'registrado_por' => auth()->id(),
            ], $validated['lineas']);

            return redirect()->route('accounting.asientos.index')->with('success', 'Asiento contable registrado correctamente.');
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Error de BD al registrar asiento', [
                'error' => $e->getMessage(),
                'sqlstate' => $e->getCode(),
                'trace' => $e->getTraceAsString(),
            ]);
            $mensaje = str_starts_with((string) $e->getCode(), '23')
                ? 'Error de integridad de datos. Verifique que no haya duplicados o conflictos.'
                : 'Error al guardar el asiento. Verifique que los datos sean correctos e intente nuevamente.';
            return back()->with('error', $mensaje);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
