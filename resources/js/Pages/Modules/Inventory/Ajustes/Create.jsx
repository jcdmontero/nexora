import { useState, useMemo } from 'react'
import { Head, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Button } from '@/Components/ui/button'
import { ArrowRightLeft, Save } from 'lucide-react'

export default function AjustesCreate({ productos, bodegas }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    tipo: 'entrada',
    bodega_id: bodegas.length > 0 ? bodegas[0].id : '',
    producto_id: '',
    pack_id: '',
    cantidad: '',
    factor_conversion: 1,
    observaciones: '',
  })

  // Producto seleccionado para extraer packs
  const selectedProducto = useMemo(() => {
    return productos.find(p => p.id === parseInt(data.producto_id)) || null
  }, [data.producto_id, productos])

  const packs = selectedProducto?.packs || []

  // Calcular la cantidad real (Física base) que se afectará
  const cantidadReal = useMemo(() => {
    const cant = parseFloat(data.cantidad) || 0
    const factor = parseFloat(data.factor_conversion) || 1
    return cant * factor
  }, [data.cantidad, data.factor_conversion])

  const handleProductoChange = (e) => {
    setData({
      ...data,
      producto_id: e.target.value,
      pack_id: '',
      factor_conversion: 1,
    })
  }

  const handlePackChange = (e) => {
    const packId = e.target.value
    if (!packId) {
      setData({ ...data, pack_id: '', factor_conversion: 1 })
      return
    }
    const pack = packs.find(p => p.id === parseInt(packId))
    if (pack) {
      setData({ ...data, pack_id: packId, factor_conversion: pack.factor_conversion })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    post(route('inventory.ajustes.store'), {
      onSuccess: () => reset()
    })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Registrar Movimiento" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl mx-auto py-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-2 rounded-full">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Registrar Movimiento</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Ingresa o retira productos probando la conversión de empaques.
            </p>
          </div>
        </div>

        <Card className="p-6 border-border shadow-sm space-y-6">
          <div className="space-y-4">
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Tipo de Movimiento</Label>
                <div className="grid grid-cols-2 gap-2 max-w-md">
                  <Button 
                    type="button" 
                    variant={data.tipo === 'entrada' ? 'default' : 'outline'}
                    className={data.tipo === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                    onClick={() => setData('tipo', 'entrada')}
                  >
                    Entrada
                  </Button>
                  <Button 
                    type="button" 
                    variant={data.tipo === 'salida' ? 'default' : 'outline'}
                    className={data.tipo === 'salida' ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}
                    onClick={() => setData('tipo', 'salida')}
                  >
                    Salida
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Bodega Destino / Origen <span className="text-destructive">*</span></Label>
                <select
                  name="bodega_id"
                  value={data.bodega_id}
                  onChange={e => setData('bodega_id', e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="" disabled>Seleccione una bodega...</option>
                  {bodegas.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
                {errors.bodega_id && <p className="text-xs text-destructive">{errors.bodega_id}</p>}
              </div>

              <div className="space-y-2">
                <Label>Producto</Label>
                <select
                  name="producto_id"
                  value={data.producto_id}
                  onChange={handleProductoChange}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Seleccione el producto...</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} - {p.nombre} (Stock: {p.stock_actual} {p.unidad_medida})
                    </option>
                  ))}
                </select>
                {errors.producto_id && <p className="text-xs text-destructive">{errors.producto_id}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Unidad / Empaque (Presentación)</Label>
                  <select
                    value={data.pack_id}
                    onChange={handlePackChange}
                    disabled={!selectedProducto}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="">Unidad Base ({selectedProducto?.unidad_medida || '---'}) - Factor x1</option>
                    {packs.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.unidad_medida}) - Factor x{p.factor_conversion}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Elige cómo estás introduciendo o sacando el producto.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    name="cantidad"
                    type="number"
                    min="0.0001"
                    step="any"
                    className="h-10"
                    value={data.cantidad}
                    onChange={e => setData('cantidad', e.target.value)}
                    placeholder="Ej. 3"
                  />
                  {errors.cantidad && <p className="text-xs text-destructive">{errors.cantidad}</p>}
                </div>
              </div>

            <div className="rounded-lg bg-muted/50 border p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Conversión Automática (Cantidad Base)</p>
                <p className="text-xs text-muted-foreground">
                  El inventario real se moverá en esta cantidad.
                </p>
              </div>
              <div className="text-xl font-bold text-primary">
                {cantidadReal} <span className="text-sm font-normal text-muted-foreground">{selectedProducto?.unidad_medida}</span>
              </div>
            </div>

              <div className="space-y-2">
                <Label>Justificación / Observaciones <span className="text-destructive">*</span></Label>
                <Input
                  name="observaciones"
                  value={data.observaciones}
                  onChange={e => setData('observaciones', e.target.value)}
                  placeholder="Ej. Ajuste por mercancía dañada (Obligatorio)"
                  required
                />
                {errors.observaciones && <p className="text-xs text-destructive">{errors.observaciones}</p>}
              </div>

            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" disabled={processing} onClick={() => reset()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={processing || !data.producto_id || !data.cantidad}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Movimiento
          </Button>
        </div>
      </form>
    </AuthenticatedLayout>
  )
}
