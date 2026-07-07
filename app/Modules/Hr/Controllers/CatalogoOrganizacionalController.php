<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\Cargo;
use App\Modules\Hr\Models\Departamento;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CatalogoOrganizacionalController extends Controller
{
    public function index()
    {
        $tenantId = auth()->user()->tenant_id;

        $departamentos = Departamento::with(['cargos' => function ($q) {
            $q->orderBy('nombre');
        }])
            ->where('tenant_id', $tenantId)
            ->orderBy('nombre')
            ->get();

        return Inertia::render('Hr/Catalogos/Organigrama', [
            'departamentos' => $departamentos,
        ]);
    }

    // ─── Departamentos ───

    public function storeDepartamento(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:100', Rule::unique('hr_departamentos', 'nombre')->where('tenant_id', $tenantId)],
            'descripcion' => 'nullable|string|max:255',
        ]);

        Departamento::create([
            'tenant_id' => $tenantId,
            'nombre' => $data['nombre'],
            'descripcion' => $data['descripcion'] ?? null,
            'activo' => true,
        ]);

        return back()->with('success', 'Departamento creado.');
    }

    public function updateDepartamento(Request $request, Departamento $departamento)
    {
        if ($departamento->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:100', Rule::unique('hr_departamentos', 'nombre')
                ->where('tenant_id', $departamento->tenant_id)->ignore($departamento->id)],
            'descripcion' => 'nullable|string|max:255',
            'activo' => 'boolean',
        ]);

        $departamento->update($data);

        return back()->with('success', 'Departamento actualizado.');
    }

    public function destroyDepartamento(Departamento $departamento)
    {
        if ($departamento->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        if ($departamento->cargos()->count() > 0) {
            return back()->with('error', 'No se puede eliminar: hay cargos asociados a este departamento.');
        }

        $departamento->delete();

        return back()->with('success', 'Departamento eliminado.');
    }

    // ─── Cargos ───

    public function storeCargo(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'departamento_id' => ['required', 'exists:hr_departamentos,id'],
            'nombre' => ['required', 'string', 'max:100', Rule::unique('hr_cargos', 'nombre')->where('tenant_id', $tenantId)],
            'categoria_laboral' => 'required|string|in:Administrativo,Operativo,Comercial',
            'salario_base_sugerido' => 'nullable|numeric|min:0',
            'es_productivo' => 'boolean',
        ]);

        // Validar que el departamento pertenece al tenant
        $depto = Departamento::where('id', $data['departamento_id'])
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$depto) {
            return back()->with('error', 'El departamento seleccionado no pertenece a tu empresa.');
        }

        Cargo::create([
            'tenant_id' => $tenantId,
            'departamento_id' => $data['departamento_id'],
            'nombre' => $data['nombre'],
            'categoria_laboral' => $data['categoria_laboral'],
            'salario_base_sugerido' => $data['salario_base_sugerido'] ?? null,
            'es_productivo' => $data['es_productivo'] ?? false,
            'activo' => true,
        ]);

        return back()->with('success', 'Cargo creado.');
    }

    public function updateCargo(Request $request, Cargo $cargo)
    {
        if ($cargo->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'departamento_id' => ['required', 'exists:hr_departamentos,id'],
            'nombre' => ['required', 'string', 'max:100', Rule::unique('hr_cargos', 'nombre')
                ->where('tenant_id', $cargo->tenant_id)->ignore($cargo->id)],
            'categoria_laboral' => 'required|string|in:Administrativo,Operativo,Comercial',
            'salario_base_sugerido' => 'nullable|numeric|min:0',
            'es_productivo' => 'boolean',
            'activo' => 'boolean',
        ]);

        // Validar que el departamento pertenece al tenant
        $depto = Departamento::where('id', $data['departamento_id'])
            ->where('tenant_id', $cargo->tenant_id)
            ->first();

        if (!$depto) {
            return back()->with('error', 'El departamento seleccionado no pertenece a tu empresa.');
        }

        $cargo->update($data);

        return back()->with('success', 'Cargo actualizado.');
    }

    public function destroyCargo(Cargo $cargo)
    {
        if ($cargo->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        if ($cargo->contratos()->count() > 0) {
            return back()->with('error', 'No se puede eliminar: hay contratos asociados a este cargo.');
        }

        $cargo->delete();

        return back()->with('success', 'Cargo eliminado.');
    }
}
