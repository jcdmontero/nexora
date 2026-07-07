<?php

namespace App\Modules\Accounting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\CuentaContable;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CuentaController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $cuentas = CuentaContable::query()
            // M-01: 'ilike' (PostgreSQL) para texto case-insensitive, 'like' para códigos case-sensitive
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
            'codigo' => [
                'required', 'string', 'max:20',
                Rule::unique('cuentas_contables', 'codigo')->where('tenant_id', tenantId())
            ],
            'nombre' => 'required|string|max:100',
            'tipo' => 'required|in:activo,pasivo,patrimonio,ingreso,gasto,costo',
            'naturaleza' => 'required|in:debito,credito',
            'nivel' => 'required|integer|min:1|max:6',
            'clase' => 'nullable|string|max:1',
            'acepta_movimientos' => 'boolean',
            'requiere_tercero' => 'boolean',
            'requiere_centro_costo' => 'boolean',
            'parent_id' => [
                'nullable',
                Rule::exists('cuentas_contables', 'id')->where('tenant_id', tenantId()),
            ],
            'descripcion' => 'nullable|string',
        ]);

        // ACC-009: Validar que parent_id no cree ciclo jerárquico
        if (!empty($validated['parent_id'])) {
            $ancestorIds = $this->getAncestorIds($validated['parent_id']);
            if (in_array(0, $ancestorIds)) {
                return back()->with('error', 'No se puede asignar esta cuenta como padre porque crearía un ciclo jerárquico.');
            }
        }

        CuentaContable::create($validated);

        return redirect()->route('accounting.cuentas.index')->with('success', 'Cuenta contable creada correctamente.');
    }

    public function update(Request $request, CuentaContable $cuenta)
    {
        if ($cuenta->tenant_id !== tenantId()) abort(403);

        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'tipo' => 'required|in:activo,pasivo,patrimonio,ingreso,gasto,costo',
            'naturaleza' => 'required|in:debito,credito',
            'nivel' => 'required|integer|min:1|max:6',
            'clase' => 'nullable|string|max:1',
            'acepta_movimientos' => 'boolean',
            'requiere_tercero' => 'boolean',
            'requiere_centro_costo' => 'boolean',
            'parent_id' => [
                'nullable',
                Rule::exists('cuentas_contables', 'id')->where('tenant_id', tenantId()),
            ],
            'descripcion' => 'nullable|string',
        ]);

        // ACC-009: Validar que parent_id no cree ciclo jerárquico
        if (!empty($validated['parent_id'])) {
            $ancestorIds = $this->getAncestorIds($validated['parent_id'], $cuenta->id);
            if (in_array($cuenta->id, $ancestorIds)) {
                return back()->with('error', 'No se puede asignar esta cuenta como padre porque crearía un ciclo jerárquico.');
            }
        }

        $cuenta->update($validated);

        return back()->with('success', 'Cuenta contable actualizada correctamente.');
    }

    public function destroy(CuentaContable $cuenta)
    {
        if ($cuenta->tenant_id !== tenantId()) abort(403);

        if ($cuenta->children()->exists()) {
            return back()->with('error', 'No se puede eliminar una cuenta que tiene cuentas hijas. Elimine primero las subcuentas.');
        }

        if ($cuenta->lineas()->exists()) {
            return back()->with('error', 'No se puede eliminar una cuenta que tiene movimientos contables registrados.');
        }

        $cuenta->delete();

        return back()->with('success', 'Cuenta contable eliminada correctamente.');
    }

    /**
     * ACC-009: Obtiene todos los IDs de ancestros de una cuenta (recursivo).
     * Retorna [0] si detecta un ciclo.
     */
    private function getAncestorIds(int $parentId, ?int $excludeId = null): array
    {
        $ancestors = [];
        $currentId = $parentId;
        $maxDepth = 10;

        for ($i = 0; $i < $maxDepth; $i++) {
            $cuenta = CuentaContable::where('id', $currentId)
                ->where('tenant_id', tenantId())
                ->select('id', 'parent_id')
                ->first();

            if (!$cuenta || !$cuenta->parent_id) {
                break;
            }

            if ($cuenta->parent_id === $excludeId) {
                return [0];
            }

            $ancestors[] = $cuenta->parent_id;
            $currentId = $cuenta->parent_id;
        }

        return $ancestors;
    }
}
