---
name: payroll-colombia
description: Liquidación de nómina y seguridad social bajo la legislación laboral colombiana para módulos de Nexora.
---

## Buenas prácticas
- Mantener los porcentajes de aportes (Salud 4%, Pensión 4%, ARL según nivel) configurables en BD.
- Calcular bien la base de liquidación (Auxilio de Transporte cuenta para Prima y Cesantías, NO para Vacaciones ni Seguridad Social).
- Manejar incapacidades y licencias proporcionalmente a los días laborados.
- Aplicar la Retención en la Fuente por Salarios (Procedimiento 1 y 2).
- Aislar la nómina por `tenant_id`.

## Restricciones
- NUNCA calcular seguridad social sobre base inferior a 1 SMLMV (salvo legislación especial por días/horas).
- NUNCA obviar los redondeos exigidos por la PILA.

## Ejemplos de uso
- "Implementa el recargo dominical y festivo según la ley 789."
- "Genera el archivo plano para la planilla integrada (PILA)."

## Errores comunes a evitar
- Incluir el auxilio de transporte en la base de seguridad social.
- Liquidar cesantías sobre salario variable sin promediar el último año.
