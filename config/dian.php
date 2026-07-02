<?php

return [

    /*
    |--------------------------------------------------------------------------
    | DIAN Electronic Invoicing Configuration
    |--------------------------------------------------------------------------
    |
    | Configuración para facturación electrónica DIAN (Colombia).
    | URLs de habilitación vs producción, credenciales del certificado
    | y parámetros de comunicación HTTP.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Environment: 'test' | 'production'
    |--------------------------------------------------------------------------
    */
    'environment' => env('DIAN_ENVIRONMENT', 'test'),

    /*
    |--------------------------------------------------------------------------
    | Base URLs
    |--------------------------------------------------------------------------
    */
    'urls' => [
        'test' => [
            'base' => 'https://vpes-habilitacion.dian.gov.co',
            'send_bill' => '/web-services/2/InvoiceSendbill/InvoiceSendbill',
            'get_status' => '/web-services/2/Invoicerequest/Invoicerequest',
        ],
        'production' => [
            'base' => 'https://vpes.dian.gov.co',
            'send_bill' => '/web-services/2/InvoiceSendbill/InvoiceSendbill',
            'get_status' => '/web-services/2/Invoicerequest/Invoicerequest',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Resolved URL helpers (derived from environment)
    |--------------------------------------------------------------------------
    */
    'base_url' => null,   // resolved at boot
    'api_endpoint' => null, // resolved at boot

    /*
    |--------------------------------------------------------------------------
    | HTTP Client Settings
    |--------------------------------------------------------------------------
    */
    'timeout' => env('DIAN_TIMEOUT', 30),
    'connect_timeout' => env('DIAN_CONNECT_TIMEOUT', 10),

    /*
    |--------------------------------------------------------------------------
    | Certificate Settings
    |--------------------------------------------------------------------------
    */
    'certificate' => [
        'storage_disk' => env('DIAN_CERT_DISK', 'local'),
        'storage_prefix' => 'dian/certificados',
    ],

    /*
    |--------------------------------------------------------------------------
    | Retry Settings
    |--------------------------------------------------------------------------
    */
    'retry' => [
        'max_attempts' => env('DIAN_RETRY_MAX', 3),
        'delay_seconds' => env('DIAN_RETRY_DELAY', 5),
    ],

    /*
    |--------------------------------------------------------------------------
    | Provider Binding
    |--------------------------------------------------------------------------
    | 'mock' uses MockDianProvider + MockSignatureProvider (default dev/testing)
    | 'real' uses RealDianProvider + XmlSigner (production)
    */
    'provider' => env('DIAN_PROVIDER', 'mock'),

];
