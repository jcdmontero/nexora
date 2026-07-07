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

        $prestamos = Prestamo::with(['empleado', 'cuotas'])
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
                    'tenant_id' => $tenantId,
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
        if ($cuota->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        if ($cuota->estado === 'PAGADA') {
            return back()->with('error', 'Esta cuota ya está pagada.');
        }

        DB::transaction(function () use ($cuota) {
            // Recargar el préstamo con bloqueo pesimista
            $prestamo = Prestamo::where('id', $cuota->prestamo_id)
                ->lockForUpdate()
                ->firstOrFail();

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
