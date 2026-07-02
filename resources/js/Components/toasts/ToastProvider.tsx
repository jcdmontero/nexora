import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import { ToastItem } from './ToastItem'
import type { ToastData, ToastFn, ToastVariant } from './toast'

interface ToastContextValue {
  toast: ToastFn
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])
  const flash = usePage().props.flash as { success?: string; error?: string } | undefined

  const toast = useCallback<ToastFn>((message, variant = 'info') => {
    const id = String(++nextId)
    setToasts((prev) => [...prev, { id, message, variant }])
  }, [])

  useEffect(() => {
    if (flash?.success) toast(flash.success, 'success')
    if (flash?.error) toast(flash.error, 'error')
  }, [flash, toast])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
