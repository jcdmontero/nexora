# Análisis de Reutilización — Legacy `servicemanager` → NEXORA

> Documento de referencia. El proyecto `servicemanager` se borrará; aquí queda capturado
> qué código backend vale la pena rescatar y cómo adaptarlo a la arquitectura de NEXORA.
> Dimensión del legacy: 61 modelos, 11 servicios, 6 repositorios, 145 migraciones, 61 controladores.

---

## 🔑 Hallazgo transversal (cambia todo el cálculo de esfuerzo)

**El legacy YA es multi-tenant.** Usa un trait `BelongsToEmpresa` + columna `empresa_id` (FK a `empresas`) en ~50 tablas (ver migración `add_empresa_id_to_core_tables.php`). La tabla `empresas` es básicamente un tenant (nit, sector, plan_id, estado).

**Implicación:** migrar a NEXORA es en su mayoría:
- Renombrar `empresa_id` → `tenant_id`
- Sustituir el trait `BelongsToEmpresa` por el global scope de tenant de NEXORA
- Reemplazar el frontend Blade/Bootstrap/Livewire por React+Inertia (NO reutilizable, solo referencia de UX)

Esto **sube el nivel de reutilización del backend** en casi todos los módulos.

⚠️ Patrón de servicios: `ClienteService`, `OrdenService`, `RepuestoService` son envoltorios CRUD finos sobre repositorios → aportan poco. El valor real está en `NominaService` y `ContabilidadService`.

---

## 💎 Las 3 joyas a rescatar casi literal

### 1. `app/Services/ContabilidadService.php` — Motor de partida doble
- `registrarAsiento(cabecera, lineas)`: **valida que débitos == créditos antes de persistir** (lanza excepción si descuadra). Soporta centro de costo por línea. Contrato genérico pensado para que otros módulos lo invoquen.
- `revertirAsiento()`: genera contra-asiento invirtiendo débito/crédito (no borra, mantiene traza).
- Helpers `registrarVenta/Compra/MovimientoCaja` con plan de cuentas PUC colombiano.
- ⚠️ A corregir al migrar: el plan de cuentas (1105, 1305, 4135, 2408...) está **hardcodeado**; parametrizarlo por tenant. El fallback `Auth::id() ?? 1` es **peligroso en multi-tenant**.

### 2. `app/Services/RH/NominaService.php` — Motor de nómina colombiana 2026
La pieza de mayor valor, muy difícil de reescribir. Ya resuelve:
- Días proporcionales (mes de 30, corrige febrero), incapacidades con % de pago.
- Horas extra/recargos con multiplicadores (1.25 / 1.75 / 2.0 / 2.5 / 0.35...).
- IBC con piso (1 SMLMV proporcional) y techo (25 SMLMV, Ley 100 art.18).
- Deducciones: salud, pensión, **FSP progresivo** (Ley 797), **retención en la fuente Art. 383 ET** (7 tramos UVT).
- Provisiones: prima, cesantías, intereses 12%, vacaciones.
- Aportes patronales: pensión, salud (exoneración Ley 1607), ARL por clase de riesgo, CCF, SENA, ICBF.
- Reducción jornada **Ley 2101** (44→42h desde jul-2026).
- `contabilizarPeriodo()`: consolida por (cuenta, centro de costo) y delega en ContabilidadService (idempotente).
- Reversa idempotente de cuotas de préstamo al re-liquidar.
- ⚠️ Depende de `ConfiguracionLegal` por año (SMLMV, UVT, tasas) y de conceptos con código mágico (SAL01, DED01-05, PAT01-06, PRO01-04...) que deben sembrarse por tenant.

### 3. `app/Services/WorkflowService.php` — Máquina de estados de órdenes
- Estados puros sin dependencias de framework: Recibido→Diagnóstico→Reparación→Pruebas→Listo→Entregado/Cancelado.
- Validación de transiciones (avance de uno en uno; cancelación desde cualquier estado).
- Modo configurable "técnicos activo" (añade estado Asignado).
- ✅ Reutilizable tal cual (solo depende del enum `OrdenEstado`).

**Bonus:** patrón Repository (`*RepositoryInterface` + `Eloquent*Repository`) ya establecido para Cliente/Orden/Repuesto.

---

## 📦 Reutilización por módulo

