# Auditoría: HR (Recursos Humanos) Juan
> Actualizado: 2026-07-06

## module.json
**Ruta:** app/Modules/Hr/module.json
```json
{
    "code": "hr",
    "name": "Recursos Humanos",
    "version": "1.0.0",
    "description": "Empleados, cargos, contratos laborales, préstamos, incapacidades y afiliaciones a seguridad social.",
    "icon": "Users",
    "core": false,
    "dependencies": [],
    "permissions": [
        "hr:view",
        "hr:create",
        "hr:edit",
        "hr:delete"
    ],
    "menus": [
        {
            "section": "RECURSOS HUMANOS",
            "icon": "Users",
            "items": [
                { "label": "Dashboard", "route": "hr.dashboard", "permission": "hr:view" },
                { "label": "Empleados", "route": "hr.empleados.index", "permission": "hr:view" },
                { "label": "Préstamos", "route": "hr.prestamos.index", "permission": "hr:view" },
                { "label": "Incapacidades", "route": "hr.incapacidades.index", "permission": "hr:view" },
                { "label": "Afiliaciones", "route": "hr.afiliaciones.index", "permission": "hr:view" },
                { "label": "Organigrama", "route": "hr.catalogos.organigrama", "permission": "hr:view" },
                { "label": "Config. Legal", "route": "hr.configuracion-legal.index", "permission": "hr:view" }
            ]
        }
    ]
}
```

## Providers
**Ruta:** app/Modules/Hr/Providers/
> No existen archivos de Providers en este módulo. La provisión de datos se realiza vía `HrProvisioner` invocado desde el `ModuleActivator` del Core.

## Routes
**Ruta:** app/Modules/Hr/Routes/web.php
```php
<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Hr\Controllers\EmpleadoController;
use App\Modules\Hr\Controllers\ContratoController;
use App\Modules\Hr\Controllers\CatalogoOrganizacionalController;
use App\Modules\Hr\Controllers\DashboardController;
use App\Modules\Hr\Controllers\PrestamoController;
use App\Modules\Hr\Controllers\IncapacidadController;
use App\Modules\Hr\Controllers\ConfiguracionLegalController;
use App\Modules\Hr\Controllers\AfiliacionController;

Route::middleware(['web', 'auth', 'tenant', 'module:hr'])->group(function () {
    Route::prefix('hr')->name('hr.')->group(function () {

        // Dashboard
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard')->middleware('permission:hr:view');

        // Empleados
        Route::get('empleados', [EmpleadoController::class, 'index'])->name('empleados.index')->middleware('permission:hr:view');
        Route::get('empleados/crear', [EmpleadoController::class, 'create'])->name('empleados.create')->middleware('permission:hr:create');
        Route::post('empleados', [EmpleadoController::class, 'store'])->name('empleados.store')->middleware('permission:hr:create');
        Route::get('empleados/{empleado}', [EmpleadoController::class, 'show'])->name('empleados.show')->middleware('permission:hr:view');
        Route::get('empleados/{empleado}/editar', [EmpleadoController::class, 'edit'])->name('empleados.edit')->middleware('permission:hr:edit');
        Route::put('empleados/{empleado}', [EmpleadoController::class, 'update'])->name('empleados.update')->middleware('permission:hr:edit');

        // Contratos
        Route::post('empleados/{empleado}/contratos', [ContratoController::class, 'store'])->name('contratos.store')->middleware('permission:hr:create');
        Route::put('contratos/{contrato}', [ContratoController::class, 'update'])->name('contratos.update')->middleware('permission:hr:edit');
        Route::get('contratos', [EmpleadoController::class, 'index'])->name('contratos.index')->middleware('permission:hr:view');

        // Catálogo organizacional
        Route::get('catalogos/organigrama', [CatalogoOrganizacionalController::class, 'index'])->name('catalogos.organigrama')->middleware('permission:hr:view');
        Route::post('catalogos/departamentos', [CatalogoOrganizacionalController::class, 'storeDepartamento'])->name('catalogos.departamentos.store')->middleware('permission:hr:create');
        Route::put('catalogos/departamentos/{departamento}', [CatalogoOrganizacionalController::class, 'updateDepartamento'])->name('catalogos.departamentos.update')->middleware('permission:hr:edit');
        Route::delete('catalogos/departamentos/{departamento}', [CatalogoOrganizacionalController::class, 'destroyDepartamento'])->name('catalogos.departamentos.destroy')->middleware('permission:hr:delete');
        Route::post('catalogos/cargos', [CatalogoOrganizacionalController::class, 'storeCargo'])->name('catalogos.cargos.store')->middleware('permission:hr:create');
        Route::put('catalogos/cargos/{cargo}', [CatalogoOrganizacionalController::class, 'updateCargo'])->name('catalogos.cargos.update')->middleware('permission:hr:edit');
        Route::delete('catalogos/cargos/{cargo}', [CatalogoOrganizacionalController::class, 'destroyCargo'])->name('catalogos.cargos.destroy')->middleware('permission:hr:delete');

        // Préstamos
        Route::get('prestamos', [PrestamoController::class, 'index'])->name('prestamos.index')->middleware('permission:hr:view');
        Route::post('prestamos', [PrestamoController::class, 'store'])->name('prestamos.store')->middleware('permission:hr:create');
        Route::post('prestamos/cuotas/{cuota}/pagar', [PrestamoController::class, 'pagarCuota'])->name('prestamos.cuotas.pagar')->middleware('permission:hr:edit');

        // Incapacidades
        Route::get('incapacidades', [IncapacidadController::class, 'index'])->name('incapacidades.index')->middleware('permission:hr:view');
        Route::post('incapacidades', [IncapacidadController::class, 'store'])->name('incapacidades.store')->middleware('permission:hr:create');
        Route::put('incapacidades/{incapacidad}', [IncapacidadController::class, 'update'])->name('incapacidades.update')->middleware('permission:hr:edit');
        Route::delete('incapacidades/{incapacidad}', [IncapacidadController::class, 'destroy'])->name('incapacidades.destroy')->middleware('permission:hr:delete');

        // Configuración legal
        Route::get('configuracion-legal', [ConfiguracionLegalController::class, 'index'])->name('configuracion-legal.index')->middleware('permission:hr:view');
        Route::post('configuracion-legal', [ConfiguracionLegalController::class, 'store'])->name('configuracion-legal.store')->middleware('permission:hr:create');
        Route::put('configuracion-legal/{id}', [ConfiguracionLegalController::class, 'update'])->name('configuracion-legal.update')->middleware('permission:hr:edit');

        // Afiliaciones
        Route::get('afiliaciones', [AfiliacionController::class, 'index'])->name('afiliaciones.index')->middleware('permission:hr:view');
        Route::post('afiliaciones', [AfiliacionController::class, 'store'])->name('afiliaciones.store')->middleware('permission:hr:create');

    });
});
```

## Controllers

### DashboardController
**Ruta:** app/Modules/Hr/Controllers/DashboardController.php
```php
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
```

### EmpleadoController
**Ruta:** app/Modules/Hr/Controllers/EmpleadoController.php
```php
<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Core\Models\Sede;
use App\Modules\Hr\Models\Cargo;
use App\Modules\Hr\Models\Departamento;
use App\Modules\Hr\Models\Empleado;
use App\Modules\Hr\Models\Contrato;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class EmpleadoController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $search = $request->input('search');

        $empleados = Empleado::with('contratoActivo.cargoRel.departamento')
            ->where('tenant_id', $tenantId)
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nombres', 'ilike', "%{$search}%")
                      ->orWhere('apellidos', 'ilike', "%{$search}%")
                      ->orWhere('documento', 'ilike', "%{$search}%")
                      ->orWhere('email', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('nombres')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Hr/Empleados/Index', [
            'empleados' => $empleados,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('Hr/Empleados/Create', [
            'sedes' => Sede::where('tenant_id', $tenantId)->get(['id', 'nombre']),
            'departamentos' => Departamento::with('cargos')
                ->where('tenant_id', $tenantId)
                ->where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre']),
            'roles' => Role::where('team_id', $tenantId)
                ->where('name', '!=', 'ADMIN_EMPRESA')
                ->orderBy('name')
                ->pluck('name'),
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'documento' => ['required', 'string', 'max:50', Rule::unique('hr_empleados', 'documento')->where('tenant_id', $tenantId)],
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'email' => 'nullable|email|max:150',
            'telefono' => 'nullable|string|max:50',
            'sede_id' => 'required|exists:core_sedes,id',

            // Opcional: crear usuario de sistema
            'crear_usuario' => 'boolean',
            'user_email' => 'nullable|email|max:150',
            'user_password' => 'nullable|string|min:8|max:100',
            'user_role' => 'nullable|string|exists:roles,name',
        ]);

        DB::transaction(function () use ($data, $tenantId) {
            // Crear empleado
            $empleado = Empleado::create([
                'tenant_id' => $tenantId,
                'sede_id' => $data['sede_id'],
                'documento' => $data['documento'],
                'nombres' => $data['nombres'],
                'apellidos' => $data['apellidos'],
                'email' => $data['email'],
                'telefono' => $data['telefono'],
                'estado' => true,
            ]);

            // Crear usuario de sistema si se solicitó
            if ($data['crear_usuario'] ?? false) {
                if (!auth()->user()->can('users:create')) {
                    throw new \Exception('No tienes permiso para crear usuarios de sistema.');
                }

                $userEmail = $data['user_email'] ?? $data['email'];
                if (empty($userEmail)) {
                    throw new \Exception('Debes proporcionar un email para el usuario de sistema.');
                }

                $userPassword = $data['user_password'] ?? str()->random(12);

                if (User::where('email', $userEmail)->exists()) {
                    throw new \Exception('El email del usuario ya está registrado.');
                }

                $user = User::create([
                    'name' => "{$data['nombres']} {$data['apellidos']}",
                    'email' => $userEmail,
                    'password' => Hash::make($userPassword),
                    'tenant_id' => $tenantId,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]);

                if (!empty($data['user_role'])) {
                    $role = Role::where('team_id', $tenantId)->where('name', $data['user_role'])->first();
                    if (!$role) {
                        throw new \Exception('El rol no pertenece al equipo actual.');
                    }
                    $registrar = app(PermissionRegistrar::class);
                    $previous = $registrar->getPermissionsTeamId();
                    $registrar->setPermissionsTeamId($tenantId);
                    $user->assignRole($data['user_role']);
                    $registrar->setPermissionsTeamId($previous);
                }

                $empleado->update(['user_id' => $user->id]);
            }

            // Guardar el ID para el redirect (necesitamos el empleado fuera del transaction callback)
            // Usamos una referencia para retornarlo
        });

        // Recuperar el último empleado creado para redirect
        $empleado = Empleado::where('tenant_id', $tenantId)
            ->where('documento', $data['documento'])
            ->first();

        return redirect()->route('hr.empleados.show', $empleado->id)
            ->with('success', 'Empleado creado exitosamente.');
    }

    public function show(Empleado $empleado)
    {
        if ($empleado->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $tenantId = auth()->user()->tenant_id;

        $empleado->load([
            'contratos' => function ($q) {
                $q->with('cargoRel.departamento')->orderBy('fecha_inicio', 'desc');
            },
            'asistencias' => function ($q) {
                $q->orderBy('fecha', 'desc')->take(30);
            },
            'sede',
            'user',
        ]);

        $cargos = Cargo::with('departamento')
            ->where('tenant_id', $tenantId)
            ->where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'departamento_id', 'es_productivo']);

        return Inertia::render('Hr/Empleados/Show', [
            'empleado' => $empleado,
            'sedes' => Sede::where('tenant_id', $tenantId)->get(['id', 'nombre']),
            'cargos' => $cargos,
        ]);
    }

    public function edit(Empleado $empleado)
    {
        if ($empleado->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('Hr/Empleados/Edit', [
            'empleado' => $empleado->load('contratoActivo.cargoRel.departamento', 'sede', 'user'),
            'sedes' => Sede::where('tenant_id', $tenantId)->get(['id', 'nombre']),
            'departamentos' => Departamento::with('cargos')
                ->where('tenant_id', $tenantId)
                ->where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre']),
            'roles' => Role::where('team_id', $tenantId)
                ->where('name', '!=', 'ADMIN_EMPRESA')
                ->orderBy('name')
                ->pluck('name'),
        ]);
    }

    public function update(Request $request, Empleado $empleado)
    {
        if ($empleado->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'documento' => ['required', 'string', 'max:50', Rule::unique('hr_empleados', 'documento')->where('tenant_id', $empleado->tenant_id)->ignore($empleado->id)],
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'email' => 'nullable|email|max:150',
            'telefono' => 'nullable|string|max:50',
            'sede_id' => 'required|exists:core_sedes,id',
            'estado' => 'boolean',
        ]);

        $empleado->update($data);

        return back()->with('success', 'Información actualizada.');
    }
}
```

### ContratoController
**Ruta:** app/Modules/Hr/Controllers/ContratoController.php
```php
<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\Cargo;
use App\Modules\Hr\Models\Contrato;
use App\Modules\Hr\Models\Empleado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContratoController extends Controller
{
    public function store(Request $request, Empleado $empleado)
    {
        if ($empleado->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'cargo_id' => ['required', 'exists:hr_cargos,id'],
            'tipo_contrato' => 'required|string|max:100',
            'salario_base' => 'required|numeric|min:0',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
        ]);

        // Validar que el cargo pertenece al tenant
        $cargo = Cargo::where('id', $data['cargo_id'])
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$cargo) {
            return back()->with('error', 'El cargo seleccionado no pertenece a tu empresa.');
        }

        DB::transaction(function () use ($empleado, $data, $cargo) {
            // Finalizar contratos activos previos
            Contrato::where('empleado_id', $empleado->id)
                ->where('estado', true)
                ->update(['estado' => false, 'fecha_fin' => now()]);

            Contrato::create([
                'empleado_id' => $empleado->id,
                'cargo_id' => $data['cargo_id'],
                'cargo' => $cargo->nombre,
                'tipo_contrato' => $data['tipo_contrato'],
                'salario_base' => $data['salario_base'],
                'fecha_inicio' => $data['fecha_inicio'],
                'fecha_fin' => $data['fecha_fin'] ?? null,
                'estado' => true,
            ]);

            // Asegurar que el empleado esté activo
            $empleado->update(['estado' => true]);
        });

        return back()->with('success', 'Contrato agregado y activado.');
    }

    public function update(Request $request, Contrato $contrato)
    {
        $empleado = $contrato->empleado;
        if ($empleado->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'cargo_id' => ['required', 'exists:hr_cargos,id'],
            'tipo_contrato' => 'required|string|max:100',
            'salario_base' => 'required|numeric|min:0',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'estado' => 'boolean',
        ]);

        // Validar que el cargo pertenece al tenant
        $cargo = Cargo::where('id', $data['cargo_id'])
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$cargo) {
            return back()->with('error', 'El cargo seleccionado no pertenece a tu empresa.');
        }

        $data['cargo'] = $cargo->nombre;
        $contrato->update($data);

        return back()->with('success', 'Contrato actualizado.');
    }
}
```

