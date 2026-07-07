<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\Cargo;
use App\Modules\Hr\Models\Contrato;
use App\Modules\Hr\Models\Empleado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContratoController extends Controller
{
    public function store(Request $request, Empleado $empleado)
    {
        if ($empleado->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'cargo_id' => ['required', 'exists:hr_cargos,id'],
            'tipo_contrato' => 'required|string|max:100',
            'salario_base' => 'required|numeric|min:0',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
        ]);

        // Validar que el cargo pertenece al tenant
        $cargo = Cargo::where('id', $data['cargo_id'])
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$cargo) {
            return back()->with('error', 'El cargo seleccionado no pertenece a tu empresa.');
        }

        DB::transaction(function () use ($empleado, $data, $cargo) {
            // Finalizar contratos activos previos
            Contrato::where('empleado_id', $empleado->id)
                ->where('estado', true)
                ->update(['estado' => false, 'fecha_fin' => now()]);

            Contrato::create([
                'empleado_id' => $empleado->id,
                'cargo_id' => $data['cargo_id'],
                'cargo' => $cargo->nombre,
                'tipo_contrato' => $data['tipo_contrato'],
                'salario_base' => $data['salario_base'],
                'fecha_inicio' => $data['fecha_inicio'],
                'fecha_fin' => $data['fecha_fin'] ?? null,
                'estado' => true,
            ]);

            // Asegurar que el empleado esté activo
            $empleado->update(['estado' => true]);
        });

        return back()->with('success', 'Contrato agregado y activado.');
    }

    public function update(Request $request, Contrato $contrato)
    {
        $empleado = $contrato->empleado;
        if ($empleado->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'cargo_id' => ['required', 'exists:hr_cargos,id'],
            'tipo_contrato' => 'required|string|max:100',
            'salario_base' => 'required|numeric|min:0',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'estado' => 'boolean',
        ]);

        // Validar que el cargo pertenece al tenant
        $cargo = Cargo::where('id', $data['cargo_id'])
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$cargo) {
            return back()->with('error', 'El cargo seleccionado no pertenece a tu empresa.');
        }

        $data['cargo'] = $cargo->nombre;
        $contrato->update($data);

        return back()->with('success', 'Contrato actualizado.');
    }
}
