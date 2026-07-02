---
name: accounting-colombia
description: Contabilidad por partida doble, facturación electrónica y cumplimiento tributario (NIIF, DIAN) para módulos de Nexora.
---

## Buenas prácticas
- Todo asiento contable debe sumar 0 (Débitos = Créditos).
- Parametrizar las cuentas PUC dinámicamente; nunca codificarlas duro.
- Estructurar la Facturación Electrónica según el anexo técnico vigente de la DIAN (XML UBL 2.1).
- Generar cierres contables periódicos (mensuales/anuales).
- Aislar la contabilidad por `tenant_id` (cada empresa lleva la suya).

## Restricciones
- NUNCA permitir eliminar un asiento validado; solo asientos de reversión.
- NUNCA generar factura sin el consecutivo oficial autorizado por la DIAN.

## Ejemplos de uso
- "Diseña el asiento contable automático de una venta."
- "Valida que este XML cumpla los requisitos de la Factura Electrónica."

## Errores comunes a evitar
- Acumular saldos erróneos por no manejar la naturaleza de las cuentas (Débito vs Crédito).
- Olvidar el ICA según el municipio del cliente.
