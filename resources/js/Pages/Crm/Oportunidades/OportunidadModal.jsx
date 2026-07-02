import { useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Textarea } from '@/Components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'

export default function OportunidadModal({ isOpen, onClose, clienteId = null, clientes = [], oportunidad = null }) {
  const isEdit = !!oportunidad

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    cliente_id: clienteId || '',
    titulo: '',
    valor_estimado: '',
    etapa: 'prospecto',
    fecha_cierre_esperada: '',
    probabilidad: '10',
    notas: '',
  })

  useEffect(() => {
    if (isOpen) {
      if (isEdit && oportunidad) {
        setData({
          cliente_id: oportunidad.cliente_id || clienteId || '',
          titulo: oportunidad.titulo || '',
          valor_estimado: oportunidad.valor_estimado || '',
          etapa: oportunidad.etapa || 'prospecto',
          fecha_cierre_esperada: oportunidad.fecha_cierre_esperada || '',
          probabilidad: oportunidad.probabilidad || '10',
          notas: oportunidad.notas || '',
        })
      } else {
        reset()
        // Override reset value if clienteId was passed
        if (clienteId) {
            setData('cliente_id', clienteId);
        }
      }
      clearErrors()
    }
  }, [isOpen, oportunidad, clienteId])

  const submit = (e) => {
    e.preventDefault()
    if (isEdit) {
      put(route('crm.oportunidades.update', oportunidad.id), {
        onSuccess: () => onClose(),
        preserveScroll: true,
      })
    } else {
      post(route('crm.oportunidades.store'), {
        onSuccess: () => onClose(),
        preserveScroll: true,
      })
    }
  }

  const etapas = [
    { value: 'prospecto', label: 'Prospecto' },
    { value: 'calificado', label: 'Calificado' },
    { value: 'propuesta', label: 'Propuesta' },
    { value: 'negociacion', label: 'Negociación' },
    { value: 'ganado', label: 'Ganado' },
    { value: 'perdido', label: 'Perdido' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar Oportunidad' : 'Nueva Oportunidad Comercial'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {!clienteId && (
                <div className="grid gap-2">
                    <Label htmlFor="cliente_id">Cliente <span className="text-destructive">*</span></Label>
                    <Select 
                        value={data.cliente_id.toString()} 
                        onValueChange={(val) => setData('cliente_id', val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            {clientes.map(c => (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                    {c.nombres} {c.apellidos} {c.razon_social}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.cliente_id && <p className="text-sm text-destructive">{errors.cliente_id}</p>}
                </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="titulo">Título del Negocio <span className="text-destructive">*</span></Label>
              <Input
                id="titulo"
                value={data.titulo}
                onChange={(e) => setData('titulo', e.target.value)}
                placeholder="Ej. Implementación ERP 50 Usuarios"
              />
              {errors.titulo && <p className="text-sm text-destructive">{errors.titulo}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="valor_estimado">Valor Estimado ($) <span className="text-destructive">*</span></Label>
                <Input
                  id="valor_estimado"
                  type="number"
                  step="0.01"
                  min="0"
                  value={data.valor_estimado}
                  onChange={(e) => setData('valor_estimado', e.target.value)}
                  placeholder="0.00"
                />
                {errors.valor_estimado && <p className="text-sm text-destructive">{errors.valor_estimado}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="etapa">Etapa <span className="text-destructive">*</span></Label>
                <Select value={data.etapa} onValueChange={(val) => setData('etapa', val)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {etapas.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                {errors.etapa && <p className="text-sm text-destructive">{errors.etapa}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fecha_cierre_esperada">Fecha de Cierre (Aprox)</Label>
                <Input
                  id="fecha_cierre_esperada"
                  type="date"
                  value={data.fecha_cierre_esperada}
                  onChange={(e) => setData('fecha_cierre_esperada', e.target.value)}
                />
                {errors.fecha_cierre_esperada && <p className="text-sm text-destructive">{errors.fecha_cierre_esperada}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="probabilidad">Probabilidad de Éxito (%)</Label>
                <Input
                  id="probabilidad"
                  type="number"
                  min="0"
                  max="100"
                  value={data.probabilidad}
                  onChange={(e) => setData('probabilidad', e.target.value)}
                  placeholder="0 - 100"
                />
                {errors.probabilidad && <p className="text-sm text-destructive">{errors.probabilidad}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notas">Notas Adicionales</Label>
              <Textarea
                id="notas"
                value={data.notas}
                onChange={(e) => setData('notas', e.target.value)}
                rows={3}
                placeholder="Detalles sobre la oportunidad, próximos pasos..."
              />
              {errors.notas && <p className="text-sm text-destructive">{errors.notas}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={processing}>
              {processing ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear Oportunidad')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
