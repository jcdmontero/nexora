<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\Empleado;
use App\Modules\Hr\Models\Contrato;
use App\Modules\Hr\Models\Prestamo;
use App\Modules\Hr\Models\Incapacidad;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $totalEmpleadosActivos = Empleado::where('tenant_id', $tenantId)
            ->where('estado', true)
            ->count();

        $totalContratosVigentes = Contrato::whereHas('empleado', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->where('estado', true)
            ->count();

        $totalPrestamosActivos = Prestamo::whereHas('empleado', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->where('saldo_pendiente', '>', 0)
            ->count();

        $totalIncapacidadesActivas = Incapacidad::whereHas('empleado', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->where('fecha_fin', '>=', now()->toDateString())
            ->where('fecha_inicio', '<=', now()->toDateString())
            ->count();

        $empleadosUltimoMes = Empleado::where('tenant_id', $tenantId)
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        return Inertia::render('Hr/Dashboard', [
            'total_empleados_activos' => $totalEmpleadosActivos,
            'total_contratos_vigentes' => $totalContratosVigentes,
            'total_prestamos_activos' => $totalPrestamosActivos,
            'total_incapacidades_activas' => $totalIncapacidadesActivas,
            'empleados_ultimo_mes' => $empleadosUltimoMes,
        ]);
    }
}
