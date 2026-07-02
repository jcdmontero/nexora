import { useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Switch } from '@/Components/ui/switch'

export default function ContactoModal({ isOpen, onClose, clienteId, contacto = null }) {
  const isEdit = !!contacto

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    nombre: '',
    cargo: '',
    email: '',
    telefono: '',
    is_principal: false,
  })

  useEffect(() => {
    if (isOpen) {
      if (isEdit && contacto) {
        setData({
          nombre: contacto.nombre || '',
          cargo: contacto.cargo || '',
          email: contacto.email || '',
          telefono: contacto.telefono || '',
          is_principal: contacto.is_principal || false,
        })
      } else {
        reset()
      }
      clearErrors()
    }
  }, [isOpen, contacto])

  const submit = (e) => {
    e.preventDefault()
    if (isEdit) {
      put(route('crm.contactos.update', contacto.id), {
        onSuccess: () => onClose(),
        preserveScroll: true,
      })
    } else {
      post(route('crm.contactos.store', clienteId), {
        onSuccess: () => onClose(),
        preserveScroll: true,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar Contacto' : 'Nuevo Contacto'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre completo <span className="text-destructive">*</span></Label>
              <Input
                id="nombre"
                value={data.nombre}
                onChange={(e) => setData('nombre', e.target.value)}
                placeholder="Ej. Juan Pérez"
              />
              {errors.nombre && <p className="text-sm text-destructive">{errors.nombre}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  value={data.cargo}
                  onChange={(e) => setData('cargo', e.target.value)}
                  placeholder="Gerente, Asesor..."
                />
                {errors.cargo && <p className="text-sm text-destructive">{errors.cargo}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={data.telefono}
                  onChange={(e) => setData('telefono', e.target.value)}
                  placeholder="12345678"
                />
                {errors.telefono && <p className="text-sm text-destructive">{errors.telefono}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                placeholder="correo@ejemplo.com"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <Switch 
                id="is_principal" 
                checked={data.is_principal}
                onCheckedChange={(checked) => setData('is_principal', checked)}
              />
              <Label htmlFor="is_principal">Marcar como contacto principal</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={processing}>
              {processing ? 'Guardando...' : 'Guardar Contacto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
