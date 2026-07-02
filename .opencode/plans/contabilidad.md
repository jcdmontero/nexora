# Plan de Implementación Contable — Nexora

**Objetivo:** Lograr contabilidad al 100%: todos los libros creados, cada operación registra
su asiento contable en la cuenta correcta, y los reportes contables reflejan la realidad
del negocio.

---

## Estado Actual vs. Objetivo

| Dimensión | Estado | Objetivo |
|---|---|---|
| PUC (Plan de Cuentas) | 30 cuentas, **falta 2815/2805** (Anticipos clientes) | Completo para operaciones del negocio |
| Libros contables | No existen como entidad | 4 libros visibles: Diario, Mayor, Caja, Ventas |
| Ventas → Contabilidad | ✅ Completo (contado, crédito, OT con abono, COGS) | ✅ Ya funciona |
| Compras → Contabilidad | ❌ No genera asientos | Generar asiento al recibir OC |
| Compras → Inventario | ❌ No ajusta stock al recibir OC | Incrementar stock al recibir OC |
| Cuentas por Cobrar | ❌ Tabla existe, no se puebla | Poblar desde ventas a crédito |
| Cuentas por Pagar | ❌ Tabla existe, no se puebla | Poblar desde compras a crédito |
| Recaudo de Cartera | ❌ No existe flujo | Recibir pago y actualizar CxC |
| Pago a Proveedores | ❌ No existe flujo | Pagar y actualizar CxP |
| Auto-seed PUC al crear tenant | ✅ Ya funciona vía ModuleActivator | ✅ Ya funciona |
| Config. cuentas x defecto | ❌ Hardcodeado en FacturaService | Parametrizable por tenant |

---

## FASE 1: Completar PUC y Libros (Fundación)

### 1.1 Agregar cuentas faltantes al PUC

**Archivos:** `PucColombiaProvisioner.php`, `PucSimplificadoProvisioner.php`

Agregar al PUC de ambos regímenes:

| Código | Nombre | Tipo | Nat. | Nivel | Acepta mov. |
|---|---|---|---|---|---|
| 2805 | Anticipos recibidos de clientes | pasivo | credito | 2 | Sí |
| 2815 | Anticipos recibidos (alternativa) | pasivo | credito | 2 | Sí |

La cuenta 2815 ya la usa `FacturaService::registrarContabilidad()` para reversar
abonos. Sin ella en el PUC, el asiento del reverso se salta silenciosamente.

### 1.2 Activar PucSimplificadoProvisioner para régimen simplificado

**Archivos:** `ModuleActivator.php`, `TenantController.php`

Actualmente solo se ejecuta `PucColombiaProvisioner`. Para tenants con régimen
`simplificado`, debe ejecutarse `PucSimplificadoProvisioner`.

### 1.3 Crear modelo LibroContable y su UI

- `app/Modules/Accounting/Models/LibroContable.php`
- Migración libros_contables
- Seed automático al crear tenant

### 1.4 UI de Libros (reportes predefinidos)

Vistas para Diario, Mayor, Caja, Ventas.

---

## FASE 2: Compras → Contabilidad + Inventario

### 2.1 Ajustar stock al recibir OC

### 2.2 Generar asiento contable al recibir OC

### 2.3 Poblar Cuentas por Pagar

---

## FASE 3: Ventas → Cartera (Cuentas por Cobrar)

### 3.1 Poblar CxC desde facturas a crédito

### 3.2 Flujo de Recaudo

### 3.3 UI de Cartera

---

## FASE 4: Pago a Proveedores (Cuentas por Pagar)

### 4.1 Flujo de Pago a Proveedores

---

## FASE 5: Reportes Contables ("Libros")

### 5.1 Libro Diario General
### 5.2 Libro Mayor y Balances
### 5.3 Libro de Caja
### 5.4 Libro de Ventas
### 5.5 Estado de Resultados (PyG)

---

## FASE 6: Parametrización y Polish

### 6.1 Cuentas por defecto por tenant
### 6.2 UI de configuración contable

