<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Core\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OfflineSyncController extends Controller
{
    public function sync(Request $request): JsonResponse
    {
        $request->validate([
            'operations' => 'required|array|max:50',
            'operations.*.id' => 'required|string',
            'operations.*.type' => 'required|string',
            'operations.*.endpoint' => 'required|string',
            'operations.*.method' => 'required|in:POST,PUT,PATCH,DELETE',
            'operations.*.data' => 'required|array',
        ]);

        $tenant = app('current_tenant');
        if (! $tenant) {
            return response()->json(['error' => 'Tenant no identificado'], 400);
        }

        $results = [];
        $operations = $request->input('operations', []);

        foreach ($operations as $op) {
            $result = $this->processOperation($op, $tenant);
            $results[] = array_merge(['id' => $op['id']], $result);
        }

        return response()->json(['results' => $results]);
    }

    private function processOperation(array $op, Tenant $tenant): array
    {
        try {
            $type = $op['type'];
            $data = $op['data'];
            $data['tenant_id'] = $tenant->id;

            return match ($type) {
                'pos.sale' => $this->processPosSale($data),
                'service-desk.order' => $this->processServiceDeskOrder($data),
                default => ['status' => 'skipped', 'message' => "Tipo '{$type}' no soportado offline"],
            };
        } catch (\Throwable $e) {
            Log::warning('Offline sync falló: ' . $e->getMessage(), [
                'operation_id' => $op['id'],
                'type' => $op['type'],
            ]);

            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    private function processPosSale(array $data): array
    {
        $factura = DB::table('sales_facturas')->insertGetId([
            'tenant_id' => $data['tenant_id'],
            'cliente_id' => $data['cliente_id'] ?? null,
            'vendedor_id' => $data['vendedor_id'] ?? null,
            'numero' => $this->generateFacturaNumber($data['tenant_id']),
            'total' => $data['total'] ?? 0,
            'metodo_pago' => $data['metodo_pago'] ?? 'efectivo',
            'estado' => 'pagada',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if (! empty($data['items']) && is_array($data['items'])) {
            foreach ($data['items'] as $item) {
                DB::table('sales_factura_items')->insert([
                    'factura_id' => $factura,
                    'tenant_id' => $data['tenant_id'],
                    'producto_id' => $item['id'] ?? null,
                    'nombre' => $item['nombre'] ?? '',
                    'cantidad' => $item['qty'] ?? 1,
                    'precio_unitario' => $item['precio_venta'] ?? 0,
                    'subtotal' => ($item['qty'] ?? 1) * ($item['precio_venta'] ?? 0),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        return ['status' => 'synced', 'serverId' => $factura];
    }

    private function processServiceDeskOrder(array $data): array
    {
        $orden = DB::table('sd_ordenes')->insertGetId([
            'tenant_id' => $data['tenant_id'],
            'cliente_id' => $data['cliente_id'] ?? null,
            'tecnico_id' => $data['tecnico_id'] ?? null,
            'numero_orden' => $this->generateOrdenNumber($data['tenant_id']),
            'estado' => 'recibido',
            'tipo_equipo_id' => $data['tipo_equipo_id'] ?? null,
            'marca_id' => $data['marca_id'] ?? null,
            'modelo_id' => $data['modelo_id'] ?? null,
            'numero_serie' => $data['numero_serie'] ?? null,
            'accesorios_equipo' => $data['accesorios_equipo'] ?? null,
            'observaciones_equipo' => $data['observaciones_equipo'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ['status' => 'synced', 'serverId' => $orden];
    }

    private function generateFacturaNumber(int $tenantId): string
    {
        $last = DB::table('sales_facturas')
            ->where('tenant_id', $tenantId)
            ->orderByDesc('id')
            ->value('numero');

        $next = 1;
        if ($last && preg_match('/(\d+)$/', $last, $m)) {
            $next = (int) $m[1] + 1;
        }

        return 'FAC-' . str_pad($next, 6, '0', STR_PAD_LEFT);
    }

    private function generateOrdenNumber(int $tenantId): string
    {
        $last = DB::table('sd_ordenes')
            ->where('tenant_id', $tenantId)
            ->orderByDesc('id')
            ->value('numero_orden');

        $next = 1;
        if ($last && preg_match('/(\d+)$/', $last, $m)) {
            $next = (int) $m[1] + 1;
        }

        return 'OT-' . str_pad($next, 6, '0', STR_PAD_LEFT);
    }
}
