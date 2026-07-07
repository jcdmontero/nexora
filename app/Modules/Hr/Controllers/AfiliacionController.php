<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\Afiliacion;
use App\Modules\Hr\Models\Empleado;
use App\Modules\Hr\Models\EntidadParafiscal;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AfiliacionController extends Controller
{
    private static array $mapTipoEntidad = [
        'EPS' => 'Salud',
        'AFP' => 'Pensión',
        'ARL' => 'ARL',
        'CCF' => 'Caja de Compensación',
    ];

    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $search = $request->input('search');

        $afiliaciones = Afiliacion::with(['empleado', 'entidad'])
            ->whereHas('empleado', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->whereHas('entidad', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('empleado', function ($qe) use ($search) {
                        $qe->where('nombres', 'ilike', "%{$search}%")
                           ->orWhere('apellidos', 'ilike', "%{$search}%")
                           ->orWhere('documento', 'ilike', "%{$search}%");
                    })->orWhereHas('entidad', function ($qe) use ($search) {
                        $qe->where('nombre', 'ilike', "%{$search}%");
                    });
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $entidades = EntidadParafiscal::where('tenant_id', $tenantId)
            ->where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'tipo_entidad']);

        $empleados = Empleado::where('tenant_id', $tenantId)
            ->where('estado', true)
            ->orderBy('nombres')
            ->get(['id', 'nombres', 'apellidos', 'documento']);

        return Inertia::render('Hr/Afiliaciones/Index', [
            'afiliaciones' => $afiliaciones,
            'entidades' => $entidades,
            'empleados' => $empleados,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'empleado_id' => ['required', 'exists:hr_empleados,id'],
            'entidad_id' => ['required', 'exists:hr_entidades_parafiscales,id'],
            'tipo_afiliacion' => 'nullable|string|max:100',
            'fecha_afiliacion' => 'required|date',
            'numero_identificacion' => 'nullable|string|max:100',
            'activo' => 'boolean',
        ]);

        // Verificar que empleado y entidad pertenecen al tenant
        $empleado = Empleado::findOrFail($data['empleado_id']);
        if ($empleado->tenant_id !== $tenantId) {
            abort(403);
        }

        $entidad = EntidadParafiscal::findOrFail($data['entidad_id']);
        if ($entidad->tenant_id !== $tenantId) {
            abort(403);
        }

        // Derivar tipo_afiliacion desde la entidad si no se envió
        if (empty($data['tipo_afiliacion'])) {
            $data['tipo_afiliacion'] = self::$mapTipoEntidad[$entidad->tipo_entidad] ?? $entidad->tipo_entidad;
        }

        DB::transaction(function () use ($data) {
            $isActive = $data['activo'] ?? true;

            if ($isActive) {
                // Desactivar otras afiliaciones del mismo tipo para este empleado
                Afiliacion::where('empleado_id', $data['empleado_id'])
                    ->where('tipo_afiliacion', $data['tipo_afiliacion'])
                    ->update(['activo' => false]);
            }

            // Buscar si ya existe una afiliación para este empleado + entidad + tipo
            $existing = Afiliacion::where('empleado_id', $data['empleado_id'])
                ->where('entidad_id', $data['entidad_id'])
                ->where('tipo_afiliacion', $data['tipo_afiliacion'])
                ->first();

            if ($existing) {
                $existing->update([
                    'fecha_afiliacion' => $data['fecha_afiliacion'],
                    'numero_identificacion' => $data['numero_identificacion'] ?? null,
                    'activo' => $isActive,
                ]);
            } else {
                Afiliacion::create([
                    'empleado_id' => $data['empleado_id'],
                    'entidad_id' => $data['entidad_id'],
                    'tipo_afiliacion' => $data['tipo_afiliacion'],
                    'fecha_afiliacion' => $data['fecha_afiliacion'],
                    'numero_identificacion' => $data['numero_identificacion'] ?? null,
                    'activo' => $isActive,
                ]);
            }
        });

        return back()->with('success', 'Afiliación registrada exitosamente.');
    }
}
