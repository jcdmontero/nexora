<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\Empleado;
use App\Modules\Hr\Models\Incapacidad;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class IncapacidadController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $search = $request->input('search');
        $tipo = $request->input('tipo');

        $incapacidades = Incapacidad::with('empleado')
            ->whereHas('empleado', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->when($search, function ($query, $search) {
                $query->whereHas('empleado', function ($q) use ($search) {
                    $q->where('nombres', 'ilike', "%{$search}%")
                      ->orWhere('apellidos', 'ilike', "%{$search}%")
                      ->orWhere('documento', 'ilike', "%{$search}%");
                });
            })
            ->when($tipo, function ($query, $tipo) {
                $query->where('tipo', $tipo);
            })
            ->orderBy('fecha_inicio', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Hr/Incapacidades/Index', [
            'incapacidades' => $incapacidades,
            'filters' => $request->only(['search', 'tipo']),
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'empleado_id' => ['required', 'exists:hr_empleados,id'],
            'tipo' => ['required', 'string', 'max:100', Rule::in(['Enfermedad General', 'Accidente Laboral', 'Enfermedad Laboral', 'Licencia Maternidad', 'Licencia Paternidad', 'Otro'])],
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
            'diagnostico' => 'nullable|string|max:500',
            'porcentaje_pago' => 'nullable|numeric|min:0|max:100',
            'documento_soporte' => 'nullable|string|max:255',
        ]);

        // Verificar que el empleado pertenece al tenant
        $empleado = Empleado::findOrFail($data['empleado_id']);
        if ($empleado->tenant_id !== $tenantId) {
            abort(403);
        }

        // Calcular días automáticamente
        $fechaInicio = \Carbon\Carbon::parse($data['fecha_inicio']);
        $fechaFin = \Carbon\Carbon::parse($data['fecha_fin']);
        $dias = $fechaInicio->diffInDays($fechaFin) + 1;

        Incapacidad::create([
            'empleado_id' => $data['empleado_id'],
            'tipo' => $data['tipo'],
            'fecha_inicio' => $data['fecha_inicio'],
            'fecha_fin' => $data['fecha_fin'],
            'dias' => $dias,
            'diagnostico' => $data['diagnostico'] ?? null,
            'porcentaje_pago' => $data['porcentaje_pago'] ?? null,
            'documento_soporte' => $data['documento_soporte'] ?? null,
        ]);

        return back()->with('success', 'Incapacidad registrada exitosamente.');
    }

    public function update(Request $request, Incapacidad $incapacidad)
    {
        if ($incapacidad->empleado->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'tipo' => ['required', 'string', 'max:100', Rule::in(['Enfermedad General', 'Accidente Laboral', 'Enfermedad Laboral', 'Licencia Maternidad', 'Licencia Paternidad', 'Otro'])],
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
            'diagnostico' => 'nullable|string|max:500',
            'porcentaje_pago' => 'nullable|numeric|min:0|max:100',
            'documento_soporte' => 'nullable|string|max:255',
        ]);

        // Recalcular días
        $fechaInicio = \Carbon\Carbon::parse($data['fecha_inicio']);
        $fechaFin = \Carbon\Carbon::parse($data['fecha_fin']);
        $data['dias'] = $fechaInicio->diffInDays($fechaFin) + 1;

        $incapacidad->update($data);

        return back()->with('success', 'Incapacidad actualizada.');
    }

    public function destroy(Incapacidad $incapacidad)
    {
        if ($incapacidad->empleado->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $incapacidad->delete();

        return back()->with('success', 'Incapacidad eliminada.');
    }
}
