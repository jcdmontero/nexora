---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality (React 19 + Tailwind v4 + Shadcn/ui).
---

Create distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices. Stack: Inertia + React 19 + Tailwind CSS v4 + Shadcn/ui (TypeScript estricto).

## Design Thinking
Before coding, commit to a clear aesthetic direction aligned with a premium SaaS (Notion/Linear/Stripe):
- **Purpose**: What problem does this screen solve? Who uses it?
- **Tone**: Refined, calm, information-dense but breathable. Avoid visual noise.
- **Constraints**: Tailwind v4 tokens, Shadcn components, accessibility (WCAG AA), responsive from < 375px to > 1440px.
- **Differentiation**: Thoughtful spacing, hierarchy and micro-interactions over decoration.

## Aesthetics Guidelines
- **Typography**: Use the project font stack (Geist) with deliberate scale and weight; avoid generic defaults.
- **Color & Theme**: Use CSS variables / Tailwind tokens (`bg-primary`, `text-muted-foreground`), never hardcoded hex.
- **Motion**: CSS-first transitions and micro-interactions; subtle, never distracting.
- **Spatial Composition**: Clear grids, intentional whitespace, consistent radius and elevation.
- **States**: Always design empty, loading (skeleton), error and success states.

## Restrictions
- NEVER hardcode colors or spacing; use the design tokens.
- NEVER ship `any` types or implicit typing.
- NEVER duplicate a component that already exists in `resources/js/Components/ui/`.

## Convenciones Nexora (OBLIGATORIAS)
- **Idioma**: toda la UI en español. Nunca mostrar códigos técnicos en inglés; traducir permisos con `@/lib/permissions` (`permissionLabel`, `groupLabel`, `groupPermissions`).
- **Tablas**: usar SIEMPRE `@/Components/ui/data-table` (`DataTable`) — tabla en escritorio, tarjetas apiladas en móvil. Prohibido `<Table>` plano sin adaptación móvil.
- **Estados**: `@/Components/ui/empty-state` (EmptyState) para vacíos; `@/Components/ui/skeleton` para carga; `useToast()` para feedback (se alimenta de `flash.success`/`flash.error`).
- **Autorización en UI**: ocultar acciones con el hook `@/Hooks/usePermissions` (`can`, `canAny`). SuperAdmin → siempre true.
- **Tema**: `@/Hooks/useTheme` (claro/oscuro, default claro, persistido).

## Trampas de Inertia/Ziggy (NO repetir)
- `usePage().url` está en la raíz, NO en `.props` (las props compartidas sí: `usePage().props.x`).
- Cualquier provider que use `usePage()` va DENTRO de `<App>` (render-prop en `app.jsx`), nunca por fuera.
- Deferred props (`Inertia::defer`) llegan `undefined` en el primer render → tratar `== null` como "cargando".
- Filtrar links a rutas que pueden no existir con `route().has(name)` (ej. menús de módulos no instalados).
