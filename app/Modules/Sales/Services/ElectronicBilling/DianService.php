<?php

namespace App\Modules\Sales\Services\ElectronicBilling;

use App\Modules\Sales\Models\Certificado;
use App\Modules\Sales\Models\Factura;
use App\Modules\Sales\Models\DianEvento;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Servicio de facturación electrónica DIAN (Colombia).
 *
 * Orquesta el ciclo completo: generación XML → firma → envío → procesamiento respuesta.
 * Soporta reintentos automáticos y máquina de estados completa.
 *
 * Estados: borrador → pendiente_envio → enviado → aceptado | rechazado | error
 */
readonly class DianService
{
    private SignatureProviderInterface $signatureProvider;
    private DianProviderInterface $dianProvider;
    private XmlUBLGenerator $xmlGenerator;

    /** Estados que impiden un nuevo envío. */
    private const BLOCKED_STATES = ['enviado', 'aceptado'];

    /** Estados que permiten reintento. */
    private const RETRYABLE_STATES = ['rechazado', 'error', 'error_http', 'error_conexion', 'error_request'];

    public function __construct(
        SignatureProviderInterface $signatureProvider,
        DianProviderInterface $dianProvider,
        XmlUBLGenerator $xmlGenerator,
    ) {
        $this->signatureProvider = $signatureProvider;
        $this->dianProvider = $dianProvider;
        $this->xmlGenerator = $xmlGenerator;
    }

    /**
     * Proceso principal para emitir una factura a la DIAN.
     *
     * Flujo completo:
     *  1. Validación de estado
     *  2. Generación XML UBL 2.1
     *  3. Firma digital (XAdES-BES)
     *  4. Envío a DIAN (con reintentos)
     *  5. Procesamiento de respuesta
     *  6. Actualización de estado en BD (transaccional)
     *
     * @throws \RuntimeException Si la factura no puede emitirse
     */
    public function emitirFactura(Factura $factura, array $empresa): void
    {
        // 1. Validate current state
        if (in_array($factura->dian_estado, self::BLOCKED_STATES, true)) {
            throw new \RuntimeException(
                "La factura {$factura->numero} ya se encuentra en estado: {$factura->dian_estado}"
            );
        }

        // Allow retry from retryable states
        $isRetry = in_array($factura->dian_estado, self::RETRYABLE_STATES, true);

        Log::channel('daily')->info('DIAN emitirFactura - Iniciando', [
            'factura_id' => $factura->id,
            'numero' => $factura->numero,
            'estado_actual' => $factura->dian_estado,
            'is_retry' => $isRetry,
        ]);

        // 2. Set pending state
        $factura->update(['dian_estado' => 'pendiente_envio']);
        $this->logEvent($factura, 'pendiente_envio', 'Iniciando generación de XML y firma.');

        // 3. Get certificate
        $certificado = Certificado::where('tenant_id', $factura->tenant_id)
            ->where('is_active', true)
            ->first();

        // 4. Generate UBL 2.1 XML
        $xmlOriginal = $this->xmlGenerator->generar($factura, $empresa);

        $this->logEvent($factura, 'pendiente_envio', 'XML UBL 2.1 generado.', $xmlOriginal);

        // 5. Sign XML
        $xmlFirmado = $this->signatureProvider->sign($xmlOriginal, $certificado);

        $this->logEvent($factura, 'enviado', 'XML firmado correctamente. Enviando a la DIAN.', $xmlFirmado);

        // 6. Send to DIAN with retry logic
        $maxAttempts = (int) config('dian.retry.max_attempts', 3);
        $retryDelay = (int) config('dian.retry.delay_seconds', 5);
        $lastResponse = null;

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            Log::channel('daily')->info("DIAN emitirFactura - Intento {$attempt}/{$maxAttempts}", [
                'factura_id' => $factura->id,
            ]);

            $response = $this->dianProvider->send($xmlFirmado);
            $lastResponse = $response;

            // If success or non-retryable error, break
            if ($response['success'] || !$this->isRetryableError($response)) {
                break;
            }

            // Wait before retrying
            if ($attempt < $maxAttempts) {
                Log::channel('daily')->warning("DIAN emitirFactura - Reintentando en {$retryDelay}s", [
                    'factura_id' => $factura->id,
                    'attempt' => $attempt,
                    'error' => $response['dian_mensaje'] ?? 'Unknown',
                ]);
                sleep($retryDelay);
            }
        }

        // 7. Process response inside transaction
        $this->processResponse($factura, $xmlFirmado, $lastResponse);
    }

    /**
     * Consulta el estado de una factura en la DIAN usando su trackId.
     */
    public function consultarEstado(Factura $factura): array
    {
        if (empty($factura->dian_track_id)) {
            throw new \RuntimeException("La factura {$factura->numero} no tiene track_id de DIAN.");
        }

        $response = $this->dianProvider->status($factura->dian_track_id);

        if ($response['success']) {
            DB::transaction(function () use ($factura, $response) {
                $factura->update([
                    'dian_estado' => $response['dian_estado'],
                    'dian_mensaje' => $response['dian_mensaje'],
                    'cufe' => $response['cufe'] ?? $factura->cufe,
                ]);

                $this->logEvent(
                    $factura,
                    $response['dian_estado'],
                    $response['dian_mensaje'],
                    null,
                    $response['xml_respuesta'] ?? null
                );
            });
        }

        return $response;
    }

    /**
     * Reintentar envío de una factura en estado retryable.
     */
    public function reintentarEnvio(Factura $factura, array $empresa): void
    {
        if (!in_array($factura->dian_estado, self::RETRYABLE_STATES, true)) {
            throw new \RuntimeException(
                "La factura {$factura->numero} no está en un estado reintenable: {$factura->dian_estado}"
            );
        }

        $this->emitirFactura($factura, $empresa);
    }

    // ──────────────────────────────────────────────
    //  Private Methods
    // ──────────────────────────────────────────────

    private function processResponse(Factura $factura, string $xmlFirmado, array $response): void
    {
        DB::transaction(function () use ($factura, $xmlFirmado, $response) {
            if ($response['success']) {
                $factura->update([
                    'dian_estado' => $response['dian_estado'],
                    'dian_mensaje' => $response['dian_mensaje'],
                    'dian_track_id' => $response['dian_track_id'] ?? null,
                    'cufe' => $response['cufe'] ?? null,
                    'dian_fecha_envio' => now(),
                ]);

                $this->logEvent(
                    $factura,
                    $response['dian_estado'],
                    $response['dian_mensaje'],
                    $xmlFirmado,
                    $response['xml_respuesta'] ?? null
                );

                Log::channel('daily')->info('DIAN emitirFactura - Factura aceptada', [
                    'factura_id' => $factura->id,
                    'track_id' => $response['dian_track_id'] ?? null,
                    'cufe' => $response['cufe'] ?? null,
                ]);
            } else {
                $estado = $response['dian_estado'] ?? 'rechazado';
                $factura->update([
                    'dian_estado' => $estado,
                    'dian_mensaje' => $response['dian_mensaje'] ?? 'Rechazado por la DIAN',
                    'dian_fecha_envio' => now(),
                ]);

                $this->logEvent(
                    $factura,
                    $estado,
                    $response['dian_mensaje'] ?? 'Error desconocido.',
                    $xmlFirmado,
                    $response['xml_respuesta'] ?? null
                );

                Log::channel('daily')->warning('DIAN emitirFactura - Factura rechazada/error', [
                    'factura_id' => $factura->id,
                    'estado' => $estado,
                    'mensaje' => $response['dian_mensaje'] ?? null,
                ]);
            }
        });
    }

    private function isRetryableError(array $response): bool
    {
        $retryableStatuses = ['error_http', 'error_conexion', 'error_request', 'error'];

        return in_array($response['dian_estado'] ?? '', $retryableStatuses, true);
    }

    private function logEvent(
        Factura $factura,
        string $estado,
        string $mensaje,
        ?string $xmlEnviado = null,
        ?string $xmlRespuesta = null
    ): void {
        DianEvento::create([
            'factura_id' => $factura->id,
            'estado' => $estado,
            'mensaje' => $mensaje,
            'xml_enviado' => $xmlEnviado,
            'xml_respuesta' => $xmlRespuesta,
        ]);
    }
}