| Módulo | Modelos legacy clave | Lógica reutilizable | Reutiliz. | Esfuerzo |
|---|---|---|---|---|
| **accounting** | CuentaContable, AsientoContable, AsientoLinea, CentroCosto, CxC, CxP | **ContabilidadService** (partida doble) | ALTA | Bajo-Medio (parametrizar PUC) |
| **inventory** | Repuesto, Categoria, Marca, AjusteInventario | Esquema sólido (stock, ubicación, soft-delete, índices pg_trgm) | ALTA | Bajo |
| **service-desk** | OrdenReparacion, Servicio, Garantia, Checklist, FallaBase | **WorkflowService** + esquema de órdenes maduro | ALTA | Medio-Alto (desacoplar "técnicos") |
| **payroll** | Nomina, NominaDetalle, ConceptoNomina, ConfiguracionLegal, ProvisionAcumulada | **NominaService** | ALTA | Medio (sembrar config legal) |
| **hr** | Empleado, Contrato, Cargo, Afiliacion, EntidadParafiscal | Estructura RH colombiana completa | ALTA | Medio (desacoplar técnico) |
| **cash** | Caja, CajaDiaria, MovimientoCaja | Arqueo (apertura/cierre/diferencia/anulación) + integración contable | MEDIA-ALTA | Bajo-Medio |
| **crm** | Cliente, SolicitudServicio, Cotizacion, Notificacion | Modelo Cliente + canales notif; servicios son CRUD finos | MEDIA | Medio |
| **sales** | VentaDirecta, VentaDetalle, Factura, PagoFactura | Lógica en ContabilidadService::registrarVenta | MEDIA | Medio |
| **purchasing** | Compra, Proveedor, CuentaPorPagar | Lógica en ContabilidadService::registrarCompra | MEDIA | Medio (rediseño multi-línea) |

---

## ⚠️ Acoplamientos legacy a romper al migrar

1. **"Técnico" fue absorbido por Empleado** (`migrate_tecnicos_to_empleados`). Service-desk quedó acoplado a HR (comisiones, `es_productivo`, `puede_facturar`). En NEXORA mantener esa separación pero limpia.
2. **Pagos directos a técnicos** → categoría "Pago a Técnicos" mapeada a cuenta 5105. El ROADMAP legacy ya prohibía pagos directos: toda compensación debe pasar por nómina.
3. **Factura nace de OrdenReparacion** (`orden_reparacion_id`): en NEXORA la factura debe poder nacer de una venta genérica, no solo de una orden.
4. **Compra acoplada a un solo `repuesto_id`**: no soporta orden de compra multi-línea sin rediseño.
5. **Plan de cuentas PUC hardcodeado** en ContabilidadService → parametrizar por tenant.
6. **`Auth::id() ?? 1`** como fallback → eliminar (peligroso en multi-tenant).
7. **NivelOperativo / SistemaModeService**: lógica heredada que NEXORA reemplaza con módulos activables por tenant.

---

## 🗺️ Orden de migración recomendado (por dependencias y valor)

1. **accounting** — base de la que dependen sales, cash, purchasing y payroll. Migrar `ContabilidadService` parametrizando el PUC.
2. **inventory** — esquema sólido, bajo esfuerzo, sin dependencias; habilita sales y purchasing.
3. **crm** — Cliente es entidad base para sales y service-desk.
4. **sales + cash + purchasing** — dependen de accounting + inventory + crm; integración contable ya hecha.
5. **service-desk** — el dominio más rico pero el más acoplado; migrar tras inventory/crm/sales.
6. **hr** — estructura organizacional requerida por payroll.
7. **payroll** — al final; depende de hr + accounting. Rescatar `NominaService` casi literal.

> Nota: el orden por dependencias (arriba) es distinto al orden por valor de negocio del PLAN-SAAS
> (que prioriza CRM/service-desk). Decidir según objetivo: si el objetivo es vender rápido a talleres,
> priorizar crm + service-desk; si es robustez financiera, empezar por accounting + inventory.

---

## ✅ Conclusión

- El backend legacy es **mayoritariamente reutilizable** gracias a que ya es multi-tenant.
- Hay **3 joyas** (contabilidad, nómina, workflow) que ahorran semanas de trabajo y encierran reglas colombianas difíciles de reescribir.
- El trabajo grande NO es la lógica de negocio, sino: (a) renombrar tenancy, (b) parametrizar lo hardcodeado, (c) reconstruir TODO el frontend en React+Inertia+Shadcn, (d) romper los acoplamientos heredados.

*Documento generado: 2026-06-19*
