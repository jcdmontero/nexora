import React from 'react'
import { Link } from '@inertiajs/react'
import { cn } from '@/lib/utils'
import { Inbox, type LucideIcon } from 'lucide-react'
import { Button } from '@/Components/ui/button'

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
}

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: React.ReactNode | EmptyStateAction
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const renderAction = () => {
    if (!action) return null

    if (typeof action === 'object' && action !== null && 'label' in action && !React.isValidElement(action)) {
      const a = action as EmptyStateAction;
      if (a.href) {
        return (
          <Button asChild>
            <Link href={a.href}>{a.label}</Link>
          </Button>
        )
      }
      if (a.onClick) {
        return (
          <Button onClick={a.onClick}>
            {a.label}
          </Button>
        )
      }
      // Si tiene label pero sin href ni onClick, renderiza botón sin acción
      return (
        <Button disabled>
          {a.label}
        </Button>
      )
    }

    return action as React.ReactNode
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center animate-[fade-in-up_0.4s_ease-out]',
        className
      )}
    >
      <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 ring-1 ring-border">
        <Icon className="w-8 h-8 text-muted-foreground/60" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-8 leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="mt-2">
            {renderAction()}
        </div>
      )}
    </div>
  )
}

export default EmptyState;
