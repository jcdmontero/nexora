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
            // Solo usuarios con permiso de crear usuarios pueden crear cuentas de sistema
            if (!auth()->user()->can('users:create')) {
                return back()->with('error', 'No tienes permiso para crear usuarios de sistema.');
            }

            $userEmail = $data['user_email'] ?? $data['email'];
            if (empty($userEmail)) {
                return back()->with('error', 'Debes proporcionar un email para el usuario de sistema.');
            }

            $userPassword = $data['user_password'] ?? str()->random(12);

            // Validar que el email no exista ya
            if (User::where('email', $userEmail)->exists()) {
                return back()->with('error', 'El email del usuario ya está registrado.');
            }

            $user = User::create([
                'name' => "{$data['nombres']} {$data['apellidos']}",
                'email' => $userEmail,
                'password' => Hash::make($userPassword),
                'tenant_id' => $tenantId,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            // Asignar rol
            if (!empty($data['user_role'])) {
                $registrar = app(PermissionRegistrar::class);
                $previous = $registrar->getPermissionsTeamId();
                $registrar->setPermissionsTeamId($tenantId);
                $user->assignRole($data['user_role']);
                $registrar->setPermissionsTeamId($previous);
            }

            // Vincular usuario al empleado
            $empleado->update(['user_id' => $user->id]);
        }

        return redirect()->route('hr.empleados.show', $empleado->id)
            ->with('success', 'Empleado creado exitosamente.');
    }

    public function show(Empleado $empleado)
    {
        if ($empleado->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

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

        return Inertia::render('Hr/Empleados/Show', [
            'empleado' => $empleado,
            'sedes' => Sede::where('tenant_id', auth()->user()->tenant_id)->get(['id', 'nombre']),
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
