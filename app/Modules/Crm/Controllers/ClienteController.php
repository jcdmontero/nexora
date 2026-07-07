<?php
namespace App\Modules\Crm\Controllers;

use App\Modules\Crm\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ClienteController extends \App\Http\Controllers\Controller
{
    protected $clienteService;

    public function __construct(\App\Modules\Crm\Services\ClienteService $clienteService)
    {
        $this->clienteService = $clienteService;
    }

    public function index()
    {
        return Inertia::render('Crm/Clientes/Index', [
            'clientes' => Inertia::defer(fn () => Cliente::withCount('oportunidades')
                ->orderBy('created_at', 'desc')
                ->paginate(15)
                ->through(fn ($c) => [
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
        $this->clienteService->crearCliente($data);

        return redirect()->route('crm.clientes.index')
            ->with('success', 'Cliente creado correctamente.');
    }

    public function show(Cliente $cliente)
    {
        $cliente->load(['contactos']);

        $oportunidades = $cliente->oportunidades()
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Crm/Clientes/Show', [
            'cliente' => array_merge($cliente->toArray(), [
                'nombre_completo' => $cliente->nombre_completo,
                'documento' => $cliente->documento,
            ]),
            'oportunidades' => $oportunidades,
        ]);
    }

    public function edit(Cliente $cliente)
    {
        return Inertia::render('Crm/Clientes/Edit', [
            'cliente' => $cliente->only([
                'id', 'tipo', 'tipo_documento', 'numero_documento', 'nombres', 'apellidos',
                'razon_social', 'nit', 'nombre_contacto', 'telefono_contacto', 'cargo_contacto',
                'email', 'telefono', 'direccion', 'ciudad', 'notas', 'activo', 'portal_active',
                'regimen_tributario', 'porcentaje_retencion_fuente', 'porcentaje_retencion_iva',
                'porcentaje_retencion_ica',
            ]),
        ]);
    }

    public function update(Request $request, Cliente $cliente)
    {
        $data = $this->validateData($request);
        $this->clienteService->actualizarCliente($cliente, $data);

        return redirect()->route('crm.clientes.index')
            ->with('success', 'Cliente actualizado.');
    }

    public function destroy(Cliente $cliente)
    {
        try {
            $this->clienteService->eliminarCliente($cliente);
            return redirect()->route('crm.clientes.index')
                ->with('success', 'Cliente eliminado.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    private function validateData(Request $request): array
    {
        $tenantId = app('current_tenant')->id;
        $clienteId = $request->route('cliente')?->id;

        return $request->validate([
            'tipo' => ['required', 'in:natural,juridico'],
            'regimen_tributario' => ['nullable', 'in:simplificado,comun'],
            'porcentaje_retencion_fuente' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'porcentaje_retencion_iva' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'porcentaje_retencion_ica' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tipo_documento' => ['nullable', 'string', 'max:20'],
            'numero_documento' => [
                'nullable', 'string', 'max:40',
                Rule::unique('crm_clientes', 'numero_documento')
                    ->where('tenant_id', $tenantId)
                    ->ignore($clienteId),
            ],
            'nombres' => ['required_if:tipo,natural', 'nullable', 'string', 'max:120'],
            'apellidos' => ['nullable', 'string', 'max:120'],
            'razon_social' => ['required_if:tipo,juridico', 'nullable', 'string', 'max:200'],
            'nit' => [
                'nullable', 'string', 'max:40',
                Rule::unique('crm_clientes', 'nit')
                    ->where('tenant_id', $tenantId)
                    ->ignore($clienteId),
            ],
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
