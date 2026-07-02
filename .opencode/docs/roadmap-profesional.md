# NEXORA — Roadmap Profesional y Buenas Prácticas

## Filosofía Principal

> **"Diseña primero la arquitectura del producto y el Design System completo antes de construir módulos."**

La mayoría de ERP se vuelven difíciles de mantener porque empiezan creando pantallas y formularios. Los productos más sólidos empiezan definiendo el **Core, los permisos, los módulos y los componentes reutilizables** que usarán todas las pantallas.

---

## PWA (Progressive Web App)

### ¿Qué es una PWA?

Es una aplicación web que puede:
- Instalarse en celular
- Instalarse en Windows
- Funcionar como una aplicación nativa
- Tener icono propio
- Abrirse en pantalla completa
- Guardar información localmente
- Funcionar parcialmente sin Internet

Para el usuario se siente casi como una app nativa, sin necesidad de publicar en tiendas.

### ¿Vale la pena para NEXORA?

**Sí**, porque muchos usuarios empresariales trabajan desde:
- Bodegas
- Talleres
- Almacenes
- Sitios con internet inestable

Una PWA ayuda muchísimo en estos escenarios.

### Dos Niveles de PWA

#### Nivel 1 — PWA Básica (Recomendado para V1)
- Permite instalar la aplicación
- Cachea recursos estáticos
- Abre rápido
- Experiencia tipo app nativa
- **Relativamente sencilla de implementar**

#### Nivel 2 — Offline Real (Avanzado, para V2+)
Ejemplo:
```
Crear factura → Sin internet → Guardar localmente → Sincronizar después
Crear OT → Sin conexión → Sincronizar cuando vuelva internet
```

**Esto es mucho más complejo.** No empezar por aquí.

---

## 10 Prioridades ANTES de PWA

### 1. Design System Completo

**Problema:** Diseñar pantalla por pantalla genera inconsistencias.

**Solución:** Crear componentes base y reutilizarlos:

```
Design System/
├── Button (variantes: primary, secondary, ghost, destructive)
├── Input (text, email, password, number, search)
├── Table (con paginación, ordenamiento, filtros)
├── Modal (drawer mobile, dialog desktop)
├── Card (con header, footer, loading states)
├── Badge (status, count, variant colors)
├── Alert (info, success, warning, error)
└── Form (validación, estados, mensajes)
```

**Impacto:** Cambia completamente la calidad del producto. Velocidad de desarrollo 3x más rápida después del setup inicial.

---

### 2. Sistema de Permisos desde el Día 1

**Muchos ERP fallan aquí.**

Diseñar desde el núcleo:
- **Usuario** → Persona que accede al sistema
- **Rol** → Conjunto de permisos (Admin, Vendedor, Técnico)
- **Permiso** → Acción específica (ventas:crear, usuarios:editar)
- **Módulo** → Agrupación de funcionalidad

Estructura de permisos:
```
módulo:acción

Ejemplos:
- ventas:ver
- ventas:crear
- ventas:editar
- ventas:eliminar
- usuarios:gestionar
- reportes:exportar
```

**Implementado:** ✅ Ya tenemos `spatie/laravel-permission` + multi-tenant

---

### 3. Auditoría Global

Todo cambio importante debe registrarse:

| Campo | Descripción |
|---|---|
| **Quién** | Usuario que realizó la acción |
| **Qué hizo** | Descripción de la acción |
| **Cuándo** | Timestamp |
| **Desde dónde** | IP, dispositivo |
| **Recurso** | Modelo afectado (User, Order, Invoice) |
| **Antes** | Valores anteriores (JSON) |
| **Después** | Valores nuevos (JSON) |

**Transmite nivel empresarial** y es crítico para compliance.

Ejemplo de uso:
```
[2026-06-19 14:30] Juan Pérez actualizó Orden #1234
  Estado: "Pendiente" → "Completado"
  IP: 192.168.1.50 | Navegador: Chrome 126
```

---

### 4. Sistema de Notificaciones

Diseñar desde el principio, no dejarlo para después.

