<?php

namespace App\Core\Services;

use App\Core\Models\AuditLog;
use App\Core\Models\Sede;
use App\Core\Models\WidgetLayout;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;

class DashboardDataService
{
    private const CACHE_TTL = 300; // 5 minutes

    public function getTenantStats(int $tenantId, $activeModules): array
    {
        $moduleCodes = $activeModules->pluck('code');
        $modulosCount = $activeModules->count();
        $cacheKey = "dashboard:{$tenantId}:stats";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($tenantId, $moduleCodes) {
            $hasSD     = $moduleCodes->contains('service-desk');
            $hasSales  = $moduleCodes->contains('sales');
            $hasInv    = $moduleCodes->contains('inventory');
            $hasCRM    = $moduleCodes->contains('crm');
            $hasPurch  = $moduleCodes->contains('purchasing');

            return [
                // ── Service Desk ─────────────────────────────────────────
                'ordenes_hoy' => $hasSD
                    ? $this->safeCount(fn () => DB::table('sd_ordenes')
                        ->where('tenant_id', $tenantId)
                        ->whereDate('created_at', today())
                        ->whereNull('deleted_at')
                        ->count())
                    : null,
                'ordenes_semana' => $hasSD
                    ? $this->safeCount(fn () => DB::table('sd_ordenes')
                        ->where('tenant_id', $tenantId)
                        ->where('created_at', '>=', today()->startOfWeek())
                        ->whereNull('deleted_at')
                        ->count())
                    : null,
                'ordenes_en_proceso' => $hasSD
                    ? $this->safeCount(fn () => DB::table('sd_ordenes')
                        ->where('tenant_id', $tenantId)
                        ->whereIn('estado', ['recibido', 'diagnosticado', 'en_proceso'])
                        ->whereNull('deleted_at')
                        ->count())
                    : null,
                'ordenes_para_entregar' => $hasSD
                    ? $this->safeCount(fn () => DB::table('sd_ordenes')
                        ->where('tenant_id', $tenantId)
                        ->where('estado', 'completado')
                        ->whereNull('deleted_at')
                        ->count())
                    : null,
                // Alias para compatibilidad con widgets existentes
                'ordenes_pendientes' => $hasSD
                    ? $this->safeCount(fn () => DB::table('sd_ordenes')
                        ->where('tenant_id', $tenantId)
                        ->whereIn('estado', ['recibido', 'diagnosticado', 'en_proceso'])
                        ->whereNull('deleted_at')
                        ->count())
                    : null,
                'ordenes_terminadas' => $hasSD
                    ? $this->safeCount(fn () => DB::table('sd_ordenes')
                        ->where('tenant_id', $tenantId)
                        ->whereIn('estado', ['completado', 'entregado'])
                        ->whereNull('deleted_at')
                        ->count())
                    : null,

                // ── Ventas ───────────────────────────────────────────────
                'ventas_hoy' => $hasSales
                    ? $this->safeCount(fn () => DB::table('sales_facturas')
                        ->where('tenant_id', $tenantId)
                        ->whereDate('created_at', today())
                        ->where('estado', 'pagada')
                        ->sum('total'))
                    : null,
                'ventas_semana' => $hasSales
                    ? $this->safeCount(fn () => DB::table('sales_facturas')
                        ->where('tenant_id', $tenantId)
                        ->where('created_at', '>=', today()->startOfWeek())
                        ->where('estado', 'pagada')
                        ->sum('total'))
                    : null,
                'ventas_mes' => $hasSales ? (function () use ($tenantId) {
                    return (float) DB::table('sales_facturas')
                        ->where('tenant_id', $tenantId)
                        ->whereYear('created_at', now()->year)
                        ->whereMonth('created_at', now()->month)
                        ->where('estado', 'pagada')
                        ->sum('total');
                })() : null,
                'ventas_mes_anterior' => $hasSales ? (function () use ($tenantId) {
                    return (float) DB::table('sales_facturas')
                        ->where('tenant_id', $tenantId)
                        ->whereYear('created_at', now()->subMonth()->year)
                        ->whereMonth('created_at', now()->subMonth()->month)
                        ->where('estado', 'pagada')
                        ->sum('total');
                })() : null,
                'facturas_pendientes' => $hasSales
                    ? $this->safeCount(fn () => DB::table('sales_facturas')
                        ->where('tenant_id', $tenantId)
                        ->where('estado', 'pendiente')
                        ->count())
                    : null,

                // ── CRM ──────────────────────────────────────────────────
                'clientes' => $hasCRM
                    ? $this->safeCount(fn () => DB::table('crm_clientes')
                        ->where('tenant_id', $tenantId)
                        ->where('activo', true)
                        ->count())
                    : null,

                // ── Inventario ───────────────────────────────────────────
                'productos' => $hasInv
                    ? $this->safeCount(fn () => DB::table('inventory_productos')
                        ->where('tenant_id', $tenantId)
                        ->where('is_active', true)
                        ->count())
                    : null,
                'productos_bajo_stock' => $hasInv
                    ? $this->safeCount(fn () => DB::table('inventory_productos')
                        ->where('tenant_id', $tenantId)
                        ->where('is_active', true)
                        ->whereColumn('stock_actual', '<=', 'stock_minimo')
                        ->count())
                    : null,

                // ── Compras ──────────────────────────────────────────────
                'proveedores' => $hasPurch
                    ? $this->safeCount(fn () => DB::table('purchasing_proveedores')
                        ->where('tenant_id', $tenantId)
                        ->where('activo', true)
                        ->count())
                    : null,
                'compras_pendientes' => $hasPurch
                    ? $this->safeCount(fn () => DB::table('purchasing_ordenes_compra')
                        ->where('tenant_id', $tenantId)
                        ->whereIn('estado', ['pendiente', 'enviada', 'parcial'])
                        ->count())
                    : null,
                'facturas_hoy' => $hasSales
                    ? $this->safeCount(fn () => DB::table('sales_facturas')
                        ->where('tenant_id', $tenantId)
                        ->whereDate('created_at', today())
                        ->count())
                    : null,

                // ── Admin (solo para info interna) ───────────────────────
                'usuarios' => $this->safeCount(fn () => DB::table('users')->where('tenant_id', $tenantId)->count()),
            ];
        });
    }

    public function getPendingTasks(int $tenantId, $moduleCodes, array $stats): array
    {
        $tasks = [];

        if ($moduleCodes->contains('service-desk')) {
            $count = $this->safeCount(fn () => DB::table('sd_ordenes')
                ->where('tenant_id', $tenantId)
                ->whereIn('estado', ['recibido', 'en_diagnostico', 'en_revision'])
                ->count());
            if ($count > 0) {
                $tasks[] = ['label' => 'Órdenes por revisar', 'count' => $count, 'route' => 'service-desk.tickets.index', 'accent' => 'rose'];
            }
        }
        if ($moduleCodes->contains('inventory') && ($stats['productos_bajo_stock'] ?? 0) > 0) {
            $tasks[] = ['label' => 'Productos bajo stock', 'count' => (int) $stats['productos_bajo_stock'], 'route' => 'inventory.productos.index', 'accent' => 'amber'];
        }
        if ($moduleCodes->contains('purchasing') && ($stats['compras_pendientes'] ?? 0) > 0) {
            $tasks[] = ['label' => 'Compras pendientes', 'count' => (int) $stats['compras_pendientes'], 'route' => 'purchasing.ordenes.index', 'accent' => 'sky'];
        }
        if ($moduleCodes->contains('sales')) {
            $cxcCount = $this->safeCount(fn () => DB::table('sales_facturas')
                ->where('tenant_id', $tenantId)
                ->where('estado', 'pendiente')
                ->count());
            if ($cxcCount > 0) {
                $tasks[] = ['label' => 'Facturas por cobrar', 'count' => $cxcCount, 'route' => 'sales.facturas.index', 'accent' => 'violet'];
            }
        }

        return $tasks;
    }

    public function getRevenueTrend(int $tenantId): array
    {
        $cacheKey = "dashboard:{$tenantId}:revenue";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($tenantId) {
            $revenue = [];
            try {
                for ($i = 5; $i >= 0; $i--) {
                    $month = today()->subMonths($i);
                    $total = DB::table('sales_facturas')
                        ->where('tenant_id', $tenantId)
                        ->where('estado', 'pagada')
                        ->whereYear('created_at', $month->year)
                        ->whereMonth('created_at', $month->month)
                        ->sum('total');

                    $revenue[] = [
                        'mes' => ucfirst($month->translatedFormat('M')),
                        'ingresos' => (int) $total,
                    ];
                }
            } catch (\Throwable) {
                $revenue = [];
            }
            return $revenue;
        });
    }

    public function getActivityData(int $tenantId): array
    {
        $cacheKey = "dashboard:{$tenantId}:activity";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($tenantId) {
            $result = ['recent' => collect(), 'series' => []];

            try {
                $result['recent'] = AuditLog::with('user:id,name')
                    ->where('tenant_id', $tenantId)
                    ->latest('created_at')
                    ->limit(8)
                    ->get()
                    ->map(fn (AuditLog $log) => [
                        'id' => $log->id,
                        'event' => $log->event,
                        'description' => $log->description,
                        'auditable_type' => class_basename($log->auditable_type ?? ''),
                        'user' => $log->user?->name ?? 'Sistema',
                        'created_at' => $log->created_at?->toIso8601String(),
                        'created_human' => $log->created_at?->diffForHumans(),
                    ]);

                $start = Carbon::today()->subDays(6);
                $counts = DB::table('audit_logs')
                    ->where('tenant_id', $tenantId)
                    ->where('created_at', '>=', $start)
                    ->selectRaw('DATE(created_at) as fecha, COUNT(*) as total')
                    ->groupByRaw('DATE(created_at)')
                    ->pluck('total', 'fecha');

                $dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                for ($i = 0; $i < 7; $i++) {
                    $date = $start->copy()->addDays($i);
                    $result['series'][] = [
                        'dia' => $dias[$date->dayOfWeek],
                        'fecha' => $date->toDateString(),
                        'eventos' => (int) ($counts[$date->toDateString()] ?? 0),
                    ];
                }
            } catch (\Throwable) {
                $result['recent'] = collect();
                $result['series'] = [];
            }

            return $result;
        });
    }

    public function getQuickAccess($tenantId, $user, $moduleCodes): array
    {
        $access = [
            'crm' => [
                ['label' => 'Nuevo Cliente', 'description' => 'Registrar cliente en CRM', 'route' => 'crm.clientes.create', 'icon' => 'UserPlus', 'color' => 'indigo', 'permission' => 'crm:create'],
                ['label' => 'Ver Clientes', 'description' => 'Listado de clientes', 'route' => 'crm.clientes.index', 'icon' => 'Users', 'color' => 'indigo', 'permission' => 'crm:view'],
            ],
            'sales' => [
                ['label' => 'Punto de Venta', 'description' => 'Nueva venta en caja', 'route' => 'sales.pos.index', 'icon' => 'ShoppingCart', 'color' => 'emerald', 'permission' => 'sales:create'],
            ],
            'inventory' => [
                ['label' => 'Ver Productos', 'description' => 'Catálogo de inventario', 'route' => 'inventory.productos.index', 'icon' => 'Package', 'color' => 'sky', 'permission' => 'inventory:view'],
            ],
            'service-desk' => [
                ['label' => 'Nuevo Ticket', 'description' => 'Registrar orden de servicio', 'route' => 'service-desk.tickets.create', 'icon' => 'Wrench', 'color' => 'rose', 'permission' => 'service-desk:edit'],
                ['label' => 'Ver Tickets', 'description' => 'Órdenes de servicio', 'route' => 'service-desk.tickets.index', 'icon' => 'ClipboardList', 'color' => 'rose', 'permission' => 'service-desk:view'],
            ],
            'purchasing' => [
                ['label' => 'Nueva Compra', 'description' => 'Orden de compra a proveedor', 'route' => 'purchasing.ordenes.create', 'icon' => 'Truck', 'color' => 'amber', 'permission' => 'purchasing:edit'],
            ],
            'accounting' => [
                ['label' => 'Nuevo Asiento', 'description' => 'Registrar asiento contable', 'route' => 'accounting.asientos.create', 'icon' => 'Calculator', 'color' => 'violet', 'permission' => 'accounting:create'],
            ],
            'hr' => [
                ['label' => 'Ver Empleados', 'description' => 'Talento humano', 'route' => 'hr.empleados.index', 'icon' => 'IdCard', 'color' => 'sky', 'permission' => 'hr:view'],
            ],
            'cash' => [
                ['label' => 'Abrir Caja', 'description' => 'Iniciar sesión de caja', 'route' => 'cash.arqueo.index', 'icon' => 'Wallet', 'color' => 'emerald', 'permission' => 'cash:create'],
            ],
        ];

        $quickAccess = [];
        foreach ($access as $modCode => $items) {
            if ($moduleCodes->contains($modCode)) {
                foreach ($items as $item) {
                    if ($user->can($item['permission']) && route_exists($item['route'])) {
                        $quickAccess[] = $item;
                    }
                }
            }
        }

        return $quickAccess;
    }

    public function getUserRole($user): string
    {
        $roles = $user->getRoleNames();
        return $roles->first() ?? 'user';
    }

    /**
     * Devuelve KPIs de ventas calculados para el período seleccionado por el usuario.
     * Incluye comparación con el período anterior para mostrar el trend.
     */
    public function getStatsByPeriod(int $tenantId, $moduleCodes, string $period): array
    {
        [$start, $end] = $this->periodRange($period);
        [$prevStart, $prevEnd] = $this->previousPeriodRange($period);
        $cacheKey = "dashboard:{$tenantId}:period_stats:{$period}";

        return Cache::remember($cacheKey, 120, function () use ($tenantId, $moduleCodes, $start, $end, $prevStart, $prevEnd, $period) {
            $stats = [];

            if ($moduleCodes->contains('sales')) {
                $current = (float) DB::table('sales_facturas')
                    ->where('tenant_id', $tenantId)
                    ->where('estado', 'pagada')
                    ->whereBetween('created_at', [$start, $end])
                    ->sum('total');

                $previous = (float) DB::table('sales_facturas')
                    ->where('tenant_id', $tenantId)
                    ->where('estado', 'pagada')
                    ->whereBetween('created_at', [$prevStart, $prevEnd])
                    ->sum('total');

                $stats['ventas_periodo'] = $current;
                $stats['ventas_periodo_anterior'] = $previous;
                $stats['ventas_trend'] = $previous > 0
                    ? round((($current - $previous) / $previous) * 100, 1)
                    : null;
            }

            $stats['periodo_label'] = match ($period) {
                'hoy'       => 'Ventas hoy',
                'semana'    => 'Ventas semana',
                'mes'       => 'Ventas ' . ucfirst(now()->translatedFormat('F')),
                'trimestre' => 'Ventas trimestre',
                'año'       => 'Ventas este año',
                default     => 'Ventas período',
            };

            return $stats;
        });
    }

    // ── Datos específicos por módulo ─────────────────────────────────────

    public function getModuleWidgetData(int $tenantId, string $module): array
    {
        return match ($module) {
            'service-desk' => $this->getServiceDeskWidgetData($tenantId),
            'sales'        => $this->getSalesWidgetData($tenantId),
            'cash'         => $this->getCashWidgetData($tenantId),
            default        => [],
        };
    }

    private function getServiceDeskWidgetData(int $tenantId): array
    {
        $cacheKey = "dashboard:{$tenantId}:widget:service-desk";

        return Cache::remember($cacheKey, 120, function () use ($tenantId) {
            try {
                $estadosActivos = ['recibido', 'diagnosticado', 'en_proceso', 'completado'];

                $porEstado = DB::table('sd_ordenes')
                    ->where('tenant_id', $tenantId)
                    ->whereIn('estado', $estadosActivos)
                    ->whereNull('deleted_at')
                    ->select('estado', DB::raw('COUNT(*) as total'))
                    ->groupBy('estado')
                    ->pluck('total', 'estado')
                    ->toArray();

                $cola = DB::table('sd_ordenes as o')
                    ->leftJoin('crm_clientes as c', 'c.id', '=', 'o.cliente_id')
                    ->where('o.tenant_id', $tenantId)
                    ->whereIn('o.estado', ['recibido', 'diagnosticado', 'en_proceso'])
                    ->whereNull('o.deleted_at')
                    ->orderBy('o.created_at', 'desc')
                    ->limit(5)
                    ->select('o.id', 'o.numero_orden', 'o.estado', 'o.created_at', 'c.nombre as cliente')
                    ->get()
                    ->map(fn ($r) => [
                        'id'      => $r->id,
                        'numero'  => $r->numero_orden,
                        'estado'  => $r->estado,
                        'cliente' => $r->cliente ?? 'Sin cliente',
                        'fecha'   => Carbon::parse($r->created_at)->diffForHumans(),
                    ]);

                return [
                    'por_estado' => [
                        'recibido'      => (int) ($porEstado['recibido']      ?? 0),
                        'diagnosticado' => (int) ($porEstado['diagnosticado'] ?? 0),
                        'en_proceso'    => (int) ($porEstado['en_proceso']    ?? 0),
                        'completado'    => (int) ($porEstado['completado']    ?? 0),
                    ],
                    'total_activas' => array_sum($porEstado),
                    'cola'          => $cola->values()->all(),
                ];
            } catch (\Throwable) {
                return ['por_estado' => [], 'total_activas' => 0, 'cola' => []];
            }
        });
    }

    private function getSalesWidgetData(int $tenantId): array
    {
        $cacheKey = "dashboard:{$tenantId}:widget:sales";

        return Cache::remember($cacheKey, 120, function () use ($tenantId) {
            try {
                $facturas = DB::table('sales_facturas as f')
                    ->leftJoin('crm_clientes as c', 'c.id', '=', 'f.cliente_id')
                    ->where('f.tenant_id', $tenantId)
                    ->orderBy('f.created_at', 'desc')
                    ->limit(6)
                    ->select('f.id', 'f.numero', 'f.total', 'f.estado', 'f.created_at', 'c.nombre as cliente')
                    ->get()
                    ->map(fn ($r) => [
                        'id'      => $r->id,
                        'numero'  => $r->numero,
                        'total'   => (float) $r->total,
                        'estado'  => $r->estado,
                        'cliente' => $r->cliente ?? 'Consumidor final',
                        'fecha'   => Carbon::parse($r->created_at)->diffForHumans(),
                    ]);

                $pendientes = DB::table('sales_facturas')
                    ->where('tenant_id', $tenantId)
                    ->where('estado', 'pendiente')
                    ->count();

                return [
                    'facturas_recientes' => $facturas->values()->all(),
                    'pendientes_cobrar'  => (int) $pendientes,
                ];
            } catch (\Throwable) {
                return ['facturas_recientes' => [], 'pendientes_cobrar' => 0];
            }
        });
    }

    private function getCashWidgetData(int $tenantId): array
    {
        $cacheKey = "dashboard:{$tenantId}:widget:cash";

        return Cache::remember($cacheKey, 60, function () use ($tenantId) {
            try {
                $sesion = DB::table('cash_caja_sesiones as s')
                    ->join('cash_cajas as c', 'c.id', '=', 's.caja_id')
                    ->where('s.tenant_id', $tenantId)
                    ->where('s.estado', 'abierta')
                    ->orderBy('s.fecha_apertura', 'desc')
                    ->select(
                        's.id', 's.saldo_inicial', 's.ingresos_totales',
                        's.egresos_totales', 's.fecha_apertura', 'c.nombre as caja_nombre',
                    )
                    ->first();

                if (! $sesion) {
                    return ['sesion_activa' => false];
                }

                $saldo = (float) $sesion->saldo_inicial
                    + (float) $sesion->ingresos_totales
                    - (float) $sesion->egresos_totales;

                return [
                    'sesion_activa'   => true,
                    'caja_nombre'     => $sesion->caja_nombre,
                    'saldo_inicial'   => (float) $sesion->saldo_inicial,
                    'ingresos'        => (float) $sesion->ingresos_totales,
                    'egresos'         => (float) $sesion->egresos_totales,
                    'saldo_actual'    => $saldo,
                    'apertura'        => Carbon::parse($sesion->fecha_apertura)->format('H:i'),
                    'apertura_humano' => Carbon::parse($sesion->fecha_apertura)->diffForHumans(),
                ];
            } catch (\Throwable) {
                return ['sesion_activa' => false];
            }
        });
    }

    /**
     * Resumen de alertas detalladas para el dashboard.
     * Cada sección se activa solo si el módulo correspondiente está habilitado.
     */
    public function getAlertsSummary(int $tenantId, $moduleCodes): array
    {
        $cacheKey = "dashboard:{$tenantId}:alerts";

        return Cache::remember($cacheKey, 120, function () use ($tenantId, $moduleCodes) {
            $alerts = [
                'stock_bajo'           => [],
                'facturas_por_vencer'  => [],
                'cuentas_por_pagar'    => [],
                'servicios_pendientes' => [],
                'cajas_abiertas'       => [],
            ];

            // ── Stock bajo (inventory) ───────────────────────────────
            if ($moduleCodes->contains('inventory')) {
                try {
                    $alerts['stock_bajo'] = DB::table('inventory_productos')
                        ->where('tenant_id', $tenantId)
                        ->where('is_active', true)
                        ->whereColumn('stock_actual', '<=', 'stock_minimo')
                        ->orderBy('stock_actual', 'asc')
                        ->limit(10)
                        ->select('id', 'nombre', 'sku', 'stock_actual', 'stock_minimo')
                        ->get()
                        ->map(fn ($r) => [
                            'id'           => $r->id,
                            'nombre'       => $r->nombre,
                            'sku'          => $r->sku,
                            'stock_actual' => (int) $r->stock_actual,
                            'stock_minimo' => (int) $r->stock_minimo,
                            'nivel'        => $r->stock_actual == 0 ? 'critico' : 'bajo',
                        ])
                        ->values()->all();
                } catch (\Throwable) {
                    $alerts['stock_bajo'] = [];
                }
            }

            // ── Facturas por vencer (sales) ──────────────────────────
            if ($moduleCodes->contains('sales')) {
                try {
                    $hasVencimiento = collect(DB::getSchemaBuilder()->getColumnListing('sales_facturas'))
                        ->contains('fecha_vencimiento');

                    $query = DB::table('sales_facturas as f')
                        ->leftJoin('crm_clientes as c', 'c.id', '=', 'f.cliente_id')
                        ->where('f.tenant_id', $tenantId)
                        ->where('f.estado', 'pendiente');

                    if ($hasVencimiento) {
                        $query->orderBy('f.fecha_vencimiento', 'asc');
                    } else {
                        $query->orderBy('f.created_at', 'asc');
                    }

                    $alerts['facturas_por_vencer'] = $query
                        ->limit(10)
                        ->select('f.id', 'f.numero', 'f.total', 'f.created_at', 'c.nombre as cliente',
                            $hasVencimiento ? 'f.fecha_vencimiento' : DB::raw("NULL as fecha_vencimiento"))
                        ->get()
                        ->map(function ($r) use ($hasVencimiento) {
                            $vencimiento = $hasVencimiento && $r->fecha_vencimiento
                                ? Carbon::parse($r->fecha_vencimiento)
                                : Carbon::parse($r->created_at)->addDays(30);

                            return [
                                'id'                => $r->id,
                                'numero'            => $r->numero,
                                'total'             => (float) $r->total,
                                'cliente'           => $r->cliente ?? 'Consumidor final',
                                'fecha_vencimiento' => $vencimiento->toDateString(),
                                'dias_restantes'    => (int) now()->diffInDays($vencimiento, false),
                            ];
                        })
                        ->values()->all();
                } catch (\Throwable) {
                    $alerts['facturas_por_vencer'] = [];
                }
            }

            // ── Cuentas por pagar (purchasing) ───────────────────────
            if ($moduleCodes->contains('purchasing')) {
                try {
                    $alerts['cuentas_por_pagar'] = DB::table('purchasing_ordenes_compra as oc')
                        ->leftJoin('purchasing_proveedores as p', 'p.id', '=', 'oc.proveedor_id')
                        ->where('oc.tenant_id', $tenantId)
                        ->whereIn('oc.estado', ['pendiente', 'enviada', 'parcial', 'aprobada'])
                        ->orderBy('oc.created_at', 'asc')
                        ->limit(10)
                        ->select('oc.id', 'oc.numero', 'oc.total', 'oc.estado', 'oc.created_at', 'p.nombre as proveedor')
                        ->get()
                        ->map(fn ($r) => [
                            'id'                 => $r->id,
                            'numero'             => $r->numero,
                            'total'              => (float) $r->total,
                            'proveedor'          => $r->proveedor ?? 'Sin proveedor',
                            'estado'             => $r->estado,
                            'dias_desde_creacion' => (int) Carbon::parse($r->created_at)->diffInDays(now()),
                        ])
                        ->values()->all();
                } catch (\Throwable) {
                    $alerts['cuentas_por_pagar'] = [];
                }
            }

            // ── Servicios pendientes (service-desk) ──────────────────
            if ($moduleCodes->contains('service-desk')) {
                try {
                    $alerts['servicios_pendientes'] = DB::table('sd_ordenes as o')
                        ->leftJoin('crm_clientes as c', 'c.id', '=', 'o.cliente_id')
                        ->where('o.tenant_id', $tenantId)
                        ->whereIn('o.estado', ['recibido', 'diagnosticado', 'en_proceso'])
                        ->whereNull('o.deleted_at')
                        ->orderBy('o.created_at', 'asc')
                        ->limit(10)
                        ->select('o.id', 'o.numero_orden', 'o.estado', 'o.created_at', 'c.nombre as cliente')
                        ->get()
                        ->map(fn ($r) => [
                            'id'           => $r->id,
                            'numero_orden' => $r->numero_orden,
                            'estado'       => $r->estado,
                            'cliente'      => $r->cliente ?? 'Sin cliente',
                            'fecha'        => Carbon::parse($r->created_at)->diffForHumans(),
                            'dias'         => (int) Carbon::parse($r->created_at)->diffInDays(now()),
                        ])
                        ->values()->all();
                } catch (\Throwable) {
                    $alerts['servicios_pendientes'] = [];
                }
            }

            // ── Cajas abiertas (cash) ──────────────────────────────────
            if ($moduleCodes->contains('cash')) {
                try {
                    $alerts['cajas_abiertas'] = DB::table('cash_caja_sesiones as s')
                        ->join('cash_cajas as c', 'c.id', '=', 's.caja_id')
                        ->leftJoin('users as u', 'u.id', '=', 's.user_id')
                        ->where('s.tenant_id', $tenantId)
                        ->where('s.estado', 'abierta')
                        ->orderBy('s.fecha_apertura', 'asc')
                        ->select('s.id', 'c.nombre as caja', 'u.name as cajero', 's.fecha_apertura', 's.saldo_inicial', 's.ingresos_totales', 's.egresos_totales')
                        ->get()
                        ->map(function ($r) {
                            $horas = Carbon::parse($r->fecha_apertura)->diffInHours(now());
                            return [
                                'id' => $r->id,
                                'caja' => $r->caja,
                                'cajero' => $r->cajero ?? 'Usuario eliminado',
                                'saldo_actual' => (float) $r->saldo_inicial + (float) $r->ingresos_totales - (float) $r->egresos_totales,
                                'horas_abierta' => $horas,
                                'nivel' => $horas >= 12 ? 'critico' : 'normal'
                            ];
                        })
                        ->values()->all();
                } catch (\Throwable) {
                    $alerts['cajas_abiertas'] = [];
                }
            }

            return $alerts;
        });
    }

    public function invalidateCache(int $tenantId): void
    {
        Cache::forget("dashboard:{$tenantId}:stats");
        Cache::forget("dashboard:{$tenantId}:revenue");
        Cache::forget("dashboard:{$tenantId}:activity");
        Cache::forget("dashboard:{$tenantId}:alerts");
        Cache::forget("dashboard:{$tenantId}:widget:service-desk");
        Cache::forget("dashboard:{$tenantId}:widget:sales");
        Cache::forget("dashboard:{$tenantId}:widget:cash");
    }

    private function periodRange(string $period): array
    {
        return match ($period) {
            'hoy'       => [now()->startOfDay(), now()->endOfDay()],
            'semana'    => [now()->startOfWeek(), now()->endOfWeek()],
            'mes'       => [now()->startOfMonth(), now()->endOfMonth()],
            'trimestre' => [now()->startOfQuarter(), now()->endOfQuarter()],
            'año'       => [now()->startOfYear(), now()->endOfYear()],
            default     => [now()->startOfWeek(), now()->endOfWeek()],
        };
    }

    private function previousPeriodRange(string $period): array
    {
        return match ($period) {
            'hoy'       => [now()->subDay()->startOfDay(), now()->subDay()->endOfDay()],
            'semana'    => [now()->subWeek()->startOfWeek(), now()->subWeek()->endOfWeek()],
            'mes'       => [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()],
            'trimestre' => [now()->subQuarter()->startOfQuarter(), now()->subQuarter()->endOfQuarter()],
            'año'       => [now()->subYear()->startOfYear(), now()->subYear()->endOfYear()],
            default     => [now()->subWeek()->startOfWeek(), now()->subWeek()->endOfWeek()],
        };
    }

    private function safeCount(callable $fn): int
    {
        try {
            return (int) $fn();
        } catch (\Throwable $e) {
            Log::warning('DashboardDataService::safeCount falló: ' . $e->getMessage(), [
                'exception' => $e::class,
            ]);
            return 0;
        }
    }
}
