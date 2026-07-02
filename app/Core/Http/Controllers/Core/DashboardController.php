<?php

namespace App\Core\Http\Controllers\Core;

use App\Core\Services\DashboardDataService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class DashboardController extends Controller
{
    private DashboardDataService $dataService;

    public function __construct(DashboardDataService $dataService)
    {
        $this->dataService = $dataService;
    }

    public function widgetData(Request $request, string $module): JsonResponse
    {
        $allowed = ['service-desk', 'sales', 'cash', 'crm', 'purchasing', 'inventory', 'hr', 'payroll', 'accounting', 'notifications'];

        if (! in_array($module, $allowed, true)) {
            return response()->json(['error' => 'Módulo no válido'], 422);
        }

        $t = tenant();
        $activeModules = $t?->activeModules?->pluck('code') ?? collect();

        if (! $activeModules->contains($module)) {
            return response()->json(['error' => 'Módulo no activo'], 403);
        }

        $permissionMap = [
            'service-desk' => 'service-desk:view',
            'sales' => 'sales:view',
            'cash' => 'cash:view',
            'crm' => 'crm:view',
            'purchasing' => 'purchasing:view',
            'inventory' => 'inventory:view',
            'hr' => 'hr:view',
            'payroll' => 'payroll:view',
            'accounting' => 'accounting:view',
            'notifications' => 'notifications:view',
        ];

        $requiredPermission = $permissionMap[$module] ?? null;
        if ($requiredPermission && !$request->user()->can($requiredPermission)) {
            return response()->json(['error' => 'Sin permisos'], 403);
        }

        $data = $this->dataService->getModuleWidgetData($t->id, $module);

        return response()->json($data);
    }

    public function stats(Request $request): JsonResponse
    {
        $period = in_array($request->query('period'), ['hoy', 'semana', 'mes', 'trimestre', 'año'])
            ? $request->query('period')
            : 'semana';

        $t = tenant();
        $activeModules = $t?->activeModules ?? collect();
        $moduleCodes = $activeModules->pluck('code');

        $stats = $this->dataService->getStatsByPeriod($t?->id, $moduleCodes, $period);

        return response()->json(['stats' => $stats]);
    }

    public function index()
    {
        $t = tenant();
        $tid = $t?->id;
        $user = auth()->user();

        $activeModules = $t?->activeModules ?? collect();
        $moduleCodes = $activeModules->pluck('code');

        $stats = $this->dataService->getTenantStats($tid, $activeModules);
        $pendingTasks = $this->dataService->getPendingTasks($tid, $moduleCodes, $stats);
        $revenueTrend = $moduleCodes->contains('sales')
            ? $this->dataService->getRevenueTrend($tid)
            : [];
        $activityData = $this->dataService->getActivityData($tid);
        $quickAccess = $tid && $user
            ? $this->dataService->getQuickAccess($tid, $user, $moduleCodes)
            : [];
        $userRole = $user ? $this->dataService->getUserRole($user) : null;

        $personalTasks = $tid && $user ? \App\Models\Core\Task::where('tenant_id', $tid)
            ->where('asignado_a', $user->id)
            ->where('estado', '!=', 'cancelada')
            ->orderByRaw('fecha_limite IS NULL, fecha_limite ASC')
            ->orderBy('created_at', 'desc')
            ->get() : [];

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'tenantName' => $t?->name,
            'recentActivity' => $activityData['recent'],
            'activitySeries' => $activityData['series'],
            'revenueTrend' => $revenueTrend,
            'pendingTasks' => $pendingTasks,
            'personalTasks' => $personalTasks,
            'quickAccess' => $quickAccess,
            'activeModules' => $moduleCodes->toArray(),
            'userRole' => $userRole,
            'alertsSummary' => Inertia::defer(fn () => $this->dataService->getAlertsSummary($tid, $moduleCodes)),
        ]);
    }
}
