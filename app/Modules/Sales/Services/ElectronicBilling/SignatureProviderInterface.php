<?php

namespace App\Modules\Sales\Services\ElectronicBilling;

use App\Modules\Sales\Models\Certificado;

interface SignatureProviderInterface
{
    /**
     * Firma un documento XML usando el certificado digital de la empresa.
     *
     * @param string $xmlContent El XML original (UBL 2.1)
     * @param Certificado|null $certificado El certificado digital. En mocks puede ser null.
     * @return string El XML firmado (XAdES)
     */
    public function sign(string $xmlContent, ?Certificado $certificado): string;
}
