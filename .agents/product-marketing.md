# Product Marketing Context

*Last updated: 2026-06-23*

## Product Overview
**One-liner:**
NEXORA es una plataforma ERP modular SaaS 100% gestionada que ofrece una solución de negocio "llave en mano" con diseño premium para empresas que buscan centralizar su operación sin lidiar con la complejidad técnica del software autoservicio.

**What it does:**
NEXORA proporciona módulos pre-construidos y listos para usar (CRM, Inventario, Compras, Ventas, Contabilidad, Nómina y Recursos Humanos) que son activados y configurados a la medida de cada empresa por nuestro equipo técnico. Toda la interfaz es ultra-rápida, responsive y con estética premium moderna (estilo Stripe/Linear).

**Product category:**
Plataforma ERP Modular, Software de Gestión Empresarial Gestionado.

**Product type:**
Managed Modular B2B SaaS (Multi-tenant).

**Business model:**
Suscripción mensual/anual basada en las capacidades y módulos habilitados en la empresa (sin autogestión de planes ni botones de compra por el usuario final).

---

## Target Audience
**Target companies:**
Pequeñas y medianas empresas (PyMEs) en crecimiento que han superado las hojas de cálculo o sistemas heredados, pero no quieren asumir los costos o complejidad de desarrollar software a medida o contratar consultores para configurar ERPs complejos.

**Decision-makers:**
- Dueños de Negocios y CEOs (Director General)
- Contadores y Directores Financieros (CFO)
- Gerentes de Operaciones / Compras / Ventas

**Primary use case:**
Eliminar la fragmentación operativa integrando inventario, clientes, ventas y contabilidad en un único espacio de trabajo moderno y auditado.

**Jobs to be done:**
- Centralizar la operación comercial y financiera sin necesidad de un equipo de tecnología interno.
- Mantener un registro histórico exacto y auditable de todos los movimientos de inventario y transacciones.
- Monitorear la salud del negocio desde cualquier dispositivo con una interfaz rápida y móvil-friendly.

**Use cases:**
- Empresas de distribución que necesitan conectar compras, almacenamiento (Kardex) y CRM/Ventas.
- Empresas que requieren cumplir con normativas contables y de auditoría interna de manera simple.

---

## Personas
| Persona | Cares about | Challenge | Value we promise |
|---------|-------------|-----------|------------------|
| **Dueño de Empresa / CEO** | Crecimiento, control de costos, visión general del negocio en tiempo real. | Sistemas desconectados, dependencias de personal técnico, interfaces difíciles de usar. | Una solución llave en mano, sin fricción técnica, accesible desde el móvil para tomar decisiones rápidas. |
| **Contador / CFO** | Cumplimiento fiscal (DIAN/NIIF), precisión en reportes, trazabilidad de datos. | Falta de control en cambios del sistema, errores manuales de digitación, exportaciones en Excel inconsistentes. | Trazabilidad total mediante un sistema de logs de auditoría automática (Auditable Core) y base de datos relacional robusta. |
| **Gerente de Operaciones / Inventario** | Rotación de stock, compras a proveedores oportunas, control de entradas y salidas. | Descuadres en almacén, compras manuales ineficientes, falta de historial (Kardex) claro. | Control de inventario completo con registro de Kardex automático, gestión de lotes y alertas de existencias. |

---

## Problems & Pain Points
**Core problem:**
Las empresas quedan atrapadas entre dos extremos ineficientes: ERPs autoservicio globales (como Odoo o Zoho) que requieren meses de configuración difícil y consultores costosos, o sistemas heredados antiguos (como Siigo local o Helisa) que son visualmente obsoletos, no funcionan en móviles y generan silos de datos.

**Why alternatives fall short:**
- **Autoservicio confuso:** El cliente tiene que adivinar cómo configurar la contabilidad o los impuestos, retrasando la puesta en marcha.
- **Interfaces obsoletas:** Diseño tipo Windows XP de los 90s, nulo soporte responsive y lentitud extrema en dispositivos móviles.
- **Venta invasiva de complementos:** Constantemente interrumpen al usuario con botones de "Comprar/Mejorar plan", degradando la experiencia operativa.

**What it costs them:**
Fugas de dinero por descuadres en stock, horas perdidas en digitación manual repetitiva, frustración de los empleados usando herramientas lentas, y retraso en reportes fiscales.

**Emotional tension:**
Estrés por posibles sanciones fiscales, miedo a perder información crítica de clientes, y cansancio mental ante sistemas lentos y no intuitivos.

---

## Competitive Landscape
**Direct:** ERPs locales tradicionales (Siigo, Helisa, Loggro) — se quedan cortos por sus interfaces obsoletas, complejidad de uso diario y nula adaptación responsive premium.
**Secondary:** Plataformas internacionales configurables (Odoo, Zoho) — se quedan cortos porque trasladan todo el peso de la configuración y soporte técnico especializado al cliente final.
**Indirect:** Hojas de cálculo compartidas (Excel/Google Sheets) o desarrollo de software a la medida — las plantillas de Excel fallan al escalar y el desarrollo propio es sumamente costoso, inestable y lento de mantener.

---

