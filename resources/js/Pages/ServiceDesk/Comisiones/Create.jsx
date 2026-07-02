import { useState } from 'react'
import { router, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Badge } from '@/Components/ui/badge'
import { ArrowLeft, DollarSign, Calculator, Briefcase, UserCheck, ExternalLink, Users, Calendar, CalendarDays, CalendarRange } from 'lucide-react'

const selectClass = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const VINC_ICON = { CONTRATISTA: Briefcase, EMPLEADO: UserCheck, FREELANCE: ExternalLink, COMISIONISTA: Users }
const VINC_LABEL = { CONTRATISTA: 'Contratista', EMPLEADO: 'Empleado', FREELANCE: 'Freelance', COMISIONISTA: 'Comisionista' }

/** Calcula inicio y fin del período según el preset. */
function calcularPeriodo(preset) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  const fmt = (date) => date.toISOString().split('T')[0]

  switch (preset) {
    case 'semanal': {
      // Semana actual: lunes a domingo
      const inicio = new Date(now)
      inicio.setDate(d - ((now.getDay() + 6) % 7)) // lunes
      const fin = new Date(inicio)
      fin.setDate(inicio.getDate() + 6) // domingo
      return { inicio: fmt(inicio), fin: fmt(fin) }
    }
    case 'quincenal': {
      // Quincena: 1-15 o 16-fin de mes
      if (d <= 15) {
        return { inicio: fmt(new Date(y, m, 1)), fin: fmt(new Date(y, m, 15)) }
      } else {
        return { inicio: fmt(new Date(y, m, 16)), fin: fmt(new Date(y, m + 1, 0)) }
      }
    }
    case 'mensual': {
      return { inicio: fmt(new Date(y, m, 1)), fin: fmt(new Date(y, m + 1, 0)) }
    }
    default:
      return { inicio: '', fin: '' }
  }
}

export default function CreateComision({ prestadores }) {
  const { data, setData, post, processing, errors } = useForm({
    prestador_id: '',
    periodo_inicio: '',
    periodo_fin: '',
    observaciones: '',
  })

  const [preview, setPreview] = useState(null)

  const prestadorSel = prestadores.find(p => p.id == data.prestador_id)

  const aplicarPreset = (preset) => {
    const { inicio, fin } = calcularPeriodo(preset)
    setData('periodo_inicio', inicio)
    setData('periodo_fin', fin)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    post(route('service-desk.comisiones.store'))
  }

  return (
    <AuthenticatedLayout>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.get(route('service-desk.comisiones.index'))}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary" /> Nueva Liquidación</h2>
          <p className="text-muted-foreground">Calcula comisiones de un técnico por período.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader><CardTitle className="text-lg">Parámetros de Liquidación</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prestador_id">Prestador *</Label>
              <select id="prestador_id" value={data.prestador_id} onChange={(e) => setData('prestador_id', e.target.value)} className={selectClass}>
                <option value="">Seleccionar…</option>
                {prestadores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre_completo} ({VINC_LABEL[p.tipo_vinculacion] || p.tipo_vinculacion})
                  </option>
                ))}
              </select>
              {errors.prestador_id && <p className="text-xs text-destructive">{errors.prestador_id}</p>}

              {prestadorSel && (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  {prestadorSel.porcentaje_comision ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{prestadorSel.porcentaje_comision}% comisión</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-100 text-slate-600">Sin % por defecto</Badge>
                  )}
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    {VINC_LABEL[prestadorSel.tipo_vinculacion] || prestadorSel.tipo_vinculacion}
                  </Badge>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Input id="observaciones" value={data.observaciones} onChange={(e) => setData('observaciones', e.target.value)} placeholder="Opcional" />
            </div>

            {/* Periodo con presets */}
            <div className="md:col-span-2 space-y-3">
              <Label>Período de liquidación *</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => aplicarPreset('semanal')}
                  className="gap-1.5"
                >
                  <Calendar className="h-3.5 w-3.5" /> Semanal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => aplicarPreset('quincenal')}
                  className="gap-1.5"
                >
                  <CalendarDays className="h-3.5 w-3.5" /> Quincenal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => aplicarPreset('mensual')}
                  className="gap-1.5"
                >
                  <CalendarRange className="h-3.5 w-3.5" /> Mensual
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="periodo_inicio">Desde</Label>
                  <Input id="periodo_inicio" type="date" value={data.periodo_inicio} onChange={(e) => setData('periodo_inicio', e.target.value)} />
                  {errors.periodo_inicio && <p className="text-xs text-destructive">{errors.periodo_inicio}</p>}
                </div>
                <div>
                  <Label htmlFor="periodo_fin">Hasta</Label>
                  <Input id="periodo_fin" type="date" value={data.periodo_fin} onChange={(e) => setData('periodo_fin', e.target.value)} />
                  {errors.periodo_fin && <p className="text-xs text-destructive">{errors.periodo_fin}</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => router.get(route('service-desk.comisiones.index'))}>Cancelar</Button>
          <Button type="submit" disabled={processing} className="gap-2">
            <Calculator className="h-4 w-4" /> {processing ? 'Calculando…' : 'Calcular y Generar'}
          </Button>
        </div>
      </form>
    </AuthenticatedLayout>
  )
}
