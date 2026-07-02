---
🔍 AUDITORÍA COMPLETA DEL DASHBOARD NEXORA

---
PARTE A — DIAGNÓSTICO COMPLETO

1. Auditoría Visual

✅ Qué está bien

┌─────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│         Aspecto         │                                                    DETALLE                                                     │
├─────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Sistema de color oklch  │ Paleta coherente con variables CSS, soporte dark/light completo. Es técnicamente sólido.                       │
├─────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ StatCard                │ Componente reutilizable con animación useCountUp, gradientes de acento, hover con translate-y. Diseño cuidado. │
├─────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Tipografía Geist        │ Elección premium, adecuada para interfaces de datos.                                                           │
├─────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Dark mode               │ Implementado con useTheme + custom variant, alternancia fluida.                                                │
├─────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Sidebar colapsable      │ Persiste en localStorage, transiciones suaves, mobile drawer.                                                  │
├─────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Iconografía Lucide      │ Consistente, peso visual uniforme.                                                                             │
├─────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Gráficos custom tooltip │ Tooltips con backdrop-blur, border-radius, formateo de moneda. Buena calidad.                                  │
└─────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

❌ Qué debe eliminarse o rediseñarse

┌──────────────────────────────────────┬───────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│               Problema               │ Severidad │                                                                   DETALLE                                                                    │
├──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Dashboard de 875 líneas monolítico   │ 🔴        │ Dashboard.tsx tiene TODO: tipos, constantes, mapeos de color, tooltips, lógica de filtros, renderizado. Violación SRP masiva.                │
│                                      │ Crítico   │                                                                                                                                              │
├──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Duplicación masiva de mapeos de      │ 🔴        │ taskAccentMap, qaColorMap, accentMap (en StatCard) repiten la misma lógica con ligeras variaciones. 3 sistemas de color paralelos.           │
│ color                                │ Crítico   │                                                                                                                                              │
├──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ SuperAdmin Dashboard primitivo       │ 🔴        │ Solo 5 StatCards sin gráficos, sin fecha, sin contexto. Comparado con el Dashboard tenant es de otro proyecto.                               │
│                                      │ Crítico   │                                                                                                                                              │
├──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Sección "Tus módulos" duplicada      │ 🟡 Alto   │ Aparece como reemplazo del gráfico de ingresos Y como sidebar card cuando el gráfico sí existe. Lógica revenueTrend.length > 0 condicional   │
│                                      │           │ confusa.                                                                                                                                     │
├──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ KPIs planos sin contexto temporal    │ 🟡 Alto   │ "Ventas hoy = $1.200.000" no dice nada sin comparación. Falta trend, sparklines, variación vs. ayer/semana anterior.                         │
├──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Jerarquía visual plana               │ 🟡 Alto   │ Todo compite por atención: saludo, banner de tareas, KPIs, gráficos, actividad, sidebar. No hay focal point.                                 │
├──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ "Accesos rápidos" como lista         │ 🟡 Alto   │ Links planos que replican la sidebar. Cero diferenciación, cero valor sobre navegar por el sidebar.                                          │
│ genérica                             │           │                                                                                                                                              │
├──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Sección "Plataforma" en KPIs         │ 🟠 Medio  │ Usuarios, Módulos, Roles, Sedes → son métricas de administración, no del día a día operacional. Ruido para usuarios no-admin.                │
├──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Sin estados skeleton/loading         │ 🟠 Medio  │ Los KPIs aparecen de golpe. No hay transición de carga perceptible.                                                                          │
├──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Gráfico de actividad sin zoom ni     │ 🟠 Medio  │ Siempre 7 días fijos. No hay selector de rango.                                                                                              │
│ rango                                │           │                                                                                                                                              │
├──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Sin personalización                  │ 🟠 Medio  │ Layout fijo. No hay drag-and-drop, ni ocultar widgets, ni reordenar.                                                                         │
├──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Responsive deficiente en gráficos    │ 🟠 Medio  │ Altura fija h-56. En mobile los gráficos se aplastan o se cortan.                                                                            │
├──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Sin adaptación por rol               │ 🟠 Medio  │ Un cajero ve los mismos widgets que el gerente. Debería variar por rol.                                                                      │
├──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Alertas de inventario aisladas       │ 🟠 Medio  │ Solo muestra "productos bajo stock". Falta: facturas vencidas, contratos por vencer, cajas abiertas sin cierre, nóminas pendientes.          │
├──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Actividad reciente como lista chata  │ 🟢 Bajo   │ Sin filtros, sin agrupación por módulo, sin búsqueda. Es un feed sin inteligencia.                                                           │
└──────────────────────────────────────┴───────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

🔴 Qué elementos faltan

┌───────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────┐
│           Elemento faltante           │                                             Impacto                                             │
├───────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Widget de cajas abiertas              │ Crítico — Un cajero necesita ver si su caja está abierta al instante.                           │
├───────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Indicadores de tendencia (sparklines) │ Crítico — KPI sin tendencia es número muerto.                                                   │
├───────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Acciones rápidas contextuales         │ Crítico — Botones de acción primaria (Nueva Venta, Nuevo Ticket, Abrir Caja) no son inmediatos. │
├───────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Selector de período temporal          │ Alto — No se puede comparar "esta semana vs. semana anterior".                                  │
├───────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Resumen por módulo                    │ Alto — Cada módulo activo debería tener su micro-resumen.                                       │
├───────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Notificaciones inline                 │ Alto — No hay integración del módulo de notificaciones en el dashboard.                         │
├───────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Widget de cuentas por cobrar/pagar    │ Alto — Para empresas es criticidad diaria.                                                      │
├───────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Indicador de estado DIAN              │ Medio — Para módulo Ventas, saber si la conexión DIAN está activa es vital.                     │
├───────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Progreso de nómina                    │ Medio — Si hay período activo, mostrar avance de liquidación.                                   │
├───────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Onboarding para tenants nuevos        │ Medio — Un tenant recién creado ve un dashboard vacío sin guía.                                 │
└───────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────┘

