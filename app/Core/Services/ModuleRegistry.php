<?php
namespace App\Core\Services;

use App\Core\Models\Module;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;

class ModuleRegistry
{
    protected array $manifestCache = [];

    /**
     * Escanea app/Modules/ y registra todos los módulos en la BD.
     */
    public function scanAndRegister(): void
    {
        $modulesPath = app_path('Modules');
        if (!File::isDirectory($modulesPath)) {
            return;
        }

        $directories = File::directories($modulesPath);

        foreach ($directories as $dir) {
            $manifestPath = $dir . '/module.json';
            if (!File::exists($manifestPath)) {
                continue;
            }

            $manifest = json_decode(File::get($manifestPath), true);
            if (!$manifest || !isset($manifest['code'])) {
                continue;
            }

            $existing = Module::where('code', $manifest['code'])->first();

            $attributes = [
                'name' => $manifest['name'],
                'class' => basename($dir),
                'version' => $manifest['version'] ?? '1.0.0',
                'description' => $manifest['description'] ?? '',
                'is_core' => $manifest['core'] ?? false,
                'dependencies' => $manifest['dependencies'] ?? [],
                'permissions' => $manifest['permissions'] ?? [],
                'is_active_globally' => true,
            ];

            // El estado del ciclo de vida NO se sobreescribe al re-escanear;
            // solo se asigna por defecto al registrar el módulo por primera vez.
            if (!$existing) {
                $attributes['estado'] = ($manifest['core'] ?? false) ? 'publicado' : 'desarrollo';
            }

            $module = Module::updateOrCreate(['code' => $manifest['code']], $attributes);

            foreach ($manifest['permissions'] ?? [] as $perm) {
                Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
            }
        }
    }

    public function getManifest(string $moduleCode): ?array
    {
        if (isset($this->manifestCache[$moduleCode])) {
            return $this->manifestCache[$moduleCode];
        }

        $module = Module::where('code', $moduleCode)->first();
        if (!$module) {
            return null;
        }

        $path = app_path("Modules/{$module->class}/module.json");
        if (!File::exists($path)) {
            return null;
        }

        $manifest = json_decode(File::get($path), true);
        $this->manifestCache[$moduleCode] = $manifest;

        return $manifest;
    }

    public function getMenusForTenant($tenant): array
    {
        $rawMenus = [];
        $activeModules = $tenant->activeModules;

        foreach ($activeModules as $tm) {
            $manifest = $this->getManifest($tm->module_code);
            if ($manifest && isset($manifest['menus'])) {
                $rawMenus = array_merge($rawMenus, $manifest['menus']);
            }
        }

        return $this->groupMenus($rawMenus);
    }

    public function getAllMenus(): array
    {
        $rawMenus = [];
        $modules = Module::where('is_active_globally', true)->get();

        foreach ($modules as $module) {
            $manifest = $this->getManifest($module->code);
            if ($manifest && isset($manifest['menus'])) {
                $rawMenus = array_merge($rawMenus, $manifest['menus']);
            }
        }

        return $this->groupMenus($rawMenus);
    }

    protected function groupMenus(array $rawMenus): array
    {
        $grouped = [];
        foreach ($rawMenus as $menu) {
            $section = $menu['section'] ?? 'Otros';
            if (!isset($grouped[$section])) {
                $grouped[$section] = $menu;
            } else {
                // Agregar un separador visual entre módulos si se desea, o solo unir los items
                $grouped[$section]['items'][] = ['type' => 'separator'];
                $grouped[$section]['items'] = array_merge($grouped[$section]['items'], $menu['items']);
            }
        }
        return array_values($grouped);
    }
}
