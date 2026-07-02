import { useState, useCallback } from 'react'
import { router } from '@inertiajs/react'
import { useToast } from '@/Components/toasts/ToastProvider'

interface CajaState {
  abriendo: boolean
  cajaAbierta: boolean
  error: string | null
  cajasDisponibles: Array<{ id: number; nombre: string }>
}

function notificar(toast: (msg: string, variant?: string) => void, opts: { title: string; description?: string; type?: string }) {
  toast(`${opts.title}${opts.description ? ': ' + opts.description : ''}`, opts.type ?? 'info')
}

interface EstadoCajaResponse {
  cajaAbierta: boolean
  cajasDisponibles: Array<{ id: number; nombre: string }>
  sesionActiva: { id: number; caja_id: number; estado: string } | null
}

export function useCaja() {
  const { toast } = useToast()
  const [estado, setEstado] = useState<CajaState>({ abriendo: false, cajaAbierta: false, error: null, cajasDisponibles: [] })

  const avisar = (opts: { title: string; description?: string; type?: string }) =>
    notificar(toast, opts)

  /**
   * Verifica asíncronamente si la caja del usuario está abierta y
   * actualiza el estado del hook sin redirigir ni perder datos.
   */
  const verificarCaja = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(route('cash.caja.estado'))
      if (!response.ok) {
        throw new Error('No se pudo verificar el estado de la caja.')
      }
      const data: EstadoCajaResponse = await response.json()
      const abierta = data.cajaAbierta
      setEstado(prev => ({ ...prev, cajaAbierta: abierta, cajasDisponibles: data.cajasDisponibles ?? [], error: null }))
      return abierta
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al verificar la caja'
      setEstado(prev => ({ ...prev, error: msg }))
      return false
    }
  }, [])

  /**
   * Abre la caja usando Inertia.router.post (maneja versionado,
   * CSRF y redirecciones automáticamente).
   * Si hay varias cajas disponibles, selecciona la indicada o la primera.
   */
  const abrirCaja = useCallback(async (saldoInicial: number, cajaId?: number): Promise<boolean> => {
    setEstado(prev => ({ ...prev, abriendo: true, error: null }))

    try {
      // Consultamos el estado vía fetch para evitar redirecciones indeseadas
      const response = await fetch(route('cash.caja.estado'))
      if (!response.ok) {
        throw new Error('No se pudo verificar el estado de la caja.')
      }
      const data: EstadoCajaResponse = await response.json()

      if (data.cajaAbierta) {
        setEstado({ abriendo: false, cajaAbierta: true, cajasDisponibles: [], error: null })
        return true
      }

      const cajas = data.cajasDisponibles ?? []
      if (cajas.length === 0) {
        avisar({ title: 'Sin cajas', description: 'No hay cajas activas. Contacta al administrador.', type: 'error' })
        setEstado({ abriendo: false, cajaAbierta: false, cajasDisponibles: [], error: 'Sin cajas' })
        return false
      }

      // Usar la caja indicada, o la primera disponible si no se especificó.
      const cajaElegida = cajaId
        ? cajas.find((c) => c.id === cajaId) ?? cajas[0]
        : cajas[0]

      return new Promise<boolean>((resolve) => {
        router.post(route('cash.caja.abrir'), {
          caja_id: cajaElegida.id,
          saldo_inicial: saldoInicial,
        }, {
          preserveState: true,
          preserveScroll: true,
          onSuccess: () => {
            setEstado({ abriendo: false, cajaAbierta: true, cajasDisponibles: [], error: null })
            avisar({ title: 'Caja Abierta', description: `${cajaElegida.nombre} — Turno iniciado con $${saldoInicial.toLocaleString('es-CO')}`, type: 'success' })
            resolve(true)
          },
          onError: (errors: Record<string, string>) => {
            const msg = errors.saldo_inicial ?? errors.caja_id ?? 'Error al abrir la caja.'
            avisar({ title: 'Error de Caja', description: msg, type: 'error' })
            setEstado({ abriendo: false, cajaAbierta: false, cajasDisponibles: [], error: msg })
            resolve(false)
          },
        })
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la apertura de caja.'
      avisar({ title: 'Error', description: msg, type: 'error' })
      setEstado({ abriendo: false, cajaAbierta: false, cajasDisponibles: [], error: msg })
      return false
    }
  }, [toast])

  return { ...estado, verificarCaja, abrirCaja }
}
