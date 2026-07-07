<?php

namespace App\Modules\Sales\Services;

use App\Core\Models\Configuracion;
use App\Modules\Accounting\Services\ContabilidadConfig;
use App\Modules\Accounting\Services\ContabilidadService;
use App\Modules\Cash\Services\CajaService;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Sales\Models\Factura;
use App\Modules\Sales\Models\FacturaItem;
use App\Modules\Sales\Services\ElectronicBilling\DianService;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FacturaService
{
    public function __construct(
        private CajaService $cajaService,
        private ContabilidadService $contabilidadService,
        private \App\Modules\Accounting\Services\TributaryRuleService $tributaryService,
        private ?DianService $dianService = null,
    ) {}

    public function crearDesdeOrden(OrdenReparacion $orden, array $data): Factura
    {
        $tenantId = auth()->user()->tenant_id;

        // Validar que la orden no tenga ya una factura (evita doble facturación)
        $existeFactura = Factura::where('orden_id', $orden->id)->exists();
        if ($existeFactura) {
            throw new \Exception(
                "La orden {$orden->numero_orden} ya tiene una factura asociada. No se puede facturar dos veces la misma orden."
            );
        }

        $sesion = $this->cajaService->getSesionAbierta(auth()->id());

        if (!$sesion) {
            $baseApertura = $data['base_apertura'] ?? throw new \Exception('Debe abrir la caja ingresando una base inicial.');
            $cajaId = (int) ($data['caja_id'] ?? 0);
            if ($cajaId <= 0) {
                throw new \Exception('Debe seleccionar una caja para abrir el turno.');
            }
            $sesion = $this->cajaService->abrirCaja(auth()->id(), $cajaId, (float) $baseApertura, 'Apertura automática desde facturación');
        }

        $descuento = min(max((float) ($data['descuento'] ?? 0), 0), (float) $orden->total_cliente);

        $incluirIva = (bool) ($data['incluir_iva'] ?? false);
        $porcentajeIva = $incluirIva ? (float) ($data['porcentaje_iva'] ?? 0) : 0;

        // Método de pago real elegido por el cajero y pagos mixtos (si los hay).
        $metodoPago = $data['metodo_pago'] ?? 'efectivo';
        $pagosMixtos = $data['pagos_mixtos'] ?? [];
        $esCredito = $metodoPago === 'credito';

        $factura = null;

        DB::transaction(function () use ($orden, $sesion, $data, $descuento, $porcentajeIva, $tenantId, $metodoPago, $pagosMixtos, $esCredito, &$factura) {
            // Actualizar precio_cliente (mano de obra) desde el payload
            if (isset($data['precio_cliente'])) {
                $orden->precio_cliente = (float) $data['precio_cliente'];
                $orden->save();
            }

            // Sincronizar servicios y repuestos PRIMERO
            $orden->servicios()->detach();
            foreach ($data['servicios'] ?? [] as $s) {
                $orden->servicios()->attach($s['servicio_id'], [
                    'cantidad' => $s['cantidad'] ?? 1,
                    'precio_aplicado' => $s['precio_aplicado'] ?? 0,
                    'costo_tecnico_aplicado' => $s['costo_tecnico_aplicado'] ?? 0,
                ]);
            }

            $orden->repuestos()->detach();
            foreach ($data['repuestos'] ?? [] as $r) {
                $orden->repuestos()->attach($r['producto_id'], [
                    'cantidad' => $r['cantidad'] ?? 1,
                    'precio_unitario' => $r['precio_unitario'] ?? 0,
                ]);
            }

            $orden->load(['servicios', 'repuestos']);

            // Calcular subtotal DESPUÉS de sincronizar
            $subtotal = (float) $orden->total_cliente;
            $descuento = min(max((float) $descuento, 0), $subtotal);
            $baseGravable = max(0, $subtotal - $descuento);
            $iva = round($baseGravable * ($porcentajeIva / 100), 2);
            $total = $baseGravable + $iva;

            $orden->descuento = $descuento;
            $orden->total_final = $total;
            $orden->save();

            $infoNumero = $this->generarNumeroSiguiente($tenantId, 'FAC');

            // Crear factura
            $factura = Factura::create([
                'tenant_id' => $tenantId,
                'cliente_id' => $orden->cliente_id,
                'user_id' => auth()->id(),
                'orden_id' => $orden->id,
                'numero' => $infoNumero['numero'],
                'resolucion_id' => $infoNumero['resolucion_id'],
                'subtotal' => $subtotal,
                'impuestos' => $iva,
                'descuento' => $descuento,
                'total' => $total,
                'estado' => $esCredito ? 'pendiente' : 'pagada',
                'metodo_pago' => $metodoPago,
                'notas' => 'Factura generada desde Orden de Reparación ' . $orden->numero_orden,
                'tipo_documento' => 'factura',
            ]);

            $impLinea = fn (float $base) => round($base * ($porcentajeIva / 100), 2);

            $manoDeObra = (float) ($orden->precio_cliente ?? 0);
            if ($manoDeObra > 0) {
                FacturaItem::create([
                    'factura_id' => $factura->id,
                    'descripcion' => 'Servicio de Diagnóstico / Mano de Obra Base',
                    'cantidad' => 1,
                    'precio_unitario' => $manoDeObra,
                    'tasa_impuesto' => $porcentajeIva,
                    'subtotal' => $manoDeObra,
                    'impuesto_total' => $impLinea($manoDeObra),
                    'total' => $manoDeObra + $impLinea($manoDeObra),
                ]);
            }

            foreach ($orden->servicios as $s) {
                $baseLinea = (float) $s->pivot->precio_aplicado;
                FacturaItem::create([
                    'factura_id' => $factura->id,
                    'descripcion' => $s->nombre,
                    'cantidad' => $s->pivot->cantidad,
                    'precio_unitario' => $s->pivot->cantidad > 0 ? ($baseLinea / $s->pivot->cantidad) : $baseLinea,
                    'tasa_impuesto' => $porcentajeIva,
                    'subtotal' => $baseLinea,
                    'impuesto_total' => $impLinea($baseLinea),
                    'total' => $baseLinea + $impLinea($baseLinea),
                ]);
            }

            $repuestoIds = $orden->repuestos->pluck('id')->filter()->unique()->values()->all();
            $productos = Producto::whereIn('id', $repuestoIds)->lockForUpdate()->get()->keyBy('id');

            foreach ($orden->repuestos as $r) {
                $baseLinea = (float) $r->pivot->cantidad * (float) $r->pivot->precio_unitario;
                $producto = $productos->get($r->id);
                if ($producto) {
                    if ((float) $producto->stock_actual < (float) $r->pivot->cantidad) {
                        throw new \Exception("Stock insuficiente para el repuesto {$producto->nombre}.");
                    }
                    $producto->decrement('stock_actual', $r->pivot->cantidad);
                }

                FacturaItem::create([
                    'factura_id' => $factura->id,
                    'producto_id' => $r->id,
                    'descripcion' => $r->nombre,
                    'cantidad' => $r->pivot->cantidad,
                    'precio_unitario' => $r->pivot->precio_unitario,
                    'tasa_impuesto' => $porcentajeIva,
                    'subtotal' => $baseLinea,
                    'impuesto_total' => $impLinea($baseLinea),
                    'total' => $baseLinea + $impLinea($baseLinea),
                ]);
            }

            // Caja: registrar el pago respetando el método elegido y los pagos mixtos.
            // El crédito no registra movimiento de caja (queda como cuenta por cobrar).
            $saldoPagado = max(0, $total - ($orden->abono_inicial ?? 0));
            if ($saldoPagado > 0 && !$esCredito) {
                if (!empty($pagosMixtos)) {
                    $sumaPagos = array_sum(array_map(fn ($p) => (float) ($p['monto'] ?? 0), $pagosMixtos));
                    if (round($sumaPagos, 2) !== round($saldoPagado, 2)) {
                        throw new \Exception(
                            "La suma de los pagos mixtos (\${$sumaPagos}) no coincide con el saldo a pagar (\${$saldoPagado})."
                        );
                    }
                    // Un movimiento de caja por cada método de pago mixto.
                    foreach ($pagosMixtos as $pago) {
                        $montoPago = (float) ($pago['monto'] ?? 0);
                        if ($montoPago > 0) {
                            $this->cajaService->registrarMovimiento(
                                $sesion,
                                'ingreso',
                                $montoPago,
                                $pago['metodo'] ?? 'efectivo',
                                'Pago mixto orden ' . $orden->numero_orden,
                                $factura
                            );
                        }
                    }
                } else {
                    // Pago único con el método real elegido por el cajero.
                    $this->cajaService->registrarMovimiento(
                        $sesion,
                        'ingreso',
                        $saldoPagado,
                        $metodoPago,
                        'Pago de saldo orden ' . $orden->numero_orden,
                        $factura
                    );
                }
            }

            // Contabilidad
            $this->registrarContabilidad($factura, $tenantId, $pagosMixtos);

            // DIAN
            $this->emitirDian($factura, $tenantId);

            // Cerrar orden
            $orden->estado = \App\Modules\ServiceDesk\Enums\OrdenEstado::Entregado;
            $orden->fecha_entregado = now();
            $orden->save();
        });

        return $factura;
    }

    public function crearDesdePos(array $data): Factura
    {
        $tenantId = auth()->user()->tenant_id;
        $regimen = $this->determinarRegimen($tenantId);

        $sesion = $this->cajaService->getSesionAbierta(auth()->id());
        $esCredito = ($data['metodo_pago'] ?? 'efectivo') === 'credito';

        if (!$sesion && !$esCredito) {
            throw new \Exception('Debes abrir un turno de caja para registrar pagos de contado.');
        }

        $subtotal = 0;
        $impuestos = 0;
        $porcentajeIva = 0;

        if ($regimen === 'comun') {
            $incluirIva = Configuracion::get('incluir_iva', 'false', $tenantId) === 'true';
            $porcentajeIva = $incluirIva ? (float) Configuracion::get('porcentaje_iva', '19', $tenantId) : 0;
        }

        foreach ($data['items'] as $item) {
            $itemSubtotal = $item['cantidad'] * $item['precio_unitario'];
            if ($item['tipo'] === 'producto' && $regimen === 'comun') {
                $itemImpuesto = $itemSubtotal * ($porcentajeIva / 100);
            } else {
                $itemImpuesto = 0;
            }
            $subtotal += $itemSubtotal;
            $impuestos += $itemImpuesto;
        }

        $total = $subtotal + $impuestos;
        $estado = $esCredito ? 'pendiente' : 'pagada';

        $factura = null;

        DB::transaction(function () use ($data, $tenantId, $regimen, $sesion, $esCredito, $subtotal, $impuestos, $total, $estado, &$factura) {
            $productoIds = collect($data['items'] ?? [])->where('tipo', 'producto')->pluck('producto_id')->filter()->unique()->values()->all();
            $productos = Producto::whereIn('id', $productoIds)->lockForUpdate()->get()->keyBy('id');
            $ivaPorcentaje = $regimen === 'comun' ? (float) Configuracion::get('porcentaje_iva', '19', $tenantId) : 0;

            $infoNumero = $this->generarNumeroSiguiente($tenantId, 'POS');

            $factura = Factura::create([
                'tenant_id' => $tenantId,
                'user_id' => auth()->id(),
                'cliente_id' => $data['cliente_id'] ?? null,
                'orden_id' => $data['orden_id'] ?? null,
                'numero' => $infoNumero['numero'],
                'resolucion_id' => $infoNumero['resolucion_id'],
                'subtotal' => $subtotal,
                'impuestos' => $impuestos,
                'descuento' => 0,
                'total' => $total,
                'estado' => $estado,
                'metodo_pago' => $data['metodo_pago'] ?? 'efectivo',
                'tipo_documento' => 'pos',
            ]);

            foreach ($data['items'] as $item) {
                $itemSubtotal = $item['cantidad'] * $item['precio_unitario'];
                $itemImpuesto = $regimen === 'comun' ? $itemSubtotal * ($ivaPorcentaje / 100) : 0;
                $producto = $productos->get($item['producto_id']);

                // Validar antes de insertar para no romper la FK constraint
                if ($item['tipo'] === 'producto') {
                    if (!$producto) {
                        throw new \Exception('Producto no válido para el item de POS.');
                    }
                    if ((float) $producto->stock_actual < (float) $item['cantidad']) {
                        throw new \Exception("Stock insuficiente para el producto {$producto->nombre}.");
                    }
                    $producto->decrement('stock_actual', $item['cantidad']);
                }

                FacturaItem::create([
                    'factura_id' => $factura->id,
                    'producto_id' => $item['tipo'] === 'producto' ? $item['producto_id'] : null,
                    'descripcion' => $item['descripcion'] ?? ($producto?->nombre ?? $item['servicio_nombre'] ?? ''),
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'tasa_impuesto' => $regimen === 'comun' ? $ivaPorcentaje : 0,
                    'subtotal' => $itemSubtotal,
                    'impuesto_total' => $itemImpuesto,
                    'total' => $itemSubtotal + $itemImpuesto,
                ]);
            }

            // Caja
            if ($estado === 'pagada' && $sesion) {
                $pagosMixtos = $data['pagos_mixtos'] ?? [];
                if (!empty($pagosMixtos)) {
                    $sumaPagos = array_sum(array_map(fn ($p) => (float) ($p['monto'] ?? 0), $pagosMixtos));
                    if (round($sumaPagos, 2) !== round($total, 2)) {
                        throw new \Exception(
                            "La suma de los pagos mixtos (\${$sumaPagos}) no coincide con el total de la factura (\${$total})."
                        );
                    }
                    foreach ($pagosMixtos as $pago) {
                        $montoPago = (float) ($pago['monto'] ?? 0);
                        if ($montoPago > 0) {
                            $this->cajaService->registrarMovimiento(
                                $sesion,
                                'ingreso',
                                $montoPago,
                                $pago['metodo'] ?? 'efectivo',
                                "Pago mixto POS Factura: {$factura->numero}",
                                $factura
                            );
                        }
                    }
                } else {
                    $this->cajaService->registrarMovimiento(
                        $sesion,
                        'ingreso',
                        $total,
                        $data['metodo_pago'] ?? 'efectivo',
                        "Venta POS Factura: {$factura->numero}",
                        $factura
                    );
                }
            }

            // Contabilidad
            $this->registrarContabilidad($factura, $tenantId, $data['pagos_mixtos'] ?? []);

            // DIAN si es común
            if ($regimen === 'comun') {
                $this->emitirDian($factura, $tenantId);
            }
        });

        return $factura;
    }

    private function generarNumeroSiguiente(int $tenantId, string $tipoDocumento): array
    {
        // 1. Intentar obtener y bloquear la resolución activa para este tenant que coincida con el tipo de documento
        $dbTipo = match (strtolower($tipoDocumento)) {
            'pos' => 'pos',
            'fac' => 'factura',
            default => strtolower($tipoDocumento),
        };

        $resolucion = \App\Modules\Sales\Models\Resolucion::where('tenant_id', $tenantId)
            ->where('tipo_documento', $dbTipo)
            ->where('is_active', true)
            ->lockForUpdate()
            ->first();

        // Fallback: si no hay resolución específica de tipo, buscar cualquier resolución activa del tenant
        if (!$resolucion) {
            $resolucion = \App\Modules\Sales\Models\Resolucion::where('tenant_id', $tenantId)
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();
        }

        if ($resolucion) {
            $nuevoConsecutivo = $resolucion->consecutivo_actual + 1;

            if ($nuevoConsecutivo > $resolucion->rango_hasta) {
                throw new \Exception("La resolución de facturación {$resolucion->numero_resolucion} ha excedido su rango máximo.");
            }

            // Verificar que la resolución esté vigente (dentro del rango de fechas)
            $ahora = now();
            if ($resolucion->fecha_desde && $ahora->lt($resolucion->fecha_desde)) {
                throw new \Exception("La resolución {$resolucion->numero_resolucion} aún no está vigente (fecha desde: {$resolucion->fecha_desde->format('Y-m-d')}).");
            }
            if ($resolucion->fecha_hasta && $ahora->gt($resolucion->fecha_hasta)) {
                throw new \Exception("La resolución {$resolucion->numero_resolucion} ha expirado (fecha hasta: {$resolucion->fecha_hasta->format('Y-m-d')}).");
            }

            $resolucion->update([
                'consecutivo_actual' => $nuevoConsecutivo
            ]);

            $prefijo = $resolucion->prefijo ?? '';
            $numero = $prefijo . $nuevoConsecutivo;

            return [
                'numero' => $numero,
                'resolucion_id' => $resolucion->id
            ];
        }

        // 2. Fallback de alta precisión con milisegundos y reintentos (sin resolución activa)
        // Para evitar colisiones concurrentes en el fallback, bloqueamos la fila del Tenant
        \App\Core\Models\Tenant::where('id', $tenantId)->lockForUpdate()->first();

        $prefijoFallback = strtoupper($tipoDocumento);
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $numero = sprintf('%s-%s-%s', $prefijoFallback, now()->format('YmdHisv'), random_int(1000, 9999));
            if (!Factura::withoutGlobalScopes()->where('numero', $numero)->exists()) {
                return [
                    'numero' => $numero,
                    'resolucion_id' => null
                ];
            }
            usleep(50000); // 50ms
        }

        throw new \RuntimeException('No se pudo generar un número de factura único. Por favor intente nuevamente.');
    }

    private function determinarRegimen(int $tenantId): string
    {
        return Configuracion::get('regimen_fiscal', 'simplificado', $tenantId);
    }

    private function registrarContabilidad(Factura $factura, int $tenantId, array $pagosMixtos = []): void
    {
        if (!class_exists(ContabilidadService::class)) {
            return;
        }

        // No contabilizar facturas anuladas
        if ($factura->anulada) {
            return;
        }

        // Evitar doble contabilización si ya existe un asiento para esta factura
        if (\App\Modules\Accounting\Models\AsientoContable::where('referencia_type', Factura::class)
            ->where('referencia_id', $factura->id)
            ->where('modulo_origen', 'ventas')
            ->exists()) {
            return;
        }

        $regimen = $this->determinarRegimen($tenantId);

        // Buscar abono de la OT para descontar anticipos
        $abono = 0;
        if ($factura->orden_id) {
            $orden = \App\Modules\ServiceDesk\Models\OrdenReparacion::find($factura->orden_id);
            $abono = (float) ($orden->abono_inicial ?? 0);
        }

        // ─── Calcular impuestos usando el motor de reglas tributarias ───
        $baseImponible = (float) $factura->subtotal - (float) $factura->descuento;
        $cliente = $factura->cliente;

        $desgloseTributario = $this->tributaryService->calculateTaxes(
            $baseImponible,
            'venta',
            $tenantId,
            $cliente,
            $factura->created_at?->toDateString()
        );

        $ivaCalculado = $desgloseTributario['iva'] ?? 0;
        $retenciones = $desgloseTributario['retenciones'] ?? [];
        $totalRetenciones = $desgloseTributario['total_retenciones'] ?? 0;

        $lineas = [];

        // ─── Anticipos de clientes: débito para reversar el anticipo ───
        if ($abono > 0) {
            $cuentaAnticipos = $this->contabilidadService->getCuenta(ContabilidadConfig::anticipos($tenantId));
            if ($cuentaAnticipos) {
                $lineas[] = [
                    'cuenta_contable_id' => $cuentaAnticipos->id,
                    'descripcion' => "Reverso anticipo {$factura->numero}",
                    'debito' => $abono,
                    'credito' => 0,
                ];
            }
        }

        // ─── Débito: una línea por cada cuenta según el método de pago (saldo restante) ───
        $saldoPagado = max(0, (float) $factura->total - $abono - $totalRetenciones);

        if ($factura->metodo_pago === 'credito' || $factura->estado !== 'pagada') {
            // Crédito: todo va a Clientes
            $this->agregarLineaDebito($lineas, ContabilidadConfig::clientes($tenantId), 'Cuenta por cobrar ' . $factura->numero, $saldoPagado);
        } elseif (!empty($pagosMixtos)) {
            // Pagos mixtos: acumular montos por cuenta
            $porCuenta = [];
            foreach ($pagosMixtos as $pago) {
                $codigo = $this->cuentaPorMetodoPago($pago['metodo'] ?? 'efectivo', $regimen);
                $porCuenta[$codigo] = ($porCuenta[$codigo] ?? 0) + (float) ($pago['monto'] ?? 0);
            }
            foreach ($porCuenta as $codigo => $monto) {
                if ($monto > 0) {
                    $this->agregarLineaDebito($lineas, $codigo, 'Pago ' . $factura->numero, $monto);
                }
            }
        } else {
            // Pago único
            $codigo = $this->cuentaPorMetodoPago($factura->metodo_pago ?? 'efectivo', $regimen);
            $this->agregarLineaDebito($lineas, $codigo, 'Pago ' . $factura->numero, $saldoPagado);
        }

        // ─── Crédito: Ingresos (base gravable) ───
        $codigoIngreso = ContabilidadConfig::ingresoVentas($tenantId);
        $cuentaIngreso = $this->contabilidadService->getCuenta($codigoIngreso);
        if ($cuentaIngreso) {
            $lineas[] = [
                'cuenta_contable_id' => $cuentaIngreso->id,
                'descripcion' => "Ingreso {$factura->numero}",
                'debito' => 0,
                'credito' => $baseImponible,
            ];
        }

        // ─── IVA Generado (solo régimen común) ───
        if ($regimen === 'comun' && $ivaCalculado > 0) {
            $cuentaIva = $this->contabilidadService->getCuenta(ContabilidadConfig::ivaGenerado($tenantId));
            if ($cuentaIva) {
                $lineas[] = [
                    'cuenta_contable_id' => $cuentaIva->id,
                    'descripcion' => "IVA Generado {$factura->numero}",
                    'debito' => 0,
                    'credito' => $ivaCalculado,
                    'base_gravable' => $baseImponible,
                    'impuesto_tipo' => 'IVA',
                    'impuesto_tarifa' => $desgloseTributario['regimen'] === 'comun' ? 19.0 : 0,
                ];
            }
        }

        // ─── Retenciones (solo régimen común) ───
        if ($regimen === 'comun' && !empty($retenciones)) {
            foreach ($retenciones as $tipoRet => $ret) {
                $montoRet = $ret['valor'] ?? 0;
                if ($montoRet <= 0) {
                    continue;
                }

                $cuentaRet = match ($tipoRet) {
                    'rete_fuente' => $this->contabilidadService->getCuenta(ContabilidadConfig::retencionFuente($tenantId)),
                    'rete_iva' => $this->contabilidadService->getCuenta(ContabilidadConfig::retencionIva($tenantId)),
                    'rete_ica' => $this->contabilidadService->getCuenta(ContabilidadConfig::retencionIca($tenantId)),
                    default => null,
                };

                if ($cuentaRet) {
                    $labelRet = match ($tipoRet) {
                        'rete_fuente' => 'Retención Fuente',
                        'rete_iva' => 'Retención IVA',
                        'rete_ica' => 'Retención ICA',
                        default => 'Retención',
                    };
                    $lineas[] = [
                        'cuenta_contable_id' => $cuentaRet->id,
                        'descripcion' => "{$labelRet} {$factura->numero}",
                        'debito' => $montoRet,
                        'credito' => 0,
                        'base_gravable' => $ret['base'] ?? $baseImponible,
                        'impuesto_tipo' => strtoupper(str_replace('rete_', '', $tipoRet)),
                        'impuesto_tarifa' => $ret['tarifa'] ?? 0,
                    ];
                }
            }
        }

        if (count($lineas) >= 2) {
            if ($factura->cliente_id) {
                $cli = $factura->cliente;
                foreach ($lineas as &$linea) {
                    if (empty($linea['tercero_numero_documento'])) {
                        $linea['tercero_numero_documento'] = $cli->numero_documento ?? '999999999';
                        $linea['tercero_nombre'] = trim(($cli->nombres ?? '') . ' ' . ($cli->apellidos ?? '')) ?: ($cli->razon_social ?? 'Consumidor Final');
                    }
                }
            }

            $this->contabilidadService->registrarAsiento([
                'fecha' => now()->toDateString(),
                'concepto' => ($factura->tipo_documento === 'pos' ? 'Venta POS' : 'Factura') . " {$factura->numero}",
                'modulo_origen' => 'ventas',
                'documento_tipo' => $factura->tipo_documento === 'pos' ? 'POS' : 'FV',
                'documento_prefijo' => explode('-', $factura->numero)[0] . '-',
                'documento_numero' => $factura->numero,
                'referencia_type' => Factura::class,
                'referencia_id' => $factura->id,
            ], $lineas);
        }

        // COGS
        $this->registrarCostoVentas($factura);

        // Poblar Cuentas por Cobrar si es venta a crédito
        $this->poblarCuentaPorCobrar($factura, $abono);
    }

    /**
     * Crea un registro en Cuentas por Cobrar cuando la factura es a crédito.
     */
    private function poblarCuentaPorCobrar(Factura $factura, float $abono): void
    {
        $esCredito = $factura->metodo_pago === 'credito' || $factura->estado === 'pendiente';
        if (!$esCredito) {
            return;
        }

        if (!class_exists(\App\Modules\Accounting\Models\CuentaPorCobrar::class)) {
            return;
        }

        $saldoPendiente = max(0, (float) $factura->total - $abono);
        if ($saldoPendiente <= 0) {
            return;
        }

        try {
            \App\Modules\Accounting\Models\CuentaPorCobrar::create([
                'tenant_id' => $factura->tenant_id,
                'deudor_id' => $factura->cliente_id,
                'deudor_type' => \App\Modules\Crm\Models\Cliente::class,
                'documento_origen_id' => $factura->id,
                'documento_origen_type' => Factura::class,
                'monto_total' => $saldoPendiente,
                'monto_pagado' => 0,
                'estado' => 'pendiente',
                'fecha_vencimiento' => now()->addDays(30),
                'notas' => "Factura {$factura->numero} — saldo pendiente",
            ]);
        } catch (\Exception $e) {
            Log::warning("No se pudo crear CxC para factura {$factura->numero}: {$e->getMessage()}");
        }
    }

    /**
     * Agrega una línea de débito si la cuenta contable existe en el plan del tenant.
     */
    private function agregarLineaDebito(array &$lineas, string $codigo, string $descripcion, float $monto): void
    {
        if ($monto <= 0) {
            return;
        }
        $cuenta = $this->contabilidadService->getCuenta($codigo);
        if ($cuenta) {
            $lineas[] = [
                'cuenta_contable_id' => $cuenta->id,
                'descripcion' => $descripcion,
                'debito' => $monto,
                'credito' => 0,
            ];
        }
    }

    /**
     * Mapea un método de pago a la cuenta contable PUC Colombia (débito).
     * - efectivo      → 110505 (Caja)
     * - tarjeta       → 111005 (Bancos)
     * - transferencia → 111005 (Bancos)
     * - credito       → 130505 (Clientes)
     */
    private function cuentaPorMetodoPago(string $metodo, string $regimen): string
    {
        return ContabilidadConfig::cuentaPorMetodoPago($metodo, $regimen, $this->getTenantId());
    }

    private function getTenantId(): int
    {
        return app('current_tenant')->id ?? auth()->user()->tenant_id;
    }

    private function registrarCostoVentas(Factura $factura): void
    {
        $productoIds = $factura->items()->whereNotNull('producto_id')->pluck('producto_id')->unique()->values()->all();
        $productos = Producto::whereIn('id', $productoIds)->get()->keyBy('id');

        $costoTotal = 0;
        foreach ($factura->items as $item) {
            if ($item->producto_id) {
                $producto = $productos->get($item->producto_id);
                if ($producto && (float) $producto->costo_promedio > 0) {
                    $costoTotal += (float) $producto->costo_promedio * (float) $item->cantidad;
                }
            }
        }

        if ($costoTotal <= 0) {
            return;
        }

        $cuentaCosto = $this->contabilidadService->getCuenta(ContabilidadConfig::costoVentas($factura->tenant_id));
        $cuentaInventario = $this->contabilidadService->getCuenta(ContabilidadConfig::inventario($factura->tenant_id));

        if (!$cuentaCosto || !$cuentaInventario) {
            return;
        }

        try {
            $this->contabilidadService->registrarAsiento([
                'fecha' => now()->toDateString(),
                'concepto' => "Costo de ventas {$factura->numero}",
                'modulo_origen' => 'ventas',
                'documento_tipo' => $factura->tipo_documento === 'pos' ? 'POS' : 'FV',
                'documento_prefijo' => explode('-', $factura->numero)[0] . '-',
                'documento_numero' => $factura->numero,
                'referencia_type' => Factura::class,
                'referencia_id' => $factura->id,
            ], [
                [
                    'cuenta_contable_id' => $cuentaCosto->id,
                    'descripcion' => "Costo de ventas {$factura->numero}",
                    'debito' => $costoTotal,
                    'credito' => 0,
                ],
                [
                    'cuenta_contable_id' => $cuentaInventario->id,
                    'descripcion' => "Salida inventario {$factura->numero}",
                    'debito' => 0,
                    'credito' => $costoTotal,
                ],
            ]);
        } catch (\Exception $e) {
            Log::warning("No se pudo registrar costo de ventas para {$factura->numero}: {$e->getMessage()}");
        }
    }

    /**
     * Anula una factura: reversa inventario, caja, contabilidad y orden.
     */
    public function anular(Factura $factura, string $motivo): void
    {
        if (!$factura->esAnulable()) {
            throw new \Exception('La factura ya está anulada.');
        }

        $tenantId = $factura->tenant_id;

        DB::transaction(function () use ($factura, $motivo, $tenantId) {
            $factura->load('items');

            // 1. Restaurar stock de productos
            foreach ($factura->items as $item) {
                if ($item->producto_id) {
                    $producto = Producto::where('id', $item->producto_id)->lockForUpdate()->first();
                    if ($producto) {
                        $producto->increment('stock_actual', $item->cantidad);
                    }
                }
            }

            // 2. Reversar movimientos de caja (registrar egreso por cada ingreso original)
            $movimientos = \App\Modules\Cash\Models\MovimientoCaja::where('referencia_type', Factura::class)
                ->where('referencia_id', $factura->id)
                ->where('tipo', 'ingreso')
                ->get();

            foreach ($movimientos as $mov) {
                $sesion = \App\Modules\Cash\Models\CajaSesion::find($mov->sesion_id);
                if ($sesion && $sesion->estado === 'abierta') {
                    $this->cajaService->registrarMovimiento(
                        $sesion,
                        'egreso',
                        (float) $mov->monto,
                        $mov->metodo_pago,
                        "REVERSIÓN ANULACIÓN Factura {$factura->numero}: {$motivo}",
                        $factura
                    );
                } else {
                    Log::warning(
                        "Reversión de caja omitida para factura {$factura->numero}: " .
                        "sesión #{$mov->sesion_id} ya cerrada (movimiento original: \${$mov->monto} {$mov->metodo_pago})."
                    );
                }
            }

            // 3. Reversar asientos contables
            if ($this->contabilidadService) {
                try {
                    $this->contabilidadService->revertirAsiento(
                        'ventas',
                        Factura::class,
                        $factura->id,
                        $motivo
                    );
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning(
                        "No se pudo revertir asiento contable para {$factura->numero}: {$e->getMessage()}"
                    );
                }
            }

            // 4. Restaurar estado de la orden (si proviene de OT)
            if ($factura->orden_id) {
                $orden = \App\Modules\ServiceDesk\Models\OrdenReparacion::find($factura->orden_id);
                if ($orden && $orden->estado === \App\Modules\ServiceDesk\Enums\OrdenEstado::Entregado) {
                    $orden->estado = \App\Modules\ServiceDesk\Enums\OrdenEstado::Listo;
                    $orden->fecha_entregado = null;
                    $orden->save();
                }
            }

            // 5. Marcar factura como anulada
            $factura->update([
                'anulada' => true,
                'anulada_at' => now(),
                'anulada_por' => auth()->id(),
                'motivo_anulacion' => $motivo,
                'estado' => 'anulada',
            ]);
        });
    }

    private function emitirDian(Factura $factura, int $tenantId): void
    {
        $regimen = $this->determinarRegimen($tenantId);

        if ($regimen !== 'comun') {
            return;
        }

        $resolucionActiva = \App\Modules\Sales\Models\Resolucion::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->exists();

        $certificadoActivo = \App\Modules\Sales\Models\Certificado::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->exists();

        if (!$resolucionActiva || !$certificadoActivo) {
            $factura->update(['dian_estado' => 'borrador']);
            return;
        }

        if (!$this->dianService) {
            $factura->update(['dian_estado' => 'borrador']);
            return;
        }

        \App\Jobs\EmitirFacturaDianJob::dispatch($factura->id, $tenantId)
            ->onQueue('dian');
    }
}