## Differentiation
**Key differentiators:**
- **Modelo 100% Gestionado:** No hay pantallas de configuración técnica para la empresa. Nosotros entregamos el producto terminado y configurado listo para operar.
- **Diseño Premium e Intuitivo:** Interfaz moderna inspirada en Stripe/Linear, rápida, minimalista y adaptada a móvil (las tablas se transforman en tarjetas interactivas táctiles).
- **Core Altamente Auditable:** Cada inserción, actualización o eliminación en la plataforma se registra automáticamente en un log de auditoría inmutable indicando quién, cuándo y qué cambió.

**How we do it differently:**
Eliminamos la sección de "Suscripciones e Instalación de Módulos" del cliente. Tratamos al ERP como un traje a la medida activado remotamente desde el Portal SuperAdmin de NEXORA.

**Why that's better:**
Tiempo de adopción de días en vez de meses, satisfacción total de los empleados que usan el sistema, y la tranquilidad de tener un soporte de ingeniería que administra la infraestructura.

**Why customers choose us:**
"NEXORA funciona tal como lo necesitamos desde el primer día, se ve increíblemente bien en el celular y no tuvimos que configurar nada nosotros mismos".

---

## Objections
| Objection | Response |
|-----------|----------|
| **¿Por qué no puedo activar o comprar módulos yo mismo desde el sistema?** | Operamos bajo un modelo gestionado donde nuestro equipo de ingeniería asegura que las dependencias entre módulos (ej. Ventas e Inventario) estén correctamente validadas y sembradas antes de habilitarlas, garantizando estabilidad total sin errores de runtime. |
| **¿Qué tan seguro es el aislamiento de mis datos frente a otras empresas?** | Usamos una base de datos PostgreSQL robusta con arquitectura multi-tenant y scopes estrictos respaldados por Spatie Teams a nivel de consulta. La información de tu empresa está aislada y vigilada por auditoría automática. |

**Anti-persona:**
Startups o microempresas tecnológicas en etapa muy temprana que buscan un software self-service hiper-barato de 10 dólares al mes y quieren configurar e integrar todo ellos mismos de forma manual.

---

## Switching Dynamics
**Push:** Lentitud de sus sistemas antiguos, frustración del equipo con herramientas visualmente feas, y errores constantes por falta de trazabilidad en las acciones de los usuarios.
**Pull:** Una interfaz limpia, moderna, consistente y rápida que funciona igual de bien en un PC de escritorio que en una tableta en almacén o un celular en la calle.
**Habit:** "Nuestros empleados ya saben de memoria los códigos rápidos de teclado de nuestro sistema de hace 15 años en pantalla negra".
**Anxiety:** "¿Perderé mis saldos iniciales o historial de clientes al migrar a NEXORA? ¿Cuánto tiempo estará paralizada mi empresa durante la transición?"

---

## Customer Language
**How they describe the problem:**
- "El software contable que tenemos parece del siglo pasado y nadie lo entiende".
- "Siempre hay descuadres entre lo que dice el vendedor y lo que realmente hay en la bodega".
- "Necesito ver el reporte de ventas desde mi celular pero el sistema actual solo abre en el computador de la oficina".

**How they describe us:**
- "Es como usar una aplicación moderna de hoy en día, muy limpia y rápida".
- "Nos configuraron todo y solo tuvimos que entrar a trabajar".

**Words to use:**
- Capacidades Habilitadas (evitar decir "Módulos Contratados")
- Solución Llave en Mano / Gestionada
- Trazabilidad y Auditoría
- Diseño Premium / Adaptado a Dispositivos

**Words to avoid:**
- Autoservicio
- Configuración manual
- Activar módulo / Comprar plan
- Enlace de Pago / Upgrade de plan

**Glossary:**
| Term | Meaning |
|------|---------|
| **Capacidades Habilitadas** | Módulos de negocio activados específicamente para un tenant por el SuperAdmin. |
| **Kardex** | Registro histórico del movimiento de mercancías (entradas, salidas y saldos). |
| **Tenant** | Instancia de base de datos lógica y aislada asignada a cada empresa cliente. |

---

## Brand Voice
**Tone:** Profesional, confiable, moderno y transparente.
**Style:** Claro, directo, libre de tecnicismos complejos para el usuario final, y enfocado en la simplicidad operativa.
**Personality:** Premium, robusto, sofisticado e impecable.

---

## Proof Points
**Metrics:**
- Puesta en marcha en menos de 48 horas (gracias al modelo modular pre-configurado).
- Cero fallas críticas de runtime causadas por mala configuración del cliente.
- Adaptabilidad móvil del 100% en todas las pantallas del ERP.

**Value themes:**
| Theme | Proof |
|-------|-------|
| **Cero Esfuerzo de Configuración** | Todo el aprovisionamiento de base de datos, asignación de roles iniciales y activación de dependencias de módulos lo realiza el servicio automatizado de aprovisionamiento de NEXORA. |
| **Control Incorruptible** | El trait `Auditable` a nivel de base de datos captura automáticamente los cambios en modelos registrando IP, User Agent, valores anteriores y nuevos en milisegundos. |

---

## Goals
**Business goal:**
Habilitar a medianas empresas para operar de forma eficiente y hermosa.

**Conversion action:**
Solicitar demostración personalizada o cotización de capacidades adicionales con un asesor NEXORA.
