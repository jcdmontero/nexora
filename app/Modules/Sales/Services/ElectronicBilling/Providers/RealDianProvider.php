<?php

namespace App\Modules\Sales\Services\ElectronicBilling\Providers;

use App\Modules\Sales\Services\ElectronicBilling\DianProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Proveedor real de servicios DIAN para facturación electrónica.
 *
 * Se comunica con la SettleAPI de la DIAN (Colombia) para enviar
 * facturas XML firmadas y consultar su estado.
 *
 * Referencia: https://www.dian.gov.co/auditorias/serviciosweb/SitePages/ServiciosWeb.aspx
 */
readonly class RealDianProvider implements DianProviderInterface
{
    private string $baseUrl;
    private string $sendBillEndpoint;
    private string $getStatusEndpoint;
    private int $timeout;
    private int $connectTimeout;

    public function __construct()
    {
        $environment = config('dian.environment', 'test');
        $urls = config('dian.urls.' . $environment, config('dian.urls.test'));

        $this->baseUrl = $urls['base'];
        $this->sendBillEndpoint = $urls['send_bill'];
        $this->getStatusEndpoint = $urls['get_status'];
        $this->timeout = (int) config('dian.timeout', 30);
        $this->connectTimeout = (int) config('dian.connect_timeout', 10);
    }

    /**
     * Envía un XML firmado a DIAN usando SendBillAsync.
     *
     * @param string $signedXml XML firmado (XAdES-BES)
     * @return array{success: bool, dian_estado: string, dian_mensaje: string, dian_track_id?: string, cufe?: string, xml_respuesta?: string}
     */
    public function send(string $signedXml): array
    {
        $url = $this->baseUrl . $this->sendBillEndpoint;

        Log::channel('daily')->info('DIAN SendBillAsync - Iniciando envío', [
            'url' => $url,
            'xml_size' => strlen($signedXml),
        ]);

        try {
            $response = Http::timeout($this->timeout)
                ->connectTimeout($this->connectTimeout)
                ->withHeaders([
                    'Content-Type' => 'application/xml; charset=utf-8',
                    'Accept' => 'application/xml',
                ])
                ->withBody($signedXml, 'application/xml')
                ->post($url);

            if ($response->failed()) {
                $errorMessage = $this->parseErrorResponse($response);

                Log::channel('daily')->error('DIAN SendBillAsync - Error HTTP', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'error' => $errorMessage,
                ]);

                return [
                    'success' => false,
                    'dian_estado' => 'error_http',
                    'dian_mensaje' => "Error HTTP {$response->status()}: {$errorMessage}",
                    'xml_respuesta' => $response->body(),
                ];
            }

            return $this->parseSendBillResponse($response->body());

        } catch (ConnectionException $e) {
            Log::channel('daily')->error('DIAN SendBillAsync - Error de conexión', [
                'error' => $e->getMessage(),
                'url' => $url,
            ]);

            return [
                'success' => false,
                'dian_estado' => 'error_conexion',
                'dian_mensaje' => 'No se pudo conectar con DIAN: ' . $e->getMessage(),
            ];
        } catch (RequestException $e) {
            Log::channel('daily')->error('DIAN SendBillAsync - Request error', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'dian_estado' => 'error_request',
                'dian_mensaje' => 'Error en la solicitud a DIAN: ' . $e->getMessage(),
            ];
        } catch (\Exception $e) {
            Log::channel('daily')->error('DIAN SendBillAsync - Error inesperado', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'dian_estado' => 'error',
                'dian_mensaje' => 'Error inesperado: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Consulta el estado de un documento previamente enviado usando el TrackID.
     *
     * @param string $trackId ID de seguimiento devuelto por SendBillAsync
     * @return array{success: bool, dian_estado: string, dian_mensaje: string, dian_track_id: string, cufe?: string, xml_respuesta?: string}
     */
    public function status(string $trackId): array
    {
        $url = $this->baseUrl . $this->getStatusEndpoint;

        Log::channel('daily')->info('DIAN GetStatus - Consultando estado', [
            'track_id' => $trackId,
            'url' => $url,
        ]);

        try {
            // Build the status request XML
            $statusXml = $this->buildStatusRequestXml($trackId);

            $response = Http::timeout($this->timeout)
                ->connectTimeout($this->connectTimeout)
                ->withHeaders([
                    'Content-Type' => 'application/xml; charset=utf-8',
                    'Accept' => 'application/xml',
                ])
                ->withBody($statusXml, 'application/xml')
                ->post($url);

            if ($response->failed()) {
                Log::channel('daily')->error('DIAN GetStatus - Error HTTP', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'dian_estado' => 'error_http',
                    'dian_mensaje' => "Error HTTP {$response->status()} al consultar estado",
                    'dian_track_id' => $trackId,
                    'xml_respuesta' => $response->body(),
                ];
            }

            return $this->parseStatusResponse($response->body(), $trackId);

        } catch (\Exception $e) {
            Log::channel('daily')->error('DIAN GetStatus - Error', [
                'track_id' => $trackId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'dian_estado' => 'error',
                'dian_mensaje' => 'Error al consultar estado: ' . $e->getMessage(),
                'dian_track_id' => $trackId,
            ];
        }
    }

    // ──────────────────────────────────────────────
    //  Response Parsers
    // ──────────────────────────────────────────────

    private function parseSendBillResponse(string $body): array
    {
        try {
            $xml = new \SimpleXMLElement($body);
            $xml->registerXPathNamespace('ns', 'http://www.dian.gov.co/web-services/settle');

            // DIAN response structure:
            // <wsOuptut><fileName/><statusCode/><statusMessage/><xmlBase64/><trackId/></wsOuptut>
            $statusCode = (string) ($xml->statusCode ?? '');
            $statusMessage = (string) ($xml->statusMessage ?? '');
            $trackId = (string) ($xml->trackId ?? '');
            $fileName = (string) ($xml->fileName ?? '');
            $xmlBase64 = (string) ($xml->xmlBase64 ?? '');

            // Response code "00" means accepted
            $isAccepted = $statusCode === '00';

            // Decode the response XML if present
            $xmlRespuesta = $xmlBase64 ? base64_decode($xmlBase64) : $body;

            // Extract CUFE from the response XML if accepted
            $cufe = null;
            if ($isAccepted && $xmlRespuesta) {
                $cufe = $this->extractCufeFromResponse($xmlRespuesta);
            }

            $result = [
                'success' => $isAccepted,
                'dian_estado' => $isAccepted ? 'aceptado' : 'rechazado',
                'dian_mensaje' => $statusMessage ?: ($isAccepted ? 'Procesado correctamente' : 'Rechazado por DIAN'),
                'dian_track_id' => $trackId ?: $fileName,
                'xml_respuesta' => $xmlRespuesta,
            ];

            if ($cufe) {
                $result['cufe'] = $cufe;
            }

            Log::channel('daily')->info('DIAN SendBillAsync - Respuesta procesada', [
                'status_code' => $statusCode,
                'track_id' => $trackId,
                'is_accepted' => $isAccepted,
            ]);

            return $result;

        } catch (\Exception $e) {
            Log::channel('daily')->error('DIAN SendBillAsync - Error parsing respuesta', [
                'error' => $e->getMessage(),
                'body' => substr($body, 0, 1000),
            ]);

            return [
                'success' => false,
                'dian_estado' => 'error_parseo',
                'dian_mensaje' => 'Error al procesar respuesta de DIAN: ' . $e->getMessage(),
                'xml_respuesta' => $body,
            ];
        }
    }

    private function parseStatusResponse(string $body, string $trackId): array
    {
        try {
            $xml = new \SimpleXMLElement($body);

            $statusCode = (string) ($xml->statusCode ?? '');
            $statusMessage = (string) ($xml->statusMessage ?? '');
            $xmlBase64 = (string) ($xml->xmlBase64 ?? '');

            $isAccepted = $statusCode === '00';

            $xmlRespuesta = $xmlBase64 ? base64_decode($xmlBase64) : $body;

            $cufe = null;
            if ($isAccepted && $xmlRespuesta) {
                $cufe = $this->extractCufeFromResponse($xmlRespuesta);
            }

            $result = [
                'success' => $isAccepted,
                'dian_estado' => $isAccepted ? 'aceptado' : 'rechazado',
                'dian_mensaje' => $statusMessage,
                'dian_track_id' => $trackId,
                'xml_respuesta' => $xmlRespuesta,
            ];

            if ($cufe) {
                $result['cufe'] = $cufe;
            }

            Log::channel('daily')->info('DIAN GetStatus - Respuesta procesada', [
                'track_id' => $trackId,
                'status_code' => $statusCode,
                'is_accepted' => $isAccepted,
            ]);

            return $result;

        } catch (\Exception $e) {
            Log::channel('daily')->error('DIAN GetStatus - Error parsing', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'dian_estado' => 'error_parseo',
                'dian_mensaje' => 'Error al parsear respuesta de estado: ' . $e->getMessage(),
                'dian_track_id' => $trackId,
            ];
        }
    }

    private function extractCufeFromResponse(string $xmlContent): ?string
    {
        try {
            $xml = new \SimpleXMLElement($xmlContent);
            $xml->registerXPathNamespace('ns', 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2');
            $xml->registerXPathNamespace('cac', 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2');

            // Look for CUFE in ResponseCode or ExtensionContent
            $results = $xml->xpath('//cbc:UUID');
            if (!empty($results)) {
                return (string) $results[0];
            }

            // Alternative: look in ApplicationResponse
            $results = $xml->xpath('//cbc:ResponseCode');
            if (!empty($results) && (string) $results[0] === '00') {
                $descriptions = $xml->xpath('//cbc:Description');
                if (!empty($descriptions)) {
                    // Some DIAN responses put CUFE in the description
                    $desc = (string) $descriptions[0];
                    if (preg_match('/^[a-fA-F0-9]{96}$/', $desc)) {
                        return $desc;
                    }
                }
            }

            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    // ──────────────────────────────────────────────
    //  XML Request Builders
    // ──────────────────────────────────────────────

    private function buildStatusRequestXml(string $trackId): string
    {
        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:ns="http://www.dian.gov.co/web-services/settle">
  <soap:Body>
    <ns:GetStatusZip>
      <ns:trackId>{$trackId}</ns:trackId>
    </ns:GetStatusZip>
  </soap:Body>
</soap:Envelope>
XML;
    }

    private function parseErrorResponse(\Illuminate\Http\Client\Response $response): string
    {
        try {
            $body = $response->body();

            // Try to parse as XML error
            if (str_contains($body, '<?xml')) {
                $xml = new \SimpleXMLElement($body);
                $fault = $xml->xpath('//soap:Fault/faultstring');
                if (!empty($fault)) {
                    return (string) $fault[0];
                }

                $message = $xml->xpath('//ns:message');
                if (!empty($message)) {
                    return (string) $message[0];
                }
            }

            // Try JSON
            $json = json_decode($body, true);
            if (is_array($json)) {
                return $json['message'] ?? $json['error'] ?? json_encode($json);
            }

            return $body ?: 'Respuesta vacía del servidor';
        } catch (\Exception $e) {
            return $response->body() ?: 'Error desconocido';
        }
    }
}