### CatalogoOrganizacionalController
**Ruta:** app/Modules/Hr/Controllers/CatalogoOrganizacionalController.php
```php
<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\Cargo;
use App\Modules\Hr\Models\Departamento;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CatalogoOrganizacionalController extends Controller
{
    public function index()
    {
        $tenantId = auth()->user()->tenant_id;

        $departamentos = Departamento::with(['cargos' => function ($q) {
            $q->orderBy('nombre');
        }])
            ->where('tenant_id', $tenantId)
            ->orderBy('nombre')
            ->get();

        return Inertia::render('Hr/Catalogos/Organigrama', [
            'departamentos' => $departamentos,
        ]);
    }

    // ─── Departamentos ───

    public function storeDepartamento(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:100', Rule::unique('hr_departamentos', 'nombre')->where('tenant_id', $tenantId)],
            'descripcion' => 'nullable|string|max:255',
        ]);

        Departamento::create([
            'tenant_id' => $tenantId,
            'nombre' => $data['nombre'],
            'descripcion' => $data['descripcion'] ?? null,
            'activo' => true,
        ]);

        return back()->with('success', 'Departamento creado.');
    }

    public function updateDepartamento(Request $request, Departamento $departamento)
    {
        if ($departamento->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:100', Rule::unique('hr_departamentos', 'nombre')
                ->where('tenant_id', $departamento->tenant_id)->ignore($departamento->id)],
            'descripcion' => 'nullable|string|max:255',
            'activo' => 'boolean',
        ]);

        $departamento->update($data);

        return back()->with('success', 'Departamento actualizado.');
    }

    public function destroyDepartamento(Departamento $departamento)
    {
        if ($departamento->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        if ($departamento->cargos()->count() > 0) {
            return back()->with('error', 'No se puede eliminar: hay cargos asociados a este departamento.');
        }

        $departamento->delete();

        return back()->with('success', 'Departamento eliminado.');
    }

    // ─── Cargos ───

    public function storeCargo(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'departamento_id' => ['required', 'exists:hr_departamentos,id'],
            'nombre' => ['required', 'string', 'max:100', Rule::unique('hr_cargos', 'nombre')->where('tenant_id', $tenantId)],
            'categoria_laboral' => 'required|string|in:Administrativo,Operativo,Comercial',
            'salario_base_sugerido' => 'nullable|numeric|min:0',
            'es_productivo' => 'boolean',
        ]);

        // Validar que el departamento pertenece al tenant
        $depto = Departamento::where('id', $data['departamento_id'])
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$depto) {
            return back()->with('error', 'El departamento seleccionado no pertenece a tu empresa.');
        }

        Cargo::create([
            'tenant_id' => $tenantId,
            'departamento_id' => $data['departamento_id'],
            'nombre' => $data['nombre'],
            'categoria_laboral' => $data['categoria_laboral'],
            'salario_base_sugerido' => $data['salario_base_sugerido'] ?? null,
            'es_productivo' => $data['es_productivo'] ?? false,
            'activo' => true,
        ]);

        return back()->with('success', 'Cargo creado.');
    }

    public function updateCargo(Request $request, Cargo $cargo)
    {
        if ($cargo->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'departamento_id' => ['required', 'exists:hr_departamentos,id'],
            'nombre' => ['required', 'string', 'max:100', Rule::unique('hr_cargos', 'nombre')
                ->where('tenant_id', $cargo->tenant_id)->ignore($cargo->id)],
            'categoria_laboral' => 'required|string|in:Administrativo,Operativo,Comercial',
            'salario_base_sugerido' => 'nullable|numeric|min:0',
            'es_productivo' => 'boolean',
            'activo' => 'boolean',
        ]);

        // Validar que el departamento pertenece al tenant
        $depto = Departamento::where('id', $data['departamento_id'])
            ->where('tenant_id', $cargo->tenant_id)
            ->first();

        if (!$depto) {
            return back()->with('error', 'El departamento seleccionado no pertenece a tu empresa.');
        }

        $cargo->update($data);

        return back()->with('success', 'Cargo actualizado.');
    }

    public function destroyCargo(Cargo $cargo)
    {
        if ($cargo->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        if ($cargo->contratos()->count() > 0) {
            return back()->with('error', 'No se puede eliminar: hay contratos asociados a este cargo.');
        }

        $cargo->delete();

        return back()->with('success', 'Cargo eliminado.');
    }
}
```

### AfiliacionController
**Ruta:** app/Modules/Hr/Controllers/AfiliacionController.php
```php
<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\Afiliacion;
use App\Modules\Hr\Models\Empleado;
use App\Modules\Hr\Models\EntidadParafiscal;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AfiliacionController extends Controller
{
    private static array $mapTipoEntidad = [
        'EPS' => 'Salud',
        'AFP' => 'Pensión',
        'ARL' => 'ARL',
        'CCF' => 'Caja de Compensación',
    ];

    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $search = $request->input('search');

        $afiliaciones = Afiliacion::with(['empleado', 'entidad'])
            ->whereHas('empleado', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->whereHas('entidad', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('empleado', function ($qe) use ($search) {
                        $qe->where('nombres', 'ilike', "%{$search}%")
                           ->orWhere('apellidos', 'ilike', "%{$search}%")
                           ->orWhere('documento', 'ilike', "%{$search}%");
                    })->orWhereHas('entidad', function ($qe) use ($search) {
                        $qe->where('nombre', 'ilike', "%{$search}%");
                    });
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $entidades = EntidadParafiscal::where('tenant_id', $tenantId)
            ->where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'tipo_entidad']);

        $empleados = Empleado::where('tenant_id', $tenantId)
            ->where('estado', true)
            ->orderBy('nombres')
            ->get(['id', 'nombres', 'apellidos', 'documento']);

        return Inertia::render('Hr/Afiliaciones/Index', [
            'afiliaciones' => $afiliaciones,
            'entidades' => $entidades,
            'empleados' => $empleados,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'empleado_id' => ['required', 'exists:hr_empleados,id'],
            'entidad_id' => ['required', 'exists:hr_entidades_parafiscales,id'],
            'tipo_afiliacion' => 'nullable|string|max:100',
            'fecha_afiliacion' => 'required|date',
            'numero_identificacion' => 'nullable|string|max:100',
            'activo' => 'boolean',
        ]);

        // Verificar que empleado y entidad pertenecen al tenant
        $empleado = Empleado::findOrFail($data['empleado_id']);
        if ($empleado->tenant_id !== $tenantId) {
            abort(403);
        }

        $entidad = EntidadParafiscal::findOrFail($data['entidad_id']);
        if ($entidad->tenant_id !== $tenantId) {
            abort(403);
        }

        // Derivar tipo_afiliacion desde la entidad si no se envió
        if (empty($data['tipo_afiliacion'])) {
            $data['tipo_afiliacion'] = self::$mapTipoEntidad[$entidad->tipo_entidad] ?? $entidad->tipo_entidad;
        }

        // Buscar si ya existe una afiliación activa para este empleado + entidad + tipo
        $existing = Afiliacion::where('empleado_id', $data['empleado_id'])
            ->where('entidad_id', $data['entidad_id'])
            ->where('tipo_afiliacion', $data['tipo_afiliacion'])
            ->first();

        if ($existing) {
            $existing->update([
                'fecha_afiliacion' => $data['fecha_afiliacion'],
                'numero_identificacion' => $data['numero_identificacion'] ?? null,
                'activo' => $data['activo'] ?? true,
            ]);

            return back()->with('success', 'Afiliación actualizada.');
        }

        Afiliacion::create([
            'empleado_id' => $data['empleado_id'],
            'entidad_id' => $data['entidad_id'],
            'tipo_afiliacion' => $data['tipo_afiliacion'],
            'fecha_afiliacion' => $data['fecha_afiliacion'],
            'numero_identificacion' => $data['numero_identificacion'] ?? null,
            'activo' => $data['activo'] ?? true,
        ]);

        return back()->with('success', 'Afiliación creada exitosamente.');
    }
}
```

### IncapacidadController
**Ruta:** app/Modules/Hr/Controllers/IncapacidadController.php
```php
<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\Empleado;
use App\Modules\Hr\Models\Incapacidad;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class IncapacidadController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $search = $request->input('search');
        $tipo = $request->input('tipo');

        $incapacidades = Incapacidad::with('empleado')
            ->whereHas('empleado', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->when($search, function ($query, $search) {
                $query->whereHas('empleado', function ($q) use ($search) {
                    $q->where('nombres', 'ilike', "%{$search}%")
                      ->orWhere('apellidos', 'ilike', "%{$search}%")
                      ->orWhere('documento', 'ilike', "%{$search}%");
                });
            })
            ->when($tipo, function ($query, $tipo) {
                $query->where('tipo', $tipo);
            })
            ->orderBy('fecha_inicio', 'desc')
            ->paginate(15)
            ->withQueryString();

        $empleados = Empleado::where('tenant_id', $tenantId)
            ->where('estado', true)
            ->orderBy('nombres')
            ->get(['id', 'nombres', 'apellidos', 'documento']);

        return Inertia::render('Hr/Incapacidades/Index', [
            'incapacidades' => $incapacidades,
            'empleados' => $empleados,
            'filters' => $request->only(['search', 'tipo']),
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'empleado_id' => ['required', 'exists:hr_empleados,id'],
            'tipo' => ['required', 'string', 'max:100', Rule::in(['Enfermedad General', 'Accidente Laboral', 'Enfermedad Laboral', 'Licencia Maternidad', 'Licencia Paternidad', 'Otro'])],
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
            'observaciones' => 'nullable|string|max:500',
            'porcentaje_pago' => 'nullable|numeric|min:0|max:100',
        ]);

        // Verificar que el empleado pertenece al tenant
        $empleado = Empleado::findOrFail($data['empleado_id']);
        if ($empleado->tenant_id !== $tenantId) {
            abort(403);
        }

        // Calcular días automáticamente
        $fechaInicio = \Carbon\Carbon::parse($data['fecha_inicio']);
        $fechaFin = \Carbon\Carbon::parse($data['fecha_fin']);
        $dias = $fechaInicio->diffInDays($fechaFin) + 1;

        Incapacidad::create([
            'empleado_id' => $data['empleado_id'],
            'tipo' => $data['tipo'],
            'fecha_inicio' => $data['fecha_inicio'],
            'fecha_fin' => $data['fecha_fin'],
            'dias' => $dias,
            'observaciones' => $data['observaciones'] ?? null,
            'porcentaje_pago' => $data['porcentaje_pago'] ?? null,
        ]);

        return back()->with('success', 'Incapacidad registrada exitosamente.');
    }

    public function update(Request $request, Incapacidad $incapacidad)
    {
        if ($incapacidad->empleado->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'tipo' => ['required', 'string', 'max:100', Rule::in(['Enfermedad General', 'Accidente Laboral', 'Enfermedad Laboral', 'Licencia Maternidad', 'Licencia Paternidad', 'Otro'])],
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
            'observaciones' => 'nullable|string|max:500',
            'porcentaje_pago' => 'nullable|numeric|min:0|max:100',
        ]);

        // Recalcular días
        $fechaInicio = \Carbon\Carbon::parse($data['fecha_inicio']);
        $fechaFin = \Carbon\Carbon::parse($data['fecha_fin']);
        $data['dias'] = $fechaInicio->diffInDays($fechaFin) + 1;

        $incapacidad->update($data);

        return back()->with('success', 'Incapacidad actualizada.');
    }

    public function destroy(Incapacidad $incapacidad)
    {
        if ($incapacidad->empleado->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $incapacidad->delete();

        return back()->with('success', 'Incapacidad eliminada.');
    }
}
```

### PrestamoController
**Ruta:** app/Modules/Hr/Controllers/PrestamoController.php
```php
<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\Empleado;
use App\Modules\Hr\Models\Prestamo;
use App\Modules\Hr\Models\PrestamoCuota;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PrestamoController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $search = $request->input('search');

        $prestamos = Prestamo::with('empleado')
            ->whereHas('empleado', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->when($search, function ($query, $search) {
                $query->whereHas('empleado', function ($q) use ($search) {
                    $q->where('nombres', 'ilike', "%{$search}%")
                      ->orWhere('apellidos', 'ilike', "%{$search}%")
                      ->orWhere('documento', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $empleados = Empleado::where('tenant_id', $tenantId)
            ->where('estado', true)
            ->orderBy('nombres')
            ->get(['id', 'nombres', 'apellidos', 'documento']);

        return Inertia::render('Hr/Prestamos/Index', [
            'prestamos' => $prestamos,
            'empleados' => $empleados,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'empleado_id' => ['required', 'exists:hr_empleados,id'],
            'monto_total' => 'required|numeric|min:1',
            'numero_cuotas' => 'required|integer|min:1|max:120',
            'descripcion' => 'nullable|string|max:500',
            'fecha_prestamo' => 'required|date',
        ]);

        // Verificar que el empleado pertenece al tenant
        $empleado = Empleado::findOrFail($data['empleado_id']);
        if ($empleado->tenant_id !== $tenantId) {
            abort(403);
        }

        $numCuotas = (int) $data['numero_cuotas'];
        $montoCuota = round($data['monto_total'] / $numCuotas, 2);

        DB::transaction(function () use ($data, $montoCuota, $numCuotas, $tenantId) {
            $prestamo = Prestamo::create([
                'empleado_id' => $data['empleado_id'],
                'monto_total' => $data['monto_total'],
                'cuotas_pactadas' => $numCuotas,
                'monto_cuota' => $montoCuota,
                'saldo_pendiente' => $data['monto_total'],
                'observaciones' => $data['descripcion'] ?? null,
                'fecha_prestamo' => $data['fecha_prestamo'],
            ]);

            // Generar cuotas mensuales
            $cuotas = [];
            $fechaBase = Carbon::parse($data['fecha_prestamo']);
            for ($i = 1; $i <= $numCuotas; $i++) {
                $ultima = $i === $numCuotas;
                // Ajustar última cuota para que suma total sea exacta
                $monto = $ultima
                    ? round($data['monto_total'] - ($montoCuota * ($numCuotas - 1)), 2)
                    : $montoCuota;

                $cuotas[] = [
                    'prestamo_id' => $prestamo->id,
                    'numero_cuota' => $i,
                    'monto' => $monto,
                    'fecha_vencimiento' => (clone $fechaBase)->addMonthsNoOverflow($i)->toDateString(),
                    'estado' => 'PENDIENTE',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            PrestamoCuota::insert($cuotas);
        });

        return back()->with('success', 'Préstamo registrado y cuotas generadas.');
    }

    public function pagarCuota(PrestamoCuota $cuota)
    {
        $prestamo = $cuota->prestamo;

        if ($prestamo->empleado->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        if ($cuota->estado === 'PAGADA') {
            return back()->with('error', 'Esta cuota ya está pagada.');
        }

        DB::transaction(function () use ($cuota, $prestamo) {
            $cuota->update([
                'estado' => 'PAGADA',
            ]);

            $nuevoSaldo = $prestamo->saldo_pendiente - $cuota->monto;
            $prestamo->update([
                'saldo_pendiente' => max($nuevoSaldo, 0),
            ]);

            // Marcar préstamo como PAGADO si todas las cuotas están pagadas
            $pendientes = PrestamoCuota::where('prestamo_id', $prestamo->id)
                ->where('estado', '!=', 'PAGADA')
                ->count();

            if ($pendientes === 0) {
                $prestamo->update(['estado' => 'PAGADO']);
            }
        });

        return back()->with('success', "Cuota #{$cuota->numero_cuota} pagada exitosamente.");
    }
}
```

### ConfiguracionLegalController
**Ruta:** app/Modules/Hr/Controllers/ConfiguracionLegalController.php
```php
<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\ConfiguracionLegal;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ConfiguracionLegalController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $year = $request->input('year');

        $configuraciones = ConfiguracionLegal::where('tenant_id', $tenantId)
            ->when($year, function ($query, $year) {
                $query->where('ano_vigencia', $year);
            })
            ->orderBy('ano_vigencia', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Hr/ConfiguracionLegal/Index', [
            'configuraciones' => $configuraciones,
            'filters' => $request->only(['year']),
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'ano_vigencia' => ['required', 'integer', 'min:2000', 'max:2100', Rule::unique('hr_configuracion_legal', 'ano_vigencia')->where('tenant_id', $tenantId)],
            'salario_minimo' => 'required|numeric|min:0',
            'auxilio_transporte' => 'required|numeric|min:0',
            'tope_auxilio_transporte_salarios' => 'nullable|numeric|min:0',
            'valor_uvt' => 'nullable|numeric|min:0',
            'aporte_salud_empleado' => 'nullable|numeric|min:0|max:100',
            'aporte_pension_empleado' => 'nullable|numeric|min:0|max:100',
            'aporte_salud_patronal' => 'nullable|numeric|min:0|max:100',
            'aporte_pension_patronal' => 'nullable|numeric|min:0|max:100',
            'caja_compensacion' => 'nullable|numeric|min:0|max:100',
            'sena' => 'nullable|numeric|min:0|max:100',
            'icbf' => 'nullable|numeric|min:0|max:100',
        ]);

        ConfiguracionLegal::create([
            'tenant_id' => $tenantId,
            'ano_vigencia' => $data['ano_vigencia'],
            'salario_minimo' => $data['salario_minimo'],
            'auxilio_transporte' => $data['auxilio_transporte'],
            'tope_auxilio_transporte_salarios' => $data['tope_auxilio_transporte_salarios'] ?? null,
            'valor_uvt' => $data['valor_uvt'] ?? null,
            'aporte_salud_empleado' => $data['aporte_salud_empleado'] ?? null,
            'aporte_pension_empleado' => $data['aporte_pension_empleado'] ?? null,
            'aporte_salud_patronal' => $data['aporte_salud_patronal'] ?? null,
            'aporte_pension_patronal' => $data['aporte_pension_patronal'] ?? null,
            'caja_compensacion' => $data['caja_compensacion'] ?? null,
            'sena' => $data['sena'] ?? null,
            'icbf' => $data['icbf'] ?? null,
        ]);

        return back()->with('success', 'Configuración legal creada.');
    }

    public function update(Request $request, ConfiguracionLegal $configuracionLegal)
    {
        if ($configuracionLegal->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'salario_minimo' => 'required|numeric|min:0',
            'auxilio_transporte' => 'required|numeric|min:0',
            'tope_auxilio_transporte_salarios' => 'nullable|numeric|min:0',
            'valor_uvt' => 'nullable|numeric|min:0',
            'aporte_salud_empleado' => 'nullable|numeric|min:0|max:100',
            'aporte_pension_empleado' => 'nullable|numeric|min:0|max:100',
            'aporte_salud_patronal' => 'nullable|numeric|min:0|max:100',
            'aporte_pension_patronal' => 'nullable|numeric|min:0|max:100',
            'caja_compensacion' => 'nullable|numeric|min:0|max:100',
            'sena' => 'nullable|numeric|min:0|max:100',
            'icbf' => 'nullable|numeric|min:0|max:100',
        ]);

        $configuracionLegal->update($data);

        return back()->with('success', 'Configuración legal actualizada.');
    }
}
```

