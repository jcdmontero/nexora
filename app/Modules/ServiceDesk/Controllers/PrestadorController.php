<?php

namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\Empleado;
use App\Modules\ServiceDesk\Models\Prestador;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Core\Models\Sede;
use Spatie\Permission\PermissionRegistrar;
use Inertia\Inertia;

/**
 * Gestión de prestadores de servicios técnicos.
 *
 * NOTA DE DISEÑO (cambio respecto al legacy servicemanager):
 * En el legacy los técnicos se manejaban como usuarios con rol TECNICO
 * o empleados con cargo productivo (es_productivo = true).
 * En Nexora, Prestador es la entidad única para todo tipo de técnico:
 * contratista, empleado, freelance o comisionista.
 * Esto permite que ServiceDesk funcione sin RRHH activo.
 *
 * @see \App\Modules\ServiceDesk\Models\Prestador
 */
class PrestadorController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $search = $request->input('search');
        $filter = $request->input('tipo');

        $prestadores = Prestador::where('tenant_id', $tenantId)
            ->withCount('ordenes')
            ->when($search, fn ($q, $s) => $q->where('nombre_completo', 'ilike', "%{$s}%")
                ->orWhere('numero_documento', 'ilike', "%{$s}%")
                ->orWhere('email', 'ilike', "%{$s}%"))
            ->when($filter, fn ($q, $f) => $q->where('tipo_vinculacion', $f))
            ->orderBy('nombre_completo')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('ServiceDesk/Prestadores/Index', [
            'prestadores' => $prestadores,
            'filters' => $request->only(['search', 'tipo']),
            'tiposVinculacion' => [
                'CONTRATISTA' => 'Contratista',
                'EMPLEADO' => 'Empleado',
                'FREELANCE' => 'Freelance',
                'COMISIONISTA' => 'Comisionista',
            ],
        ]);
    }

    public function show(Prestador $prestador)
    {
        if ($prestador->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $prestador->loadCount('ordenes');
        $ordenes = $prestador->ordenes()
            ->orderByDesc('fecha_recibido')
            ->take(20)
            ->get(['id', 'numero_orden', 'estado', 'total_final', 'fecha_recibido']);

        return Inertia::render('ServiceDesk/Prestadores/Show', [
            'prestador' => [
                'id' => $prestador->id,
                'nombre_completo' => $prestador->nombre_completo,
                'tipo_documento' => $prestador->tipo_documento,
                'numero_documento' => $prestador->numero_documento,
                'email' => $prestador->email,
                'telefono' => $prestador->telefono,
                'tipo_vinculacion' => $prestador->tipo_vinculacion,
                'activo' => (bool) $prestador->activo,
                'es_gratuito' => (bool) $prestador->es_gratuito,
                'tipo_comision' => $prestador->tipo_comision,
                'porcentaje_comision' => (float) $prestador->porcentaje_comision,
                'user_id' => $prestador->user_id,
                'user_name' => $prestador->user?->name,
                'ordenes_count' => $prestador->ordenes_count,
                'total_comisiones' => (float) $prestador->liquidaciones()->sum('total_comisiones'),
                'ordenes' => $ordenes->map(fn ($o) => [
                    'id' => $o->id,
                    'numero_orden' => $o->numero_orden,
                    'estado' => $o->estado->value,
                    'estado_label' => $o->estado->label(),
                    'estado_color' => $o->estado->color(),
                    'total_cliente' => (float) $o->total_final,
                    'fecha_recibido' => $o->fecha_recibido?->format('Y-m-d H:i'),
                ]),
            ],
        ]);
    }

    public function create()
    {
        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('ServiceDesk/Prestadores/Create', [
            'empleados' => Empleado::where('tenant_id', $tenantId)
                ->where('estado', true)
                ->orderBy('nombres')
                ->get(['id', 'nombres', 'apellidos', 'documento']),
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'tipo_documento' => 'required|string|max:20',
            'numero_documento' => 'required_if:tipo_vinculacion,EMPLEADO|nullable|string|max:50',
            'nombre_completo' => 'required|string|max:200',
            'email' => 'nullable|email|max:150',
            'telefono' => 'nullable|string|max:50',
            'tipo_vinculacion' => 'required|in:CONTRATISTA,EMPLEADO,FREELANCE,COMISIONISTA,APRENDIZ,SOCIO',
            'empleado_id' => 'nullable|exists:hr_empleados,id',
            'es_gratuito' => 'boolean',
            'generar_usuario' => 'boolean',
            'password' => 'exclude_if:generar_usuario,false|required_if:generar_usuario,true|nullable|string|min:8|confirmed',
        ]);

        if ($request->generar_usuario) {
            $request->validate([
                'email' => 'required|email|unique:users,email',
            ]);
        }

        $data['tenant_id'] = $tenantId;
        $data['activo'] = true;

        $userId = null;
        if ($request->generar_usuario) {
            $user = User::create([
                'tenant_id' => $tenantId,
                'name' => $data['nombre_completo'],
                'email' => $data['email'],
                'password' => Hash::make($request->password),
                'is_active' => true,
            ]);

            app(PermissionRegistrar::class)->setPermissionsTeamId($tenantId);
            $user->assignRole('TECNICO');

            $userId = $user->id;
        }

        $data['user_id'] = $userId;
        $empleadoId = null;

        if ($data['tipo_vinculacion'] === 'EMPLEADO') {
            $parts = explode(' ', trim($data['nombre_completo']), 2);
            $nombres = $parts[0];
            $apellidos = $parts[1] ?? '';

            $sede = Sede::where('tenant_id', $tenantId)->first();

            $empleado = Empleado::firstOrCreate(
                ['tenant_id' => $tenantId, 'documento' => $data['numero_documento']],
                [
                    'sede_id' => $sede ? $sede->id : 1, // Fallback if no sede
                    'nombres' => $nombres,
                    'apellidos' => $apellidos,
                    'email' => $data['email'],
                    'telefono' => $data['telefono'],
                    'user_id' => $userId,
                    'estado' => true,
                ]
            );
            $empleadoId = $empleado->id;
        }

        $data['empleado_id'] = $empleadoId;

        Prestador::create(collect($data)->except(['generar_usuario', 'password', 'password_confirmation'])->toArray());

        return redirect()->route('service-desk.prestadores.index')
            ->with('success', 'Prestador registrado correctamente.');
    }

    public function edit(Prestador $prestador)
    {
        if ($prestador->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('ServiceDesk/Prestadores/Edit', [
            'prestador' => $prestador,
            'empleados' => Empleado::where('tenant_id', $tenantId)
                ->where('estado', true)
                ->orderBy('nombres')
                ->get(['id', 'nombres', 'apellidos', 'documento']),
        ]);
    }

    public function update(Request $request, Prestador $prestador)
    {
        if ($prestador->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'tipo_documento' => 'required|string|max:20',
            'numero_documento' => 'required_if:tipo_vinculacion,EMPLEADO|nullable|string|max:50',
            'nombre_completo' => 'required|string|max:200',
            'email' => 'nullable|email|max:150',
            'telefono' => 'nullable|string|max:50',
            'tipo_vinculacion' => 'required|in:CONTRATISTA,EMPLEADO,FREELANCE,COMISIONISTA,APRENDIZ,SOCIO',
            'empleado_id' => 'nullable|exists:hr_empleados,id',
            'es_gratuito' => 'boolean',
            'activo' => 'boolean',
            'generar_usuario' => 'boolean',
            'password' => 'exclude_if:generar_usuario,false|required_if:generar_usuario,true|nullable|string|min:8|confirmed',
        ]);

        // ── Crear usuario si no existe y se solicita ──
        $userId = $prestador->user_id;
        if ($request->generar_usuario && !$prestador->user_id) {
            $request->validate([
                'email' => 'required|email|unique:users,email',
            ]);

            $tenantId = auth()->user()->tenant_id;

            $user = User::create([
                'tenant_id' => $tenantId,
                'name' => $data['nombre_completo'],
                'email' => $data['email'],
                'password' => Hash::make($request->password),
                'is_active' => true,
            ]);

            app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($tenantId);
            $user->assignRole('TECNICO');

            $userId = $user->id;
        }

        $data['user_id'] = $userId;

        $tenantId = auth()->user()->tenant_id;
        $empleadoId = $prestador->empleado_id;

        if ($data['tipo_vinculacion'] === 'EMPLEADO') {
            $parts = explode(' ', trim($data['nombre_completo']), 2);
            $nombres = $parts[0];
            $apellidos = $parts[1] ?? '';

            $sede = Sede::where('tenant_id', $tenantId)->first();

            $empleado = Empleado::firstOrCreate(
                ['tenant_id' => $tenantId, 'documento' => $data['numero_documento']],
                [
                    'sede_id' => $sede ? $sede->id : 1,
                    'nombres' => $nombres,
                    'apellidos' => $apellidos,
                    'email' => $data['email'],
                    'telefono' => $data['telefono'],
                    'user_id' => $userId,
                    'estado' => true,
                ]
            );
            $empleadoId = $empleado->id;
        } else {
            // Si dejó de ser empleado, lo desvinculamos en Prestador pero no borramos el de RRHH
            $empleadoId = null;
        }

        $data['empleado_id'] = $empleadoId;

        $prestador->update(collect($data)->except(['generar_usuario', 'password', 'password_confirmation'])->toArray());

        return redirect()->route('service-desk.prestadores.index')
            ->with('success', 'Prestador actualizado correctamente.');
    }

    public function destroy(Prestador $prestador)
    {
        if ($prestador->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        if ($prestador->ordenes()->count() > 0) {
            return back()->with('error', 'No se puede eliminar: el prestador tiene órdenes asignadas.');
        }

        $prestador->delete();

        return back()->with('success', 'Prestador eliminado.');
    }
}
