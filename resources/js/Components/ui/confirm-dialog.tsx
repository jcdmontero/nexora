import { useState, type ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { AlertTriangle } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/Components/ui/alert-dialog'

interface ConfirmDialogProps {
  /** Elemento que abre el diálogo (botón/ícono). */
  trigger: ReactNode
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Si se pasa, hace router.delete a esta URL al confirmar. */
  deleteUrl?: string
  /** Callback alternativo al confirmar (para lógica personalizada). */
  onConfirm?: () => void
}

/**
 * Diálogo de confirmación premium para acciones destructivas.
 * Protege contra eliminaciones accidentales con mensaje claro.
 */
export function ConfirmDialog({
  trigger,
  title = '¿Eliminar este registro?',
  description = 'Esta acción no se puede deshacer. El registro se eliminará permanentemente.',
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  deleteUrl,
  onConfirm,
}: ConfirmDialogProps) {
  const [processing, setProcessing] = useState(false)

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
      return
    }
    if (deleteUrl) {
      setProcessing(true)
      router.delete(deleteUrl, {
        preserveScroll: true,
        onFinish: () => setProcessing(false),
      })
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={trigger as React.ReactElement} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={processing}
            onClick={handleConfirm}
          >
            {processing ? 'Eliminando…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDialog
