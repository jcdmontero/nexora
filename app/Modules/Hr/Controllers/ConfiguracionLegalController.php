<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\ConfiguracionLegal;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ConfiguracionLegalController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $year = $request->input('year');

        $configuraciones = ConfiguracionLegal::where('tenant_id', $tenantId)
            ->when($year, function ($query, $year) {
                $query->where('ano_vigencia', $year);
            })
            ->orderBy('ano_vigencia', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Hr/ConfiguracionLegal/Index', [
            'configuraciones' => $configuraciones,
            'filters' => $request->only(['year']),
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'ano_vigencia' => ['required', 'integer', 'min:2000', 'max:2100', Rule::unique('hr_configuracion_legal', 'ano_vigencia')->where('tenant_id', $tenantId)],
            'salario_minimo' => 'required|numeric|min:0',
            'auxilio_transporte' => 'required|numeric|min:0',
            'tope_auxilio_transporte_salarios' => 'nullable|numeric|min:0',
            'valor_uvt' => 'nullable|numeric|min:0',
            'aporte_salud_empleado' => 'nullable|numeric|min:0|max:100',
            'aporte_pension_empleado' => 'nullable|numeric|min:0|max:100',
            'aporte_salud_patronal' => 'nullable|numeric|min:0|max:100',
            'aporte_pension_patronal' => 'nullable|numeric|min:0|max:100',
            'caja_compensacion' => 'nullable|numeric|min:0|max:100',
            'sena' => 'nullable|numeric|min:0|max:100',
            'icbf' => 'nullable|numeric|min:0|max:100',
        ]);

        ConfiguracionLegal::create([
            'tenant_id' => $tenantId,
            'ano_vigencia' => $data['ano_vigencia'],
            'salario_minimo' => $data['salario_minimo'],
            'auxilio_transporte' => $data['auxilio_transporte'],
            'tope_auxilio_transporte_salarios' => $data['tope_auxilio_transporte_salarios'] ?? null,
            'valor_uvt' => $data['valor_uvt'] ?? null,
            'aporte_salud_empleado' => $data['aporte_salud_empleado'] ?? null,
            'aporte_pension_empleado' => $data['aporte_pension_empleado'] ?? null,
            'aporte_salud_patronal' => $data['aporte_salud_patronal'] ?? null,
            'aporte_pension_patronal' => $data['aporte_pension_patronal'] ?? null,
            'caja_compensacion' => $data['caja_compensacion'] ?? null,
            'sena' => $data['sena'] ?? null,
            'icbf' => $data['icbf'] ?? null,
        ]);

        return back()->with('success', 'Configuración legal creada.');
    }

    public function update(Request $request, $id)
    {
        $configuracionLegal = ConfiguracionLegal::findOrFail($id);

        if ($configuracionLegal->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'salario_minimo' => 'required|numeric|min:0',
            'auxilio_transporte' => 'required|numeric|min:0',
            'tope_auxilio_transporte_salarios' => 'nullable|numeric|min:0',
            'valor_uvt' => 'nullable|numeric|min:0',
            'aporte_salud_empleado' => 'nullable|numeric|min:0|max:100',
            'aporte_pension_empleado' => 'nullable|numeric|min:0|max:100',
            'aporte_salud_patronal' => 'nullable|numeric|min:0|max:100',
            'aporte_pension_patronal' => 'nullable|numeric|min:0|max:100',
            'caja_compensacion' => 'nullable|numeric|min:0|max:100',
            'sena' => 'nullable|numeric|min:0|max:100',
            'icbf' => 'nullable|numeric|min:0|max:100',
        ]);

        $configuracionLegal->update($data);

        return back()->with('success', 'Configuración legal actualizada.');
    }
}