---
2. Auditoría Funcional

Flujo de trabajo diario típico (por rol)

┌───────────────┬─────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────┐
│      Rol      │                 Primera acción del día                  │                           Problemática actual                            │
├───────────────┼─────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
│ Gerente       │ Ver ventas del día, cuentas por cobrar, alertas         │ Debe escrollear hasta los KPIs, los datos de ventas están sin contexto   │
├───────────────┼─────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
│ Cajero        │ Abrir caja, ver facturas pendientes                     │ No hay widget de cajas. Debe navegar manualmente.                        │
├───────────────┼─────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
│ Vendedor      │ Nuevo cliente, punto de venta, ver comisiones           │ Los accesos rápidos están enterrados en la sidebar derecha               │
├───────────────┼─────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
│ Técnico       │ Ver tickets asignados, órdenes pendientes               │ Aparece como "Órdenes por revisar" en banner genérico                    │
├───────────────┼─────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
│ Contador      │ Asientos pendientes, conciliaciones, cierres de período │ No hay widget contable. Cero visibilidad.                                │
├───────────────┼─────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
│ RRHH          │ Ver incapacidades, contratos por vencer, préstamos      │ Tiene su propio dashboard, pero desconectado del principal               │
├───────────────┼─────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
│ Admin empresa │ Resumen general, tareas pendientes, configurar usuarios │ Los KPIs "Plataforma" son lo primero que ve, pero son lo menos relevante │
└───────────────┴─────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────┘

Cuellos de botella identificados

1. KPIs sin trend obligan a cálculo mental → El usuario debe abrir otra pantalla para comparar
2. Acceso rápido está en el fondo de la página → requiere scroll en pantallas menores
3. Actividad reciente mezcla todo sin filtrar → ruido cognitivo alto
4. No hay "comando" rápido → Para crear factura/ticket/empleado, siempre se navega 2-3 niveles
5. El Dashboard no cambia según el contexto del usuario → Un cajero y un contador ven lo mismo

---
PARTE B — LISTA PRIORIZADA DE MEJORAS

┌─────┬───────────────────────────────────────────────────────┬───────────┬──────────────┬──────────┐
│  #  │                        Mejora                         │ Prioridad │   Impacto    │ Esfuerzo │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 1   │ Descomponer Dashboard.tsx en widget system            │ P0        │ Arquitectura │ Alto     │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 2   │ Añadir sparklines/trends a todos los KPIs             │ P0        │ UX           │ Bajo     │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 3   │ Sección de acciones rápidas prominente (hero actions) │ P0        │ UX           │ Medio    │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 4   │ Dashboard adaptativo por módulos activos              │ P0        │ Funcional    │ Alto     │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 5   │ Dashboard adaptativo por rol                          │ P1        │ Funcional    │ Medio    │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 6   │ Widget de cajas + estado de sesión                    │ P1        │ Funcional    │ Medio    │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 7   │ Widget de cuentas por cobrar/pagar                    │ P1        │ Negocio      │ Medio    │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 8   │ Selector de período temporal global                   │ P1        │ UX           │ Medio    │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 9   │ Sistema de notificaciones inline                      │ P1        │ UX           │ Medio    │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 10  │ Rediseñar Dashboard SuperAdmin                        │ P1        │ Visual       │ Medio    │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 11  │ Unificar sistema de colores (eliminar 3 mapeos)       │ P1        │ Técnico      │ Bajo     │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 12  │ Estados skeleton/loading en widgets                   │ P2        │ UX           │ Bajo     │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 13  │ Personalización drag-and-drop de widgets              │ P2        │ UX           │ Alto     │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 14  │ Onboarding para tenants nuevos                        │ P2        │ Retención    │ Medio    │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 15  │ Filtros en actividad reciente                         │ P2        │ UX           │ Bajo     │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 16  │ Responsive mejorado para gráficos                     │ P2        │ UX           │ Bajo     │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 17  │ Guardar layouts personalizados                        │ P3        │ UX           │ Alto     │
├─────┼───────────────────────────────────────────────────────┼───────────┼──────────────┼──────────┤
│ 18  │ Múltiples vistas (ej. "Financiero", "Operativo")      │ P3        │ UX           │ Alto     │
└─────┴───────────────────────────────────────────────────────┴───────────┴──────────────┴──────────┘

---
PARTE C — WIREFRAME TEXTUAL DEL NUEVO DASHBOARD

