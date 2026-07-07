<?php
namespace App\Modules\Inventory\Controllers;

use App\Modules\Inventory\Models\Bodega;
use App\Modules\Inventory\Models\Stock;
use App\Core\Models\Sede;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BodegaController extends Controller
{
    public function index()
    {
        return Inertia::render('Inventory/Bodegas/Index', [
            'bodegas' => Bodega::with('sede:id,nombre')->orderBy('nombre')->get()
        ]);
    }

    public function create()
    {
        $tenantId = auth()->user()->tenant_id;
        return Inertia::render('Inventory/Bodegas/Create', [
            'sedes' => Sede::where('tenant_id', $tenantId)->where('activo', true)->get(['id', 'nombre'])
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'sede_id' => ['required', Rule::exists('core_sedes', 'id')->where('tenant_id', $tenantId)],
            'nombre' => ['required', 'string', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'es_principal' => ['boolean'],
            'activo' => ['boolean'],
        ]);

        // A-04: Transacción + lock para evitar race condition en bodega principal
        DB::transaction(function () use ($data, $tenantId) {
            if (!empty($data['es_principal'])) {
                Bodega::where('tenant_id', $tenantId)
                    ->where('es_principal', true)
                    ->lockForUpdate()
                    ->update(['es_principal' => false]);
            }

            Bodega::create($data + ['tenant_id' => $tenantId]);
        });

        return redirect()->route('inventory.bodegas.index')
            ->with('success', 'Bodega creada correctamente.');
    }

    public function edit(Bodega $bodega)
    {
        $tenantId = auth()->user()->tenant_id;
        return Inertia::render('Inventory/Bodegas/Edit', [
            'bodega' => $bodega,
            'sedes' => Sede::where('tenant_id', $tenantId)->where('activo', true)->get(['id', 'nombre'])
        ]);
    }

    public function update(Request $request, Bodega $bodega)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'sede_id' => ['required', Rule::exists('core_sedes', 'id')->where('tenant_id', $tenantId)],
            'nombre' => ['required', 'string', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'es_principal' => ['boolean'],
            'activo' => ['boolean'],
        ]);

        DB::transaction(function () use ($data, $bodega, $tenantId) {
            if (!empty($data['es_principal'])) {
                Bodega::where('tenant_id', $tenantId)
                    ->where('id', '!=', $bodega->id)
                    ->where('es_principal', true)
                    ->lockForUpdate()
                    ->update(['es_principal' => false]);
            }

            $bodega->update($data);
        });

        return redirect()->route('inventory.bodegas.index')
            ->with('success', 'Bodega actualizada correctamente.');
    }

    public function destroy(Bodega $bodega)
    {
        if ($bodega->es_principal) {
            return back()->with('error', 'No puedes eliminar la bodega principal.');
        }

        // Fix #13: Verificar stock antes de eliminar
        $tieneStock = Stock::where('bodega_id', $bodega->id)
            ->where('cantidad', '>', 0)
            ->exists();

        if ($tieneStock) {
            return back()->with('error', 'No puedes eliminar una bodega que tiene stock positivo.');
        }

        $bodega->delete();

        return back()->with('success', 'Bodega eliminada.');
    }
}
