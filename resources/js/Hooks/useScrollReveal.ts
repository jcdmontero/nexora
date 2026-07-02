import { useEffect, useRef, useState } from 'react'

interface ScrollRevealOptions {
  /** Umbral de visibilidad para disparar la animación (0-1). */
  threshold?: number
  /** Margen raíz para disparar antes/después de entrar en viewport. */
  rootMargin?: string
  /** Si la animación se reproduce una sola vez (default true). */
  once?: boolean
}

/**
 * Revela un elemento al entrar en viewport (animación premium tipo Linear/Stripe).
 * Usa IntersectionObserver y las clases de `tw-animate-css` ya cargadas en el proyecto.
 *
 * Uso:
 *   const { ref, visible } = useScrollReveal()
 *   <div ref={ref} className={visible ? 'animate-in fade-in slide-in-from-bottom-4 duration-700' : 'opacity-0'} />
 *
 * Devuelve `visible` para condicionar clases y `ref` para attach al nodo.
 */
export function useScrollReveal({
  threshold = 0.15,
  rootMargin = '0px 0px -10% 0px',
  once = true,
}: ScrollRevealOptions = {}) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Respetar prefers-reduced-motion: si el usuario lo pide, mostrar sin animar
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setVisible(true)
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            setVisible(false)
          }
        })
      },
      { threshold, rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return { ref, visible }
}