┌─────────────────────────────────────────────────────────────────────────┐
│ ☰  NEXORA  │ Dashboard │ ...breadcrumb...  │  ⌘K  ☀ 🔔 👤  │
├─────────────┴───────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  BUENOS DÍAS, CARLOS                                    ⚙️ Layout  │ │
│  │  Martes 28 de junio de 2026 — Distribuidora Los Andes S.A.S    │ │
│  │                                                                    │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │ │
│  │  │ + Venta  │  │+ Ticket  │  │ Abrir    │  │ + Cliente│         │ │
│  │  │ (POS)    │  │          │  │  Caja    │  │          │         │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌─ ATENCIÓN REQUERIDA ──────────────────────────────────────────────┐  │
│  │  ⚠ 3 Prod. bajo stock   ⏳ 2 CxC vencidas   📋 4 Órdenes pend. │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─ KPIs PRINCIPALES ───────────────────────────────────────────────┐  │
│  │ Ventas Hoy       │ Ventas Semana    │ CxC Pendientes │ Cajas Ab. │  │
│  │ $2.4M ↑12%      │ $14.8M ↑8%     │ $3.1M ↓2%     │ 2/3     │  │
│  │ ╱╲╱─╱╲ spark     │ ╱╲╱╲╱ spark     │ ──╲╱ spark     │ ●●○     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─ INGRESOS (6M) ──────────┐  ┌─ ACTIVIDAD (7D) ─────────────────┐  │
│  │  ▓▓   ▓▓▓                │  │  ╱╲    ╱╲                       │  │
│  │  ▓▓▓▓ ▓▓▓▓ ▓▓▓  ▓▓▓▓   │  │ ╱  ╲╱╱  ╲╱╲                     │  │
│  │  Ene Feb Mar Abr May Jun │  │  Lun Mar Mié Jue Vie Sáb Dom     │  │
│  │  [1M │ 3M │ 6M │ 12M]   │  │  Total: 47 eventos              │  │
│  └──────────────────────────┘  └────────────────────────────────────┘  │
│                                                                          │
│  ┌─ MÓDULOS ACTIVOS ────────────────────────────────────────────────┐  │
│  │  ┌─Ventas────┐ ┌─Inventario─┐ ┌─CRM───────┐ ┌─Compras──┐      │  │
│  │  │ 23 fact.  │ │ 156 prod.  │ │ 89 clien. │ │ 3 OC pen.│      │  │
│  │  │ $2.4M hoy│ │ 3 bajo stk │ │ 5 nuevos  │ │ 1 recibida│     │  │
│  │  │ Ver →    │ │ Ver →      │ │ Ver →     │ │ Ver →     │      │  │
│  │  └──────────┘ └────────────┘ └───────────┘ └───────────┘      │  │
│  │  ┌─Contab.──┐ ┌─Caja───────┐ ┌─RRHH──────┐ ┌─Nómina──┐      │  │
│  │  │ 4 asien. │ │ 2/3 cajas  │ │ 24 emp.   │ │ 1 período│     │  │
│  │  │ Per. Act.│ │$1.2M hoy  │ │ 2 inCap.  │ │ En curso │     │  │
│  │  │ Ver →    │ │ Ver →      │ │ Ver →     │ │ Ver →     │     │  │
│  │  └──────────┘ └────────────┘ └───────────┘ └────────────┘     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─ ACTIVIDAD RECIENTE ─────────────────────┐ ┌─ NOTIFICACIONES ───┐  │
│  │  [Todos] [Ventas] [Inventario] [CRM]     │ │  📱 María P.      │  │
│  │  ─────────────────────────────────       │ │  "Pedido listo"    │  │
│  │  ● María creó Factura #1024    hace 2m  │ │  hace 15 min       │  │
│  │  ● Carlos actualizó Producto X  hace 5m │ │  ─────────────     │  │
│  │  ● Sistema eliminó Sesión exp. hace 1h  │ │  📧 Juan M.        │  │
│  │  ● Ana creó Cliente "TecnoSur" hace 2h  │ │  "Factura recibida"│  │
│  │  ... Ver auditoría completa →            │ │  hace 1 hora      │  │
│  └───────────────────────────────────────────┘ └──────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

Principios del Wireframe

1. Z-Pattern de lectura: Saludo + Acciones rápidas → Alertas → KPIs → Gráficos → Detalle
2. Focal point claro: Las acciones rápidas prominentes son lo primero interactuable
3. Progressive disclosure: De resumen a detalle, nunca al revés
4. Modularidad: Cada sección es un widget independiente con su fuente de datos
5. Densidad controlada: Información suficiente sin scroll excesivo (4-5 pantallas en desktop)

---
PARTE D — ESTRUCTURA React RECOMENDADA

resources/js/Pages/Dashboard.tsx          ← Orquestador thin (solo composición)
resources/js/Widgets/
  ├── index.ts                            ← Registro y metadata de widgets
  ├── WidgetShell.tsx                     ← Wrapper: drag handle, menú, resize
  ├── DashboardGrid.tsx                   ← Grid con dnd-kit y responsive layout
  ├── WidgetRegistry.ts                   ← Mapa widgetId → componente + metadata
  │
  ├── Alertas/
  │   ├── AlertasWidget.tsx               ← Banner de atención requerida
  │   └── alertas-data.ts                 ← Hook/query de datos
  │
  ├── KPI/
  │   ├── KPIGrid.tsx                     ← Grid de KPIs con sparklines
  │   ├── KPICard.tsx                      ← Evolución de StatCard actual
  │   └── kpi-definitions.ts              ← Definiciones por módulo + rol
  │
  ├── RevenueChart/
  │   ├── RevenueChartWidget.tsx          ← Gráfico de ingresos con selector período
  │   └── useRevenueData.ts               ← Hook de datos
  │
  ├── ActivityChart/
  │   ├── ActivityChartWidget.tsx         ← Gráfico de actividad
  │   └── useActivityData.ts              ← Hook de datos
  │
  ├── ModuleSummary/
  │   ├── ModuleSummaryGrid.tsx           ← Grid de mini-cards por módulo
  │   ├── ModuleMiniCard.tsx              ← Card individual por módulo
  │   └── module-definitions.ts           ← Mapa código→config por módulo
  │
  ├── RecentActivity/
  │   ├── RecentActivityWidget.tsx         ← Feed con filtros por módulo
  │   └── useRecentActivity.ts            ← Hook de datos
  │
  ├── Notifications/
  │   ├── NotificationsWidget.tsx          ← Notificaciones recientes
  │   └── useNotifications.ts             ← Hook de datos
  │
  ├── QuickActions/
  │   ├── QuickActionsWidget.tsx           ← Botones de acción principal
  │   └── quick-action-definitions.ts      ← Definiciones por módulo + rol
  │
  └── CashStatus/
      ├── CashStatusWidget.tsx             ← Estado de cajas abiertas/cerradas
      └── useCashStatus.ts                 ← Hook de datos

