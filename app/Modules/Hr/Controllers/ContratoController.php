<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\Cargo;
use App\Modules\Hr\Models\Contrato;
use App\Modules\Hr\Models\Empleado;
use Illuminate\Http\Request;

class ContratoController extends Controller
{
    public function store(Request $request, Empleado $empleado)
    {
        if ($empleado->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'cargo_id' => 'required|exists:hr_cargos,id',
            'tipo_contrato' => 'required|string|max:100',
            'salario_base' => 'required|numeric|min:0',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
        ]);

        // Obtener nombre del cargo
        $cargo = Cargo::find($data['cargo_id']);
        $cargoNombre = $cargo ? $cargo->nombre : 'Sin cargo';

        // Si se crea uno nuevo como activo, finalizamos los anteriores
        Contrato::where('empleado_id', $empleado->id)
                ->where('estado', true)
                ->update(['estado' => false, 'fecha_fin' => now()]);

        Contrato::create([
            'empleado_id' => $empleado->id,
            'cargo_id' => $data['cargo_id'],
            'cargo' => $cargoNombre,
            'tipo_contrato' => $data['tipo_contrato'],
            'salario_base' => $data['salario_base'],
            'fecha_inicio' => $data['fecha_inicio'],
            'fecha_fin' => $data['fecha_fin'] ?? null,
            'estado' => true,
        ]);

        // Asegurar que el empleado esté activo
        $empleado->update(['estado' => true]);

        return back()->with('success', 'Contrato agregado y activado.');
    }

    public function update(Request $request, Contrato $contrato)
    {
        $empleado = $contrato->empleado;
        if ($empleado->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'cargo_id' => 'required|exists:hr_cargos,id',
            'tipo_contrato' => 'required|string|max:100',
            'salario_base' => 'required|numeric|min:0',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'estado' => 'boolean',
        ]);

        // Actualizar nombre denormalizado
        $cargo = Cargo::find($data['cargo_id']);
        $data['cargo'] = $cargo ? $cargo->nombre : 'Sin cargo';

        $contrato->update($data);

        return back()->with('success', 'Contrato actualizado.');
    }
}
