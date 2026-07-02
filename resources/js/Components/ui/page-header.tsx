import type { ReactNode } from 'react'
import { Link } from '@inertiajs/react'
import { ArrowLeft, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackLink {
  href: string
  label?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  /** Enlace "volver" opcional (muestra flecha sobre el título). */
  back?: BackLink
  /** Acciones a la derecha (botones, etc.). */
  actions?: ReactNode
  className?: string
}

/**
 * Encabezado de página premium y consistente para todos los módulos.
 * Maneja título, descripción, icono, navegación de retorno y acciones.
 */
export function PageHeader({ title, description, icon: Icon, back, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {back.label ?? 'Volver'}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export default PageHeader
