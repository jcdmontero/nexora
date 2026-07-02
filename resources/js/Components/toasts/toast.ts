export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastData {
  id: string
  message: string
  variant: ToastVariant
}

export type ToastFn = (message: string, variant?: ToastVariant) => void
