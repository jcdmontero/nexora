<?php

namespace App\Core\Http\Controllers\Core;

use App\Core\Models\Sede;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SedeController extends Controller
{
    public function index()
    {
        return Inertia::render('Sedes/Index', [
            'sedes' => Sede::orderBy('nombre')->get()
        ]);
    }

    public function create()
    {
        return Inertia::render('Sedes/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'es_principal' => ['boolean'],
            'activo' => ['boolean'],
        ]);

        $data['tenant_id'] = app('current_tenant')->id;

        if (!empty($data['es_principal'])) {
            Sede::where('tenant_id', $data['tenant_id'])
                ->where('es_principal', true)
                ->update(['es_principal' => false]);
        }

        Sede::create($data);

        return redirect()->route('core.sedes.index')
            ->with('success', 'Sede creada correctamente.');
    }

    public function edit(Sede $sede)
    {
        return Inertia::render('Sedes/Edit', [
            'sede' => $sede,
        ]);
    }

    public function update(Request $request, Sede $sede)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'es_principal' => ['boolean'],
            'activo' => ['boolean'],
        ]);

        if (!empty($data['es_principal'])) {
            Sede::where('tenant_id', $sede->tenant_id)
                ->where('id', '!=', $sede->id)
                ->where('es_principal', true)
                ->update(['es_principal' => false]);
        }

        $sede->update($data);

        return redirect()->route('core.sedes.index')
            ->with('success', 'Sede actualizada correctamente.');
    }

    public function destroy(Sede $sede)
    {
        if ($sede->es_principal) {
            return back()->with('error', 'No puedes eliminar la sede principal.');
        }

        $sede->delete();

        return back()->with('success', 'Sede eliminada.');
    }
}
