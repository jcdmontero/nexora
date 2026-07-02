import { usePage } from '@inertiajs/react'

interface RegimeConfig {
  /** Régimen fiscal del tenant: 'simplificado' o 'comun' */
  regimen: string
  /** Fecha de cambio de régimen (si aplica) */
  fechaCambio: string | null
  /** Si el tenant es responsable de IVA */
  esResponsableIva: boolean
  /** Si el tenant está en régimen simplificado */
  esSimplificado: boolean
  /** Porcentaje de IVA configurado */
  porcentajeIva: number
  /** Si se debe incluir IVA en facturación */
  incluirIva: boolean
}

/**
 * Hook que expone el régimen tributario del tenant actual.
 * Controla la visibilidad de campos de IVA y retenciones en la UI.
 */
export function useRegime(): RegimeConfig {
  const { config } = usePage().props as {
    config?: Record<string, string>
  }

  const regimen = config?.regimen_fiscal ?? 'simplificado'
  const fechaCambio = config?.fecha_cambio_regimen ?? null
  const esResponsableIva = regimen === 'comun'
  const esSimplificado = regimen === 'simplificado'
  const porcentajeIva = Number(config?.porcentaje_iva ?? 19)
  const incluirIva = config?.incluir_iva === 'true'

  return {
    regimen,
    fechaCambio,
    esResponsableIva,
    esSimplificado,
    porcentajeIva,
    incluirIva,
  }
}
