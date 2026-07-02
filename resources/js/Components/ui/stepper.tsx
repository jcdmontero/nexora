import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  title: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  /** Paso actual (1-indexado). */
  current: number
  /** Permite navegar a un paso ya visitado. */
  onStepClick?: (step: number) => void
  className?: string
}

/**
 * Indicador de pasos premium para asistentes (wizard).
 */
export function Stepper({ steps, current, onStepClick, className }: StepperProps) {
  return (
    <ol className={cn('flex w-full items-center', className)}>
      {steps.map((step, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        const clickable = onStepClick && n < current
        return (
          <li key={step.title} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(n)}
              className={cn('flex items-center gap-3 text-left', clickable && 'cursor-pointer')}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  done && 'bg-primary text-primary-foreground',
                  active && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                  !done && !active && 'border border-border bg-background text-muted-foreground',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : n}
              </span>
              <div className="hidden sm:block">
                <p className={cn('text-sm font-semibold', active || done ? 'text-foreground' : 'text-muted-foreground')}>
                  {step.title}
                </p>
                {step.description && <p className="text-xs text-muted-foreground">{step.description}</p>}
              </div>
            </button>
            {i < steps.length - 1 && (
              <div className={cn('mx-3 h-0.5 flex-1 rounded-full transition-colors', done ? 'bg-primary' : 'bg-border')} />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default Stepper