---
PARTE E — ARQUITECTURA DE COMPONENTES REUTILIZABLES

Jerarquía de componentes

<DashboardGrid>                          ← Grid responsivo con dnd-kit
  <WidgetShell widgetId="kpi">           ← Shell: header, menú ⋮, drag handle
    <KPICard />                           ← Contenido del widget
  </WidgetShell>
  <WidgetShell widgetId="revenue">
    <RevenueChartWidget />
  </WidgetShell>
  ...
</DashboardGrid>

WidgetShell — Componente universal

interface WidgetShellProps {
  widgetId: string
  title: string
  description?: string
  icon?: LucideIcon
  accent?: AccentColor
  className?: string
  noPadding?: boolean
  menuItems?: WidgetMenuItem[]
  children: React.ReactNode
}

// Comportamiento:
// - Header con icono + título + descripción + menú ⋮
// - Botón "ocultar" en menú → actualiza layout del usuario
// - Botón "anclar" → siempre visible
// - Drag handle (solo si drag habilitado)
// - Border, rounded-xl, bg-card
// - Opcionalmente colapsable

Sistema de color unificado

// resources/js/lib/accent.ts — ELIMINAR los 3 mapeos actuales

const accentPalette = {
  indigo: {
    50: 'bg-indigo-50 dark:bg-indigo-500/10',
    100: 'bg-indigo-100 dark:bg-indigo-500/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-500/20',
    hover: 'hover:border-indigo-300 dark:hover:border-indigo-500/30',
    gradient: 'from-indigo-500 to-indigo-400',
    dot: 'bg-indigo-500',
    glow: 'group-hover:shadow-indigo-500/10',
  },
  // ... emerald, amber, sky, rose, violet
} as const

type AccentColor = keyof typeof accentPalette

---
PARTE F — DISEÑO DEL SISTEMA DE WIDGETS DINÁMICOS

Modelo de datos

interface WidgetDefinition {
  id: string                    // 'kpi' | 'revenue-chart' | 'activity' | ...
  title: string
  description: string
  icon: LucideIcon
  accent: AccentColor
  defaultPosition: { x: number; y: number }
  defaultSize: 'full' | 'half' | 'third' | 'quarter'
  requiredModules: string[]     // ['sales'] — solo se muestra si módulos activos
  requiredPermissions: string[] // ['sales:view']
  minRole?: string              // rol mínimo para verlo
}

interface UserWidgetLayout {
  userId: number
  tenantId: number
  widgets: {
    widgetId: string
    visible: boolean
    pinned: boolean
    position: { x: number; y: number }
    size: 'full' | 'half' | 'third' | 'quarter'
  }[]
  viewName: string              // 'default' | 'financiero' | 'operativo'
}

Flujo de renderizado

1. DashboardController → devuelve: stats, módulos activos, rol del usuario
2. WidgetRegistry.getWidgetDefinitions(modules, role) → lista de widgets disponibles
3. DashboardGrid.mergeWithUserLayout(definitions, userLayout) → layout final
4. Renderizado: cada WidgetShell carga su hook de datos independientemente
5. Si el usuario reordena/oculta → guarda layout vía API → actualiza UserWidgetLayout

Backend — Tabla user_widget_layouts

CREATE TABLE user_widget_layouts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    tenant_id BIGINT NOT NULL REFERENCES tenants(id),
    view_name VARCHAR(50) DEFAULT 'default',
    layout JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(user_id, tenant_id, view_name)
);

---
PARTE G — ADAPTACIÓN POR MÓDULOS

Widget mapping por módulo

