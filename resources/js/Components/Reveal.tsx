import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useScrollReveal } from '@/Hooks/useScrollReveal'

interface RevealProps {
  children: ReactNode
  /** Dirección de entrada. */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  /** Delay en ms (escala de clases tw-animate: 0,75,150,300...). */
  delay?: 0 | 75 | 150 | 300
  /** Duración de la animación (clase tw-animate). */
  duration?: 300 | 500 | 700 | 1000
  className?: string
  /** Etiqueta HTML del contenedor (default div). */
  as?: 'div' | 'section' | 'li' | 'article'
}

const DIRECTION_CLASS: Record<NonNullable<RevealProps['direction']>, string> = {
  up: 'slide-in-from-bottom-8',
  down: 'slide-in-from-top-8',
  left: 'slide-in-from-right-8',
  right: 'slide-in-from-left-8',
  none: '',
}

const DELAY_CLASS: Record<NonNullable<RevealProps['delay']>, string> = {
  0: '',
  75: '[animation-delay:75ms]',
  150: '[animation-delay:150ms]',
  300: '[animation-delay:300ms]',
}

const DURATION_CLASS: Record<NonNullable<RevealProps['duration']>, string> = {
  300: 'duration-300',
  500: 'duration-500',
  700: 'duration-700',
  1000: 'duration-1000',
}

/**
 * Envuelve contenido con animación de entrada al hacer scroll.
 * Respeta `prefers-reduced-motion` (via useScrollReveal).
 *
 * Ejemplo:
 *   <Reveal direction="up" delay={150}><Card>...</Card></Reveal>
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 700,
  className,
  as = 'div',
}: RevealProps) {
  const { ref, visible } = useScrollReveal()

  const animationClass = visible
    ? cn(
        'animate-in fade-in',
        DIRECTION_CLASS[direction],
        DURATION_CLASS[duration],
        DELAY_CLASS[delay],
      )
    : 'opacity-0'

  const Tag = as as 'div'
  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} className={cn(animationClass, className)}>
      {children}
    </Tag>
  )
}
