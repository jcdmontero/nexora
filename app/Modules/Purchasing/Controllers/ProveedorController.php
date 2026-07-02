<?php
namespace App\Modules\Purchasing\Controllers;

use App\Modules\Purchasing\Models\Proveedor;
use App\Modules\Purchasing\Services\PurchasingService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class ProveedorController extends Controller
{
    public function __construct(
        private PurchasingService $purchasingService = new PurchasingService(),
    ) {}
    public function index()
    {
        return Inertia::render('Purchasing/Proveedores/Index', [
            'proveedores' => Inertia::defer(fn () => Proveedor::orderBy('razon_social', 'asc')
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'documento' => $p->documento,
                    'razon_social' => $p->razon_social,
                    'nombre_contacto' => $p->nombre_contacto,
                    'email' => $p->email,
                    'telefono' => $p->telefono,
                    'ciudad' => $p->ciudad,
                    'activo' => $p->activo,
                ])),
        ]);
    }

    public function create()
    {
        return Inertia::render('Purchasing/Proveedores/Create');
    }

    public function store(Request $request)
    {
        Proveedor::create($this->validateData($request));

        return redirect()->route('purchasing.proveedores.index')
            ->with('success', 'Proveedor creado correctamente.');
    }

    public function edit(Proveedor $proveedore)
    {
        return Inertia::render('Purchasing/Proveedores/Edit', [
            'proveedor' => $proveedore->only([
                'id', 'tipo_documento', 'numero_documento', 'razon_social',
                'nombre_contacto', 'email', 'telefono', 'direccion', 'ciudad', 'notas', 'activo'
            ]),
        ]);
    }

    public function update(Request $request, Proveedor $proveedore)
    {
        $proveedore->update($this->validateData($request, $proveedore->id));

        return redirect()->route('purchasing.proveedores.index')
            ->with('success', 'Proveedor actualizado correctamente.');
    }

    public function destroy(Proveedor $proveedore)
    {
        $check = $this->purchasingService->canDeleteProveedor($proveedore);

        if (!$check['can_delete']) {
            return back()->with('error', 'No se puede eliminar el proveedor: ' . $check['reason']);
        }

        $proveedore->delete();

        return redirect()->route('purchasing.proveedores.index')
            ->with('success', 'Proveedor eliminado.');
    }

    private function validateData(Request $request, $ignoreId = null): array
    {
        return $request->validate([
            'regimen_tributario' => ['nullable', 'in:simplificado,comun'],
            'porcentaje_retencion_fuente' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'porcentaje_retencion_iva' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'porcentaje_retencion_ica' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tipo_documento' => ['nullable', 'string', 'max:20'],
            'numero_documento' => ['nullable', 'string', 'max:40'],
            'razon_social' => ['required', 'string', 'max:200'],
            'nombre_contacto' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'ciudad' => ['nullable', 'string', 'max:120'],
            'notas' => ['nullable', 'string'],
            'activo' => ['boolean'],
        ]);
    }
}
