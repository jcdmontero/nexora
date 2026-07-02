<?php
namespace App\Modules\Crm\Controllers;

use App\Modules\Crm\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class ClienteController extends Controller
{
    public function index()
    {
        return Inertia::render('Crm/Clientes/Index', [
            'clientes' => Inertia::defer(fn () => Cliente::withCount('oportunidades')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'tipo' => $c->tipo,
                    'nombre' => $c->nombre_completo,
                    'documento' => $c->documento,
                    'email' => $c->email,
                    'telefono' => $c->telefono,
                    'ciudad' => $c->ciudad,
                    'activo' => $c->activo,
                    'oportunidades_count' => $c->oportunidades_count,
                ])),
        ]);
    }

    public function create()
    {
        return Inertia::render('Crm/Clientes/Create');
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        if (!empty($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        }
        Cliente::create($data);

        return redirect()->route('crm.clientes.index')
            ->with('success', 'Cliente creado correctamente.');
    }

    public function show(Cliente $cliente)
    {
        $cliente->load(['contactos', 'oportunidades' => function ($query) {
            $query->orderBy('created_at', 'desc');
        }]);

        return Inertia::render('Crm/Clientes/Show', [
            'cliente' => $cliente,
        ]);
    }

    public function edit(Cliente $cliente)
    {
        return Inertia::render('Crm/Clientes/Edit', [
            'cliente' => $cliente->only([
                'id', 'tipo', 'tipo_documento', 'numero_documento', 'nombres', 'apellidos',
                'razon_social', 'nit', 'nombre_contacto', 'telefono_contacto', 'cargo_contacto',
                'email', 'telefono', 'direccion', 'ciudad', 'notas', 'activo', 'portal_active',
            ]),
        ]);
    }

    public function update(Request $request, Cliente $cliente)
    {
        $data = $this->validateData($request);
        if (!empty($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        } else {
            unset($data['password']);
        }
        $cliente->update($data);

        return redirect()->route('crm.clientes.index')
            ->with('success', 'Cliente actualizado.');
    }

    public function destroy(Cliente $cliente)
    {
        if ($cliente->oportunidades()->count() > 0) {
            return back()->with('error', 'No se puede eliminar el cliente porque tiene oportunidades asociadas.');
        }

        $cliente->delete();

        return redirect()->route('crm.clientes.index')
            ->with('success', 'Cliente eliminado.');
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'tipo' => ['required', 'in:natural,juridico'],
            'regimen_tributario' => ['nullable', 'in:simplificado,comun'],
            'porcentaje_retencion_fuente' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'porcentaje_retencion_iva' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'porcentaje_retencion_ica' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tipo_documento' => ['nullable', 'string', 'max:20'],
            'numero_documento' => ['nullable', 'string', 'max:40'],
            'nombres' => ['required_if:tipo,natural', 'nullable', 'string', 'max:120'],
            'apellidos' => ['nullable', 'string', 'max:120'],
            'razon_social' => ['required_if:tipo,juridico', 'nullable', 'string', 'max:200'],
            'nit' => ['nullable', 'string', 'max:40'],
            'nombre_contacto' => ['nullable', 'string', 'max:120'],
            'telefono_contacto' => ['nullable', 'string', 'max:30'],
            'cargo_contacto' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'ciudad' => ['nullable', 'string', 'max:120'],
            'notas' => ['nullable', 'string'],
            'activo' => ['boolean'],
            'portal_active' => ['boolean'],
            'password' => ['nullable', 'string', 'min:6'],
        ]);
    }
}
