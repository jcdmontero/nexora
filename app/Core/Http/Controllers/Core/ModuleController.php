<?php
namespace App\Core\Http\Controllers\Core;

use App\Core\Models\Module;
use App\Core\Models\TenantModule;
use App\Core\Services\ModuleActivator;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class ModuleController extends Controller
{
    public function index()
    {
        $t = tenant();

        if (!$t && !auth()->user()?->isSuperAdmin()) {
            return redirect()->route('core.login')->with('error', 'Debes iniciar sesión en una empresa');
        }

        $allModules = Module::where('is_active_globally', true)->get()->map(fn ($m) => [
            'code' => $m->code,
            'name' => $m->name,
            'version' => $m->version,
            'description' => $m->description,
            'is_core' => $m->is_core,
        ]);
        $activeCodes = $t
            ? TenantModule::where('tenant_id', $t->id)->where('is_active', true)->pluck('module_code')->toArray()
            : [];

        return Inertia::render('Modules/Index', [
            'loading' => false,
            'modules' => $allModules,
            'activeCodes' => $activeCodes,
        ]);
    }

    public function activate(Request $request, ModuleActivator $activator)
    {
        $t = tenant();
        
        if (!$t && !auth()->user()?->isSuperAdmin()) {
            return redirect()->route('core.login')->with('error', 'Debes iniciar sesión en una empresa');
        }
        
        $module = Module::where('code', $request->module_code)->firstOrFail();

        try {
            $activator->activate($t, $module->code);
        } catch (\RuntimeException $e) {
            return redirect()->route('core.modules.index')->with('error', $e->getMessage());
        }

        return redirect()->route('core.modules.index')
            ->with('success', "Módulo \"{$module->name}\" activado correctamente.");
    }

    public function deactivate(Request $request, ModuleActivator $activator)
    {
        $t = tenant();
        
        if (!$t && !auth()->user()?->isSuperAdmin()) {
            return redirect()->route('core.login')->with('error', 'Debes iniciar sesión en una empresa');
        }
        
        $module = Module::where('code', $request->module_code)->firstOrFail();

        try {
            $activator->deactivate($t, $module->code);
        } catch (\RuntimeException $e) {
            return redirect()->route('core.modules.index')->with('error', $e->getMessage());
        }

        return redirect()->route('core.modules.index')
            ->with('success', "Módulo \"{$module->name}\" desactivado.");
    }
}
