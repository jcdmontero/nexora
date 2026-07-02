<?php

/**
 * Tabla de Retención en la Fuente — Artículo 383 Estatuto Tributario.
 *
 * Actualizar este archivo cuando la DIAN modifique los tramos o acumulados.
 * Los límites y tarifas están expresados en UVT; el valor UVT se obtiene
 * de ConfiguracionLegal::valor_uvt para cada año vigente.
 *
 * Vigencia: Año Gravable 2025-2026 (ET Art. 383, modificado por Ley 2277/2022).
 */
return [
    /*
    |--------------------------------------------------------------------------
    | Tramos marginales (en UVT)
    |--------------------------------------------------------------------------
    | desde     : límite inferior del tramo (UVT)
    | hasta     : límite superior (null = sin tope)
    | tarifa    : tasa marginal para el excedente del tramo
    | acumulado : impuesto fijo acumulado hasta el inicio del tramo (UVT)
    */
    'tramos' => [
        ['desde' => 0,    'hasta' => 95,   'tarifa' => 0.00, 'acumulado' => 0.00],
        ['desde' => 95,   'hasta' => 150,  'tarifa' => 0.19, 'acumulado' => 0.00],
        ['desde' => 150,  'hasta' => 360,  'tarifa' => 0.28, 'acumulado' => 10.45],
        ['desde' => 360,  'hasta' => 640,  'tarifa' => 0.33, 'acumulado' => 69.25],
        ['desde' => 640,  'hasta' => 945,  'tarifa' => 0.35, 'acumulado' => 161.65],
        ['desde' => 945,  'hasta' => 2300, 'tarifa' => 0.37, 'acumulado' => 268.40],
        ['desde' => 2300, 'hasta' => null, 'tarifa' => 0.39, 'acumulado' => 769.75],
    ],

    /*
    |--------------------------------------------------------------------------
    | Depuración (exención del 25%)
    |--------------------------------------------------------------------------
    | porcentaje : fracción del ingreso laboral exenta
    | tope_uvt   : tope máximo en UVT (Art. 206 ET)
    */
    'depuracion_porcentaje' => 0.25,
    'depuracion_tope_uvt'   => 240,
];
