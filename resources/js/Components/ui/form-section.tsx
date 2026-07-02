import type { ReactNode } from 'react'
import { AlertCircle, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormSectionProps {
  title: string
  description?: string
  icon?: LucideIcon
  children: ReactNode
  /** Número de columnas en escritorio (1 o 2). Móvil siempre 1 columna. */
  columns?: 1 | 2
  className?: string
}

/**
 * Sección agrupada de formulario premium: icono + título + subtítulo
 * y una grilla de campos responsive (1 columna en móvil).
 */
export function FormSection({ title, description, icon: Icon, children, columns = 2, className }: FormSectionProps) {
  return (
    <section className={cn('rounded-xl border border-border bg-card p-5 sm:p-6', className)}>
      <div className="mb-5 flex items-start gap-3">
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className={cn('grid gap-x-5 gap-y-4', columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1')}>
        {children}
      </div>
    </section>
  )
}

interface FieldProps {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  /** Ocupa el ancho completo de la grilla (2 columnas). */
  full?: boolean
  className?: string
}

/**
 * Envoltorio de campo: label + control + error/ayuda elegante.
 */
export function Field({ label, htmlFor, error, hint, required, children, full, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', full && 'sm:col-span-2', className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-1 text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

export default FormSection
