<?php

namespace App\Modules\Crm\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Crm\Models\Oportunidad;
use App\Modules\Crm\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OportunidadController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $oportunidades = Oportunidad::query()
            ->with('cliente')
            ->when($search, function ($query, $search) {
                $cleanSearch = addcslashes($search, '%_\\');
                $operator = \Illuminate\Support\Facades\DB::connection()->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';
                
                $query->where(function ($q) use ($cleanSearch, $operator) {
                    $q->where('titulo', $operator, "%{$cleanSearch}%")
                      ->orWhereHas('cliente', function ($c) use ($cleanSearch, $operator) {
                          $c->where('nombres', $operator, "%{$cleanSearch}%")
                            ->orWhere('apellidos', $operator, "%{$cleanSearch}%")
                            ->orWhere('razon_social', $operator, "%{$cleanSearch}%");
                      });
                });
            })
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Crm/Oportunidades/Index', [
            'oportunidades' => $oportunidades,
            'clientes' => Cliente::select('id', 'nombres', 'apellidos', 'razon_social')
                ->where('activo', true)
                ->orderBy('id', 'desc')
                ->take(50)
                ->get(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cliente_id' => [
                'required',
                Rule::exists('crm_clientes', 'id')->where('tenant_id', app('current_tenant')->id),
            ],
            'titulo' => 'required|string|max:150',
            'valor_estimado' => 'required|numeric|min:0',
            'etapa' => 'required|in:prospecto,calificado,propuesta,negociacion,ganado,perdido',
            'fecha_cierre_esperada' => 'nullable|date',
            'probabilidad' => 'required|integer|min:0|max:100',
            'notas' => 'nullable|string',
        ]);

        Oportunidad::create($validated);

        return redirect()->route('crm.oportunidades.index')
            ->with('success', 'Oportunidad creada exitosamente.');
    }

    public function update(Request $request, Oportunidad $oportunidad)
    {
        $validated = $request->validate([
            'titulo' => 'required|string|max:150',
            'valor_estimado' => 'required|numeric|min:0',
            'etapa' => 'required|in:prospecto,calificado,propuesta,negociacion,ganado,perdido',
            'fecha_cierre_esperada' => 'nullable|date',
            'probabilidad' => 'required|integer|min:0|max:100',
            'notas' => 'nullable|string',
        ]);

        $oportunidad->update($validated);

        return redirect()->route('crm.oportunidades.index')
            ->with('success', 'Oportunidad actualizada.');
    }

    public function updateEtapa(Request $request, Oportunidad $oportunidad)
    {
        $validated = $request->validate([
            'etapa' => 'required|in:prospecto,calificado,propuesta,negociacion,ganado,perdido',
        ]);

        $oportunidad->update($validated);

        return back()->with('success', 'Etapa actualizada.');
    }

    public function destroy(Oportunidad $oportunidad)
    {
        $oportunidad->delete();

        return back()->with('success', 'Oportunidad eliminada.');
    }
}