┌────────────────┬─────────────────────────────────────┬────────────────────┬───────────────────────────┬──────────────────────────────┬────────────────────────────┬───────────────────────────┐
│     Módulo     │          KPIs principales           │      Gráfico       │          Alertas          │       Acciones rápidas       │     Listados recientes     │   Indicadores críticos    │
├────────────────┼─────────────────────────────────────┼────────────────────┼───────────────────────────┼──────────────────────────────┼────────────────────────────┼───────────────────────────┤
│ Ventas         │ Ventas hoy, Ventas semana, Ticket   │ Área — tendencia   │ Facturas rechazadas DIAN, │ Nueva Venta (POS), Nueva     │ Últimas 5 facturas         │ Estado conexión DIAN      │
│                │ promedio, N° facturas               │ 30d                │  CxC vencidas             │ Factura, Ver Facturas        │                            │                           │
├────────────────┼─────────────────────────────────────┼────────────────────┼───────────────────────────┼──────────────────────────────┼────────────────────────────┼───────────────────────────┤
│ Inventario     │ Total productos, Bajo stock, Valor  │ Bar — stock por    │ Productos bajo mínimo,    │ Nuevo Producto, Ajustar      │ Últimos movimientos        │ % productos bajo mínimo   │
│                │ inventario, Movimientos hoy         │ categoría          │ Traslados pendientes      │ Stock, Ver Kardex            │                            │                           │
├────────────────┼─────────────────────────────────────┼────────────────────┼───────────────────────────┼──────────────────────────────┼────────────────────────────┼───────────────────────────┤
│                │ Clientes activos, Oportunidades     │ Funnel — pipeline  │ Oportunidades sin         │ Nuevo Cliente, Nueva         │ Últimos 5 clientes,        │                           │
│ CRM            │ abiertas, Valor pipeline, Tasa      │ por etapa          │ seguimiento 7d            │ Oportunidad                  │ Oportunidades próximas a   │ Pipeline value            │
│                │ conversión                          │                    │                           │                              │ cerrar                     │                           │
├────────────────┼─────────────────────────────────────┼────────────────────┼───────────────────────────┼──────────────────────────────┼────────────────────────────┼───────────────────────────┤
│                │ Proveedores activos, OC pendientes, │ Bar — compras por  │ OC vencidas sin recibir,  │                              │                            │                           │
│ Compras        │  OC parcialmente recibidas, Gasto   │ mes                │ Productos sin proveedor   │ Nueva OC, Nuevo Proveedor    │ Últimas 5 OC               │ Gasto vs. presupuesto     │
│                │ mensual                             │                    │                           │                              │                            │                           │
├────────────────┼─────────────────────────────────────┼────────────────────┼───────────────────────────┼──────────────────────────────┼────────────────────────────┼───────────────────────────┤
│                │ Asientos del mes, Saldo cuenta      │ Línea — evolución  │ Período contable          │ Nuevo Asiento, Ver PUC,      │                            │ Período activo, Año       │
│ Contabilidad   │ bancaria, CxC, CxP                  │ patrimonio         │ cerrado?, Asientos sin    │ Cierre mes                   │ Últimos 5 asientos         │ fiscal                    │
│                │                                     │                    │ aprobar                   │                              │                            │                           │
├────────────────┼─────────────────────────────────────┼────────────────────┼───────────────────────────┼──────────────────────────────┼────────────────────────────┼───────────────────────────┤
│ Caja           │ Cajas abiertas, Total recaudo hoy,  │ Bar — recaudo por  │ Cajas abiertas >12h,      │ Abrir Caja, Cerrar Caja,     │ Últimos movimientos        │ Sesiones activas          │
│                │ Arqueos pendientes                  │ caja               │ Diferencias en arqueo     │ Arqueo                       │                            │                           │
├────────────────┼─────────────────────────────────────┼────────────────────┼───────────────────────────┼──────────────────────────────┼────────────────────────────┼───────────────────────────┤
│                │ Empleados activos, Contratos        │ Donut —            │ Contratos por vencer 30d, │ Nuevo Empleado, Registrar    │                            │                           │
│ Talento Humano │ vigentes, Préstamos activos,        │ distribución       │  Incapacidades activas    │ Incapacidad                  │ Últimos 5 empleados        │ Rotación mensual          │
│                │ Incapacidades                       │ contrato           │                           │                              │                            │                           │
├────────────────┼─────────────────────────────────────┼────────────────────┼───────────────────────────┼──────────────────────────────┼────────────────────────────┼───────────────────────────┤
│                │ Período activo, Empleados a         │ Stacked bar —      │ Período sin cerrar,       │ Iniciar Liquidación,         │                            │                           │
│ Nómina         │ liquidar, Total nómina, Novedades   │ conceptos nómina   │ Novedades pendientes      │ Registrar Novedad, Ver       │ Períodos recientes         │ Estado liquidación        │
│                │                                     │                    │                           │ Desprendibles                │                            │                           │
├────────────────┼─────────────────────────────────────┼────────────────────┼───────────────────────────┼──────────────────────────────┼────────────────────────────┼───────────────────────────┤
│ Mesa de        │ Órdenes pendientes, En reparación,  │ Bar — órdenes por  │ Órdenes >7d sin atención, │                              │                            │ Tiempo promedio           │
│ Servicio       │ Terminadas hoy, Ticket promedio     │ estado             │  Repuestos pendientes     │ Nuevo Ticket, Asignar Orden  │ Últimas 5 órdenes          │ resolución                │
│                │ días                                │                    │                           │                              │                            │                           │
├────────────────┼─────────────────────────────────────┼────────────────────┼───────────────────────────┼──────────────────────────────┼────────────────────────────┼───────────────────────────┤
│ Notificaciones │ Enviadas hoy, Pendientes, Tasa      │ Área — volumen 7d  │ Canal desconectado, Lote  │ Nueva Plantilla, Enviar      │ Últimos 10 envíos          │ WhatsApp/Telegram/Email   │
│                │ entrega, Canales activos            │                    │ fallido                   │ Manual                       │                            │ status                    │
└────────────────┴─────────────────────────────────────┴────────────────────┴───────────────────────────┴──────────────────────────────┴────────────────────────────┴───────────────────────────┘

---
PARTE H — SISTEMA DE PERSONALIZACIÓN

3 niveles de personalización

Nivel 1 — Automático (sin configuración)
- Dashboard se adapta a módulos activos del tenant
- Se adapta al rol del usuario
- Oculta widgets de módulos desactivados

Nivel 2 — Semi-manual ( UI de toggle)
- Cada widget tiene menú ⋮: "Ocultar", "Anclar", "Reducir/Expandir"
- Toggle de widgets en configuración: lista de checkboxes
- Se guarda en user_widget_layouts

Nivel 3 — Avanzado (drag-and-drop + vistas)
- Drag-and-drop con @dnd-kit/core
- Vistas preconfiguradas: "General", "Financiero", "Operativo", "RRHH"
- Persistencia por usuario + tenant

Implementación progresiva

