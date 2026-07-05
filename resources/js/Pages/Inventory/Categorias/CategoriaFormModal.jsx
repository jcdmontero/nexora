import { useForm } from '@inertiajs/react'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Button } from '@/Components/ui/button'
import { Checkbox } from '@/Components/ui/checkbox'

import { useEffect } from 'react'

export default function CategoriaFormModal({ isOpen, onClose, categoria = null }) {
  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    nombre: '',
    descripcion: '',
    is_active: true,
  })

  useEffect(() => {
    if (isOpen) {
      if (categoria) {
        setData({
          nombre: categoria.nombre || '',
          descripcion: categoria.descripcion || '',
          is_active: categoria.is_active,
        })
      } else {
        reset()
      }
      clearErrors()
    }
  }, [isOpen, categoria])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (categoria) {
      put(route('inventory.categorias.update', categoria.id), {
        onSuccess: () => {
          reset()
          onClose()
        },
      })
    } else {
      post(route('inventory.categorias.store'), {
        onSuccess: () => {
          reset()
          onClose()
        },
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative z-50 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {categoria ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Clasifica tus productos para organizar tu inventario.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Categoría</Label>
            <Input
              id="nombre"
              value={data.nombre}
              onChange={e => setData('nombre', e.target.value)}
              placeholder="Ej. Herramientas, Repuestos..."
              className={errors.nombre ? 'border-destructive' : ''}
            />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Input
              id="descripcion"
              value={data.descripcion}
              onChange={e => setData('descripcion', e.target.value)}
              placeholder="Breve detalle..."
            />
          </div>

          <div className="flex items-start space-x-3 rounded-md border border-border p-4">
            <Checkbox
              id="is_active"
              checked={data.is_active}
              onCheckedChange={checked => setData('is_active', checked)}
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="is_active" className="cursor-pointer">
                Categoría Activa
              </Label>
              <p className="text-xs text-muted-foreground">
                Permite asignar productos a esta categoría.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
              Cancelar
            </Button>
            <Button type="submit" disabled={processing}>
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