## Models

### Empleado
**Ruta:** app/Modules/Hr/Models/Empleado.php
```php
<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Models\Sede;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Empleado extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_empleados';
    protected $guarded = ['id'];

    protected $casts = [
        'estado' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sede(): BelongsTo
    {
        return $this->belongsTo(Sede::class);
    }

    public function asistencias(): HasMany
    {
        return $this->hasMany(Asistencia::class);
    }

    public function contratos(): HasMany
    {
        return $this->hasMany(Contrato::class);
    }

    public function contratoActivo()
    {
        return $this->hasOne(Contrato::class)->where('estado', true)->latest('fecha_inicio');
    }
}
```

### Contrato
**Ruta:** app/Modules/Hr/Models/Contrato.php
```php
<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contrato extends Model
{
    use BelongsToTenant;
    protected $table = 'hr_contratos';
    protected $fillable = [
        'empleado_id',
        'cargo_id',
        'tipo_contrato',
        'cargo',
        'salario_base',
        'fecha_inicio',
        'fecha_fin',
        'estado',
    ];

    protected $casts = [
        'salario_base' => 'decimal:2',
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'estado' => 'boolean',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function cargoRel(): BelongsTo
    {
        return $this->belongsTo(Cargo::class, 'cargo_id');
    }
}
```

### Cargo
**Ruta:** app/Modules/Hr/Models/Cargo.php
```php
<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cargo extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_cargos';
    protected $guarded = ['id'];

    protected $casts = [
        'salario_base_sugerido' => 'decimal:2',
        'es_productivo' => 'boolean',
        'activo' => 'boolean',
    ];

    public function departamento(): BelongsTo
    {
        return $this->belongsTo(Departamento::class);
    }

    public function contratos(): HasMany
    {
        return $this->hasMany(Contrato::class, 'cargo_id');
    }
}
```

### Departamento
**Ruta:** app/Modules/Hr/Models/Departamento.php
```php
<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Departamento extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_departamentos';
    protected $guarded = ['id'];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function cargos(): HasMany
    {
        return $this->hasMany(Cargo::class);
    }
}
```

### Asistencia
**Ruta:** app/Modules/Hr/Models/Asistencia.php
```php
<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Asistencia extends Model
{
    use BelongsToTenant;
    protected $table = 'hr_asistencias';
    protected $guarded = ['id'];

    protected $casts = [
        'fecha' => 'date',
        'hora_entrada' => 'datetime:H:i:s',
        'hora_salida' => 'datetime:H:i:s',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }
}
```

### Afiliacion
**Ruta:** app/Modules/Hr/Models/Afiliacion.php
```php
<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Afiliacion extends Model
{
    use BelongsToTenant;
    protected $table = 'hr_afiliaciones';

    protected $guarded = ['id'];

    protected $casts = [
        'fecha_afiliacion' => 'date',
        'activo' => 'boolean',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function entidad(): BelongsTo
    {
        return $this->belongsTo(EntidadParafiscal::class, 'entidad_id');
    }
}
```

### Incapacidad
**Ruta:** app/Modules/Hr/Models/Incapacidad.php
```php
<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Incapacidad extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $table = 'hr_incapacidades';

    protected $guarded = ['id'];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'porcentaje_pago' => 'decimal:2',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }
}
```

### Prestamo
**Ruta:** app/Modules/Hr/Models/Prestamo.php
```php
<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Prestamo extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $table = 'hr_prestamos';

    protected $guarded = ['id'];

    protected $casts = [
        'monto_total' => 'decimal:2',
        'monto_cuota' => 'decimal:2',
        'saldo_pendiente' => 'decimal:2',
        'fecha_prestamo' => 'date',
        'cuotas_pactadas' => 'integer',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function cuotas(): HasMany
    {
        return $this->hasMany(PrestamoCuota::class);
    }
}
```

### PrestamoCuota
**Ruta:** app/Modules/Hr/Models/PrestamoCuota.php
```php
<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrestamoCuota extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_prestamo_cuotas';

    protected $guarded = ['id'];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha_vencimiento' => 'date',
    ];

    public function prestamo(): BelongsTo
    {
        return $this->belongsTo(Prestamo::class);
    }

    public function nomina(): BelongsTo
    {
        if (!class_exists(\App\Modules\Payroll\Models\Nomina::class)) {
            return $this->belongsTo(\App\Modules\Payroll\Models\Nomina::class)->whereRaw('1 = 0');
        }
        return $this->belongsTo(\App\Modules\Payroll\Models\Nomina::class);
    }
}
```

### EntidadParafiscal
**Ruta:** app/Modules/Hr/Models/EntidadParafiscal.php
```php
<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EntidadParafiscal extends Model
{
    use BelongsToTenant;
    protected $table = 'hr_entidades_parafiscales';

    protected $guarded = ['id'];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function afiliaciones(): HasMany
    {
        return $this->hasMany(Afiliacion::class, 'entidad_id');
    }
}
```

### ConfiguracionLegal
**Ruta:** app/Modules/Hr/Models/ConfiguracionLegal.php
```php
<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConfiguracionLegal extends Model
{
    use BelongsToTenant;
    protected $table = 'hr_configuracion_legal';

    protected $guarded = ['id'];

    protected $casts = [
        'salario_minimo' => 'decimal:2',
        'auxilio_transporte' => 'decimal:2',
        'tope_auxilio_transporte_salarios' => 'decimal:2',
        'valor_uvt' => 'decimal:2',
        'aporte_salud_empleado' => 'decimal:2',
        'aporte_pension_empleado' => 'decimal:2',
        'aporte_salud_patronal' => 'decimal:2',
        'aporte_pension_patronal' => 'decimal:2',
        'caja_compensacion' => 'decimal:2',
        'sena' => 'decimal:2',
        'icbf' => 'decimal:2',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
```

## Services

### HrProvisioner
**Ruta:** app/Modules/Hr/Services/HrProvisioner.php
```php
<?php

namespace App\Modules\Hr\Services;

use App\Core\Models\Tenant;
use App\Modules\Hr\Models\ConfiguracionLegal;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class HrProvisioner
{
    /**
     * Siembra datos iniciales de RRHH para un tenant:
     * - Configuración legal por defecto (año actual)
     * - Entidades parafiscales por defecto (EPS, ARL, AFP, CCF)
     * - Permisos extra de RRHH
     */
    public function provisionForTenant(Tenant $tenant): void
    {
        $tenantId = $tenant->id;

        // ─── Configuración legal por defecto (año actual) ───
        $currentYear = (int) date('Y');
        ConfiguracionLegal::firstOrCreate(
            ['tenant_id' => $tenantId, 'ano_vigencia' => $currentYear],
            [
                'salario_minimo' => 1400000,
                'auxilio_transporte' => 200000,
                'tope_auxilio_transporte_salarios' => 2,
                'valor_uvt' => 47000,
                'horas_semanales' => 46,
                'aporte_salud_empleado' => 4,
                'aporte_pension_empleado' => 4,
                'aporte_salud_patronal' => 8.5,
                'aporte_pension_patronal' => 12,
                'caja_compensacion' => 4,
                'sena' => 2,
                'icbf' => 3,
            ]
        );

        // ─── Entidades parafiscales por defecto ───
        $entidades = [
            // EPS - Salud
            ['nombre' => 'Sura EPS', 'tipo_entidad' => 'EPS', 'nit' => '800251149-1', 'activo' => true],
            ['nombre' => 'Nueva EPS', 'tipo_entidad' => 'EPS', 'nit' => '900226827-1', 'activo' => true],
            ['nombre' => 'Sanitas EPS', 'tipo_entidad' => 'EPS', 'nit' => '800251269-8', 'activo' => true],
            ['nombre' => 'Coomeva EPS', 'tipo_entidad' => 'EPS', 'nit' => '800252184-6', 'activo' => true],
            ['nombre' => 'Compensar EPS', 'tipo_entidad' => 'EPS', 'nit' => '860012384-5', 'activo' => true],

            // AFP - Pensiones
            ['nombre' => 'Porvenir', 'tipo_entidad' => 'AFP', 'nit' => '800131477-0', 'activo' => true],
            ['nombre' => 'Protección', 'tipo_entidad' => 'AFP', 'nit' => '800144331-1', 'activo' => true],
            ['nombre' => 'Colfondos', 'tipo_entidad' => 'AFP', 'nit' => '800224362-7', 'activo' => true],
            ['nombre' => 'Colpensiones', 'tipo_entidad' => 'AFP', 'nit' => '899999001-1', 'activo' => true],

            // ARL
            ['nombre' => 'Sura ARL', 'tipo_entidad' => 'ARL', 'nit' => '800251149-1', 'activo' => true],
            ['nombre' => 'Positiva ARL', 'tipo_entidad' => 'ARL', 'nit' => '800130753-1', 'activo' => true],
            ['nombre' => 'Colmena ARL', 'tipo_entidad' => 'ARL', 'nit' => '800252099-1', 'activo' => true],
            ['nombre' => 'Bolívar ARL', 'tipo_entidad' => 'ARL', 'nit' => '860012987-8', 'activo' => true],

            // CCF - Cajas de Compensación
            ['nombre' => 'Compensar', 'tipo_entidad' => 'CCF', 'nit' => '860012384-5', 'activo' => true],
            ['nombre' => 'Colsubsidio', 'tipo_entidad' => 'CCF', 'nit' => '860002573-5', 'activo' => true],
            ['nombre' => 'Cafam', 'tipo_entidad' => 'CCF', 'nit' => '860005225-8', 'activo' => true],
            ['nombre' => 'Comfama', 'tipo_entidad' => 'CCF', 'nit' => '890900452-8', 'activo' => true],
            ['nombre' => 'Comfandi', 'tipo_entidad' => 'CCF', 'nit' => '890901315-2', 'activo' => true],
        ];

        foreach ($entidades as $data) {
            $data['tenant_id'] = $tenantId;
            \App\Modules\Hr\Models\EntidadParafiscal::firstOrCreate(
                ['tenant_id' => $tenantId, 'nombre' => $data['nombre']],
                $data
            );
        }

        // ─── Permisos extra a ADMIN_EMPRESA ───
        $registrar = app(PermissionRegistrar::class);
        $previous = $registrar->getPermissionsTeamId();
        $registrar->setPermissionsTeamId($tenantId);

        $extraPerms = ['hr:edit', 'hr:delete'];
        foreach ($extraPerms as $permName) {
            Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'web']);
            $role = Role::where('team_id', $tenantId)
                ->where('name', config('roles.default_tenant_admin', 'ADMIN_EMPRESA'))
                ->first();
            if ($role) {
                $role->givePermissionTo($permName);
            }
        }

        $registrar->setPermissionsTeamId($previous);
    }
}
```

## Migrations

### 2026_06_20_135001_create_hr_tables.php
**Ruta:** app/Modules/Hr/Migrations/2026_06_20_135001_create_hr_tables.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_empleados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // Si el empleado usa el sistema
            $table->foreignId('sede_id')->constrained('core_sedes')->cascadeOnDelete();
            $table->string('documento', 50)->unique();
            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->string('email', 150)->nullable();
            $table->string('telefono', 50)->nullable();
            $table->string('cargo', 100);
            $table->decimal('salario_base', 15, 2);
            $table->date('fecha_ingreso');
            $table->date('fecha_retiro')->nullable();
            $table->boolean('estado')->default(true); // Activo / Inactivo
            $table->timestamps();
            
            $table->index(['tenant_id', 'estado']);
        });

        Schema::create('hr_asistencias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empleado_id')->constrained('hr_empleados')->cascadeOnDelete();
            $table->date('fecha');
            $table->string('tipo', 50)->default('asistencia'); // asistencia, falta, incapacidad, vacaciones
            $table->time('hora_entrada')->nullable();
            $table->time('hora_salida')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->unique(['empleado_id', 'fecha']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_asistencias');
        Schema::dropIfExists('hr_empleados');
    }
};
```

### 2026_06_20_135002_create_hr_contratos_table.php
**Ruta:** app/Modules/Hr/Migrations/2026_06_20_135002_create_hr_contratos_table.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Crear la nueva tabla hr_contratos
        Schema::create('hr_contratos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empleado_id')->constrained('hr_empleados')->cascadeOnDelete();
            $table->string('tipo_contrato', 100); // indefinido, termino_fijo, prestacion_servicios, obra_labor
            $table->string('cargo', 100);
            $table->decimal('salario_base', 15, 2);
            $table->date('fecha_inicio');
            $table->date('fecha_fin')->nullable();
            $table->boolean('estado')->default(true); // Activo (true) o Finalizado (false)
            $table->timestamps();
        });

        // 2. Modificar hr_empleados para remover columnas que ahora van en contrato
        Schema::table('hr_empleados', function (Blueprint $table) {
            $table->dropColumn(['cargo', 'salario_base', 'fecha_ingreso', 'fecha_retiro']);
        });
    }

    public function down(): void
    {
        // Revertir hr_empleados
        Schema::table('hr_empleados', function (Blueprint $table) {
            $table->string('cargo', 100)->nullable();
            $table->decimal('salario_base', 15, 2)->nullable();
            $table->date('fecha_ingreso')->nullable();
            $table->date('fecha_retiro')->nullable();
        });

        Schema::dropIfExists('hr_contratos');
    }
};
```

### 2026_06_20_135003_create_hr_organigrama_tables.php
**Ruta:** app/Modules/Hr/Migrations/2026_06_20_135003_create_hr_organigrama_tables.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Departamentos
        Schema::create('hr_departamentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('nombre', 100);
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'nombre']);
        });

        // 2. Cargos (posiciones laborales)
        Schema::create('hr_cargos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('departamento_id')->constrained('hr_departamentos')->cascadeOnDelete();
            $table->string('nombre', 100);
            $table->string('categoria_laboral', 50)->default('Operativo'); // Administrativo, Operativo, Comercial
            $table->decimal('salario_base_sugerido', 15, 2)->nullable();
            $table->boolean('es_productivo')->default(false); // true = puede ser técnico en ServiceDesk
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'nombre']);
        });

        // 3. Agregar cargo_id a hr_contratos (nullable para migración gradual)
        Schema::table('hr_contratos', function (Blueprint $table) {
            $table->foreignId('cargo_id')->nullable()->after('empleado_id')->constrained('hr_cargos')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('hr_contratos', function (Blueprint $table) {
            $table->dropForeign(['cargo_id']);
            $table->dropColumn('cargo_id');
        });
        Schema::dropIfExists('hr_cargos');
        Schema::dropIfExists('hr_departamentos');
    }
};
```

### 2026_06_20_135004_create_hr_config_legal_tables.php
**Ruta:** app/Modules/Hr/Migrations/2026_06_20_135004_create_hr_config_legal_tables.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Configuración legal anual (SMMLV, UVT, aportes)
        Schema::create('hr_configuracion_legal', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->integer('ano_vigencia');
            $table->unique(['tenant_id', 'ano_vigencia']);
            $table->decimal('salario_minimo', 15, 2);
            $table->decimal('auxilio_transporte', 15, 2);
            $table->decimal('tope_auxilio_transporte_salarios', 5, 2)->default(2);
            $table->decimal('valor_uvt', 15, 2);
            $table->integer('horas_semanales')->default(46);
            $table->decimal('aporte_salud_empleado', 5, 2)->default(4);
            $table->decimal('aporte_pension_empleado', 5, 2)->default(4);
            $table->decimal('aporte_salud_patronal', 5, 2)->default(8.5);
            $table->decimal('aporte_pension_patronal', 5, 2)->default(12);
            $table->decimal('caja_compensacion', 5, 2)->default(4);
            $table->decimal('sena', 5, 2)->default(2);
            $table->decimal('icbf', 5, 2)->default(3);
            $table->timestamps();
        });

        // Entidades parafiscales (EPS, AFP, ARL, CCF)
        Schema::create('hr_entidades_parafiscales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('tipo_entidad', 20); // EPS, AFP, ARL, CCF
            $table->string('nombre', 200);
            $table->string('nit', 50)->nullable();
            $table->string('codigo_pila', 50)->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'tipo_entidad']);
        });

        // Afiliaciones de empleados a entidades
        Schema::create('hr_afiliaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empleado_id')->constrained('hr_empleados')->cascadeOnDelete();
            $table->foreignId('entidad_id')->constrained('hr_entidades_parafiscales')->cascadeOnDelete();
            $table->date('fecha_afiliacion');
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->unique(['empleado_id', 'entidad_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_afiliaciones');
        Schema::dropIfExists('hr_entidades_parafiscales');
        Schema::dropIfExists('hr_configuracion_legal');
    }
};
```