Tipos de notificaciones:
- **Push** → Navegador/PWA
- **Email** → Críticas o resumen diario
- **In-app** → Badge + panel de notificaciones
- **WhatsApp** → Opcional, para clientes

Ejemplos empresariales:
```
✓ Nueva orden asignada
✓ Orden completada
✓ Cliente nuevo registrado
✓ Pago recibido
✓ Stock bajo (alerta)
✓ Backup completado
```

---

### 5. Estados Vacíos Profesionales

**Mal:**
```
No records found
```

**Bien:**
```
┌─────────────────────────────────┐
│   [Icono ilustrativo]           │
│                                 │
│   Aún no tienes clientes        │
│   registrados                   │
│                                 │
│   Los clientes te ayudarán a    │
│   gestionar tu negocio.         │
│                                 │
│   [+ Crear mi primer cliente]   │
└─────────────────────────────────┘
```

**Impacto visual:** Enorme. Diferencia un sistema amateur de uno profesional.

Principios:
- Icono/ilustración contextual
- Texto descriptivo y amigable
- Call-to-action claro
- Explicar el valor de la funcionalidad

---

### 6. Skeleton Loading

**En lugar de:**
```
Cargando...
```

**Usar esqueletos visuales:**
```
┌─────────────────────────────────┐
│ ▂▂▂▂▂▂▂▂▂  ▂▂▂▂▂               │ ← shimmer animation
│ ▂▂▂▂▂▂     ▂▂▂▂▂▂▂             │
│ ▂▂▂▂▂      ▂▂▂▂▂▂▂▂            │
└─────────────────────────────────┘
```

**Referencias:** Linear, Notion, GitHub, Stripe.

Hace que el sistema se vea mucho más premium y reduce la **percepción de lentitud**.

---

### 7. Búsqueda Global

Una de las características **más valoradas** en productos SaaS.

**UX ideal:**
```
Usuario presiona: Cmd + K (Mac) o Ctrl + K (Windows)
↓
Modal aparece
↓
Escribe: "Juan"
↓
Resultados en tiempo real:
  👤 Juan Pérez (Cliente)
  📦 Orden #1234 - Juan Martínez
  📄 Factura #5678 - Juan López
```

Buscar en:
- Clientes
- Productos
- Órdenes
- Facturas
- Usuarios
- Documentos

**Implementación:** Algolia, Meilisearch o Laravel Scout.

---

### 8. Atajos de Teclado

Muy profesional y mejora productividad.

| Atajo | Acción |
|---|---|
| `Ctrl + K` / `Cmd + K` | Búsqueda global |
| `Ctrl + N` / `Cmd + N` | Nuevo registro |
| `Ctrl + S` / `Cmd + S` | Guardar |
| `Esc` | Cerrar modal |
| `?` | Ver atajos disponibles |
| `G → D` | Ir a Dashboard |
| `G → U` | Ir a Usuarios |

**Mostrar en tooltip** al hacer hover sobre botones.

---

### 9. Sistema de Temas

Aunque uses azul corporativo inicialmente, diseñar desde el día 1 para soportar:

- **Tema claro** (default)
- **Tema oscuro** (profesional, reduce fatiga visual)

Usar **CSS variables** y tokens de color:
```css
--background
--foreground
--primary
--secondary
--accent
--muted
--destructive
--border
```

**Tailwind v4** ya lo soporta perfectamente con `dark:` prefix.

Aunque actives solo uno inicialmente, tener la arquitectura lista permite agregarlo en días, no semanas.

---

### 10. API First Architecture

**Esta es enorme.**

Diseñar pensando en múltiples consumidores desde el día 1:

```
NEXORA API (Laravel)
    ↓
├── Web (Inertia + React)
├── Móvil (React Native / Flutter)
├── PWA (Progressive Web App)
├── Integraciones (Webhooks)
├── WhatsApp Bot
└── API Pública (para clientes)
```

**Principios:**
- Controladores devuelven JSON
- Inertia consume la misma API
- Autenticación con Sanctum (token-based)
- Versionado desde el inicio (`/api/v1/`)
- Documentación automática con Scribe o OpenAPI

