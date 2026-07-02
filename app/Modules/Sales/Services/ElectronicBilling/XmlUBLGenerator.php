<?php

namespace App\Modules\Sales\Services\ElectronicBilling;

use App\Modules\Sales\Models\Factura;
use App\Modules\Sales\Models\FacturaItem;
use App\Modules\Sales\Models\Resolucion;
use Illuminate\Support\Facades\DB;

/**
 * Generador de XML UBL 2.1 para facturación electrónica DIAN (Colombia).
 *
 * Producing valid UBL 2.1 documents that comply with DIAN's technical
 * requirements (Resolución 000012 de 2021 and subsequent updates).
 */
readonly class XmlUBLGenerator
{
    private const UBL_NS = 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2';
    private const CAC_NS = 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2';
    private const CBC_NS = 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2';
    private const EXT_NS = 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2';

    /**
     * Genera el XML UBL 2.1 completo para una factura.
     *
     * @param Factura $factura Factura con items y cliente cargados
     * @param array   $empresa Datos de la empresa (razon_social, nit, direccion, etc.)
     * @return string XML UBL 2.1 listo para firmar
     *
     * @throws \RuntimeException Si la resolución o datos obligatorios faltan
     */
    public function generar(Factura $factura, array $empresa): string
    {
        $this->validarDatosRequeridos($factura, $empresa);

        $resolucion = Resolucion::where('tenant_id', $factura->tenant_id)
            ->where('tipo_documento', 'factura')
            ->where('is_active', true)
            ->first();

        $fecha = $factura->created_at->format('Y-m-d');
        $hora = $factura->created_at->format('H:i:s') . '-05:00';

        // Ensure items are loaded
        $items = $factura->items()->with('producto')->get();

        $xml = new \DOMDocument('1.0', 'UTF-8');
        $xml->formatOutput = true;

        $invoice = $xml->createElementNS(self::UBL_NS, 'Invoice');
        $invoice->setAttribute('xmlns:cac', self::CAC_NS);
        $invoice->setAttribute('xmlns:cbc', self::CBC_NS);
        $invoice->setAttribute('xmlns:ext', self::EXT_NS);

        // ── UBL Extensions (placeholder for signature) ──
        $extensions = $this->createElement($xml, 'ext:UBLExtensions');
        $extension = $this->createElement($xml, 'ext:UBLExtension');
        $extensionContent = $this->createElement($xml, 'ext:ExtensionContent');
        $extension->appendChild($extensionContent);
        $extensions->appendChild($extension);
        $invoice->appendChild($extensions);

        // ── Standard UBL Header ──
        $invoice->appendChild($this->createElement($xml, 'cbc:UBLVersionID', 'UBL 2.1'));
        $invoice->appendChild($this->createElement($xml, 'cbc:CustomizationID', 'Documentos electrónicos'));
        $invoice->appendChild($this->createElement($xml, 'cbc:ProfileID', 'DIAN 2.1'));
        $invoice->appendChild($this->createElement($xml, 'cbc:ID', $factura->numero));
        $invoice->appendChild($this->createElement($xml, 'cbc:IssueDate', $fecha));
        $invoice->appendChild($this->createElement($xml, 'cbc:IssueTime', $hora));
        $invoice->appendChild($this->createElement($xml, 'cbc:InvoiceTypeCode', '01'));
        $invoice->appendChild($this->createElement($xml, 'cbc:DocumentCurrencyCode', 'COP'));

        // Note: document-level note
        if ($factura->notas) {
            $invoice->appendChild($this->createElement($xml, 'cbc:Note', $factura->notas));
        }

        // ── Resolution / Authorization ──
        if ($resolucion) {
            $invoice->appendChild($this->createElement($xml, 'cbc:InvoicePeriod', null, [
                $this->createElement($xml, 'cbc:StartDate', $resolucion->fecha_desde->format('Y-m-d')),
                $this->createElement($xml, 'cbc:EndDate', $resolucion->fecha_hasta->format('Y-m-d')),
            ]));

            $invoice->appendChild($this->createElement($xml, 'cbc:DocumentSố', $resolucion->numero_resolucion));
        }

        // ── Supplier (Empresa / Emisor) ──
        $supplier = $this->buildParty($xml, 'cac:AccountingSupplierParty', [
            'id' => $empresa['nit'],
            'id_scheme' => '96',
            'name' => $empresa['razon_social'],
            'address' => $empresa['direccion'] ?? '',
            'city_code' => $empresa['ciudad codigo'] ?? $empresa['ciudad_codigo'] ?? '11001',
            'country_code' => $empresa['pais'] ?? 'CO',
        ]);
        $invoice->appendChild($supplier);

        // ── Customer (Cliente / Adquirente) ──
        $customerData = $this->resolveCustomerData($factura);
        $customer = $this->buildParty($xml, 'cac:AccountingCustomerParty', $customerData);
        $invoice->appendChild($customer);

        // ── Payment Means ──
        $invoice->appendChild($this->buildPaymentMeans($xml, $factura, $empresa));

        // ── Tax Total ──
        $taxTotal = $this->buildTaxTotal($xml, $items);
        $invoice->appendChild($taxTotal);

        // ── Legal Monetary Total ──
        $monetaryTotal = $this->buildLegalMonetaryTotal($xml, $factura);
        $invoice->appendChild($monetaryTotal);

        // ── Invoice Lines ──
        foreach ($items as $index => $item) {
            $line = $this->buildInvoiceLine($xml, $index + 1, $item);
            $invoice->appendChild($line);
        }

        $xml->appendChild($invoice);

        return $xml->saveXML();
    }

    // ──────────────────────────────────────────────
    //  Party Builders
    // ──────────────────────────────────────────────

    private function buildParty(\DOMDocument $xml, string $elementName, array $data): \DOMElement
    {
        $party = $xml->createElement($elementName);
        $partyNode = $xml->createElement('cac:Party');

        // PartyIdentification (NIT)
        $partyIdentification = $xml->createElement('cac:PartyIdentification');
        $idEl = $this->createElement($xml, 'cbc:ID', $data['id']);
        if (isset($data['id_scheme'])) {
            $idEl->setAttribute('schemeID', $data['id_scheme']);
        }
        $partyIdentification->appendChild($idEl);
        $partyNode->appendChild($partyIdentification);

        // PartyName
        if (!empty($data['name'])) {
            $partyName = $xml->createElement('cac:PartyName');
            $partyName->appendChild($this->createElement($xml, 'cbc:Name', $data['name']));
            $partyNode->appendChild($partyName);
        }

        // PhysicalLocation (Address)
        $location = $xml->createElement('cac:PhysicalLocation');
        $address = $xml->createElement('cac:Address');
        $address->appendChild($this->createElement($xml, 'cbc:StreetName', $data['address'] ?? ''));
        $address->appendChild($this->createElement($xml, 'cbc:CitySubdivisionName', $data['city_subdivision'] ?? ''));

        $city = $xml->createElement('cac:City');
        $city->appendChild($this->createElement($xml, 'cbc:Code', $data['city_code'] ?? '11001'));
        $address->appendChild($city);

        $country = $xml->createElement('cac:Country');
        $country->appendChild($this->createElement($xml, 'cbc:IdentificationCode', $data['country_code'] ?? 'CO'));
        $address->appendChild($country);

        $location->appendChild($address);
        $partyNode->appendChild($location);

        // PartyTaxScheme (NIT para DIAN)
        $taxScheme = $xml->createElement('cac:PartyTaxScheme');
        $taxScheme->appendChild($this->createElement($xml, 'cbc:RegistrationName', $data['name'] ?? ''));
        $taxScheme->appendChild($this->createElement($xml, 'cbc:CompanyID', $data['id'] ?? ''));

        $tax = $xml->createElement('cac:TaxScheme');
        $tax->appendChild($this->createElement($xml, 'cbc:ID', '01'));
        $taxScheme->appendChild($tax);
        $partyNode->appendChild($taxScheme);

        $party->appendChild($partyNode);
        return $party;
    }

    private function resolveCustomerData(Factura $factura): array
    {
        $cliente = $factura->cliente;

        if ($cliente) {
            return [
                'id' => $cliente->nit ?? $cliente->documento ?? '222222222222',
                'id_scheme' => '96',
                'name' => $cliente->nombre_razon_social ?? $cliente->nombre ?? 'CONSUMIDOR FINAL',
                'address' => $cliente->direccion ?? '',
                'city_code' => $cliente->ciudad_codigo ?? '11001',
                'country_code' => 'CO',
            ];
        }

        // Consumer final fallback
        return [
            'id' => '222222222222',
            'id_scheme' => '96',
            'name' => 'CONSUMIDOR FINAL',
            'address' => '',
            'city_code' => '11001',
            'country_code' => 'CO',
        ];
    }

    // ──────────────────────────────────────────────
    //  Payment Means
    // ──────────────────────────────────────────────

    private function buildPaymentMeans(\DOMDocument $xml, Factura $factura, array $empresa): \DOMElement
    {
        $paymentMeans = $xml->createElement('cac:PaymentMeans');

        // DIAN payment means codes: 10=Efectivo, 42=Transferencia, 48=Tarjeta
        $paymentCode = match ($factura->metodo_pago) {
            'efectivo' => '10',
            'transferencia' => '42',
            'tarjeta' => '48',
            'credito' => '10', // Crédito still pays eventually
            default => '10',
        };

        $paymentMeans->appendChild($this->createElement($xml, 'cbc:PaymentMeansCode', $paymentCode));
        $paymentMeans->appendChild($this->createElement($xml, 'cbc:PaymentDueDate', $factura->created_at->format('Y-m-d')));

        // PayeeFinancialAccount (optional but recommended)
        $account = $xml->createElement('cac:PayeeFinancialAccount');
        $account->appendChild($this->createElement($xml, 'cbc:ID', $empresa['cuenta_bancaria'] ?? '000000000'));
        $paymentMeans->appendChild($account);

        return $paymentMeans;
    }

    // ──────────────────────────────────────────────
    //  Tax Total
    // ──────────────────────────────────────────────

    private function buildTaxTotal(\DOMDocument $xml, \Illuminate\Database\Eloquent\Collection $items): \DOMElement
    {
        $taxTotal = $xml->createElement('cac:TaxTotal');

        // Sumar total de IVA de todos los ítems
        $totalIva = $items->sum('impuesto_total');

        $taxAmount = $this->createElement($xml, 'cbc:TaxAmount', $this->formatDecimal($totalIva));
        $taxAmount->setAttribute('currencyID', 'COP');
        $taxTotal->appendChild($taxAmount);

        // TaxSubtotal for IVA
        $taxSubtotal = $xml->createElement('cac:TaxSubtotal');
        $taxableAmount = $this->createElement($xml, 'cbc:TaxableAmount', $this->formatDecimal($items->sum('subtotal')));
        $taxableAmount->setAttribute('currencyID', 'COP');
        $taxSubtotal->appendChild($taxableAmount);

        $subTaxAmount = $this->createElement($xml, 'cbc:TaxAmount', $this->formatDecimal($totalIva));
        $subTaxAmount->setAttribute('currencyID', 'COP');
        $taxSubtotal->appendChild($subTaxAmount);

        // Determine IVA rate from first item that has tax
        $ivaRate = $items->firstWhere('tasa_impuesto', '>', 0)?->tasa_impuesto ?? 19.00;

        $taxCategory = $xml->createElement('cac:TaxCategory');
        $taxCategory->appendChild($this->createElement($xml, 'cbc:Percent', $this->formatDecimal($ivaRate)));
        $taxCategory->appendChild($this->createElement($xml, 'cbc:TaxExemptionReasonCode', '01'));

        $taxScheme = $xml->createElement('cac:TaxScheme');
        $taxScheme->appendChild($this->createElement($xml, 'cbc:ID', '01'));
        $taxScheme->appendChild($this->createElement($xml, 'cbc:Name', 'IVA'));
        $taxCategory->appendChild($taxScheme);

        $taxSubtotal->appendChild($taxCategory);
        $taxTotal->appendChild($taxSubtotal);

        return $taxTotal;
    }

    // ──────────────────────────────────────────────
    //  Legal Monetary Total
    // ──────────────────────────────────────────────

    private function buildLegalMonetaryTotal(\DOMDocument $xml, Factura $factura): \DOMElement
    {
        $monetaryTotal = $xml->createElement('cac:LegalMonetaryTotal');

        $lineExtension = $this->createElement($xml, 'cbc:LineExtensionAmount', $this->formatDecimal($factura->subtotal));
        $lineExtension->setAttribute('currencyID', 'COP');
        $monetaryTotal->appendChild($lineExtension);

        $taxExclusive = $this->createElement($xml, 'cbc:TaxExclusiveAmount', $this->formatDecimal($factura->subtotal));
        $taxExclusive->setAttribute('currencyID', 'COP');
        $monetaryTotal->appendChild($taxExclusive);

        $taxInclusive = $this->createElement($xml, 'cbc:TaxInclusiveAmount', $this->formatDecimal($factura->total));
        $taxInclusive->setAttribute('currencyID', 'COP');
        $monetaryTotal->appendChild($taxInclusive);

        $payable = $this->createElement($xml, 'cbc:PayableAmount', $this->formatDecimal($factura->total));
        $payable->setAttribute('currencyID', 'COP');
        $monetaryTotal->appendChild($payable);

        return $monetaryTotal;
    }

    // ──────────────────────────────────────────────
    //  Invoice Line
    // ──────────────────────────────────────────────

    private function buildInvoiceLine(\DOMDocument $xml, int $lineNumber, FacturaItem $item): \DOMElement
    {
        $line = $xml->createElement('cac:InvoiceLine');

        $line->appendChild($this->createElement($xml, 'cbc:ID', (string) $lineNumber));
        $line->appendChild($this->createElement($xml, 'cbc:InvoicedQuantity', $this->formatDecimal($item->cantidad)));
        $line->appendChild($this->createElement($xml, 'cbc:LineExtensionAmount', $this->formatDecimal($item->subtotal)));

        // Item details
        $itemEl = $xml->createElement('cac:Item');
        $itemEl->appendChild($this->createElement($xml, 'cbc:Description', $item->descripcion));

        $productName = $item->producto?->nombre ?? $item->descripcion;
        $itemEl->appendChild($this->createElement($xml, 'cbc:Name', $productName));

        // SellersItemIdentification (if product has code)
        if ($item->producto?->codigo) {
            $sellersItem = $xml->createElement('cac:SellersItemIdentification');
            $sellersItem->appendChild($this->createElement($xml, 'cbc:ID', $item->producto->codigo));
            $itemEl->appendChild($sellersItem);
        }

        // ClassifiedTaxCategory (IVA)
        $taxCategory = $xml->createElement('cac:ClassifiedTaxCategory');
        $taxCategory->appendChild($this->createElement($xml, 'cbc:Percent', $this->formatDecimal($item->tasa_impuesto)));
        $taxCategory->appendChild($this->createElement($xml, 'cbc:TaxExemptionReasonCode', '01'));

        $taxScheme = $xml->createElement('cac:TaxScheme');
        $taxScheme->appendChild($this->createElement($xml, 'cbc:ID', '01'));
        $taxScheme->appendChild($this->createElement($xml, 'cbc:Name', 'IVA'));
        $taxCategory->appendChild($taxScheme);

        $itemEl->appendChild($taxCategory);
        $line->appendChild($itemEl);

        // Price
        $price = $xml->createElement('cac:Price');
        $priceAmount = $this->createElement($xml, 'cbc:PriceAmount', $this->formatDecimal($item->precio_unitario));
        $priceAmount->setAttribute('currencyID', 'COP');
        $price->appendChild($priceAmount);
        $line->appendChild($price);

        return $line;
    }

    // ──────────────────────────────────────────────
    //  Helpers
    // ──────────────────────────────────────────────

    private function createElement(\DOMDocument $xml, string $name, ?string $value = null, array $children = []): \DOMElement
    {
        $el = $xml->createElement($name);

        if ($value !== null) {
            $el->appendChild($xml->createTextNode($value));
        }

        foreach ($children as $child) {
            $el->appendChild($child);
        }

        return $el;
    }

    private function formatDecimal(float $value): string
    {
        return number_format($value, 2, '.', '');
    }

    private function validarDatosRequeridos(Factura $factura, array $empresa): void
    {
        $required = ['nit', 'razon_social'];
        foreach ($required as $field) {
            if (empty($empresa[$field])) {
                throw new \RuntimeException("Dato empresarial requerido faltante: {$field}");
            }
        }

        if (!$factura->numero) {
            throw new \RuntimeException("La factura no tiene número asignado.");
        }
    }
}
