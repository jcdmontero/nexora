# ESTÁNDARES OBLIGATORIOS DE ARQUITECTURA Y CALIDAD DE CÓDIGO

## Objetivo

Todo el desarrollo debe priorizar: Mantenibilidad, Escalabilidad, Reutilización, Legibilidad, Bajo acoplamiento, Alta cohesión.

La velocidad de desarrollo nunca debe estar por encima de la calidad arquitectónica.

---

## Principio DRY (Don't Repeat Yourself)

Prohibido duplicar lógica. Si una funcionalidad se utiliza más de una vez:
- Crear función reutilizable, helper, hook, servicio o componente compartido.
- No copiar y pegar código.

---

## Separación de Responsabilidades

**Frontend:** Separar Componentes, Hooks, Servicios, Utilidades, Tipos, Constantes. Un componente no debe contener lógica de negocio compleja.

**Backend:** Separar Controladores, Servicios, Repositorios, Validadores, Modelos, Permisos. Controladores delgados, lógica en servicios.

---

## Prohibido Código Monolítico

Evitar archivos gigantes. Si un archivo crece demasiado, dividir responsabilidades. Ningún archivo debe ser un "archivo Dios".

---

## Reutilización de Componentes

Antes de crear cualquier componente nuevo, verificar si ya existe uno similar (botones, tarjetas, tablas, formularios, inputs, modales, alertas). No duplicar interfaces.

---

## Gestión de Estilos

**Prohibido:** CSS inline innecesario, estilos repetidos, colores hardcodeados, espaciados hardcodeados.

**Usar:** Design System, tokens de diseño, variables globales, tema centralizado.

---

## Gestión de Colores

Todos los colores deben provenir del Theme, Tailwind Config o variables globales. Nunca escribir colores directamente.

**Incorrecto:** `background: #2563EB`
**Correcto:** `bg-primary`

---

## Gestión de Tipografía

Centralizar tamaños, pesos, espaciados y jerarquías. No definir estilos tipográficos manualmente en cada pantalla.

---

## Componentes Inteligentes y Presentacionales

- **Presentacionales:** Solo renderizan.
- **Inteligentes:** Gestionan lógica.

No mezclar ambas responsabilidades innecesariamente.

---

## Hooks Reutilizables

Si una lógica aparece varias veces, crear hooks reutilizables. Ej: `useAuth`, `usePermissions`, `usePagination`, `useFilters`, `useDebounce`.

---

## Servicios Reutilizables

Centralizar llamadas a API. No tener fetch/axios dispersos en múltiples componentes. Ej: `authService`, `userService`, `companyService`.

---

## Tipado Estricto

Usar TypeScript estricto. Evitar `any`, tipado implícito, datos sin validar. Todos los contratos deben estar tipados.

---

## Rendimiento

Evitar renderizados innecesarios, consultas repetidas, componentes duplicados. Priorizar memoización, lazy loading, componentes reutilizables.

---

## Validación Antes de Entregar

Antes de finalizar cualquier tarea:
1. Buscar duplicación de código.
2. Buscar componentes reutilizables existentes.
3. Buscar lógica repetida.
4. Buscar estilos repetidos.
5. Buscar colores hardcodeados.
6. Buscar archivos excesivamente grandes.
7. Buscar funciones que puedan abstraerse.

Si se detectan oportunidades de reutilización, refactorizar antes de dar por terminada la tarea.

---

## Regla Principal

Siempre elegir la solución **más limpia, más mantenible, más reutilizable, más escalable**, aunque requiera más trabajo inicial. El objetivo es construir una plataforma empresarial preparada para crecer durante años sin degradar su calidad arquitectónica.

---

## ESTÁNDAR OBLIGATORIO DE RESPONSIVE Y EXPERIENCIA MULTIDISPOSITIVO

### Objetivo

Toda la plataforma debe ofrecer una experiencia Premium en:
- **Escritorio**
- **Laptop**
- **Tablet**
- **Teléfono móvil**

No se aceptan adaptaciones básicas o de último momento. Cada pantalla debe diseñarse considerando todos los dispositivos desde el inicio.

### Filosofía Responsive

Diseñar cada componente bajo el principio:

**"Mobile Friendly + Tablet Friendly + Desktop Premium"**

- No limitarse a que "quepa en pantalla".
- Debe verse profesional en todos los tamaños.

### Breakpoints

Validar obligatoriamente:
- Móvil pequeño (< 375px)
- Móvil estándar (375px - 640px)
- Tablet vertical (640px - 768px)
- Tablet horizontal (768px - 1024px)
- Laptop (1024px - 1440px)
- Monitor grande (> 1440px)

### Navegación

**Desktop:**
- Sidebar expandido
- Menús completos

**Tablet:**
- Sidebar colapsable

**Móvil:**
- Drawer moderno
- Menú optimizado para dedo
- Navegación simplificada

### Formularios

**En escritorio:**
- Múltiples columnas cuando sea apropiado

**En móvil:**
- Una sola columna
- Campos cómodos para tocar
- Botones de ancho adecuado
- Nunca mostrar formularios comprimidos

### Dashboard

Los KPIs deben reorganizarse automáticamente:

**Desktop:** Varias tarjetas por fila  
**Tablet:** Menos columnas  
**Móvil:** Tarjetas apiladas

Manteniendo siempre la jerarquía visual.

### Tablas Empresariales

Las tablas deben tener comportamiento adaptativo. **Está prohibido simplemente agregar scroll horizontal como única solución.**

Cuando el espacio sea insuficiente:

**Opción 1:** Transformar filas en tarjetas móviles.

```
Cliente: Juan Pérez
Teléfono: 3001234567
Estado: Activo
Acciones: [Editar] [Ver]
```

**Opción 2:** Ocultar columnas secundarias y mostrar detalles al expandir.

**Opción 3:** Drawer o panel lateral con información completa.

### Acciones

**En móvil:**
- Botones más grandes
- Área táctil adecuada (mínimo 44x44px)
- Separación suficiente entre acciones
- Evitar iconos diminutos

### Modales

**En móvil:**
- Pantalla completa o casi completa
- Evitar modales pequeños centrados

### Tablas Premium

Buscar una experiencia similar a productos SaaS modernos. Las tablas deben incluir:
- Filtros
- Búsquedas
- Ordenamiento
- Estados vacíos elegantes
- Skeleton loading
- Paginación responsive

### Calidad Visual

La experiencia móvil debe sentirse diseñada específicamente para móvil. No debe parecer una versión comprimida del escritorio.

### Validación Obligatoria

Antes de finalizar cualquier pantalla:
1. ✅ Verificar Desktop
2. ✅ Verificar Tablet
3. ✅ Verificar Móvil
4. ✅ Verificar orientación vertical
5. ✅ Verificar orientación horizontal
6. ✅ Verificar accesibilidad táctil
7. ✅ Verificar tablas
8. ✅ Verificar formularios

**No considerar terminada ninguna funcionalidad sin validar todos los dispositivos.**

La calidad visual en móvil debe ser equivalente a la calidad visual en escritorio.