---

## Progreso

### ✅ Completado

- **FASE 1: PUC + Libros**
  - [x] 1.1 Agregar 2815/2805 al PucColombiaProvisioner
  - [x] 1.2 Agregar 2815/2805 al PucSimplificadoProvisioner
  - [x] 1.3 Activar PucSimplificadoProvisioner para régimen simplificado
  - [x] 1.4 Crear migración y modelo LibroContable
  - [x] 1.5 Seed automático de libros al crear tenant
  - [x] 1.6 UI de libros en módulo contable

- **FASE 2: Compras → Inventario + Contabilidad** ✅ YA IMPLEMENTADO
  - [x] 2.1 Incrementar stock al recibir OC → `RecepcionController::store()` (línea 120-131)
  - [x] 2.2 Crear asiento contable → `RecepcionController::store()` (línea 165-221)
  - [x] 2.3 Registrar movimiento de caja → `RecepcionController::store()` (línea 137-146)
  - [x] 2.4 Poblar Cuentas por Pagar → `RecepcionController::store()` (línea 149-162)

- **FASE 3: Cartera (Cuentas por Cobrar)**
  - [x] 3.1 Poblar CxC desde facturas a crédito → `FacturaService::poblarCuentaPorCobrar()`
  - [x] 3.2 RecaudoService → `app/Modules/Cash/Services/RecaudoService.php`
  - [x] 3.3 RecaudoController (index, pendientes, pagar) + rutas + menú
  - [x] 3.4 UI Recaudos → `resources/js/Pages/Modules/Cash/Recaudos/{Index,Pendientes}.tsx`
  - [x] 3.5 Relaciones: `Cliente::cuentasPorCobrar()`, `Factura::cuentaPorCobrar()`

- **FASE 4: Pago a Proveedores (Cuentas por Pagar)**
  - [x] 4.1 PagoProveedorService → `app/Modules/Cash/Services/PagoProveedorService.php`
  - [x] 4.2 PagoProveedorController (index, pendientes, pagar) + rutas + menú
  - [x] 4.3 UI PagoProveedores → `resources/js/Pages/Modules/Cash/PagoProveedores/{Index,Pendientes}.tsx`
  - [x] 4.4 Relación: `Proveedor::cuentasPorPagar()`

- **FASE 5: Reportes / Libros faltantes**
  - [x] 5.1 Estado de Resultados (PyG) → `ReporteController::pyg()` + `Pyg.tsx`
    - Filtro por período, muestra Ingresos (Clase 4), Costos (Clase 6), Gastos (Clase 5)
    - Totales: Utilidad Bruta, Utilidad/Pérdida Neta
  - [x] 5.2 Balance General → `ReporteController::balance()` + `Balance.tsx`
    - Activos (Clase 1), Pasivos (Clase 2), Patrimonio (Clase 3)
    - Alerta si ecuación contable desbalanceada
  - [x] 5.3 Menú CONTABILIDAD con enlaces directos a Balance de Prueba, PyG, Balance General

- **FASE 6: Parametrización**
  - [x] 6.1 Agregar claves contables a `Configuracion::CATEGORIAS` y `defaults()`
  - [x] 6.2 Crear `ContabilidadConfig` helper con métodos semánticos (`caja()`, `clientes()`, etc.)
  - [x] 6.3 Actualizar `FacturaService` para usar `ContabilidadConfig` en lugar de códigos hardcodeados
  - [x] 6.4 Actualizar `RecaudoService`, `PagoProveedorService`, `ReciboService`
  - [x] 6.5 UI de configuración contable en `Tenant/Edit.jsx` (pestaña "Contabilidad" con 8 campos PUC)

### ✅ Misión cumplida — Contabilidad Nexora al 100%

Todas las fases del plan han sido implementadas. Cada operación del sistema ya genera su
asiento contable, los libros son consultables, la cartera y CxP tienen flujo completo,
y los reportes financieros (Balance de Prueba, PyG, Balance General) están disponibles.
