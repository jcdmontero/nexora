<?php

namespace App\Modules\Crm\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Crm\Models\Contacto;
use Illuminate\Http\Request;

class ContactoController extends Controller
{
    protected $contactoService;

    public function __construct(\App\Modules\Crm\Services\ContactoService $contactoService)
    {
        $this->contactoService = $contactoService;
    }

    public function store(Request $request, Cliente $cliente)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:150',
            'cargo' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:150',
            'telefono' => 'nullable|string|max:50',
            'is_principal' => 'boolean',
        ]);

        $this->contactoService->crearContacto($cliente, $validated);

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

        $this->contactoService->actualizarContacto($contacto, $validated);

        return back()->with('success', 'Contacto actualizado.');
    }

    public function destroy(Contacto $contacto)
    {
        $this->contactoService->eliminarContacto($contacto);

        return back()->with('success', 'Contacto eliminado.');
    }
}
