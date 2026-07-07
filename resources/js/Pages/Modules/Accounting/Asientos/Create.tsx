import { useState, useEffect } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Button } from '@/Components/ui/button'
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AsientoCreate({ cuentas, centrosCosto }) {
  const { data, setData, post, processing, errors } = useForm({
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    documento_tipo: '',
    documento_prefijo: '',
    documento_numero: '',
    tercero_tipo_documento: 'NIT',
    tercero_numero_documento: '',
    tercero_nombre: '',
    referencia_id: '',
    referencia_type: '',
    lineas: [
      { cuenta_contable_id: '', centro_costo_id: '', debito: 0, credito: 0, base_gravable: '', impuesto_tipo: '', impuesto_tarifa: '', descripcion: '' },
      { cuenta_contable_id: '', centro_costo_id: '', debito: 0, credito: 0, base_gravable: '', impuesto_tipo: '', impuesto_tarifa: '', descripcion: '' },
    ]
  })

  const [totales, setTotales] = useState({ debito: 0, credito: 0, diferencia: 0 })

  useEffect(() => {
    const debito = data.lineas.reduce((acc, curr) => acc + (parseFloat(curr.debito) || 0), 0)
    const credito = data.lineas.reduce((acc, curr) => acc + (parseFloat(curr.credito) || 0), 0)
    setTotales({ debito, credito, diferencia: Math.abs(debito - credito) })
  }, [data.lineas])

  const addLinea = () => {
    setData('lineas', [...data.lineas, { cuenta_contable_id: '', centro_costo_id: '', debito: 0, credito: 0, base_gravable: '', impuesto_tipo: '', impuesto_tarifa: '', descripcion: '' }])
  }

  const removeLinea = (index) => {
    const newLineas = [...data.lineas]
    newLineas.splice(index, 1)
    setData('lineas', newLineas)
  }

  const updateLinea = (index, field, value) => {
    const newLineas = [...data.lineas]
    if (field === 'debito' && value > 0) newLineas[index].credito = 0
    if (field === 'credito' && value > 0) newLineas[index].debito = 0
    newLineas[index][field] = value
    setData('lineas', newLineas)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    post(route('accounting.asientos.store'))
  }

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val)
  const isCuadrado = totales.diferencia < 0.01

  return (
    <AuthenticatedLayout>
      <Head title="Nuevo Asiento Contable" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={route('accounting.asientos.index')}>
              <Button variant="outline" size="icon" type="button">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Registrar Asiento</h2>
              <p className="text-sm text-muted-foreground mt-1">Ingresa los datos para la nueva partida doble manual.</p>
            </div>
          </div>
          <Button type="submit" disabled={processing || !isCuadrado || data.lineas.length < 2}>
            <Save className="h-4 w-4 mr-2" />
            Contabilizar Asiento
          </Button>
        </div>

        <Card className="p-6 border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Información del Documento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha del Comprobante</Label>
              <Input
                id="fecha"
                type="date"
                value={data.fecha}
                onChange={e => setData('fecha', e.target.value)}
                className={errors.fecha ? 'border-destructive' : ''}
              />
              {errors.fecha && <p className="text-xs text-destructive">{errors.fecha}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="concepto">Concepto / Glosa</Label>
              <Input
                id="concepto"
                value={data.concepto}
                onChange={e => setData('concepto', e.target.value)}
                placeholder="Ej. Pago nómina quincena 1..."
                className={errors.concepto ? 'border-destructive' : ''}
              />
              {errors.concepto && <p className="text-xs text-destructive">{errors.concepto}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="documento_tipo">Tipo de documento</Label>
              <Input
                id="documento_tipo"
                value={data.documento_tipo}
                onChange={e => setData('documento_tipo', e.target.value)}
                placeholder="Factura, recibo, nota"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento_prefijo">Prefijo</Label>
              <Input
                id="documento_prefijo"
                value={data.documento_prefijo}
                onChange={e => setData('documento_prefijo', e.target.value)}
                placeholder="FE"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento_numero">Numero</Label>
              <Input
                id="documento_numero"
                value={data.documento_numero}
                onChange={e => setData('documento_numero', e.target.value)}
                placeholder="000123"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="tercero_tipo_documento">Documento</Label>
              <select
                id="tercero_tipo_documento"
                value={data.tercero_tipo_documento}
                onChange={e => setData('tercero_tipo_documento', e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 shadow-sm text-sm"
              >
                <option value="NIT">NIT</option>
                <option value="CC">CC</option>
                <option value="CE">CE</option>
                <option value="PAS">Pasaporte</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tercero_numero_documento">Numero tercero</Label>
              <Input
                id="tercero_numero_documento"
                value={data.tercero_numero_documento}
                onChange={e => setData('tercero_numero_documento', e.target.value)}
                placeholder="900123456"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tercero_nombre">Nombre tercero</Label>
              <Input
                id="tercero_nombre"
                value={data.tercero_nombre}
                onChange={e => setData('tercero_nombre', e.target.value)}
                placeholder="Cliente o proveedor"
              />
            </div>
          </div>
        </Card>

        <Card className="border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
            <h3 className="text-sm font-semibold">Líneas del Asiento</h3>
            <Button type="button" variant="outline" size="sm" onClick={addLinea}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Línea
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Cuenta Contable</th>
                  <th className="px-4 py-3 font-medium">Centro de Costo (Opcional)</th>
                  <th className="px-4 py-3 font-medium w-48">Débito</th>
                  <th className="px-4 py-3 font-medium w-48">Crédito</th>
                  <th className="px-4 py-3 font-medium w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.lineas.map((linea, index) => (
                  <tr key={index} className="bg-card hover:bg-muted/10 transition-colors">
                    <td className="p-2">
                      <select
                        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 shadow-sm text-sm"
                        value={linea.cuenta_contable_id}
                        onChange={e => updateLinea(index, 'cuenta_contable_id', e.target.value)}
                        required
                      >
                        <option value="">Seleccione cuenta...</option>
                        {cuentas.map(c => (
                          <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                        ))}
                      </select>
                      {errors[`lineas.${index}.cuenta_contable_id`] && (
                        <span className="text-[10px] text-destructive">Requerido</span>
                      )}
                    </td>
                    <td className="p-2">
                      <select
                        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 shadow-sm text-sm"
                        value={linea.centro_costo_id}
                        onChange={e => updateLinea(index, 'centro_costo_id', e.target.value)}
                      >
                        <option value="">Ninguno</option>
                        {centrosCosto.map(cc => (
                          <option key={cc.id} value={cc.id}>{cc.codigo} - {cc.nombre}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={linea.debito || ''}
                        onChange={e => updateLinea(index, 'debito', e.target.value)}
                        placeholder="0.00"
                        className="text-right font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={linea.credito || ''}
                        onChange={e => updateLinea(index, 'credito', e.target.value)}
                        placeholder="0.00"
                        className="text-right font-mono"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => removeLinea(index)}
                        disabled={data.lineas.length <= 2}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-muted/30 p-4 border-t flex flex-col items-end gap-2">
            <div className="flex w-full max-w-sm justify-between text-sm font-medium">
              <span className="text-muted-foreground">Total Débitos:</span>
              <span className="font-mono">{formatCurrency(totales.debito)}</span>
            </div>
            <div className="flex w-full max-w-sm justify-between text-sm font-medium">
              <span className="text-muted-foreground">Total Créditos:</span>
              <span className="font-mono">{formatCurrency(totales.credito)}</span>
            </div>
            <div className="flex w-full max-w-sm justify-between text-base font-bold mt-2 pt-2 border-t border-border">
              <span>Diferencia:</span>
              <span className={cn("font-mono", isCuadrado ? "text-emerald-500" : "text-destructive")}>
                {formatCurrency(totales.diferencia)}
              </span>
            </div>
            {!isCuadrado && (
              <p className="text-xs text-destructive mt-1 font-medium bg-destructive/10 px-2 py-1 rounded">
                El asiento está descuadrado. Revisa las sumas iguales.
              </p>
            )}
          </div>
        </Card>
      </form>
    </AuthenticatedLayout>
  )
}