### 2026_06_20_135005_create_hr_prestamos_incapacidades.php
**Ruta:** app/Modules/Hr/Migrations/2026_06_20_135005_create_hr_prestamos_incapacidades.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Préstamos a empleados
        Schema::create('hr_prestamos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empleado_id')->constrained('hr_empleados')->cascadeOnDelete();
            $table->decimal('monto_total', 15, 2);
            $table->integer('cuotas_pactadas');
            $table->decimal('monto_cuota', 15, 2);
            $table->decimal('saldo_pendiente', 15, 2);
            $table->date('fecha_prestamo');
            $table->string('estado', 30)->default('ACTIVO'); // ACTIVO, PAGADO, ANULADO
            $table->text('observaciones')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['empleado_id', 'estado']);
        });

        // Cuotas de préstamos
        Schema::create('hr_prestamo_cuotas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prestamo_id')->constrained('hr_prestamos')->cascadeOnDelete();
            $table->integer('numero_cuota');
            $table->decimal('monto', 15, 2);
            $table->date('fecha_vencimiento');
            $table->string('estado', 30)->default('PENDIENTE'); // PENDIENTE, PAGADA
            $table->foreignId('nomina_id')->nullable()->index();
            $table->timestamps();

            $table->index(['prestamo_id', 'estado']);
        });

        // Incapacidades y licencias
        Schema::create('hr_incapacidades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empleado_id')->constrained('hr_empleados')->cascadeOnDelete();
            $table->string('tipo', 50); // ENFERMEDAD_GENERAL, LABORAL, MATERNIDAD, LICENCIA
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->integer('dias');
            $table->decimal('porcentaje_pago', 5, 2)->default(0);
            $table->text('observaciones')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['empleado_id', 'fecha_inicio', 'fecha_fin']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_incapacidades');
        Schema::dropIfExists('hr_prestamo_cuotas');
        Schema::dropIfExists('hr_prestamos');
    }
};
```

### 2026_07_05_000001_fix_hr_module_patch.php
**Ruta:** app/Modules/Hr/Migrations/2026_07_05_000001_fix_hr_module_patch.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bug #6, #13: Agregar BelongsToTenant a modelos faltantes.
     * Tablas que ya tienen tenant_id (migración original): hr_empleados, hr_departamentos,
     * hr_cargos, hr_configuracion_legal, hr_entidades_parafiscales.
     * Las siguientes NO lo tiene y se agregan aquí.
     */
    public function up(): void
    {
        // hr_contratos — Bug #6
        Schema::table('hr_contratos', function (Blueprint $table) {
            if (!Schema::hasColumn('hr_contratos', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });

        // hr_asistencias — Bug #6
        Schema::table('hr_asistencias', function (Blueprint $table) {
            if (!Schema::hasColumn('hr_asistencias', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });

        // hr_prestamos — Bug #6
        Schema::table('hr_prestamos', function (Blueprint $table) {
            if (!Schema::hasColumn('hr_prestamos', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });

        // hr_prestamo_cuotas — Bug #6
        Schema::table('hr_prestamo_cuotas', function (Blueprint $table) {
            if (!Schema::hasColumn('hr_prestamo_cuotas', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });

        // hr_incapacidades — Bug #6
        Schema::table('hr_incapacidades', function (Blueprint $table) {
            if (!Schema::hasColumn('hr_incapacidades', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });

        // hr_afiliaciones — Bug #6 (ya se agregaron tipo_afiliacion y numero_identificacion arriba)
        Schema::table('hr_afiliaciones', function (Blueprint $table) {
            if (!Schema::hasColumn('hr_afiliaciones', 'tipo_afiliacion')) {
                $table->string('tipo_afiliacion', 100)->nullable()->after('entidad_id');
            }
            if (!Schema::hasColumn('hr_afiliaciones', 'numero_identificacion')) {
                $table->string('numero_identificacion', 100)->nullable()->after('fecha_afiliacion');
            }
            if (!Schema::hasColumn('hr_afiliaciones', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        $tables = ['hr_contratos', 'hr_asistencias', 'hr_prestamos', 'hr_prestamo_cuotas', 'hr_incapacidades', 'hr_afiliaciones'];
        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $t) use ($table) {
                if (Schema::hasColumn($table, 'tenant_id')) {
                    $t->dropForeign([$table . '_tenant_id_foreign']);
                    $t->dropColumn('tenant_id');
                }
            });
        }
    }
};
```

### 2026_07_05_000002_fix_hr_sede_cascade.php
**Ruta:** app/Modules/Hr/Migrations/2026_07_05_000002_fix_hr_sede_cascade.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hr_empleados', function (Blueprint $table) {
            $table->dropForeign(['sede_id']);
            $table->foreign('sede_id')->references('id')->on('core_sedes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('hr_empleados', function (Blueprint $table) {
            $table->dropForeign(['sede_id']);
            $table->foreign('sede_id')->references('id')->on('core_sedes')->cascadeOnDelete();
        });
    }
};
```

## Frontend (JSX)

### Hr/Dashboard
**Ruta:** resources/js/Pages/Hr/Dashboard.jsx
```jsx
import { useState, useEffect } from 'react'
import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { StatCard } from '@/Components/ui/stat-card'
import { PageHeader } from '@/Components/ui/page-header'
import {
  Users,
  FileText,
  DollarSign,
  HeartPulse,
  UserPlus,
  ArrowRight,
  Building2,
  CreditCard,
  Activity,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react'

/**
 * Dashboard de RRHH con KPIs y accesos rápidos.
 * @param {{ total_empleados_activos: number, total_contratos_vigentes: number, total_prestamos_activos: number, total_incapacidades_activas: number, empleados_ultimo_mes: number }} props
 */
export default function HrDashboard({
  total_empleados_activos = 0,
  total_contratos_vigentes = 0,
  total_prestamos_activos = 0,
  total_incapacidades_activas = 0,
  empleados_ultimo_mes = 0,
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const kpis = [
    {
      label: 'Empleados Activos',
      value: total_empleados_activos,
      icon: Users,
      accent: 'indigo',
      hint: 'Colaboradores activos en la empresa',
    },
    {
      label: 'Contratos Vigentes',
      value: total_contratos_vigentes,
      icon: FileText,
      accent: 'emerald',
      hint: 'Contratos actualmente activos',
    },
    {
      label: 'Préstamos Activos',
      value: total_prestamos_activos,
      icon: DollarSign,
      accent: 'amber',
      hint: 'Préstamos con saldo pendiente',
    },
    {
      label: 'Incapacidades Activas',
      value: total_incapacidades_activas,
      icon: HeartPulse,
      accent: 'rose',
      hint: 'Incapacidades vigentes hoy',
    },
    {
      label: 'Nuevos en el último mes',
      value: empleados_ultimo_mes,
      icon: UserPlus,
      accent: 'sky',
      hint: 'Empleados incorporados',
    },
  ]

  const quickAccessLinks = [
    {
      label: 'Empleados',
      description: 'Gestiona la información del personal',
      icon: Users,
      route: 'hr.empleados.index',
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400',
    },
    {
      label: 'Préstamos',
      description: 'Administra préstamos y cuotas',
      icon: CreditCard,
      route: 'hr.prestamos.index',
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
    },
    {
      label: 'Incapacidades',
      description: 'Registra incapacidades y licencias',
      icon: Stethoscope,
      route: 'hr.incapacidades.index',
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
    },
    {
      label: 'Organigrama',
      description: 'Departamentos y cargos',
      icon: Building2,
      route: 'hr.catalogos.organigrama',
      color: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400',
    },
    {
      label: 'Afiliaciones',
      description: 'EPS, AFP, ARL y CCF',
      icon: ShieldCheck,
      route: 'hr.afiliaciones.index',
      color: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400',
    },
    {
      label: 'Configuración Legal',
      description: 'SMMLV, UVT y aportes',
      icon: FileText,
      route: 'hr.configuracion-legal.index',
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400',
    },
  ].filter((a) => route().has(a.route))

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard RRHH" />

      <PageHeader
        title="Dashboard RRHH"
        description="Resumen general del módulo de Recursos Humanos"
        icon={Activity}
      />

      {/* KPIs Grid */}
      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5 transition-all duration-500 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Acceso rápido y módulos */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Acceso rápido */}
        <section className="rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Activity className="h-4 w-4 text-indigo-500" />
            Acceso rápido
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Las secciones más utilizadas del módulo de RRHH.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {quickAccessLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.route}
                  href={route(link.route)}
                  className="group flex items-start gap-3 rounded-xl border border-border bg-background p-4 transition-all hover:border-indigo-300 hover:shadow-sm hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${link.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {link.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {link.description}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                </Link>
              )
            })}
          </div>
        </section>

        {/* Resumen informativo */}
        <section className="rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Building2 className="h-4 w-4 text-indigo-500" />
            Resumen de Personal
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Indicadores clave de tu fuerza laboral.
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">Total empleados</p>
                  <p className="text-xs text-muted-foreground">Activos en el sistema</p>
                </div>
              </div>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {total_empleados_activos}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">Contratos vigentes</p>
                  <p className="text-xs text-muted-foreground">Relaciones laborales activas</p>
                </div>
              </div>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {total_contratos_vigentes}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                  <DollarSign className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">Préstamos activos</p>
                  <p className="text-xs text-muted-foreground">Con saldo pendiente</p>
                </div>
              </div>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {total_prestamos_activos}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                  <HeartPulse className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">Incapacidades activas</p>
                  <p className="text-xs text-muted-foreground">Vigentes al día de hoy</p>
                </div>
              </div>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {total_incapacidades_activas}
              </span>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{empleados_ultimo_mes}</span>{' '}
              {empleados_ultimo_mes === 1 ? 'empleado se ha' : 'empleados se han'} incorporado en
              los últimos 30 días.
            </p>
          </div>
        </section>
      </div>
    </AuthenticatedLayout>
  )
}
```

### Hr/Empleados/Index
**Ruta:** resources/js/Pages/Hr/Empleados/Index.jsx
```jsx
import { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Search, IdCard, Plus, UserCircle2 } from 'lucide-react'

