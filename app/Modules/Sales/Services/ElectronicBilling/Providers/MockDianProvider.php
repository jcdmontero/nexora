<?php

namespace App\Modules\Sales\Services\ElectronicBilling\Providers;

use App\Modules\Sales\Services\ElectronicBilling\DianProviderInterface;

class MockDianProvider implements DianProviderInterface
{
    public function send(string $signedXml): array
    {
        // Simulamos un retraso de red
        sleep(1);

        return [
            'success' => true,
            'dian_estado' => 'aceptado',
            'dian_mensaje' => 'Documento procesado correctamente (Simulado).',
            'dian_track_id' => 'MOCK-TRACK-' . strtoupper(uniqid()),
            'cufe' => hash('sha384', uniqid() . $signedXml),
            'xml_respuesta' => '<ApplicationResponse><DocumentResponse><Response><ResponseCode>00</ResponseCode><Description>Procesado Correctamente.</Description></Response></DocumentResponse></ApplicationResponse>'
        ];
    }

    public function status(string $trackId): array
    {
        return [
            'success' => true,
            'dian_estado' => 'aceptado',
            'dian_mensaje' => 'Documento validado exitosamente.',
            'dian_track_id' => $trackId
        ];
    }
}
