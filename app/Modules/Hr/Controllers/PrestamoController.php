<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\Empleado;
use App\Modules\Hr\Models\Prestamo;
use App\Modules\Hr\Models\PrestamoCuota;
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

        return Inertia::render('Hr/Prestamos/Index', [
            'prestamos' => $prestamos,
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

        $montoCuota = round($data['monto_total'] / $data['numero_cuotas'], 2);

        DB::transaction(function () use ($data, $montoCuota, $tenantId) {
            $prestamo = Prestamo::create([
                'empleado_id' => $data['empleado_id'],
                'monto_total' => $data['monto_total'],
                'monto_cuota' => $montoCuota,
                'numero_cuotas' => $data['numero_cuotas'],
                'saldo_pendiente' => $data['monto_total'],
                'descripcion' => $data['descripcion'] ?? null,
                'fecha_prestamo' => $data['fecha_prestamo'],
            ]);

            // Generar cuotas mensuales
            $cuotas = [];
            for ($i = 1; $i <= $data['numero_cuotas']; $i++) {
                $fechaVencimiento = date('Y-m-d', strtotime(
                    "+{$i} months",
                    strtotime($data['fecha_prestamo'])
                ));

                $cuotas[] = [
                    'prestamo_id' => $prestamo->id,
                    'numero_cuota' => $i,
                    'monto' => $montoCuota,
                    'fecha_vencimiento' => $fechaVencimiento,
                    'pagada' => false,
                    'monto_pagado' => 0,
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

        if ($cuota->pagada) {
            return back()->with('error', 'Esta cuota ya está pagada.');
        }

        DB::transaction(function () use ($cuota, $prestamo) {
            $cuota->update([
                'pagada' => true,
                'monto_pagado' => $cuota->monto,
                'fecha_pago' => now(),
            ]);

            $nuevoSaldo = $prestamo->saldo_pendiente - $cuota->monto;
            $prestamo->update([
                'saldo_pendiente' => max($nuevoSaldo, 0),
            ]);
        });

        return back()->with('success', "Cuota #{$cuota->numero_cuota} pagada exitosamente.");
    }
}
