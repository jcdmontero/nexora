<?php

namespace App\Modules\Sales\Services\ElectronicBilling;

use App\Modules\Sales\Models\Certificado;
use App\Modules\Sales\Services\ElectronicBilling\SignatureProviderInterface;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Firma digital de XML UBL 2.1 usando certificado PFX (XAdES-BES).
 *
 * Extrae la clave privada y el certificado del PFX usando openssl,
 * luego genera una firma XML canonicalizada según las especificaciones
 * de la DIAN (Resolución 000012 de 2021).
 */
readonly class XmlSigner implements SignatureProviderInterface
{
    private string $tempDir;

    public function __construct(?string $tempDir = null)
    {
        $this->tempDir = $tempDir ?? sys_get_temp_dir();
    }

    /**
     * Firma un XML UBL 2.1 con el certificado digital de la empresa.
     *
     * @param string        $xmlContent  XML original (UBL 2.1)
     * @param Certificado|null $certificado Certificado PFX almacenado en BD
     * @return string XML firmado (XAdES-BES)
     * @throws RuntimeException Si el certificado no es válido o la firma falla
     */
    public function sign(string $xmlContent, ?Certificado $certificado): string
    {
        if ($certificado === null) {
            throw new RuntimeException('No se proporcionó certificado digital para firmar.');
        }

        $this->validarCertificado($certificado);

        try {
            $pfxPath = $this->resolvePfxPath($certificado);
            $password = $certificado->password;

            // Extract private key and certificate from PFX
            $privateKey = $this->extractPrivateKey($pfxPath, $password);
            $certificate = $this->extractCertificate($pfxPath, $password);

            // Compute the digest of the XML (envelope hash)
            $xmlDigest = $this->computeXmlDigest($xmlContent);

            // Build the XAdES signature
            $signature = $this->buildXadesSignature($xmlContent, $certificate, $privateKey, $xmlDigest);

            // Insert signature into XML's UBLExtension/ExtensionContent
            $signedXml = $this->insertSignatureIntoXml($xmlContent, $signature);

            Log::channel('daily')->info('XML firmado exitosamente', [
                'certificado_id' => $certificado->id,
                'tenant_id' => $certificado->tenant_id,
            ]);

            return $signedXml;

        } catch (RuntimeException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::channel('daily')->error('Error al firmar XML', [
                'error' => $e->getMessage(),
                'certificado_id' => $certificado->id,
            ]);
            throw new RuntimeException('Error al firmar XML: ' . $e->getMessage(), 0, $e);
        }
    }

    // ──────────────────────────────────────────────
    //  PFX Handling
    // ──────────────────────────────────────────────

    private function resolvePfxPath(Certificado $certificado): string
    {
        // The pfx_path may be a relative path within the storage disk
        $disk = config('dian.certificate.storage_disk', 'local');
        $prefix = config('dian.certificate.storage_prefix', 'dian/certificados');

        // If it's an absolute path, use it directly
        if (File::isAbsolute($certificado->pfx_path) && File::exists($certificado->pfx_path)) {
            return $certificado->pfx_path;
        }

        // Try resolving via storage disk
        $storagePath = storage_path("app/{$prefix}/{$certificado->pfx_path}");
        if (File::exists($storagePath)) {
            return $storagePath;
        }

        // Fallback: treat pfx_path as relative to storage
        $fullPath = storage_path("app/{$certificado->pfx_path}");
        if (File::exists($fullPath)) {
            return $fullPath;
        }

        throw new RuntimeException("Certificado PFX no encontrado: {$certificado->pfx_path}");
    }

    private function extractPrivateKey(string $pfxPath, string $password): string
    {
        $certs = [];
        $result = openssl_pkcs12_read(file_get_contents($pfxPath), $certs, $password);

        if (!$result || empty($certs['pkey'])) {
            throw new RuntimeException('No se pudo extraer la clave privada del certificado PFX.');
        }

        return $certs['pkey'];
    }

    private function extractCertificate(string $pfxPath, string $password): string
    {
        $certs = [];
        $result = openssl_pkcs12_read(file_get_contents($pfxPath), $certs, $password);

        if (!$result || empty($certs['cert'])) {
            throw new RuntimeException('No se pudo extraer el certificado del PFX.');
        }

        return $certs['cert'];
    }

    // ──────────────────────────────────────────────
    //  XML Digest & Signature
    // ──────────────────────────────────────────────

    private function computeXmlDigest(string $xmlContent): string
    {
        // Remove existing UBLExtensions (signature placeholder) before digesting
        $cleanXml = preg_replace(
            '/<ext:UBLExtensions>.*?<\/ext:UBLExtensions>/s',
            '<ext:UBLExtensions><ext:UBLExtension><ext:ExtensionContent></ext:ExtensionContent></ext:UBLExtension></ext:UBLExtensions>',
            $xmlContent
        );

        // Canonicalize using C14N (removes comments, normalizes whitespace)
        $dom = new \DOMDocument();
        $dom->loadXML($cleanXml);
        $canonical = $dom->C14N();

        return base64_encode(hash('sha256', $canonical, true));
    }

    private function buildXadesSignature(
        string $xmlContent,
        string $certificate,
        string $privateKey,
        string $xmlDigest
    ): string {
        $uuid = 'sig-' . strtoupper(bin2hex(random_bytes(16)));
        $timestamp = now()->format('Y-m-d\TH:i:s-05:00');

        // Extract the issuer name and serial number from the certificate
        $certData = openssl_x509_parse($certificate);
        $issuerName = $this->normalizeX509Name($certData['issuer'] ?? []);
        $serialNumber = $certData['serialNumberHex'] ?? strtoupper(bin2hex(random_bytes(8)));

        // Compute signature value
        $signatureValue = $this->computeSignatureValue($xmlDigest, $uuid, $timestamp, $certificate, $privateKey);

        return <<<XML
<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="{$uuid}">
  <ds:SignedInfo>
    <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
    <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
    <ds:Reference URI="">
      <ds:Transforms>
        <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
        <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
      </ds:Transforms>
      <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
      <ds:DigestValue>{$xmlDigest}</ds:DigestValue>
    </ds:Reference>
    <ds:Reference URI="#{$uuid}-SignedProperties">
      <ds:Transforms>
        <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
      </ds:Transforms>
      <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
      <ds:DigestValue>{$this->computeSignedPropertiesDigest($uuid, $timestamp, $certificate, $serialNumber)}</ds:DigestValue>
    </ds:Reference>
  </ds:SignedInfo>
  <ds:SignatureValue>{$signatureValue}</ds:SignatureValue>
  <ds:KeyInfo>
    <ds:X509Data>
      <ds:X509Certificate>{$this->normalizeCertificate($certificate)}</ds:X509Certificate>
    </ds:X509Data>
  </ds:KeyInfo>
  <ds:Object Id="{$uuid}-SignedProperties">
    <xades:SignedProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="{$uuid}-SignedProperties">
      <xades:SignedSignatureProperties>
        <xades:SigningTime>{$timestamp}</xades:SigningTime>
        <xades:SigningCertificate>
          <xades:Cert>
            <xades:CertDigest>
              <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
              <ds:DigestValue>{$this->computeCertificateDigest($certificate)}</ds:DigestValue>
            </xades:CertDigest>
            <xades:IssuerSerial>
              <ds:X509IssuerName>{$issuerName}</ds:X509IssuerName>
              <ds:X509SerialNumber>{$serialNumber}</ds:X509SerialNumber>
            </xades:IssuerSerial>
          </xades:Cert>
        </xades:SigningCertificate>
      </xades:SignedSignatureProperties>
    </xades:SignedProperties>
  </ds:Object>
</ds:Signature>
XML;
    }

    private function computeSignatureValue(
        string $xmlDigest,
        string $uuid,
        string $timestamp,
        string $certificate,
        string $privateKey
    ): string {
        // Build the SignedInfo canonical form for signing
        $signedInfoCanonical = <<<XML
<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/><ds:Reference URI=""><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>{$xmlDigest}</ds:DigestValue></ds:Reference><ds:Reference URI="#{$uuid}-SignedProperties"><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>{$this->computeSignedPropertiesDigest($uuid, $timestamp, $certificate, $this->getSerialNumber($certificate))}</ds:DigestValue></ds:Reference></ds:SignedInfo>
XML;

        $signatureValue = '';
        openssl_sign($signedInfoCanonical, $signatureValue, $privateKey, OPENSSL_ALGO_SHA256);

        return base64_encode($signatureValue);
    }

    private function computeSignedPropertiesDigest(
        string $uuid,
        string $timestamp,
        string $certificate,
        string $serialNumber
    ): string {
        $issuerName = $this->normalizeX509Name(openssl_x509_parse($certificate)['issuer'] ?? []);
        $certDigest = $this->computeCertificateDigest($certificate);

        $signedProperties = <<<XML
<xades:SignedProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="{$uuid}-SignedProperties"><xades:SignedSignatureProperties><xades:SigningTime>{$timestamp}</xades:SigningTime><xades:SigningCertificate><xades:Cert><xades:CertDigest><ds:DigestMethod xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue xmlns:ds="http://www.w3.org/2000/09/xmldsig#">{$certDigest}</ds:DigestValue></xades:CertDigest><xades:IssuerSerial><ds:X509IssuerName xmlns:ds="http://www.w3.org/2000/09/xmldsig#">{$issuerName}</ds:X509IssuerName><ds:X509SerialNumber xmlns:ds="http://www.w3.org/2000/09/xmldsig#">{$serialNumber}</ds:X509SerialNumber></xades:IssuerSerial></xades:Cert></xades:SigningCertificate></xades:SignedSignatureProperties></xades:SignedProperties>
XML;

        return base64_encode(hash('sha256', $signedProperties, true));
    }

    private function computeCertificateDigest(string $certificate): string
    {
        $der = $this->pemToDer($certificate);
        return base64_encode(hash('sha256', $der, true));
    }

    // ──────────────────────────────────────────────
    //  XML Manipulation
    // ──────────────────────────────────────────────

    private function insertSignatureIntoXml(string $xmlContent, string $signature): string
    {
        // Replace the placeholder in ExtensionContent
        $pattern = '/<ext:ExtensionContent>\s*<\/ext:ExtensionContent>/';
        $replacement = '<ext:ExtensionContent>' . "\n" . $signature . "\n" . '</ext:ExtensionContent>';

        $result = preg_replace($pattern, $replacement, $xmlContent, 1);

        if ($result === null || $result === $xmlContent) {
            throw new RuntimeException('No se pudo insertar la firma en el XML. Verifique la estructura UBL.');
        }

        return $result;
    }

    // ──────────────────────────────────────────────
    //  Utility Methods
    // ──────────────────────────────────────────────

    private function normalizeCertificate(string $pem): string
    {
        return str_replace(["-----BEGIN CERTIFICATE-----", "-----END CERTIFICATE-----", "\n", "\r"], '', $pem);
    }

    private function pemToDer(string $pem): string
    {
        $der = '';
        openssl_x509_export($pem, $der, false);
        // The export gives us PEM, strip headers
        return base64_decode(str_replace(["-----BEGIN CERTIFICATE-----", "-----END CERTIFICATE-----", "\n", "\r"], '', $der));
    }

    private function getSerialNumber(string $certificate): string
    {
        $certData = openssl_x509_parse($certificate);
        return $certData['serialNumberHex'] ?? strtoupper(bin2hex(random_bytes(8)));
    }

    private function normalizeX509Name(array $nameParts): string
    {
        $parts = [];
        foreach ($nameParts as $key => $value) {
            $parts[] = "{$key}={$value}";
        }
        return implode(', ', $parts);
    }

    private function validarCertificado(Certificado $certificado): void
    {
        if (!$certificado->is_active) {
            throw new RuntimeException('El certificado digital no está activo.');
        }

        if ($certificado->fecha_vencimiento && $certificado->fecha_vencimiento->isPast()) {
            throw new RuntimeException('El certificado digital ha expirado.');
        }
    }
}
