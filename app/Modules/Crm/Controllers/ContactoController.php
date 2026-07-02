<?php

namespace App\Modules\Crm\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Crm\Models\Contacto;
use Illuminate\Http\Request;

class ContactoController extends Controller
{
    public function store(Request $request, Cliente $cliente)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:150',
            'cargo' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:150',
            'telefono' => 'nullable|string|max:50',
            'is_principal' => 'boolean',
        ]);

        if (!empty($validated['is_principal'])) {
            // Desmarcar otros contactos como principales
            $cliente->contactos()->update(['is_principal' => false]);
        }

        $cliente->contactos()->create($validated);

        return back()->with('success', 'Contacto agregado exitosamente.');
    }

    public function update(Request $request, Contacto $contacto)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:150',
            'cargo' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:150',
            'telefono' => 'nullable|string|max:50',
            'is_principal' => 'boolean',
        ]);

        if (!empty($validated['is_principal'])) {
            // Desmarcar otros
            $contacto->cliente->contactos()->where('id', '!=', $contacto->id)->update(['is_principal' => false]);
        }

        $contacto->update($validated);

        return back()->with('success', 'Contacto actualizado.');
    }

    public function destroy(Contacto $contacto)
    {
        $contacto->delete();

        return back()->with('success', 'Contacto eliminado.');
    }
}
