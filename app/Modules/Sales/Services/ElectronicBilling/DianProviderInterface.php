<?php

namespace App\Modules\Sales\Services\ElectronicBilling;

interface DianProviderInterface
{
    /**
     * Envía el XML firmado a los servicios web de la DIAN.
     *
     * @param string $signedXml
     * @return array
     */
    public function send(string $signedXml): array;

    /**
     * Consulta el estado de un documento previamente enviado (usando el TrackID).
     *
     * @param string $trackId
     * @return array
     */
    public function status(string $trackId): array;
}
