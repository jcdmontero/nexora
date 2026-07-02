import { type ReactNode } from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/Components/ui/dialog'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: LucideIcon
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Modal premium reutilizable.
 * Wrapper sobre Dialog (Shadcn/ui) que expone una API simplificada
 * con `open`/`onClose` controlada.
 */
export function Modal({ open, onClose, title, description, icon: Icon, children, footer, className }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className={cn('sm:max-w-lg', className)} showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            {Icon && (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Icon className="h-5 w-5" />
              </span>
            )}
            <div>
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </div>
          </div>
        </DialogHeader>
        <div>{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}

export default Modal
