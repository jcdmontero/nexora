<?php

namespace App\Modules\Sales\Services\ElectronicBilling\Providers;

use App\Modules\Sales\Models\Certificado;
use App\Modules\Sales\Services\ElectronicBilling\SignatureProviderInterface;

class MockSignatureProvider implements SignatureProviderInterface
{
    public function sign(string $xmlContent, ?Certificado $certificado): string
    {
        // En lugar de una firma criptográfica real, añadimos un tag de firma simulada al XML.
        $signatureTag = "\n<ext:UBLExtensions>\n  <ext:UBLExtension>\n    <ext:ExtensionContent>\n      <!-- FIRMA MOCK -->\n      <ds:Signature Id=\"MockSignature\">\n        <ds:SignatureValue>MOCK_SIGNATURE_DATA_" . uniqid() . "</ds:SignatureValue>\n      </ds:Signature>\n    </ext:ExtensionContent>\n  </ext:UBLExtension>\n</ext:UBLExtensions>";

        // Insertamos la firma antes del primer tag de cierre o al final del archivo.
        return str_replace('</Invoice>', $signatureTag . "\n</Invoice>", $xmlContent);
    }
}