┌──────┬────────────────────────────────────────────────────────────────────┬───────────┐
│ Fase │                             Contenido                              │ Esfuerzo  │
├──────┼────────────────────────────────────────────────────────────────────┼───────────┤
│ F1   │ Widgets auto-adaptativos por módulo + rol. Layout fijo responsive. │ 3 semanas │
├──────┼────────────────────────────────────────────────────────────────────┼───────────┤
│ F2   │ Widgets con menú ocultar/anclar. Persistencia en DB.               │ 2 semanas │
├──────┼────────────────────────────────────────────────────────────────────┼───────────┤
│ F3   │ Drag-and-drop, vistas múltiples, selector de layout.               │ 3 semanas │
└──────┴────────────────────────────────────────────────────────────────────┴───────────┘

---
PARTE I — WIDGET DEFINITIONS COMPLETO

// resources/js/Widgets/widget-definitions.ts

export const widgetDefinitions: WidgetDefinition[] = [
  // ── Core (siempre visibles) ──
  {
    id: 'greeting',
    title: '',
    description: '',
    icon: Sun,
    accent: 'indigo',
    defaultPosition: { x: 0, y: 0 },
    defaultSize: 'full',
    requiredModules: [],
    requiredPermissions: [],
  },
  {
    id: 'alertas',
    title: 'Atención requerida',
    description: 'Elementos que requieren acción inmediata',
    icon: Zap,
    accent: 'amber',
    defaultPosition: { x: 0, y: 1 },
    defaultSize: 'full',
    requiredModules: [],
    requiredPermissions: [],
  },
  {
    id: 'kpi',
    title: 'Indicadores',
    description: 'KPIs principales del negocio',
    icon: TrendingUp,
    accent: 'indigo',
    defaultPosition: { x: 0, y: 2 },
    defaultSize: 'full',
    requiredModules: [],
    requiredPermissions: [],
  },
  {
    id: 'activity',
    title: 'Actividad',
    description: 'Actividad de la semana',
    icon: Activity,
    accent: 'indigo',
    defaultPosition: { x: 0, y: 4 },
    defaultSize: 'half',
    requiredModules: [],
    requiredPermissions: ['audit:view'],
  },
  {
    id: 'recent-activity',
    title: 'Actividad reciente',
    description: 'Últimos movimientos del sistema',
    icon: ScrollText,
    accent: 'sky',
    defaultPosition: { x: 0, y: 5 },
    defaultSize: 'half',
    requiredModules: [],
    requiredPermissions: ['audit:view'],
  },

  // ── Ventas ──
  {
    id: 'revenue-chart',
    title: 'Ingresos',
    description: 'Tendencia de ingresos',
    icon: TrendingUp,
    accent: 'emerald',
    defaultPosition: { x: 1, y: 4 },
    defaultSize: 'half',
    requiredModules: ['sales'],
    requiredPermissions: ['sales:view'],
  },
  {
    id: 'sales-kpi',
    title: 'Ventas',
    description: '',
    icon: ShoppingCart,
    accent: 'emerald',
    defaultPosition: { x: 0, y: 2 },
    defaultSize: 'quarter',
    requiredModules: ['sales'],
    requiredPermissions: ['sales:view'],
  },

  // ── Inventario ──
  {
    id: 'inventory-alerts',
    title: 'Alertas de inventario',
    icon: Package,
    accent: 'amber',
    defaultPosition: { x: 1, y: 1 },
    defaultSize: 'quarter',
    requiredModules: ['inventory'],
    requiredPermissions: ['inventory:view'],
  },

  // ── Caja ──
  {
    id: 'cash-status',
    title: 'Estado de cajas',
    icon: Wallet,
    accent: 'emerald',
    defaultPosition: { x: 2, y: 3 },
    defaultSize: 'quarter',
    requiredModules: ['cash'],
    requiredPermissions: ['cash:view'],
  },

  // ── Contabilidad ──
  {
    id: 'accounting-summary',
    title: 'Resumen contable',
    icon: Calculator,
    accent: 'violet',
    defaultPosition: { x: 3, y: 5 },
    defaultSize: 'half',
    requiredModules: ['accounting'],
    requiredPermissions: ['accounting:view'],
  },

  // ── Nómina ──
  {
    id: 'payroll-status',
    title: 'Estado de nómina',
    icon: IdCard,
    accent: 'sky',
    defaultPosition: { x: 3, y: 5 },
    defaultSize: 'third',
    requiredModules: ['payroll'],
    requiredPermissions: ['payroll:view'],
  },

  // ── Notificaciones ──
  {
    id: 'notifications',
    title: 'Notificaciones recientes',
    icon: Bell,
    accent: 'rose',
    defaultPosition: { x: 1, y: 5 },
    defaultSize: 'third',
    requiredModules: ['notifications'],
    requiredPermissions: ['notifications:view'],
  },
]

---
PARTE J — RECOMENDACIONES ESPECÍFICAS PARA EL STACK

Laravel + Inertia

1. Separar DashboardController en DashboardDataService: dedicar una clase de servicio que devuelva los datos por widget, no todo en un controlador monolítico. Cada widget debería poder obtener sus datos de forma independiente.
2. Caché por tenant: Los KPIs no cambian cada segundo. Usar Cache::remember("dashboard:{$tid}:kpi", 300, fn() => ...) con TTL de 5 minutos. Invalidar on-model-event.
3. Endpoint parcial: GET /dashboard/widgets/{widgetId} para carga lazy de widgets pesados (gráficos, actividad reciente).
4. Inertia partial reload: Usar router.reload({ only: ['revenueTrend'] }) cuando el usuario cambia el período del gráfico de ingresos.

