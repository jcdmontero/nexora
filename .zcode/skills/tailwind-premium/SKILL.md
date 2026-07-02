---
name: tailwind-premium
description: UI moderna, responsiva y de alto rendimiento con Tailwind CSS v4 + Shadcn/ui (reemplaza al legacy bootstrap-premium).
---

## Buenas prácticas
- Enfoque "Mobile First": diseñar desde < 375px hacia monitores > 1440px.
- Usar los tokens del tema (variables CSS de Tailwind v4, `bg-primary`, `text-muted-foreground`); nunca colores hardcodeados.
- Componer con utilidades de Tailwind; extraer componentes reutilizables en `resources/js/Components/` antes de duplicar markup.
- Usar Flexbox y CSS Grid para layouts; navegación accesible por teclado y ARIA.
- Aprovechar `tailwind-merge` y `class-variance-authority` (cva) para variantes de componentes.

## Restricciones
- NUNCA usar Bootstrap ni clases de Bootstrap (este proyecto usa Tailwind v4 + Shadcn).
- NUNCA usar estilos inline salvo valores calculados en runtime.
- Evitar `!important`.

## Ejemplos de uso
- "Haz responsive esta página usando el grid de Tailwind y tokens del tema."
- "Crea una variante de botón con cva siguiendo el design system."

## Errores comunes a evitar
- Cortar texto largo sin `truncate` o sin `min-w-0` en contenedores flex.
- Provocar scroll horizontal no deseado en móvil.
