import { useForm } from '@inertiajs/react'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Button } from '@/Components/ui/button'
import { Checkbox } from '@/Components/ui/checkbox'

export default function CuentaFormModal({ isOpen, onClose }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    codigo: '',
    nombre: '',
    tipo: 'activo',
    naturaleza: 'debito',
    nivel: 1,
    clase: '',
    acepta_movimientos: true,
    requiere_tercero: false,
    requiere_centro_costo: false,
    descripcion: '',
  })

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    post(route('accounting.cuentas.store'), {
      onSuccess: () => {
        reset()
        onClose()
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative z-50 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Nueva Cuenta Contable</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Crea una cuenta para estructurar el plan único (PUC).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código PUC</Label>
              <Input
                id="codigo"
                value={data.codigo}
                onChange={e => setData('codigo', e.target.value)}
                placeholder="Ej. 110505"
                className={errors.codigo ? 'border-destructive' : ''}
              />
              {errors.codigo && <p className="text-xs text-destructive">{errors.codigo}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Naturaleza / Tipo</Label>
              <select
                id="tipo"
                value={data.tipo}
                onChange={e => setData('tipo', e.target.value)}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="activo">Activo</option>
                <option value="pasivo">Pasivo</option>
                <option value="patrimonio">Patrimonio</option>
                <option value="ingreso">Ingreso</option>
                <option value="gasto">Gasto</option>
                <option value="costo">Costo</option>
              </select>
              {errors.tipo && <p className="text-xs text-destructive">{errors.tipo}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="naturaleza">Naturaleza</Label>
              <select
                id="naturaleza"
                value={data.naturaleza}
                onChange={e => setData('naturaleza', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
              </select>
              {errors.naturaleza && <p className="text-xs text-destructive">{errors.naturaleza}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nivel">Nivel</Label>
              <Input
                id="nivel"
                type="number"
                min="1"
                max="6"
                value={data.nivel}
                onChange={e => setData('nivel', e.target.value)}
                className={errors.nivel ? 'border-destructive' : ''}
              />
              {errors.nivel && <p className="text-xs text-destructive">{errors.nivel}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clase">Clase</Label>
              <Input
                id="clase"
                maxLength="1"
                value={data.clase}
                onChange={e => setData('clase', e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Cuenta</Label>
            <Input
              id="nombre"
              value={data.nombre}
              onChange={e => setData('nombre', e.target.value)}
              placeholder="Caja General"
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
              placeholder="Breve detalle del uso de la cuenta"
            />
          </div>

          <div className="flex items-start space-x-3 rounded-md border border-border p-4">
            <Checkbox
              id="acepta_movimientos"
              checked={data.acepta_movimientos}
              onCheckedChange={checked => setData('acepta_movimientos', checked)}
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="acepta_movimientos" className="cursor-pointer">
                Acepta Movimientos
              </Label>
              <p className="text-xs text-muted-foreground">
                Si desmarcas esta opción, será una cuenta "agrupadora" o título (ej. 1105 Caja).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start space-x-3 rounded-md border border-border p-4">
              <Checkbox
                id="requiere_tercero"
                checked={data.requiere_tercero}
                onCheckedChange={checked => setData('requiere_tercero', checked)}
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="requiere_tercero" className="cursor-pointer">
                  Requiere tercero
                </Label>
                <p className="text-xs text-muted-foreground">Obliga NIT/CC en cada movimiento.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 rounded-md border border-border p-4">
              <Checkbox
                id="requiere_centro_costo"
                checked={data.requiere_centro_costo}
                onCheckedChange={checked => setData('requiere_centro_costo', checked)}
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="requiere_centro_costo" className="cursor-pointer">
                  Requiere centro
                </Label>
                <p className="text-xs text-muted-foreground">Útil para gastos y costos operativos.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
              Cancelar
            </Button>
            <Button type="submit" disabled={processing}>
              Guardar Cuenta
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