React

5. Cada widget es un componente React independiente con su propio hook de datos. Cada widget puede hacer router.reload({ only: [...] }) independientemente.
6. Suspense boundaries: Envolver cada widget en <React.Suspense fallback={<WidgetSkeleton />}> para que los widgets rápidos aparezcan inmediatamente mientras los lentos cargan.
7. usetransition Para re-ordenar widgets sin bloquear el input del usuario.

Tailwind v4 + shadcn/ui

8. Unificar acentos: Eliminar los 3 mapeos paralelos (accentMap, taskAccentMap, qaColorMap). Crear un solo accentPalette en lib/accent.ts que los 3 sistemas consuman.
9. Usar variables CSS existentes: Los colores de chart (--chart-1 a --chart-5) ya existen en app.css. Los gráficos deberían usar estas variables en vez de #6366f1 hardcodeado.
10. Responsive breakpoints: Definir size-variants en WidgetShell: full = col-span-full, half = lg:col-span-2, third = lg:col-span-1 en grid de 4 columnas.
11. Animations: Usar las animaciones de tw-animate-css ya importadas. Añadir animate-in fade-in slide-in-from-bottom-4 en lugar de la clase CSS inline actual {visible ? ...}.

Rendimiento

12. Lazy mount de gráficos: Los gráficos recharts solo renderizan cuando son visibles (IntersectionObserver + react-lazy).
13. Debounce de resize: Si se implementa drag-and-drop, debounce el guardado de layout a 1s.
14. Compressed Inertia responses: Habilitar Inertia::lazy() para los datos de widgets pesados que no se necesitan en el primer paint.

---
PROPUESTA VISUAL — SaaS Premium Enterprise

Identidad visual del nuevo Dashboard

┌──────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│     Elemento     │                                                                           Concepto                                                                           │
├──────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Tono             │ Minimalista con acentos sutiles. Fondo limpio --background, cards con ring-1 ring-foreground/5 (sin borders pesados, estilo Linear)                          │
├──────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Tipografía       │ Geist Variable. Display text-3xl font-bold tracking-tight en KPIs. Cuerpo text-sm consistente. Labels text-xs uppercase tracking-wider text-muted-foreground │
├──────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Espaciado        │ Gap consistente gap-4 entre widgets. Padding interno p-5. Sin padding excesivo — denso pero respirado (estilo Stripe)                                        │
├──────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Cards            │ rounded-xl bg-card ring-1 ring-foreground/5 shadow-none hover:shadow-md transition-shadow. Sin border visible en reposo (estilo Notion)                      │
├──────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Color de acentos │ Solo en iconos, sparklines y hover states. El contenido es monocromático (estilo Vercel)                                                                     │
├──────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Indicadores      │ Dots de color para estados. bg-emerald-500 activo, bg-amber-500 pendiente, bg-rose-500 atención. Minimalistas                                                │
├──────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Sparklines       │ SVG inline 80×24px en cada KPI. Sutiles, con stroke-opacity-0.3 y fill gradiente de currentColor                                                             │
├──────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Gráficos         │ Fondo transparente, sin grid lines visibles (estilo Stripe). Solo el eje X con labels. Tooltips premium con blur                                             │
├──────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Animaciones      │ fade-in + slide-in-from-bottom-2 escalonado. CountUp en números. Sin bounce ni efectos llamativos                                                            │
├──────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Responsive       │ 4 cols desktop → 2 cols tablet → 1 col mobile. Widgets colapsan con prioridad                                                                                │
└──────────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

Comparativa antes/después

┌────────────────────────────┬───────────────────────────────────┬──────────────────────────────────┐
│         Dimensión          │              Actual               │            Propuesto             │
├────────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
│ Líneas código Dashboard    │ 875 monolítico                    │ ~50 orquestador + ~80 por widget │
├────────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
│ Tiempo a primera acción    │ ~3 segundos (scroll + navegación) │ <1 segundo (acciones en hero)    │
├────────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
│ KPIs con tendencia         │ 0/14                              │ 14/14 con sparkline + %          │
├────────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
│ Widgets adaptativos        │ No (fijo)                         │ Sí (por módulo + rol)            │
├────────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
│ Personalización            │ No                                │ 3 niveles (auto → toggle → dnd)  │
├────────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
│ Mapeos de color            │ 3 separados                       │ 1 unificado                      │
├────────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
│ Caché backend              │ No (queries cada request)         │ 5 min por tenant                 │
├────────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
│ Carga lazy de widgets      │ No (todo en 1 request)            │ Partial reload por widget        │
├────────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
│ SuperAdmin Dashboard       │ 5 StatCards                       │ Paridad con Dashboard tenant     │
├────────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
│ Integración notificaciones │ Ninguna                           │ Widget dedicado                  │
└────────────────────────────┴───────────────────────────────────┴──────────────────────────────────┘

---
Próximos pasos recomendados

Si deseas proceder con la implementación, sugiero este orden:

1. Fase 0 — Crear accentPalette unificado + WidgetShell + DashboardGrid básico
2. Fase 1 — Refactorizar Dashboard.tsx a widgets independientes (sin cambiar UI visible)
3. Fase 2 — Añadir sparklines + trends a KPIs + acciones rápidas prominentes
4. Fase 3 — Implementar adaptación por módulos + roles
5. Fase 4 — Sistema de personalización (toggle → dnd)

¿Deseas que comience con la implementación de alguna fase específica?

✻ Brewed for 12m 33s

❯ hazlo en orden desde la fase 0

  Thought for 22s

Perfecto. Voy a implementar la Fase 0 del nuevo sistema de Dashboard. Primero creo las tareas para seguimiento y luego implemento en orden.

