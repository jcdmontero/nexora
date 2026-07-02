<?php
namespace App\Core\Http\Controllers\SuperAdmin;

use App\Core\Models\Module;
use App\Core\Models\TenantModule;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class ModuleController extends Controller
{
    public function index()
    {
        $modulos = Module::orderBy('is_core', 'desc')
            ->orderBy('name')
            ->get()
            ->map(fn ($m) => [
                'code' => $m->code,
                'name' => $m->name,
                'version' => $m->version,
                'description' => $m->description,
                'is_core' => $m->is_core,
                'estado' => $m->estado,
                'dependencies' => $m->dependencies ?? [],
                'empresas_count' => TenantModule::where('module_code', $m->code)
                    ->where('is_active', true)->count(),
            ]);

        return Inertia::render('SuperAdmin/Modulos/Index', [
            'modulos' => $modulos,
            'estados' => Module::ESTADOS,
        ]);
    }

    public function updateEstado(Request $request, Module $module)
    {
        $data = $request->validate([
            'estado' => ['required', 'string', 'in:' . implode(',', Module::ESTADOS)],
        ]);

        if ($module->is_core) {
            return back()->with('error', 'El módulo Core no cambia de estado.');
        }

        $module->update(['estado' => $data['estado']]);

        return back()->with('success', "Módulo \"{$module->name}\" movido a estado: {$data['estado']}.");
    }
}
