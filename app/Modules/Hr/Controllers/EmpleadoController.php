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

            // Contrato
            'cargo_id' => 'required|exists:hr_cargos,id',
            'tipo_contrato' => 'required|string|max:50',
            'salario_base' => 'required|numeric|min:0',
            'fecha_inicio_contrato' => 'required|date',

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

            // Obtener el nombre del cargo
            $cargo = \App\Modules\Hr\Models\Cargo::find($data['cargo_id']);

            // Crear contrato
            Contrato::create([
                'tenant_id' => $tenantId,
                'empleado_id' => $empleado->id,
                'cargo_id' => $data['cargo_id'],
                'cargo' => $cargo ? $cargo->nombre : '',
                'tipo_contrato' => $data['tipo_contrato'],
                'salario_base' => $data['salario_base'],
                'fecha_inicio' => $data['fecha_inicio_contrato'],
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