**Beneficio:** Construir app móvil en el futuro es trivial.

---

## Orden de Fases Recomendado

### Fase 1 — Arquitectura Base ✅
- Core (Tenant, User, Module)
- Sistema de permisos (Spatie)
- Middleware multi-tenant
- Migraciones base

**Estado:** Completado.

---

### Fase 2 — Design System 🚧
- Componentes Shadcn/ui base
- Sidebar premium
- Layout responsive
- Estados de carga (skeleton)
- Estados vacíos
- Sistema de toasts

**Estado:** En progreso (50%).

---

### Fase 3 — Primer Módulo Real
Opciones:
- **CRM** (Leads, Clientes, Oportunidades)
- **Service Desk** (Órdenes de trabajo, garantías)
- **Sales** (Facturación, POS)

**Recomendación:** Empezar con el módulo más crítico para el negocio.

---

### Fase 4 — Responsive Completo
- Todas las pantallas validadas en mobile/tablet/desktop
- Tablas adaptativas (cards en mobile)
- Formularios touch-friendly
- Navegación optimizada

**Estándar:** Ya documentado en `coding-standards.md`.

---

### Fase 5 — PWA Instalable
- `manifest.json`
- Service Worker básico
- Cache de recursos estáticos
- Icono de aplicación
- Splash screen

**Complejidad:** Media. 1-2 semanas.

---

### Fase 6 — Offline Avanzado (Opcional)
- IndexedDB para datos locales
- Cola de sincronización
- Conflictos de merge
- Indicadores de conexión

**Complejidad:** Alta. Solo si realmente aporta valor al negocio.

---

## Métricas de Calidad

Antes de dar por terminada cualquier funcionalidad:

### Checklist de Calidad

#### Diseño
- [ ] Usa componentes del Design System
- [ ] No tiene colores hardcodeados
- [ ] Sigue la guía de diseño premium
- [ ] Se ve profesional en mobile
- [ ] Se ve profesional en desktop
- [ ] Tiene estados de carga (skeleton)
- [ ] Tiene estado vacío elegante

#### Funcionalidad
- [ ] Respeta permisos del usuario
- [ ] Valida datos en frontend y backend
- [ ] Maneja errores gracefully
- [ ] Tiene auditoría de cambios críticos
- [ ] Funciona sin JavaScript (progressive enhancement)

#### Performance
- [ ] Carga en < 3 segundos
- [ ] No tiene renderizados innecesarios
- [ ] Usa lazy loading cuando aplica
- [ ] Imágenes optimizadas

#### Accesibilidad
- [ ] Focus visible
- [ ] Contraste adecuado
- [ ] Labels en formularios
- [ ] Navegable por teclado
- [ ] Screen reader friendly

#### Código
- [ ] Sin duplicación (DRY)
- [ ] TypeScript estricto (sin `any`)
- [ ] Componentes reutilizables
- [ ] Lógica en servicios, no en controladores
- [ ] Tests básicos (al menos happy path)

---

## Referencias de Productos Premium

Estudiar y replicar patrones de:

| Producto | Qué copiar |
|---|---|
| **Linear** | Sidebar, comandos de teclado, animaciones, estados vacíos |
| **Notion** | Editor, bloques, drag & drop, jerarquía visual |
| **Stripe** | Dashboard, tablas, filtros, diseño minimalista |
| **Vercel** | Deploys, logs en tiempo real, UX de CLI |
| **Clerk** | Auth flows, onboarding, settings |
| **GitHub** | Navegación, search, labels, estados |

---

## Regla de Oro

**"Si no lo harías en una app que vas a vender a Microsoft, no lo hagas en NEXORA."**

Pensar siempre:
- ¿Se ve profesional?
- ¿Es reutilizable?
- ¿Es mantenible en 3 años?
- ¿Escala a 10,000 usuarios?

Si la respuesta es no, rediseñar antes de implementar.

---

**Documento actualizado:** 2026-06-19  
**Versión:** 1.0
