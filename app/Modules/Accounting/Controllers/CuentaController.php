<?php

namespace App\Modules\Accounting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\CuentaContable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CuentaController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $cuentas = CuentaContable::query()
            ->when($search, function ($query, $search) {
                $query->where('codigo', 'like', "%{$search}%")
                      ->orWhere('nombre', 'ilike', "%{$search}%");
            })
            ->orderBy('codigo')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Accounting/Cuentas/Index', [
            'cuentas' => $cuentas,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:20|unique:cuentas_contables,codigo,NULL,id,tenant_id,' . auth()->user()->tenant_id,
            'nombre' => 'required|string|max:100',
            'tipo' => 'required|in:activo,pasivo,patrimonio,ingreso,gasto,costo',
            'naturaleza' => 'required|in:debito,credito',
            'nivel' => 'required|integer|min:1|max:6',
            'clase' => 'nullable|string|max:1',
            'acepta_movimientos' => 'boolean',
            'requiere_tercero' => 'boolean',
            'requiere_centro_costo' => 'boolean',
            'descripcion' => 'nullable|string',
        ]);

        CuentaContable::create($validated);

        return redirect()->route('accounting.cuentas.index')->with('success', 'Cuenta contable creada correctamente.');
    }
}
