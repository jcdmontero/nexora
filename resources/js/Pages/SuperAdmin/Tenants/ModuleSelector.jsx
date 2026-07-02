import { useState } from 'react'
import { Check } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/Components/ui/alert-dialog'

/**
 * Selector de módulos a habilitar para una empresa.
 * Solo recibe módulos PUBLICADOS (filtrado en backend).
 * Sugiere comercialmente la activación de dependencias para armar el paquete.
 */
export default function ModuleSelector({ modulos, selected, onToggle }) {
  const [pendingModule, setPendingModule] = useState(null)
  if (modulos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay módulos publicados disponibles. Publica módulos desde el Centro de Módulos.
      </p>
    )
  }

  const handleToggle = (moduleCode) => {
    const isSelected = selected.includes(moduleCode)
    
    if (isSelected) {
      // Si ya está seleccionado, solo lo quitamos (podría haber dependientes, pero lo validará el backend)
      onToggle(moduleCode)
    } else {
      // Intenta seleccionar. Buscamos el módulo y revisamos sus dependencias.
      const target = modulos.find(m => m.code === moduleCode)
      if (!target) return

      const missingDeps = (target.dependencies || []).filter(dep => !selected.includes(dep))
      
      if (missingDeps.length > 0) {
        // Encontramos dependencias no seleccionadas, disparamos la alerta de "Paquete"
        const missingNames = missingDeps.map(code => {
            const mod = modulos.find(m => m.code === code)
            return mod ? mod.name : code
        })

        setPendingModule({ 
            code: moduleCode, 
            name: target.name,
            missingCodes: missingDeps,
            missingNames: missingNames 
        })
      } else {
        // No tiene dependencias faltantes, activar normalmente
        onToggle(moduleCode)
      }
    }
  }

  const confirmPaquete = () => {
    if (pendingModule) {
      onToggle([pendingModule.code, ...pendingModule.missingCodes])
      setPendingModule(null)
    }
  }

  const cancelPaquete = () => {
    setPendingModule(null)
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {modulos.map((m) => {
          const isSelected = selected.includes(m.code)
          return (
            <button
              key={m.code}
              type="button"
              onClick={() => handleToggle(m.code)}
            className={`text-left rounded-lg border p-3 transition-colors ${
              isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-sm">{m.name}</span>
              <span className={`flex items-center justify-center w-5 h-5 rounded-md border shrink-0 ${
                isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
              }`}>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </span>
            </div>
            {m.description && <p className="text-xs text-muted-foreground mt-1">{m.description}</p>}
            {m.dependencies?.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Requiere: {m.dependencies.join(', ')}
              </p>
            )}
          </button>
        )
        })}
      </div>

      <AlertDialog open={!!pendingModule} onOpenChange={(val) => !val && cancelPaquete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Paquete Recomendado</AlertDialogTitle>
            <AlertDialogDescription>
              Para activar y vender <strong>{pendingModule?.name}</strong> de forma completa, se requiere habilitar también los módulos de <strong>{pendingModule?.missingNames.join(', ')}</strong>.
              <br /><br />
              ¿Deseas incluir estos módulos en el paquete de este cliente?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPaquete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPaquete}>Sí, incluir paquete completo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