Ahora empiezo la implementación. Primero, la paleta de acentos unificada.

● Write(resources\js\lib\accent.ts)
Wrote 186 lines to resources\js\lib\accent.ts
/**
 * Paleta de acentos unificada para todo el sistema.
 *
 * Reemplaza los 3 mapeos de color paralelos que existían antes:
 *   - accentMap (StatCard)
 *   - taskAccentMap (Dashboard — tareas pendientes)
 *   - qaColorMap  (Dashboard — accesos rápidos)
 *
 * Todos los componentes deben consumir de aquí. No crear nuevos mapeos.
 */
… +176 lines

● Write(resources\js\Widgets\types.ts)
Wrote 190 lines to resources\js\Widgets\types.ts
**
* Tipos TypeScript del sistema de widgets de Dashboard.
*
* Este archivo es la fuente de verdad para todas las interfaces
* que componen la arquitectura de widgets dinámicos.
*/

mport type { LucideIcon } from 'lucide-react'
mport type { AccentColor } from '@/lib/accent'
… +180 lines

● Write(resources\js\Widgets\WidgetShell.tsx)
Wrote 157 lines to resources\js\Widgets\WidgetShell.tsx
/**
 * WidgetShell — Wrapper universal para todos los widgets del Dashboard.
 *
 * Provee: header con icono + título + descripción, menú contextual ⋮,
 * línea de acento superior, animación de entrada, y padding consistente.
 *
 * Inspirado en Linear/Notion/Stripe — minimalista, sin bordes pesados.
 */

import { type ReactNode, useState, useRef, useEffect } from 'react'
… +148 lines

● Write(resources\js\Widgets\DashboardGrid.tsx)
Wrote 29 lines to resources\js\Widgets\DashboardGrid.tsx
/**
 * DashboardGrid — Grid responsivo para componer widgets.
 *
 * Desktop: 4 columnas
 * Tablet:  2 columnas
 * Móvil:   1 columna
 *
 * Preparado para integrar @dnd-kit/core en Fase 3.
 * Por ahora es un grid CSS estático con soporte para WidgetShell.
 */
… +19 lines

Upstream provider NIM returned HTTP 429.
Category: rate_limit_error
Mapped message: Provider rate limit reached. Please retry shortly.

Upstream error:
{"status":429,"title":"Too Many Requests"}

Request ID: req_8e5ccde28635

✻ Cooked for 2m 27s

❯ /skills
  ⎿  No changes

❯ que paso

Upstream provider NIM returned HTTP 429.
Category: rate_limit_error
Mapped message: Provider rate limit reached. Please retry shortly.

Upstream error:
{"status":429,"title":"Too Many Requests"}

Request ID: req_5f53d269e0ae

✻ Cooked for 35s

❯ termina

Upstream provider NIM returned HTTP 429.
Category: rate_limit_error
Mapped message: Provider rate limit reached. Please retry shortly.

Upstream error:
{"status":429,"title":"Too Many Requests"}

Request ID: req_5ade428b86b2

✻ Brewed for 34s

❯ /model
  ⎿  Set model to nvidia_nim/nvidia/nemotron-3-ultra-550b-a55b and saved as your default for new sessions

❯ termina

  Thought for 7s

  Thought for 1m 26s

● Write(resources\js\Widgets\WidgetRegistry.ts)
Wrote 82 lines to resources\js\Widgets\WidgetRegistry.ts
/**
 * WidgetRegistry — Catálogo central de widgets del Dashboard.
 *
 * Responsabilidades:
 * - Registrar todos los widgets disponibles con su componente + metadata
 * - Filtrar widgets visibles según módulos activos y permisos
 * - Ordenar widgets por posición por defecto
 *
 * En Fase 3 se integrará con user_widget_layouts para personalización.
 */
… +72 lines

  Thought for 50s

● Write(resources\js\Widgets\widget-definitions.ts)
Wrote 401 lines to resources\js\Widgets\widget-definitions.ts
/**
 * Definiciones de todos los widgets disponibles en el Dashboard.
 *
 * Cada widget define:
 * - ID único
 * - Metadatos visuales (título, icono, acento)
 * - Posición/tamaño por defecto en grid de 4 columnas
 * - Módulos requeridos para mostrarlo
 * - Permisos requeridos
 * - Rol mínimo (opcional)
… +391 lines

  Thought for 25s

● Write(resources\js\Widgets\index.ts)
Wrote 36 lines to resources\js\Widgets\index.ts
/**
 * Exportaciones públicas del sistema de Widgets.
 */

// Tipos
export * from './types'

// Componentes base
export { DashboardGrid } from './DashboardGrid'
export { WidgetShell } from './WidgetShell'
… +26 lines

Upstream provider NIM returned an error.
Category: internal_server_error
Mapped message: Provider API request failed.

Upstream error:
{"message":"ResourceExhausted: Worker local total request limit reached (112/32)","type":"internal_server_error","code":500}

Request ID: req_3a9e2cca4188    

✻ Churned for 2m 58s

  7 tasks (4 done, 1 in progress, 2 open)
  ◼ Crear WidgetRegistry y widget-definitions
  ◻ Migrar StatCard al sistema de acentos unificado
  ◻ Refactorizar Dashboard.tsx al nuevo sistema de widgets › blocked by #5, #6
  ✔ Crear paleta de acentos unificada (accent.ts)
  ✔ Crear tipos TypeScript del sistema de widgets
   … +2 completed

─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  ⏵⏵ accept edits on (shift+tab to cycle) · ctrl+t to hide tasks