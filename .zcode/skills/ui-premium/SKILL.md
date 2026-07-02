---
name: ui-premium
description: Interfaces premium con React 19 + Tailwind v4 + Shadcn/ui, estilo Notion/Linear/Stripe, totalmente responsive.
---

## Especialidad
UI con acabado premium en el stack de Nexora (Inertia + React 19 + Tailwind CSS v4 + Shadcn/ui), con micro-interacciones, accesibilidad y diseño responsive.

## Buenas prácticas
- Reutilizar componentes de `resources/js/Components/ui/` (Shadcn) antes de crear nuevos.
- Usar tokens del tema (variables CSS / clases Tailwind como `bg-primary`), nunca colores hardcodeados.
- Transiciones suaves (0.2s–0.3s ease); estados hover, focus-ring y loading.
- Skeleton loading y estados vacíos elegantes en listas/tablas.
- Tablas con filtros, búsqueda, orden y paginación responsive; en móvil transformar filas en tarjetas (no solo scroll horizontal).
- Áreas táctiles mínimas de 44×44px en móvil.

## Restricciones
- NUNCA sacrificar accesibilidad (WCAG AA/AAA) por estética.
- NUNCA usar `any` ni tipado implícito (TypeScript estricto).
- NUNCA usar animaciones con parpadeos rápidos.

## Ejemplos de uso
- "Rediseña este modal con Shadcn y animación de entrada premium."
- "Convierte esta tabla en una experiencia responsive con tarjetas en móvil."

## Errores comunes a evitar
- Duplicar componentes que ya existen en `Components/ui/`.
- Romper el layout en pantallas < 375px.