export default function EmpleadosIndex({ empleados, filters }) {
  const [search, setSearch] = useState(filters.search || '')

  const handleSearch = (e) => {
    e.preventDefault()
    router.get(route('hr.empleados.index'), { search }, { preserveState: true })
  }

  const columns = [
    { 
        key: 'empleado', 
        header: 'Empleado', 
        cell: (e) => (
            <div className="flex items-center gap-3">
                <div className="bg-slate-100 rounded-full p-2 text-slate-400">
                    <UserCircle2 className="h-6 w-6" />
                </div>
                <div>
                    <Link href={route('hr.empleados.show', e.id)} className="font-semibold text-primary hover:underline">
                        {e.nombres} {e.apellidos}
                    </Link>
                    <div className="text-xs text-muted-foreground">{e.documento}</div>
                </div>
            </div>
        )
    },
    { 
        key: 'cargo', 
        header: 'Cargo Actual', 
        cell: (e) => e.contrato_activo ? e.contrato_activo.cargo : <span className="text-muted-foreground italic">Sin contrato activo</span>
    },
    { 
        key: 'salario', 
        header: 'Salario Base', 
        cell: (e) => e.contrato_activo ? `$${Number(e.contrato_activo.salario_base).toLocaleString()}` : '—'
    },
    { 
        key: 'tipo_contrato', 
        header: 'Tipo de Contrato', 
        cell: (e) => {
            if (!e.contrato_activo) return '—'
            const tipos = {
                'indefinido': 'Indefinido',
                'termino_fijo': 'Término Fijo',
                'obra_labor': 'Obra o Labor',
                'prestacion_servicios': 'Prestación Servicios'
            }
            return tipos[e.contrato_activo.tipo_contrato] || e.contrato_activo.tipo_contrato
        }
    },
    { 
        key: 'estado', 
        header: 'Estado', 
        cell: (e) => (
            <Badge variant={e.estado ? 'secondary' : 'outline'} className={e.estado ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                {e.estado ? 'Activo' : 'Inactivo'}
            </Badge>
        )
    },
  ]

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><IdCard className="h-6 w-6 text-primary" /> Nómina y Empleados</h2>
          <p className="text-muted-foreground">Gestiona la información de tu personal y sus contratos.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="flex gap-2 w-full">
            <Input
              placeholder="Buscar por nombre o documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background max-w-[250px]"
            />
            <Button type="submit" variant="secondary" size="icon"><Search className="h-4 w-4" /></Button>
          </form>
          <Link href={route('hr.empleados.create')}>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nuevo Empleado</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {empleados.data.length > 0 ? (
            <DataTable columns={columns} data={empleados.data} />
          ) : (
            <div className="py-12">
              <EmptyState
                icon={IdCard}
                title="No hay empleados"
                description="Aún no se han registrado empleados en el sistema."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  )
}
```

### Hr/Empleados/Create
**Ruta:** resources/js/Pages/Hr/Empleados/Create.jsx
```jsx
import { useState } from 'react'
import { router, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Separator } from '@/Components/ui/separator'
import { ArrowLeft, IdCard, Save, UserPlus, ChevronDown } from 'lucide-react'

const selectClass = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export default function CreateEmpleado({ sedes, roles }) {
  const { data, setData, post, processing, errors } = useForm({
    documento: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    sede_id: '',
    crear_usuario: false,
    user_email: '',
    user_password: '',
    user_role: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    post(route('hr.empleados.store'))
  }

  return (
    <AuthenticatedLayout>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.get(route('hr.empleados.index'))}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <IdCard className="h-6 w-6 text-primary" /> Nuevo Empleado
          </h2>
          <p className="text-muted-foreground">Registra un nuevo colaborador y su contrato inicial.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Datos personales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos Personales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documento">Documento *</Label>
              <Input id="documento" name="documento" value={data.documento} onChange={(e) => setData('documento', e.target.value)} placeholder="Cédula o NIT" />
              {errors.documento && <p className="text-xs text-destructive">{errors.documento}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sede_id">Sede *</Label>
              <select id="sede_id" name="sede_id" value={data.sede_id} onChange={(e) => setData('sede_id', e.target.value)} className={selectClass}>
                <option value="">Seleccionar sede…</option>
                {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              {errors.sede_id && <p className="text-xs text-destructive">{errors.sede_id}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres *</Label>
              <Input id="nombres" name="nombres" value={data.nombres} onChange={(e) => setData('nombres', e.target.value)} placeholder="Nombres" />
              {errors.nombres && <p className="text-xs text-destructive">{errors.nombres}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input id="apellidos" name="apellidos" value={data.apellidos} onChange={(e) => setData('apellidos', e.target.value)} placeholder="Apellidos" />
              {errors.apellidos && <p className="text-xs text-destructive">{errors.apellidos}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" name="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="correo@ejemplo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" value={data.telefono} onChange={(e) => setData('telefono', e.target.value)} placeholder="Teléfono" />
            </div>
          </CardContent>
        </Card>



        {/* Usuario de sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Usuario de Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={data.crear_usuario} onChange={(e) => setData('crear_usuario', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              <span className="text-sm font-medium">Crear usuario para acceso al sistema</span>
            </label>

            {data.crear_usuario && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border">
                <div className="space-y-2">
                  <Label htmlFor="user_email">Correo de acceso</Label>
                  <Input id="user_email" type="email" value={data.user_email} onChange={(e) => setData('user_email', e.target.value)} placeholder={data.email || 'correo@ejemplo.com'} />
                  <p className="text-xs text-muted-foreground">Si se deja vacío, usa el correo personal.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user_password">Contraseña</Label>
                  <Input id="user_password" type="text" value={data.user_password} onChange={(e) => setData('user_password', e.target.value)} placeholder="Se generará automáticamente" />
                  <p className="text-xs text-muted-foreground">Mín. 8 caracteres. Vacío = aleatoria.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user_role">Rol *</Label>
                  <select id="user_role" value={data.user_role} onChange={(e) => setData('user_role', e.target.value)} className={selectClass}>
                    <option value="">Seleccionar rol…</option>
                    {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botón guardar */}
        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => router.get(route('hr.empleados.index'))}>
            Cancelar
          </Button>
          <Button type="submit" disabled={processing} className="gap-2">
            <Save className="h-4 w-4" /> {processing ? 'Guardando…' : 'Guardar Empleado'}
          </Button>
        </div>
      </form>
    </AuthenticatedLayout>
  )
}
```

### Hr/Empleados/Show
**Ruta:** resources/js/Pages/Hr/Empleados/Show.jsx
```jsx
import { useState } from 'react'
import { Link, useForm, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { ArrowLeft, UserCircle2, Mail, Phone, MapPin, FileSignature, CalendarDays, DollarSign, Building2, Briefcase, Edit, Wrench } from 'lucide-react'

const selectClass = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

const TIPOS_CONTRATO = {
  'indefinido': 'Indefinido',
  'termino_fijo': 'Término Fijo',
  'obra_labor': 'Obra o Labor',
  'prestacion_servicios': 'Prestación Servicios',
}

export default function EmpleadosShow({ empleado, sedes, cargos = [] }) {
  const [activeTab, setActiveTab] = useState('contratos')
  const [showNewContract, setShowNewContract] = useState(false)

  const { data: cData, setData: setCData, post: postContrato, processing: cLoading, errors: cErrors, reset: resetC } = useForm({
    cargo_id: '',
    tipo_contrato: 'indefinido',
    salario_base: '',
    fecha_inicio: '',
    fecha_fin: '',
  })

  const contratos = empleado.contratos || []
  const contratoActivo = contratos.find(c => c.estado)

  const handleNewContract = (e) => {
    e.preventDefault()
    postContrato(route('hr.contratos.store', empleado.id), {
      preserveScroll: true,
      onSuccess: () => { setShowNewContract(false); resetC() }
    })
  }

  return (
    <AuthenticatedLayout>
      <div className="flex items-center gap-4 mb-6">
        <Link href={route('hr.empleados.index')}>
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
            <h2 className="text-2xl font-bold flex items-center gap-3">
                {empleado.nombres} {empleado.apellidos}
                <Badge variant={empleado.estado ? 'secondary' : 'outline'} className={empleado.estado ? 'bg-emerald-100 text-emerald-700' : ''}>
                    {empleado.estado ? 'Activo' : 'Inactivo'}
                </Badge>
            </h2>
            <p className="text-muted-foreground flex gap-2 items-center text-sm">
                <Briefcase className="h-4 w-4" /> Documento: {empleado.documento}
            </p>
        </div>
        <div className="flex gap-2">
          {empleado.user && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
              <UserCircle2 className="h-3 w-3" /> {empleado.user.email}
            </Badge>
          )}
          <Link href={route('hr.empleados.edit', empleado.id)}>
            <Button variant="outline" size="sm" className="gap-1"><Edit className="h-3.5 w-3.5" /> Editar</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo: Info Personal */}
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center text-center space-y-3 mb-6">
                        <div className="bg-slate-100 p-6 rounded-full text-slate-300">
                            <UserCircle2 className="h-16 w-16" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{empleado.nombres} {empleado.apellidos}</h3>
                            {contratoActivo?.cargo_rel && (
                              <p className="text-sm text-slate-500 flex items-center justify-center gap-1">
                                {contratoActivo.cargo_rel.es_productivo ? <Wrench className="h-3.5 w-3.5 text-amber-500" /> : <Briefcase className="h-3.5 w-3.5" />}
                                {contratoActivo.cargo}
                              </p>
                            )}
                            {contratoActivo?.cargo_rel?.departamento && (
                              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                                <Building2 className="h-3 w-3" /> {contratoActivo.cargo_rel.departamento.nombre}
                              </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 text-sm border-t pt-4 mt-4">
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span>{empleado.email || 'No registrado'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-slate-400" />
                            <span>{empleado.telefono || 'No registrado'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span>Sede: {empleado.sede?.nombre || '—'}</span>
                        </div>
                        {empleado.user && (
                          <div className="flex items-center gap-3 pt-2 border-t">
                            <UserCircle2 className="h-4 w-4 text-slate-400" />
                            <span className="text-xs text-muted-foreground">Usuario: {empleado.user.email}</span>
                          </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Panel Derecho: Tabs */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex space-x-1 bg-slate-100/50 p-1 rounded-xl">
                <button 
                    onClick={() => setActiveTab('contratos')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'contratos' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <FileSignature className="h-4 w-4" /> Contratos
                </button>
                <button 
                    onClick={() => setActiveTab('asistencias')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'asistencias' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <CalendarDays className="h-4 w-4" /> Asistencias
                </button>
            </div>

            {activeTab === 'contratos' && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
                        <CardTitle className="text-md">Historial de Contratos</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => setShowNewContract(!showNewContract)}>
                          {showNewContract ? 'Cancelar' : 'Nuevo Contrato'}
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      {showNewContract && (
                        <form onSubmit={handleNewContract} className="p-4 border-b bg-muted/20 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="nc-cargo" className="text-xs">Cargo</Label>
                              <select id="nc-cargo" value={cData.cargo_id} onChange={(e) => setCData('cargo_id', e.target.value)} className={selectClass} required>
                                <option value="">Seleccionar…</option>
                                {cargos.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.nombre}{c.departamento ? ` (${c.departamento.nombre})` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="nc-tipo" className="text-xs">Tipo</Label>
                              <select id="nc-tipo" value={cData.tipo_contrato} onChange={(e) => setCData('tipo_contrato', e.target.value)} className={selectClass}>
                                {Object.entries(TIPOS_CONTRATO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="nc-salario" className="text-xs">Salario Base</Label>
                              <Input id="nc-salario" type="number" min="0" value={cData.salario_base} onChange={(e) => setCData('salario_base', e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="nc-inicio" className="text-xs">Inicio</Label>
                              <Input id="nc-inicio" type="date" value={cData.fecha_inicio} onChange={(e) => setCData('fecha_inicio', e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="nc-fin" className="text-xs">Fin</Label>
                              <Input id="nc-fin" type="date" value={cData.fecha_fin} onChange={(e) => setCData('fecha_fin', e.target.value)} />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button type="submit" size="sm" disabled={cLoading} className="gap-1">
                              <FileSignature className="h-3.5 w-3.5" /> {cLoading ? 'Guardando…' : 'Crear Contrato'}
                            </Button>
                          </div>
                        </form>
                      )}

                        {contratos.length === 0 ? (
                            <div className="py-8 text-center text-slate-500 text-sm">No hay contratos registrados.</div>
                        ) : (
                            <div className="divide-y">
                                {contratos.map(c => (
                                    <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold">{c.cargo}</h4>
                                                {c.estado && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 h-5 px-1.5 text-[10px]">ACTIVO</Badge>}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                              <span className="capitalize">{TIPOS_CONTRATO[c.tipo_contrato] || c.tipo_contrato}</span>
                                              {c.cargo_rel?.departamento && <><span>·</span><span>{c.cargo_rel.departamento.nombre}</span></>}
                                              {c.cargo_rel?.es_productivo && <Badge variant="outline" className="text-[10px] h-4 px-1 border-amber-200 text-amber-700 bg-amber-50">Productivo</Badge>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:flex gap-4 sm:gap-8 text-sm">
                                            <div>
                                                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><DollarSign className="h-3 w-3" /> Salario</p>
                                                <p className="font-medium">${Number(c.salario_base).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Vigencia</p>
                                                <p>{c.fecha_inicio} al {c.fecha_fin || 'Presente'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {activeTab === 'asistencias' && (
                <Card>
                    <CardHeader className="border-b bg-slate-50/50">
                        <CardTitle className="text-md">Registro de Asistencias (Últimos 30 días)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 text-center text-slate-500">
                        <CalendarDays className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                        <p>No se encontraron registros de asistencia recientes.</p>
                        <p className="text-xs text-slate-400 mt-1">El control de entrada/salida está inactivo para este empleado.</p>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
```

### Hr/Empleados/Edit
**Ruta:** resources/js/Pages/Hr/Empleados/Edit.jsx
```jsx
import { router, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { ArrowLeft, IdCard, Save, UserCircle2 } from 'lucide-react'

const selectClass = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export default function EditEmpleado({ empleado, sedes }) {
  const { data, setData, put, processing, errors } = useForm({
    documento: empleado.documento || '',
    nombres: empleado.nombres || '',
    apellidos: empleado.apellidos || '',
    email: empleado.email || '',
    telefono: empleado.telefono || '',
    sede_id: empleado.sede_id || '',
    estado: empleado.estado,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    put(route('hr.empleados.update', empleado.id))
  }

  return (
    <AuthenticatedLayout>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.get(route('hr.empleados.show', empleado.id))}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <IdCard className="h-6 w-6 text-primary" /> Editar Empleado
          </h2>
          <p className="text-muted-foreground">{empleado.nombres} {empleado.apellidos}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documento">Documento *</Label>
              <Input id="documento" value={data.documento} onChange={(e) => setData('documento', e.target.value)} />
              {errors.documento && <p className="text-xs text-destructive">{errors.documento}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sede_id">Sede *</Label>
              <select id="sede_id" value={data.sede_id} onChange={(e) => setData('sede_id', e.target.value)} className={selectClass}>
                {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              {errors.sede_id && <p className="text-xs text-destructive">{errors.sede_id}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres *</Label>
              <Input id="nombres" value={data.nombres} onChange={(e) => setData('nombres', e.target.value)} />
              {errors.nombres && <p className="text-xs text-destructive">{errors.nombres}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input id="apellidos" value={data.apellidos} onChange={(e) => setData('apellidos', e.target.value)} />
              {errors.apellidos && <p className="text-xs text-destructive">{errors.apellidos}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" value={data.telefono} onChange={(e) => setData('telefono', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={data.estado} onChange={(e) => setData('estado', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              <span className="text-sm font-medium">Empleado activo</span>
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => router.get(route('hr.empleados.show', empleado.id))}>
            Cancelar
          </Button>
          <Button type="submit" disabled={processing} className="gap-2">
            <Save className="h-4 w-4" /> {processing ? 'Guardando…' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </AuthenticatedLayout>
  )
}
```

### Hr/Prestamos/Index
**Ruta:** resources/js/Pages/Hr/Prestamos/Index.jsx
```jsx
import { useState } from 'react'
import { router, useForm, Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Textarea } from '@/Components/ui/textarea'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Pagination } from '@/Components/ui/pagination'
import { StatCard } from '@/Components/ui/stat-card'
import { PageHeader } from '@/Components/ui/page-header'
import {
  DollarSign,
  Plus,
  CreditCard,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
} from 'lucide-react'

// Select nativo con misma apariencia que Input
const selectClass =
  'flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30'

/**
 * Página de gestión de préstamos a empleados.
 * @param {{ prestamos: { data: Array, current_page: number, last_page: number, total: number }, empleados?: Array<{ id: number, nombres: string, apellidos: string, documento: string }>, filters: { search?: string } }} props
 */
export default function PrestamosIndex({ prestamos, empleados = [], filters }) {
  // ─── Búsqueda ───
  const [search, setSearch] = useState(filters?.search || '')
  const [expandedRow, setExpandedRow] = useState(null)

  const handleSearch = (e) => {
    e.preventDefault()
    router.get(route('hr.prestamos.index'), { search }, { preserveState: true })
  }

  // ─── Formulario de creación ───
  const { data, setData, post, processing, errors, reset } = useForm({
    empleado_id: '',
    monto_total: '',
    cuotas_pactadas: '',
    fecha_prestamo: '',
    observaciones: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    post(route('hr.prestamos.store'), {
      onSuccess: () => reset(),
    })
  }

  // ─── Pagar cuota ───
  const handlePagarCuota = (cuotaId) => {
    router.post(route('hr.prestamos.cuotas.pagar', cuotaId), {}, { preserveScroll: true })
  }

  // ─── Formato moneda ───
  const fmt = (val) => {
    if (val == null) return '$0'
    const n = typeof val === 'string' ? Number.parseFloat(val) : val
    return '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  // ─── Indicadores ───
  const totalActivos = prestamos?.data?.filter((p) => p.estado === 'ACTIVO').length ?? 0
  const totalPrestamos = prestamos?.total ?? 0

  // ─── Columnas DataTable ───
  const columns = [
    {
      key: 'empleado',
      header: 'Empleado',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold dark:bg-indigo-500/10 dark:text-indigo-400">
            {row.empleado?.nombres?.charAt(0) ?? '?'}
            {row.empleado?.apellidos?.charAt(0) ?? ''}
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">
              {row.empleado?.nombres ?? ''} {row.empleado?.apellidos ?? ''}
            </p>
            <p className="text-xs text-muted-foreground">{row.empleado?.documento ?? ''}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'monto_total',
      header: 'Monto Total',
      cell: (row) => (
        <span className="font-semibold tabular-nums">{fmt(row.monto_total)}</span>
      ),
    },
    {
      key: 'cuotas_pactadas',
      header: 'Cuotas',
      cell: (row) => (
        <span className="tabular-nums">{row.cuotas_pactadas}</span>
      ),
    },
    {
      key: 'saldo_pendiente',
      header: 'Saldo Pendiente',
      cell: (row) => (
        <span className="font-medium tabular-nums">{fmt(row.saldo_pendiente)}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (row) => {
        const isPaid = row.estado === 'PAGADO'
        return (
          <Badge
            variant={isPaid ? 'secondary' : 'default'}
            className={
              isPaid
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                : ''
            }
          >
            {isPaid ? 'Pagado' : 'Activo'}
          </Badge>
        )
      },
    },
    {
      key: 'acciones',
      header: '',
      alignEnd: true,
      className: 'w-20',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
          className="gap-1 text-xs"
        >
          {expandedRow === row.id ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Ocultar
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> Ver cuotas
            </>
          )}
        </Button>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Préstamos" />

      <PageHeader
        title="Préstamos a Empleados"
        description="Administra los préstamos y sus cuotas"
        icon={CreditCard}
      />

      {/* KPIs rápidos */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total préstamos"
          value={totalPrestamos}
          icon={DollarSign}
          accent="indigo"
          hint="Registrados en el sistema"
        />
        <StatCard
          label="Préstamos activos"
          value={totalActivos}
          icon={CreditCard}
          accent="amber"
          hint="Con saldo pendiente"
        />
        <StatCard
          label="Empleados disponibles"
          value={empleados.length}
          icon={Search}
          accent="emerald"
          hint="Para nuevos préstamos"
        />
      </div>

      {/* Grid: Formulario + Tabla */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulario de creación */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="h-4 w-4 text-indigo-500" />
                  Nuevo Préstamo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Empleado */}
                  <div className="space-y-1.5">
                    <Label htmlFor="empleado_id">
                      Empleado <span className="text-rose-500">*</span>
                    </Label>
                    <select
                      id="empleado_id"
                      value={data.empleado_id}
                      onChange={(e) => setData('empleado_id', e.target.value)}
                      className={selectClass}
                      required
                    >
                      <option value="">Seleccionar empleado…</option>
                      {empleados.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nombres} {emp.apellidos} — {emp.documento}
                        </option>
                      ))}
                    </select>
                    {errors.empleado_id && (
                      <p className="text-xs text-destructive">{errors.empleado_id}</p>
                    )}
                  </div>

                  {/* Monto total */}
                  <div className="space-y-1.5">
                    <Label htmlFor="monto_total">
                      Monto Total <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="monto_total"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      value={data.monto_total}
                      onChange={(e) => setData('monto_total', e.target.value)}
                      required
                    />
                    {errors.monto_total && (
                      <p className="text-xs text-destructive">{errors.monto_total}</p>
                    )}
                  </div>

                  {/* Número de cuotas */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cuotas_pactadas">
                      Número de Cuotas <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="cuotas_pactadas"
                      type="number"
                      min="1"
                      max="120"
                      placeholder="Ej: 12"
                      value={data.cuotas_pactadas}
                      onChange={(e) => setData('cuotas_pactadas', e.target.value)}
                      required
                    />
                    {errors.cuotas_pactadas && (
                      <p className="text-xs text-destructive">{errors.cuotas_pactadas}</p>
                    )}
                  </div>

                  {/* Fecha */}
                  <div className="space-y-1.5">
                    <Label htmlFor="fecha_prestamo">
                      Fecha del Préstamo <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="fecha_prestamo"
                      type="date"
                      value={data.fecha_prestamo}
                      onChange={(e) => setData('fecha_prestamo', e.target.value)}
                      required
                    />
                    {errors.fecha_prestamo && (
                      <p className="text-xs text-destructive">{errors.fecha_prestamo}</p>
                    )}
                  </div>

                  {/* Observaciones */}
                  <div className="space-y-1.5">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      placeholder="Motivo del préstamo, condiciones, etc."
                      value={data.observaciones}
                      onChange={(e) => setData('observaciones', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button type="submit" disabled={processing} className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    {processing ? 'Registrando…' : 'Registrar Préstamo'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Tabla de préstamos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Listado de Préstamos</CardTitle>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    placeholder="Buscar empleado…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-56"
                  />
                  <Button type="submit" variant="secondary" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {prestamos?.data?.length > 0 ? (
                <div>
                  <DataTable columns={columns} data={prestamos.data} rowKey={(r) => r.id} />

                  {/* Filas expandibles: cuotas */}
                  {prestamos.data.map(
                    (row) =>
                      expandedRow === row.id && (
                        <div
                          key={`cuotas-${row.id}`}
                          className="border-t border-border bg-muted/30 px-6 py-4"
                        >
                          <h4 className="mb-3 text-sm font-semibold text-foreground">
                            Cuotas del Préstamo
                          </h4>
                          {row.cuotas && row.cuotas.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                                    <th className="pb-2 pr-4 font-medium">#</th>
                                    <th className="pb-2 pr-4 font-medium">Monto</th>
                                    <th className="pb-2 pr-4 font-medium">Vencimiento</th>
                                    <th className="pb-2 pr-4 font-medium">Estado</th>
                                    <th className="pb-2 font-medium">Acción</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.cuotas.map((cuota) => {
                                    const pagada =
                                      cuota.estado === 'PAGADA' || cuota.pagada === true
                                    const vencida =
                                      !pagada &&
                                      new Date(cuota.fecha_vencimiento) < new Date()
                                    return (
                                      <tr
                                        key={cuota.id}
                                        className="border-b border-border/50 last:border-0"
                                      >
                                        <td className="py-2 pr-4 tabular-nums">
                                          {cuota.numero_cuota}
                                        </td>
                                        <td className="py-2 pr-4 tabular-nums font-medium">
                                          {fmt(cuota.monto)}
                                        </td>
                                        <td className="py-2 pr-4 tabular-nums">
                                          {new Date(
                                            cuota.fecha_vencimiento + 'T00:00:00',
                                          ).toLocaleDateString('es-CO', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                          })}
                                        </td>
                                        <td className="py-2 pr-4">
                                          {pagada ? (
                                            <Badge
                                              variant="secondary"
                                              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                            >
                                              <CheckCircle2 className="mr-1 h-3 w-3" />
                                              Pagada
                                            </Badge>
                                          ) : vencida ? (
                                            <Badge variant="destructive">Vencida</Badge>
                                          ) : (
                                            <Badge variant="outline">
                                              <Clock className="mr-1 h-3 w-3" />
                                              Pendiente
                                            </Badge>
                                          )}
                                        </td>
                                        <td className="py-2">
                                          {!pagada && (
                                            <Button
                                              variant="outline"
                                              size="xs"
                                              onClick={() => handlePagarCuota(cuota.id)}
                                              className="text-xs"
                                            >
                                              Pagar
                                            </Button>
                                          )}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No hay información de cuotas disponible.
                            </p>
                          )}
                        </div>
                      ),
                  )}

                  {/* Paginación */}
                  <Pagination
                    page={prestamos.current_page}
                    totalPages={prestamos.last_page}
                    onPage={(p) =>
                      router.get(route('hr.prestamos.index'), { page: p }, { preserveState: true })
                    }
                  />
                </div>
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="No hay préstamos registrados"
                  description="Aún no se han registrado préstamos. Completa el formulario para crear el primero."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
```

### Hr/Incapacidades/Index
**Ruta:** resources/js/Pages/Hr/Incapacidades/Index.jsx
```jsx
import { useState, useMemo } from 'react'
import { router, useForm, Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Textarea } from '@/Components/ui/textarea'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Pagination } from '@/Components/ui/pagination'
import { PageHeader } from '@/Components/ui/page-header'
import {
  Stethoscope,
  Plus,
  Search,
  Pencil,
  Trash2,
  CalendarDays,
} from 'lucide-react'

// Select nativo con misma apariencia que Input
const selectClass =
  'flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30'

// Catálogo de tipos de incapacidad
const TIPOS_INCAPACIDAD = [
  { value: 'Enfermedad General', label: 'Enfermedad General' },
  { value: 'Accidente Laboral', label: 'Accidente Laboral' },
  { value: 'Enfermedad Laboral', label: 'Enfermedad Laboral' },
  { value: 'Licencia Maternidad', label: 'Licencia Maternidad' },
  { value: 'Licencia Paternidad', label: 'Licencia Paternidad' },
  { value: 'Otro', label: 'Otro' },
]

// Variantes de Badge por tipo
const tipoBadgeClass = {
  'Enfermedad General':
    'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  'Accidente Laboral':
    'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  'Enfermedad Laboral':
    'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  'Licencia Maternidad':
    'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  'Licencia Paternidad':
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
}

/**
 * Página de gestión de incapacidades y licencias.
 * @param {{ incapacidades: { data: Array, current_page: number, last_page: number, total: number }, empleados?: Array<{ id: number, nombres: string, apellidos: string, documento: string }>, filters: { search?: string, tipo?: string } }} props
 */
export default function IncapacidadesIndex({ incapacidades, empleados = [], filters }) {
  // ─── Búsqueda y filtro ───
  const [search, setSearch] = useState(filters?.search || '')
  const [tipoFilter, setTipoFilter] = useState(filters?.tipo || '')
  const [editing, setEditing] = useState(null)

  const handleFilter = (e) => {
    e.preventDefault()
    router.get(
      route('hr.incapacidades.index'),
      { search, tipo: tipoFilter },
      { preserveState: true },
    )
  }

  // ─── Formulario de creación ───
  const { data, setData, post, processing, errors, reset } = useForm({
    empleado_id: '',
    tipo: 'Enfermedad General',
    fecha_inicio: '',
    fecha_fin: '',
    porcentaje_pago: '',
    observaciones: '',
  })

  // Auto-calcular días en creación
  const diasCalculados = useMemo(() => {
    if (data.fecha_inicio && data.fecha_fin) {
      const inicio = new Date(data.fecha_inicio + 'T00:00:00')
      const fin = new Date(data.fecha_fin + 'T00:00:00')
      if (fin >= inicio) {
        return Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
      }
    }
    return 0
  }, [data.fecha_inicio, data.fecha_fin])

  const handleSubmit = (e) => {
    e.preventDefault()
    post(route('hr.incapacidades.store'), {
      onSuccess: () => reset(),
    })
  }

  // ─── Editar ───
  const {
    data: editData,
    setData: setEditData,
    put: editPut,
    processing: editProcessing,
    errors: editErrors,
  } = useForm({
    tipo: '',
    fecha_inicio: '',
    fecha_fin: '',
    porcentaje_pago: '',
    observaciones: '',
  })

  const openEdit = (inc) => {
    setEditing(inc)
    setEditData({
      tipo: inc.tipo,
      fecha_inicio: inc.fecha_inicio,
      fecha_fin: inc.fecha_fin,
      porcentaje_pago: inc.porcentaje_pago != null ? String(inc.porcentaje_pago) : '',
      observaciones: inc.observaciones ?? '',
    })
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!editing) return
    editPut(route('hr.incapacidades.update', editing.id), {
      onSuccess: () => setEditing(null),
      preserveScroll: true,
    })
  }

  // ─── Eliminar ───
  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta incapacidad?')) {
      router.delete(route('hr.incapacidades.destroy', id), { preserveScroll: true })
    }
  }

  // Días edit auto-calc
  const editDias = useMemo(() => {
    if (editData.fecha_inicio && editData.fecha_fin) {
      const inicio = new Date(editData.fecha_inicio + 'T00:00:00')
      const fin = new Date(editData.fecha_fin + 'T00:00:00')
      if (fin >= inicio) {
        return Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
      }
    }
    return 0
  }, [editData.fecha_inicio, editData.fecha_fin])

  // ─── Columnas DataTable ───
  const columns = [
    {
      key: 'empleado',
      header: 'Empleado',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 text-sm font-bold dark:bg-rose-500/10 dark:text-rose-400">
            {row.empleado?.nombres?.charAt(0) ?? '?'}
            {row.empleado?.apellidos?.charAt(0) ?? ''}
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">
              {row.empleado?.nombres ?? ''} {row.empleado?.apellidos ?? ''}
            </p>
            <p className="text-xs text-muted-foreground">{row.empleado?.documento ?? ''}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      cell: (row) => (
        <Badge variant="secondary" className={tipoBadgeClass[row.tipo] ?? ''}>
          {row.tipo}
        </Badge>
      ),
    },
    {
      key: 'fechas',
      header: 'Fechas',
      cell: (row) => {
        const fmt = (d) =>
          new Date(d + 'T00:00:00').toLocaleDateString('es-CO', {
            day: '2-digit',
            month: '2-digit',
          })
        return (
          <span className="text-sm tabular-nums">
            {fmt(row.fecha_inicio)} — {fmt(row.fecha_fin)}
          </span>
        )
      },
    },
    {
      key: 'dias',
      header: 'Días',
      className: 'w-16',
      cell: (row) => (
        <span className="tabular-nums font-medium">{row.dias}</span>
      ),
    },
    {
      key: 'porcentaje_pago',
      header: '% Pago',
      className: 'w-20',
      cell: (row) =>
        row.porcentaje_pago != null ? (
          <span className="tabular-nums">{Number(row.porcentaje_pago).toFixed(0)}%</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'acciones',
      header: '',
      alignEnd: true,
      className: 'w-24',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openEdit(row)}
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDelete(row.id)}
            title="Eliminar"
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Incapacidades" />

      <PageHeader
        title="Incapacidades y Licencias"
        description="Registra y administra incapacidades, licencias de maternidad, paternidad y más"
        icon={Stethoscope}
      />

      {/* Grid: Formulario + Tabla */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulario de creación */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="h-4 w-4 text-indigo-500" />
                  Nueva Incapacidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Empleado */}
                  <div className="space-y-1.5">
                    <Label htmlFor="empleado_id">
                      Empleado <span className="text-rose-500">*</span>
                    </Label>
                    <select
                      id="empleado_id"
                      value={data.empleado_id}
                      onChange={(e) => setData('empleado_id', e.target.value)}
                      className={selectClass}
                      required
                    >
                      <option value="">Seleccionar empleado…</option>
                      {empleados.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nombres} {emp.apellidos} — {emp.documento}
                        </option>
                      ))}
                    </select>
                    {errors.empleado_id && (
                      <p className="text-xs text-destructive">{errors.empleado_id}</p>
                    )}
                  </div>

                  {/* Tipo */}
                  <div className="space-y-1.5">
                    <Label htmlFor="tipo">
                      Tipo <span className="text-rose-500">*</span>
                    </Label>
                    <select
                      id="tipo"
                      value={data.tipo}
                      onChange={(e) => setData('tipo', e.target.value)}
                      className={selectClass}
                      required
                    >
                      {TIPOS_INCAPACIDAD.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    {errors.tipo && <p className="text-xs text-destructive">{errors.tipo}</p>}
                  </div>

                  {/* Fechas */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="fecha_inicio">
                        Fecha Inicio <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="fecha_inicio"
                        type="date"
                        value={data.fecha_inicio}
                        onChange={(e) => setData('fecha_inicio', e.target.value)}
                        required
                      />
                      {errors.fecha_inicio && (
                        <p className="text-xs text-destructive">{errors.fecha_inicio}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fecha_fin">
                        Fecha Fin <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="fecha_fin"
                        type="date"
                        value={data.fecha_fin}
                        onChange={(e) => setData('fecha_fin', e.target.value)}
                        required
                      />
                      {errors.fecha_fin && (
                        <p className="text-xs text-destructive">{errors.fecha_fin}</p>
                      )}
                    </div>
                  </div>

                  {/* Días calculados */}
                  {diasCalculados > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                      <CalendarDays className="h-4 w-4 text-indigo-500" />
                      <span className="text-foreground font-medium">{diasCalculados}</span>
                      <span className="text-muted-foreground">
                        {diasCalculados === 1 ? 'día' : 'días'}
                      </span>
                    </div>
                  )}

                  {/* % Pago */}
                  <div className="space-y-1.5">
                    <Label htmlFor="porcentaje_pago">% de Pago</Label>
                    <div className="relative">
                      <Input
                        id="porcentaje_pago"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="100"
                        value={data.porcentaje_pago}
                        onChange={(e) => setData('porcentaje_pago', e.target.value)}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                        %
                      </span>
                    </div>
                    {errors.porcentaje_pago && (
                      <p className="text-xs text-destructive">{errors.porcentaje_pago}</p>
                    )}
                  </div>

                  {/* Observaciones */}
                  <div className="space-y-1.5">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      placeholder="Diagnóstico, recomendaciones, etc."
                      value={data.observaciones}
                      onChange={(e) => setData('observaciones', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button type="submit" disabled={processing} className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    {processing ? 'Registrando…' : 'Registrar Incapacidad'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Tabla de incapacidades */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Historial de Incapacidades</CardTitle>
                <form onSubmit={handleFilter} className="flex flex-wrap gap-2">
                  <select
                    value={tipoFilter}
                    onChange={(e) => setTipoFilter(e.target.value)}
                    className={selectClass + ' max-w-40'}
                  >
                    <option value="">Todos los tipos</option>
                    {TIPOS_INCAPACIDAD.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Buscar empleado…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-44"
                  />
                  <Button type="submit" variant="secondary" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {incapacidades?.data?.length > 0 ? (
                <div>
                  <DataTable
                    columns={columns}
                    data={incapacidades.data}
                    rowKey={(r) => r.id}
                  />
                  <Pagination
                    page={incapacidades.current_page}
                    totalPages={incapacidades.last_page}
                    onPage={(p) =>
                      router.get(
                        route('hr.incapacidades.index'),
                        { page: p, search, tipo: tipoFilter },
                        { preserveState: true },
                      )
                    }
                  />
                </div>
              ) : (
                <EmptyState
                  icon={Stethoscope}
                  title="No hay incapacidades registradas"
                  description="Aún no se han registrado incapacidades. Usa el formulario para crear la primera."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Modal de edición ─── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-popover p-6 shadow-lg ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Pencil className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">Editar Incapacidad</h3>
                <p className="text-sm text-muted-foreground">
                  {editing.empleado?.nombres} {editing.empleado?.apellidos}
                </p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-tipo">Tipo</Label>
                <select
                  id="edit-tipo"
                  value={editData.tipo}
                  onChange={(e) => setEditData('tipo', e.target.value)}
                  className={selectClass}
                  required
                >
                  {TIPOS_INCAPACIDAD.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {editErrors.tipo && (
                  <p className="text-xs text-destructive">{editErrors.tipo}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-fecha_inicio">Fecha Inicio</Label>
                  <Input
                    id="edit-fecha_inicio"
                    type="date"
                    value={editData.fecha_inicio}
                    onChange={(e) => setEditData('fecha_inicio', e.target.value)}
                    required
                  />
                  {editErrors.fecha_inicio && (
                    <p className="text-xs text-destructive">{editErrors.fecha_inicio}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-fecha_fin">Fecha Fin</Label>
                  <Input
                    id="edit-fecha_fin"
                    type="date"
                    value={editData.fecha_fin}
                    onChange={(e) => setEditData('fecha_fin', e.target.value)}
                    required
                  />
                  {editErrors.fecha_fin && (
                    <p className="text-xs text-destructive">{editErrors.fecha_fin}</p>
                  )}
                </div>
              </div>

              {editDias > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-indigo-500" />
                  <span className="text-foreground font-medium">{editDias}</span>
                  <span className="text-muted-foreground">
                    {editDias === 1 ? 'día' : 'días'}
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="edit-porcentaje_pago">% de Pago</Label>
                <div className="relative">
                  <Input
                    id="edit-porcentaje_pago"
                    type="number"
                    min="0"
                    max="100"
                    value={editData.porcentaje_pago}
                    onChange={(e) => setEditData('porcentaje_pago', e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-observaciones">Observaciones</Label>
                <Textarea
                  id="edit-observaciones"
                  value={editData.observaciones}
                  onChange={(e) => setEditData('observaciones', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={editProcessing}>
                  {editProcessing ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  )
}
```

### Hr/Afiliaciones/Index
**Ruta:** resources/js/Pages/Hr/Afiliaciones/Index.jsx
```jsx
import { useState } from 'react'
import { router, useForm, Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Pagination } from '@/Components/ui/pagination'
import { PageHeader } from '@/Components/ui/page-header'
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
} from 'lucide-react'

// Select nativo con misma apariencia que Input
const selectClass =
  'flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30'

// Colores para tipo de entidad
const tipoEntidadColor = {
  EPS: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
  AFP: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  ARL: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  CCF: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  Salud: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
  Pensión: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  'Caja de Compensación': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  Parafiscal: 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  Cesantías: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
}

/**
 * Página de afiliaciones de empleados a entidades de seguridad social.
 * @param {{ afiliaciones: { data: Array, current_page: number, last_page: number, total: number }, entidades?: Array<{ id: number, nombre: string, tipo_entidad: string }>, empleados?: Array<{ id: number, nombres: string, apellidos: string, documento: string }>, filters: { search?: string } }} props
 */
export default function AfiliacionesIndex({ afiliaciones, entidades = [], empleados = [], filters }) {
  const [search, setSearch] = useState(filters?.search || '')

  const handleSearch = (e) => {
    e.preventDefault()
    router.get(route('hr.afiliaciones.index'), { search }, { preserveState: true })
  }

  // ─── Formulario de creación ───
  const { data, setData, post, processing, errors, reset } = useForm({
    empleado_id: '',
    entidad_id: '',
    fecha_afiliacion: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    post(route('hr.afiliaciones.store'), {
      onSuccess: () => reset(),
    })
  }

  // ─── Agrupar entidades por tipo para optgroup ───
  const entidadesPorTipo = entidades.reduce((acc, e) => {
    const tipo = e.tipo_entidad || 'Otro'
    if (!acc[tipo]) acc[tipo] = []
    acc[tipo].push(e)
    return acc
  }, {})

  // ─── Columnas DataTable ───
  const columns = [
    {
      key: 'empleado',
      header: 'Empleado',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold dark:bg-indigo-500/10 dark:text-indigo-400">
            {row.empleado?.nombres?.charAt(0) ?? '?'}
            {row.empleado?.apellidos?.charAt(0) ?? ''}
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">
              {row.empleado?.nombres ?? ''} {row.empleado?.apellidos ?? ''}
            </p>
            <p className="text-xs text-muted-foreground">{row.empleado?.documento ?? ''}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'entidad',
      header: 'Entidad',
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            {row.entidad?.nombre ?? '—'}
          </span>
          {row.entidad?.tipo_entidad && (
            <Badge
              variant="secondary"
              className={`w-fit text-[10px] ${
                tipoEntidadColor[row.entidad.tipo_entidad] ?? ''
              }`}
            >
              {row.entidad.tipo_entidad}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'fecha_afiliacion',
      header: 'Fecha Afiliación',
      cell: (row) => {
        const d = new Date(row.fecha_afiliacion + 'T00:00:00')
        return (
          <span className="tabular-nums text-sm">
            {d.toLocaleDateString('es-CO', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
        )
      },
    },
    {
      key: 'activo',
      header: 'Estado',
      className: 'w-24',
      cell: (row) =>
        row.activo ? (
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Activo
          </Badge>
        ) : (
          <Badge variant="outline">Inactivo</Badge>
        ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Afiliaciones" />

      <PageHeader
        title="Afiliaciones"
        description="Administra las afiliaciones de empleados a entidades de seguridad social (EPS, AFP, ARL, CCF)"
        icon={ShieldCheck}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulario de creación */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="h-4 w-4 text-indigo-500" />
                  Nueva Afiliación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Empleado */}
                  <div className="space-y-1.5">
                    <Label htmlFor="empleado_id">
                      Empleado <span className="text-rose-500">*</span>
                    </Label>
                    <select
                      id="empleado_id"
                      value={data.empleado_id}
                      onChange={(e) => setData('empleado_id', e.target.value)}
                      className={selectClass}
                      required
                    >
                      <option value="">Seleccionar empleado…</option>
                      {empleados.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nombres} {emp.apellidos} — {emp.documento}
                        </option>
                      ))}
                    </select>
                    {errors.empleado_id && (
                      <p className="text-xs text-destructive">{errors.empleado_id}</p>
                    )}
                  </div>

                  {/* Entidad agrupada por tipo */}
                  <div className="space-y-1.5">
                    <Label htmlFor="entidad_id">
                      Entidad <span className="text-rose-500">*</span>
                    </Label>
                    <select
                      id="entidad_id"
                      value={data.entidad_id}
                      onChange={(e) => setData('entidad_id', e.target.value)}
                      className={selectClass}
                      required
                    >
                      <option value="">Seleccionar entidad…</option>
                      {Object.entries(entidadesPorTipo).map(([tipo, list]) => (
                        <optgroup key={tipo} label={tipo}>
                          {list.map((ent) => (
                            <option key={ent.id} value={ent.id}>
                              {ent.nombre}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {errors.entidad_id && (
                      <p className="text-xs text-destructive">{errors.entidad_id}</p>
                    )}
                  </div>

                  {/* Fecha */}
                  <div className="space-y-1.5">
                    <Label htmlFor="fecha_afiliacion">
                      Fecha de Afiliación <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="fecha_afiliacion"
                      type="date"
                      value={data.fecha_afiliacion}
                      onChange={(e) => setData('fecha_afiliacion', e.target.value)}
                      required
                    />
                    {errors.fecha_afiliacion && (
                      <p className="text-xs text-destructive">{errors.fecha_afiliacion}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={processing} className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    {processing ? 'Registrando…' : 'Registrar Afiliación'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Tabla de afiliaciones */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Listado de Afiliaciones</CardTitle>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    placeholder="Buscar empleado o entidad…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-56"
                  />
                  <Button type="submit" variant="secondary" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {afiliaciones?.data?.length > 0 ? (
                <div>
                  <DataTable
                    columns={columns}
                    data={afiliaciones.data}
                    rowKey={(r) => r.id}
                  />
                  <Pagination
                    page={afiliaciones.current_page}
                    totalPages={afiliaciones.last_page}
                    onPage={(p) =>
                      router.get(
                        route('hr.afiliaciones.index'),
                        { page: p, search },
                        { preserveState: true },
                      )
                    }
                  />
                </div>
              ) : (
                <EmptyState
                  icon={ShieldCheck}
                  title="No hay afiliaciones registradas"
                  description="Aún no se han registrado afiliaciones a entidades de seguridad social. Usa el formulario para crear la primera."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
```

### Hr/Catalogos/Organigrama
**Ruta:** resources/js/Pages/Hr/Catalogos/Organigrama.jsx
```jsx
import { useState } from 'react'
import { router, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Badge } from '@/Components/ui/badge'
import { EmptyState } from '@/Components/ui/empty-state'
import { Building2, Briefcase, Plus, Pencil, Trash2, Save, X, Wrench } from 'lucide-react'

const selectClass = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

const CATEGORIAS = ['Administrativo', 'Operativo', 'Comercial']

export default function Organigrama({ departamentos: initialDeptos }) {
  const [departamentos, setDepartamentos] = useState(initialDeptos)
  const [editDept, setEditDept] = useState(null) // { id, nombre, descripcion } or null for new
  const [editCargo, setEditCargo] = useState(null) // { id, departamento_id, nombre, categoria_laboral, salario_base_sugerido, es_productivo } or null for new

  const refresh = () => router.reload({ only: ['departamentos'] })

  // ─── Departamento ───
  const saveDept = (e) => {
    e.preventDefault()
    const form = e.target
    const data = { nombre: form.nombre.value, descripcion: form.descripcion.value }
    if (editDept?.id) {
      router.put(route('hr.catalogos.departamentos.update', editDept.id), data, { preserveState: true, onSuccess: () => { setEditDept(null); refresh() } })
    } else {
      router.post(route('hr.catalogos.departamentos.store'), data, { preserveState: true, onSuccess: () => { setEditDept(null); refresh() } })
    }
  }

  const deleteDept = (id) => {
    if (!confirm('¿Eliminar este departamento? Se eliminarán también los cargos asociados.')) return
    router.delete(route('hr.catalogos.departamentos.destroy', id), { preserveState: true, onSuccess: refresh })
  }

  // ─── Cargo ───
  const saveCargo = (e) => {
    e.preventDefault()
    const form = e.target
    const data = {
      departamento_id: form.dept_id.value,
      nombre: form.nombre.value,
      categoria_laboral: form.categoria.value,
      salario_base_sugerido: form.salario.value || null,
      es_productivo: form.es_productivo.checked,
    }
    if (editCargo?.id) {
      router.put(route('hr.catalogos.cargos.update', editCargo.id), data, { preserveState: true, onSuccess: () => { setEditCargo(null); refresh() } })
    } else {
      router.post(route('hr.catalogos.cargos.store'), data, { preserveState: true, onSuccess: () => { setEditCargo(null); refresh() } })
    }
  }

  const deleteCargo = (id) => {
    if (!confirm('¿Eliminar este cargo?')) return
    router.delete(route('hr.catalogos.cargos.destroy', id), { preserveState: true, onSuccess: refresh })
  }

  // ─── Render ───
  return (
    <AuthenticatedLayout>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Organigrama
          </h2>
          <p className="text-muted-foreground">Departamentos, cargos y perfiles laborales.</p>
        </div>
        <Button onClick={() => setEditDept({})} className="gap-2"><Plus className="h-4 w-4" /> Nuevo Departamento</Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Panel izquierdo: Departamentos */}
        <div className="xl:col-span-1 space-y-4">
          {departamentos.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <EmptyState icon={Building2} title="Sin departamentos" description="Crea el primer departamento para comenzar." />
              </CardContent>
            </Card>
          ) : (
            departamentos.map((dept) => (
              <Card key={dept.id} className="overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg"><Building2 className="h-5 w-5 text-primary" /></div>
                    <div>
                      <h3 className="font-semibold">{dept.nombre}</h3>
                      <p className="text-xs text-muted-foreground">{dept.cargos?.length ?? 0} cargos</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditDept(dept)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDept(dept.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="divide-y">
                  {dept.cargos?.length > 0 ? dept.cargos.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20">
                      <div className="flex items-center gap-2">
                        {c.es_productivo ? <Wrench className="h-3.5 w-3.5 text-amber-500" /> : <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span className="text-sm">{c.nombre}</span>
                        {c.es_productivo && <Badge variant="outline" className="text-[10px] h-4 px-1 border-amber-200 text-amber-700 bg-amber-50">Técnico</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditCargo({ ...c, departamento_id: dept.id })}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCargo(c.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  )) : (
                    <p className="px-4 py-3 text-xs text-muted-foreground text-center">Sin cargos</p>
                  )}
                </div>
                <div className="border-t px-4 py-2">
                  <Button variant="ghost" size="sm" className="w-full gap-1 text-xs text-muted-foreground" onClick={() => setEditCargo({ departamento_id: dept.id })}>
                    <Plus className="h-3 w-3" /> Agregar cargo
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Panel derecho: Formularios */}
        <div className="xl:col-span-2 space-y-6">
          {/* Formulario Departamento */}
          {(editDept !== null) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{editDept?.id ? 'Editar Departamento' : 'Nuevo Departamento'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setEditDept(null)}><X className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveDept} className="space-y-4">
                  <input type="hidden" name="id" value={editDept?.id || ''} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dept-nombre">Nombre del departamento *</Label>
                      <Input id="dept-nombre" name="nombre" defaultValue={editDept?.nombre || ''} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dept-descripcion">Descripción</Label>
                      <Input id="dept-descripcion" name="descripcion" defaultValue={editDept?.descripcion || ''} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditDept(null)}>Cancelar</Button>
                    <Button type="submit" size="sm" className="gap-1"><Save className="h-3.5 w-3.5" /> Guardar</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Formulario Cargo */}
          {(editCargo !== null) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{editCargo?.id ? 'Editar Cargo' : 'Nuevo Cargo'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setEditCargo(null)}><X className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveCargo} className="space-y-4">
                  <input type="hidden" name="dept_id" value={editCargo?.departamento_id || ''} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cargo-departamento">Departamento</Label>
                      <select name="dept_id" defaultValue={editCargo?.departamento_id || ''} className={selectClass} onChange={(e) => setEditCargo({ ...editCargo, departamento_id: e.target.value })}>
                        <option value="">Seleccionar…</option>
                        {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cargo-nombre">Nombre del cargo *</Label>
                      <Input id="cargo-nombre" name="nombre" defaultValue={editCargo?.nombre || ''} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cargo-categoria">Categoría Laboral</Label>
                      <select name="categoria" defaultValue={editCargo?.categoria_laboral || 'Operativo'} className={selectClass}>
                        {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cargo-salario">Salario Base Sugerido</Label>
                      <Input id="cargo-salario" name="salario" type="number" min="0" defaultValue={editCargo?.salario_base_sugerido || ''} placeholder="0" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-2">
                    <input type="checkbox" name="es_productivo" defaultChecked={editCargo?.es_productivo || false} className="h-4 w-4 rounded border-gray-300" />
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <Wrench className="h-4 w-4 text-amber-500" /> Cargo productivo (puede ser técnico en Service Desk)
                    </span>
                  </label>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditCargo(null)}>Cancelar</Button>
                    <Button type="submit" size="sm" className="gap-1"><Save className="h-3.5 w-3.5" /> Guardar</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
```

### Hr/ConfiguracionLegal/Index
**Ruta:** resources/js/Pages/Hr/ConfiguracionLegal/Index.jsx
```jsx
import { useState, useCallback } from 'react'
import { router, useForm, Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Pagination } from '@/Components/ui/pagination'
import { PageHeader } from '@/Components/ui/page-header'
import {
  Scale,
  Plus,
  Gavel,
  Save,
  X,
  DollarSign,
  Clock,
  Calculator,
} from 'lucide-react'

// Select nativo con misma apariencia que Input
const selectClass =
  'flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30'

/**
 * Formato moneda COP.
 * @param {number|string|null|undefined} val
 * @returns {string}
 */
const fmt = (val) => {
  if (val == null) return '—'
  const n = typeof val === 'string' ? Number.parseFloat(val) : val
  return '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

/**
 * Página de configuración legal anual (SMMLV, UVT, aportes).
 * @param {{ configuraciones: { data: Array, current_page: number, last_page: number, total: number }, filters: { year?: string } }} props
 */
export default function ConfiguracionLegalIndex({ configuraciones, filters }) {
  // ─── Modal ───
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)

  // ─── Formulario crear/editar ───
  const { data, setData, post, put, processing, errors, reset } = useForm({
    ano_vigencia: '',
    salario_minimo: '',
    auxilio_transporte: '',
    tope_auxilio_transporte_salarios: '2',
    valor_uvt: '',
    horas_semanales: '46',
    aporte_salud_empleado: '4',
    aporte_pension_empleado: '4',
    aporte_salud_patronal: '8.5',
    aporte_pension_patronal: '12',
    caja_compensacion: '4',
    sena: '2',
    icbf: '3',
  })

  // ─── Abrir modal para crear ───
  const openCreate = () => {
    setEditingId(null)
    reset()
    setShowModal(true)
  }

  // ─── Abrir modal para editar ───
  const openEdit = useCallback(
    (config) => {
      setEditingId(config.id)
      setData({
        ano_vigencia: String(config.ano_vigencia),
        salario_minimo: String(config.salario_minimo),
        auxilio_transporte: String(config.auxilio_transporte),
        tope_auxilio_transporte_salarios: String(
          config.tope_auxilio_transporte_salarios ?? '2',
        ),
        valor_uvt: String(config.valor_uvt ?? ''),
        horas_semanales: String(config.horas_semanales ?? '46'),
        aporte_salud_empleado: String(config.aporte_salud_empleado ?? '4'),
        aporte_pension_empleado: String(config.aporte_pension_empleado ?? '4'),
        aporte_salud_patronal: String(config.aporte_salud_patronal ?? '8.5'),
        aporte_pension_patronal: String(config.aporte_pension_patronal ?? '12'),
        caja_compensacion: String(config.caja_compensacion ?? '4'),
        sena: String(config.sena ?? '2'),
        icbf: String(config.icbf ?? '3'),
      })
      setShowModal(true)
    },
    [setData],
  )

  // ─── Cerrar modal ───
  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    reset()
  }

  // ─── Enviar formulario ───
  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingId) {
      put(route('hr.configuracion-legal.update', editingId), {
        onSuccess: closeModal,
        preserveScroll: true,
      })
    } else {
      post(route('hr.configuracion-legal.store'), {
        onSuccess: closeModal,
        preserveScroll: true,
      })
    }
  }

  // ─── Columnas DataTable ───
  const columns = [
    {
      key: 'ano_vigencia',
      header: 'Año',
      className: 'w-20',
      cell: (row) => (
        <span className="font-semibold tabular-nums">{row.ano_vigencia}</span>
      ),
    },
    {
      key: 'salario_minimo',
      header: 'SMMLV',
      cell: (row) => (
        <span className="tabular-nums font-medium">{fmt(row.salario_minimo)}</span>
      ),
    },
    {
      key: 'auxilio_transporte',
      header: 'Aux. Transporte',
      cell: (row) => (
        <span className="tabular-nums">{fmt(row.auxilio_transporte)}</span>
      ),
    },
    {
      key: 'valor_uvt',
      header: 'UVT',
      cell: (row) =>
        row.valor_uvt != null ? (
          <span className="tabular-nums">{fmt(row.valor_uvt)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'horas_semanales',
      header: 'Horas Sem.',
      hideOnMobile: true,
      cell: (row) => (
        <span className="tabular-nums">{row.horas_semanales}h</span>
      ),
    },
    {
      key: 'acciones',
      header: '',
      alignEnd: true,
      className: 'w-16',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openEdit(row)}
          className="text-xs"
        >
          Editar
        </Button>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Configuración Legal" />

      <PageHeader
        title="Configuración Legal"
        description="Parámetros legales anuales: SMMLV, auxilio de transporte, UVT y porcentajes de aportes"
        icon={Scale}
        actions={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Configuración
          </Button>
        }
      />

      {/* Cuadro informativo */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-card p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <Gavel className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">
            Parámetros legales para liquidación de nómina
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Estos valores se usan como base para el cálculo de la nómina y los aportes de seguridad
            social. Deben actualizarse cada año según la legislación colombiana vigente.
          </p>
        </div>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuraciones por Año</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {configuraciones?.data?.length > 0 ? (
            <div>
              <DataTable
                columns={columns}
                data={configuraciones.data}
                rowKey={(r) => r.id}
              />
              <Pagination
                page={configuraciones.current_page}
                totalPages={configuraciones.last_page}
                onPage={(p) =>
                  router.get(
                    route('hr.configuracion-legal.index'),
                    { page: p },
                    { preserveState: true },
                  )
                }
              />
            </div>
          ) : (
            <EmptyState
              icon={Scale}
              title="Sin configuración legal"
              description="No hay configuraciones registradas. Crea la primera para el año vigente."
              action={{
                label: 'Nueva Configuración',
                onClick: openCreate,
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* ─── Modal Crear/Editar ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/20 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl bg-popover p-6 shadow-lg ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  {editingId ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {editingId ? 'Editar Configuración' : 'Nueva Configuración Legal'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {editingId
                      ? `Actualiza los parámetros para el año ${data.ano_vigencia}`
                      : 'Registra los parámetros legales para un año'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Datos básicos del año */}
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  Vigencia
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ano_vigencia">
                      Año de Vigencia <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="ano_vigencia"
                      type="number"
                      min="2000"
                      max="2100"
                      placeholder="2026"
                      value={data.ano_vigencia}
                      onChange={(e) => setData('ano_vigencia', e.target.value)}
                      required
                      disabled={!!editingId}
                    />
                    {errors.ano_vigencia && (
                      <p className="text-xs text-destructive">{errors.ano_vigencia}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="horas_semanales">Horas Semanales</Label>
                    <Input
                      id="horas_semanales"
                      type="number"
                      min="1"
                      max="60"
                      value={data.horas_semanales}
                      onChange={(e) => setData('horas_semanales', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Valores monetarios */}
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  Valores Base
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="salario_minimo">
                      Salario Mínimo <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="salario_minimo"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="1.423.500"
                      value={data.salario_minimo}
                      onChange={(e) => setData('salario_minimo', e.target.value)}
                      required
                    />
                    {errors.salario_minimo && (
                      <p className="text-xs text-destructive">{errors.salario_minimo}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="auxilio_transporte">
                      Auxilio Transporte <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="auxilio_transporte"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="200.000"
                      value={data.auxilio_transporte}
                      onChange={(e) => setData('auxilio_transporte', e.target.value)}
                      required
                    />
                    {errors.auxilio_transporte && (
                      <p className="text-xs text-destructive">{errors.auxilio_transporte}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="valor_uvt">Valor UVT</Label>
                    <Input
                      id="valor_uvt"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="47.065"
                      value={data.valor_uvt}
                      onChange={(e) => setData('valor_uvt', e.target.value)}
                    />
                    {errors.valor_uvt && (
                      <p className="text-xs text-destructive">{errors.valor_uvt}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 sm:w-1/3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tope_auxilio_transporte_salarios">
                      Tope Aux. Transporte (SMMLV)
                    </Label>
                    <Input
                      id="tope_auxilio_transporte_salarios"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="2"
                      value={data.tope_auxilio_transporte_salarios}
                      onChange={(e) =>
                        setData('tope_auxilio_transporte_salarios', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Aportes */}
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Calculator className="h-4 w-4 text-violet-500" />
                  Porcentajes de Aportes (%)
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="aporte_salud_empleado">Salud Empleado (%)</Label>
                    <Input
                      id="aporte_salud_empleado"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.aporte_salud_empleado}
                      onChange={(e) => setData('aporte_salud_empleado', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="aporte_pension_empleado">Pensión Empleado (%)</Label>
                    <Input
                      id="aporte_pension_empleado"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.aporte_pension_empleado}
                      onChange={(e) => setData('aporte_pension_empleado', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="aporte_salud_patronal">Salud Patronal (%)</Label>
                    <Input
                      id="aporte_salud_patronal"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.aporte_salud_patronal}
                      onChange={(e) => setData('aporte_salud_patronal', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="aporte_pension_patronal">Pensión Patronal (%)</Label>
                    <Input
                      id="aporte_pension_patronal"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.aporte_pension_patronal}
                      onChange={(e) => setData('aporte_pension_patronal', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="caja_compensacion">Caja de Compensación (%)</Label>
                    <Input
                      id="caja_compensacion"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.caja_compensacion}
                      onChange={(e) => setData('caja_compensacion', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sena">SENA (%)</Label>
                    <Input
                      id="sena"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.sena}
                      onChange={(e) => setData('sena', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="icbf">ICBF (%)</Label>
                    <Input
                      id="icbf"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.icbf}
                      onChange={(e) => setData('icbf', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={processing} className="gap-2">
                  <Save className="h-4 w-4" />
                  {processing
                    ? 'Guardando…'
                    : editingId
                      ? 'Actualizar'
                      : 'Crear Configuración'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  )
}
```

## Tests

### EmpleadoControllerTest
**Ruta:** tests/Feature/Modules/Hr/EmpleadoControllerTest.php
```php
<?php

namespace Tests\Feature\Modules\Hr;

use App\Core\Http\Middleware\EnsureModuleActive;
use App\Core\Models\Sede;
use App\Core\Models\Tenant;
use App\Models\User;
use App\Modules\Hr\Models\Contrato;
use App\Modules\Hr\Models\Empleado;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmpleadoControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private Sede $sede;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([
            \Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class,
            EnsureModuleActive::class,
        ]);

        // Cargar migraciones de módulos HR (no se auto-descubren sin Service Provider)
        $this->artisan('migrate', ['--path' => 'app/Modules/Hr/Migrations', '--realpath' => true]);

        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->sede = Sede::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Sede Principal',
            'direccion' => 'Calle 100',
            'es_principal' => true,
            'activo' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    // =========================================================================
    //  AUTENTICACIÓN Y PERMISOS
    // =========================================================================

    public function test_empleado_index_requires_auth(): void
    {
        $this->withMiddleware();
        auth()->logout();

        $response = $this->get(route('hr.empleados.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_empleado_index_requires_permission(): void
    {
        $this->withMiddleware();

        $userSinPermiso = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userSinPermiso);

        $response = $this->get(route('hr.empleados.index'));
        $response->assertStatus(403);
    }

    // =========================================================================
    //  ÍNDICE
    // =========================================================================

    public function test_empleado_index_loads_empleados(): void
    {
        $empleado = Empleado::create([
            'tenant_id' => $this->tenant->id,
            'sede_id' => $this->sede->id,
            'documento' => '1234567890',
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'email' => 'juan@test.com',
            'estado' => true,
        ]);

        $response = $this->get(route('hr.empleados.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('empleados.data')
            ->where('empleados.data.0.id', $empleado->id)
        );
    }

    public function test_empleado_index_filters_by_tenant(): void
    {
        // Empleado del tenant actual
        Empleado::create([
            'tenant_id' => $this->tenant->id,
            'sede_id' => $this->sede->id,
            'documento' => '1111111111',
            'nombres' => 'Empleado',
            'apellidos' => 'Propio',
            'estado' => true,
        ]);

        // Empleado de otro tenant
        $otroTenant = Tenant::factory()->create();
        $otraSede = Sede::create([
            'tenant_id' => $otroTenant->id,
            'nombre' => 'Sede Otro',
            'activo' => true,
        ]);
        Empleado::create([
            'tenant_id' => $otroTenant->id,
            'sede_id' => $otraSede->id,
            'documento' => '2222222222',
            'nombres' => 'Empleado',
            'apellidos' => 'Ajeno',
            'estado' => true,
        ]);

        $response = $this->get(route('hr.empleados.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('empleados.total', 1)
        );
    }

    // =========================================================================
    //  CREAR / STORE
    // =========================================================================

    public function test_empleado_store_creates_empleado(): void
    {
        $response = $this->post(route('hr.empleados.store'), [
            'documento' => '9876543210',
            'nombres' => 'María',
            'apellidos' => 'García',
            'email' => 'maria@test.com',
            'telefono' => '3001234567',
            'sede_id' => $this->sede->id,
        ]);

        $empleado = Empleado::where('documento', '9876543210')->first();

        $this->assertNotNull($empleado);
        $this->assertEquals('María', $empleado->nombres);
        $this->assertEquals('García', $empleado->apellidos);
        $this->assertEquals($this->tenant->id, $empleado->tenant_id);
        $this->assertEquals($this->sede->id, $empleado->sede_id);
        $this->assertTrue($empleado->estado);

        $response->assertRedirectToRoute('hr.empleados.show', $empleado->id);
        $response->assertSessionHas('success');
    }

    public function test_empleado_store_validates_required_fields(): void
    {
        $response = $this->post(route('hr.empleados.store'), []);

        $response->assertSessionHasErrors(['documento', 'nombres', 'apellidos', 'sede_id']);
    }

    public function test_empleado_store_rejects_duplicate_documento(): void
    {
        Empleado::create([
            'tenant_id' => $this->tenant->id,
            'sede_id' => $this->sede->id,
            'documento' => '1111111111',
            'nombres' => 'Existente',
            'apellidos' => 'Surname',
            'estado' => true,
        ]);

        $response = $this->post(route('hr.empleados.store'), [
            'documento' => '1111111111',
            'nombres' => 'Nuevo',
            'apellidos' => 'Empleado',
            'sede_id' => $this->sede->id,
        ]);

        $response->assertSessionHasErrors('documento');
    }

    // =========================================================================
    //  SHOW
    // =========================================================================

    public function test_empleado_show_displays_empleado(): void
    {
        $empleado = Empleado::create([
            'tenant_id' => $this->tenant->id,
            'sede_id' => $this->sede->id,
            'documento' => '5555555555',
            'nombres' => 'Carlos',
            'apellidos' => 'López',
            'email' => 'carlos@test.com',
            'telefono' => '3009876543',
            'estado' => true,
        ]);

        $response = $this->get(route('hr.empleados.show', $empleado->id));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('empleado.id', $empleado->id)
            ->where('empleado.nombres', 'Carlos')
            ->where('empleado.apellidos', 'López')
        );
    }

    public function test_empleado_show_rejects_cross_tenant_access(): void
    {
        $otroTenant = Tenant::factory()->create();
        $otraSede = Sede::create([
            'tenant_id' => $otroTenant->id,
            'nombre' => 'Sede Ajena',
            'activo' => true,
        ]);
        $empleadoAjeno = Empleado::create([
            'tenant_id' => $otroTenant->id,
            'sede_id' => $otraSede->id,
            'documento' => '9999999999',
            'nombres' => 'Ajeno',
            'apellidos' => 'Tenant',
            'estado' => true,
        ]);

        // BelongsToTenant scope returns 404 (no encontrado) en vez de 403
        $response = $this->get(route('hr.empleados.show', $empleadoAjeno->id));

        $response->assertStatus(404);
    }

    // =========================================================================
    //  UPDATE
    // =========================================================================

    public function test_empleado_update_modifies_fields(): void
    {
        $empleado = Empleado::create([
            'tenant_id' => $this->tenant->id,
            'sede_id' => $this->sede->id,
            'documento' => '4444444444',
            'nombres' => 'Antes',
            'apellidos' => 'Original',
            'email' => 'antes@test.com',
            'telefono' => '3000000000',
            'estado' => true,
        ]);

        $response = $this->put(route('hr.empleados.update', $empleado->id), [
            'documento' => '4444444444',
            'nombres' => 'Después',
            'apellidos' => 'Modificado',
            'email' => 'despues@test.com',
            'telefono' => '3001111111',
            'sede_id' => $this->sede->id,
            'estado' => true,
        ]);

        // El controller usa back() — verificar que redirige
        $response->assertStatus(302);
        $response->assertSessionHas('success');

        $empleado->refresh();
        $this->assertEquals('Después', $empleado->nombres);
        $this->assertEquals('Modificado', $empleado->apellidos);
        $this->assertEquals('despues@test.com', $empleado->email);
    }

    public function test_empleado_update_rejects_cross_tenant(): void
    {
        $otroTenant = Tenant::factory()->create();
        $otraSede = Sede::create([
            'tenant_id' => $otroTenant->id,
            'nombre' => 'Sede Ajena',
            'activo' => true,
        ]);
        $empleadoAjeno = Empleado::create([
            'tenant_id' => $otroTenant->id,
            'sede_id' => $otraSede->id,
            'documento' => '8888888888',
            'nombres' => 'Ajeno',
            'apellidos' => 'Tenant',
            'estado' => true,
        ]);

        // BelongsToTenant scope returns 404 (no encontrado) en vez de 403
        $response = $this->put(route('hr.empleados.update', $empleadoAjeno->id), [
            'documento' => '8888888888',
            'nombres' => 'Hacked',
            'apellidos' => 'User',
            'sede_id' => $otraSede->id,
        ]);

        $response->assertStatus(404);
    }

    // =========================================================================
    //  DELETE (no soportado)
    // =========================================================================

    public function test_empleado_cannot_delete_with_active_contract(): void
    {
        $empleado = Empleado::create([
            'tenant_id' => $this->tenant->id,
            'sede_id' => $this->sede->id,
            'documento' => '7777777777',
            'nombres' => 'NoBorrar',
            'apellidos' => 'Test',
            'estado' => true,
        ]);

        // Crear contrato activo
        Contrato::create([
            'empleado_id' => $empleado->id,
            'tipo_contrato' => 'indefinido',
            'cargo' => 'Desarrollador',
            'salario_base' => 5000000,
            'fecha_inicio' => '2026-01-01',
            'estado' => true,
        ]);

        // Intentar DELETE — la ruta no existe (solo GET/PUT), retorna 405 Method Not Allowed
        $response = $this->delete(route('hr.empleados.show', $empleado->id));

        $response->assertStatus(405);

        // Verificar que el empleado y su contrato siguen existiendo
        $this->assertDatabaseHas('hr_empleados', ['id' => $empleado->id, 'estado' => true]);
        $this->assertDatabaseHas('hr_contratos', [
            'empleado_id' => $empleado->id,
            'estado' => true,
        ]);
    }
}
```

## Correcciones

| # | Severidad | Archivo | Descripción | Estado |
|---|-----------|---------|-------------|--------|
| 1 | CRITICO | `Models/EntidadParafiscal.php` | Falta import `use App\Core\Models\Tenant;` — `BelongsToTenant` ya lo importa via trait, pero la relación `tenant()` referencia `Tenant::class` sin importarlo explícitamente. Puede causar ClassNotFound en runtime si el trait no lo auto-importa. | PENDIENTE |
| 2 | CRITICO | `Models/ConfiguracionLegal.php` | Mismo problema: relación `tenant()` referencia `Tenant::class` sin import. | PENDIENTE |
| 3 | ALTO | `Controllers/EmpleadoController.php:84-140` | El `DB::transaction` no retorna el empleado creado — después del commit hace una segunda query por `documento` para el redirect. Si hay duplicados concurrentes podría encontrar el registro incorrecto. | PENDIENTE |
| 4 | ALTO | `Migrations/2026_07_05_000001` | `tenant_id` agregado como `nullable()` a tablas secundarias (contratos, prestamos, etc.). Si `BelongsToTenant` aplica scope全球 que filtra por `tenant_id IS NOT NULL`, los registros existentes sin `tenant_id` se vuelven invisibles. Debería ser `nullable()` solo para migración gradual con backfill. | PENDIENTE |
| 5 | MEDIO | `Migrations/2026_06_20_135005` | `nomina_id` en `hr_prestamo_cuotas` tiene `foreignId()->index()` pero **sin** `->constrained()`. FK huérfana. | PENDIENTE |
| 6 | MEDIO | `Controllers/PrestamoController.php:49` | Campo de validación es `numero_cuotas` pero el frontend (Prestamos/Index.jsx:48) envía `cuotas_pactadas`. Hay un mismatch entre lo que el form envía y lo que el controller valida — el campo nunca llega. | PENDIENTE |
| 7 | MEDIO | `Controllers/EmpleadoController.php:31-34` | Búsqueda con `ilike` es PostgreSQL-specific. Sin fallback para SQLite en tests, las búsquedas en tests fallarían silenciosamente (ilike no existe en SQLite). | PENDIENTE |
| 8 | MEDIO | `Pages/Hr/Empleados/Create.jsx:52` | `<select>` para `sede_id` no tiene opción vacía por defecto — el primer `<option>` tiene `value=""` pero no tiene `disabled` ni `selected`, el campo empieza vacío y puede pasar validación con string vacío. | PENDIENTE |
| 9 | BAJO | `Pages/Hr/Prestamos/Index.jsx:49` | Usa `cuotas_pactadas` como nombre del campo pero el controller valida `numero_cuotas`. Mismatch funcional — el formulario nunca puede crear un préstamo. | PENDIENTE |
| 10 | BAJO | `Pages/Hr/Catalogos/Organigrama.jsx:36` | El `confirm()` de eliminación de departamento dice "Se eliminarán también los cargos asociados" pero el backend (`destroyDepartamento`) **rechaza** la eliminación si hay cargos. Mensaje engañoso. | PENDIENTE |
| 11 | BAJO | Sin Providers | El módulo no tiene `HrServiceProvider` — la provisión de datos depende de `ModuleActivator` del Core. Funcional pero frágil si se necesita customizar. | INFORMACIONAL |
| 12 | BAJO | `Models/PrestamoCuota.php:29-33` | Relación `nomina()` hardcodea un `class_exists` check. Patrón anti-circumvent; mejor usar relación condicional normal. | PENDIENTE |
| 13 | INFO | Tests | Solo existe 1 archivo de test (`EmpleadoControllerTest`). Faltan tests para: ContratoController, PrestamoController, IncapacidadController, AfiliacionController, ConfiguracionLegalController, CatalogoOrganizacionalController. | PENDIENTE |
| 14 | INFO | Frontend | Ninguna página usa `usePermissions()` para proteger botones de acción (crear, editar, eliminar). La protección es solo a nivel de rutas backend. | PENDIENTE |
