import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ToastData } from './toast'

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const styles: Record<string, string> = {
  success: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
  error: 'border-l-red-500 bg-red-50 dark:bg-red-950/20',
  info: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
  warning: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20',
}

const iconColors: Record<string, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
}

interface ToastProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

export function ToastItem({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false)
  const Icon = icons[toast.variant]

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 300)
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg ring-1 ring-foreground/5 border-l-4 transition-all duration-300',
        styles[toast.variant],
        visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
      )}
    >
      <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', iconColors[toast.variant])} />
      <p className="text-sm text-foreground flex-1">{toast.message}</p>
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(() => onDismiss(toast.id), 300)
        }}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
