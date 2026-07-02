<?php
namespace App\Core\Http\Controllers\SuperAdmin;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => [
                'empresas' => Tenant::count(),
                'empresas_activas' => Tenant::where('is_active', true)->count(),
                'empresas_suspendidas' => Tenant::where('is_active', false)->count(),
                'usuarios' => User::where('is_superadmin', false)->count(),
                'modulos_activos' => TenantModule::where('is_active', true)
                    ->where('module_code', '!=', 'core')->count(),
            ],
        ]);
    }
}
