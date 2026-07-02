<?php

namespace App\Core\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Core\Services\ModuleActivator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Búsqueda global del tenant (Cmd+K).
 *
 * Contrato del JSON (consumido por resources/js/Components/GlobalSearch.tsx):
 *   [{ id, group, title, description, url }, ...]
 *
 * Seguridad:
 *  - El scoping por tenant lo aplica automáticamente el trait BelongsToTenant
 *    (global scope "tenant"); aquí NO se filtra manualmente.
 *  - Cada bloque se protege además por el permiso del módulo (Spatie) y por
 *    ModuleActivator::isActive() para no exponer resultados de módulos no
 *    contratados/activos ni de entidades que el usuario no pueda ver.
 */
class SearchController extends Controller
{
    public function __construct(private readonly ModuleActivator $activator)
    {
    }

    public function search(Request $request): JsonResponse
    {
        $query = trim((string) $request->input('q', ''));

        if (mb_strlen($query) < 2) {
            return response()->json([]);
        }

        $user = $request->user();
        $tenant = $user->tenant;
        $results = [];

        // ── Usuarios (Core) ──────────────────────────────────────────────
        if ($user->can('users:view')) {
            $usuarios = User::query()
                ->where(function ($q) use ($query) {
                    $q->where('name', 'ilike', "%{$query}%")
                        ->orWhere('email', 'ilike', "%{$query}%");
                })
                ->orderByDesc('updated_at')
                ->take(5)
                ->get();

            foreach ($usuarios as $u) {
                $results[] = [
                    'id' => "user_{$u->id}",
                    'group' => 'Usuarios',
                    'title' => $u->name,
                    'description' => $u->email,
                    'url' => route('core.users.index', ['search' => $u->email]),
                ];
            }
        }

        // ── Clientes (CRM) ───────────────────────────────────────────────
        if ($user->can('crm:view') && $this->activator->isActive($tenant, 'crm')) {
            if (class_exists(\App\Modules\Crm\Models\Cliente::class)) {
                $clientes = \App\Modules\Crm\Models\Cliente::query()
                    ->where(function ($q) use ($query) {
                        $q->where('nombres', 'ilike', "%{$query}%")
                            ->orWhere('apellidos', 'ilike', "%{$query}%")
                            ->orWhere('razon_social', 'ilike', "%{$query}%")
                            ->orWhere('numero_documento', 'ilike', "%{$query}%")
                            ->orWhere('nit', 'ilike', "%{$query}%");
                    })
                    ->orderByDesc('updated_at')
                    ->take(5)
                    ->get();

                foreach ($clientes as $c) {
                    $results[] = [
                        'id' => "cliente_{$c->id}",
                        'group' => 'Clientes',
                        'title' => $c->nombre_completo ?: trim("{$c->nombres} {$c->apellidos}") ?: ($c->razon_social ?: 'Cliente #' . $c->id),
                        'description' => $c->documento ?: 'Sin documento',
                        'url' => route('crm.clientes.show', $c->id),
                    ];
                }
            }
        }

        // ── Productos (Inventory) ────────────────────────────────────────
        if ($user->can('inventory:view') && $this->activator->isActive($tenant, 'inventory')) {
            if (class_exists(\App\Modules\Inventory\Models\Producto::class)) {
                $productos = \App\Modules\Inventory\Models\Producto::query()
                    ->where(function ($q) use ($query) {
                        $q->where('nombre', 'ilike', "%{$query}%")
                            ->orWhere('codigo', 'ilike', "%{$query}%")
                            ->orWhere('descripcion', 'ilike', "%{$query}%");
                    })
                    ->orderByDesc('updated_at')
                    ->take(5)
                    ->get();

                foreach ($productos as $p) {
                    $results[] = [
                        'id' => "producto_{$p->id}",
                        'group' => 'Productos',
                        'title' => $p->nombre,
                        'description' => trim("Código: {$p->codigo} · Stock: {$p->stock_actual}", " \t\n\r\0\x0B·"),
                        'url' => route('inventory.productos.index', ['search' => $p->codigo]),
                    ];
                }
            }
        }

        // ── Facturas (Sales) ─────────────────────────────────────────────
        if ($user->can('sales:view') && $this->activator->isActive($tenant, 'sales')) {
            if (class_exists(\App\Modules\Sales\Models\Factura::class)) {
                $facturas = \App\Modules\Sales\Models\Factura::query()
                    ->where(function ($q) use ($query) {
                        $q->where('numero', 'ilike', "%{$query}%")
                            ->orWhere('estado', 'ilike', "%{$query}%");
                    })
                    ->orderByDesc('updated_at')
                    ->take(5)
                    ->get();

                foreach ($facturas as $f) {
                    $total = isset($f->total) ? '$ ' . number_format((float) $f->total, 0, ',', '.') : '—';
                    $results[] = [
                        'id' => "factura_{$f->id}",
                        'group' => 'Facturas',
                        'title' => "Factura {$f->numero}",
                        'description' => "Total: {$total} · Estado: {$f->estado}",
                        'url' => route('sales.facturas.show', $f->id),
                    ];
                }
            }
        }

        return response()->json($results);
    }
}
