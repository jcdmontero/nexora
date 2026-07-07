import { useMemo } from 'react'
import { useForm, Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { PageHeader } from '@/Components/ui/page-header'
import { Calculator, ArrowLeft, Coins, Landmark } from 'lucide-react'

function formatoCOP(v) {
  return '$ ' + new Intl.NumberFormat('es-CO').format(Math.round(v || 0))
}

export default function Arqueo({ sesion, denominaciones }) {
  const { data, setData, post, processing, errors } = useForm({
    detalles: denominaciones.map((d) => ({ denominacion_id: d.id, cantidad: 0 })),
    observaciones: '',
  })

  const saldoSistema = useMemo(() => {
    const val = Number(sesion.saldo_inicial) + Number(sesion.ingresos_totales) - Number(sesion.egresos_totales)
    return Math.round(val * 100) / 100
  }, [sesion])

  const totalContado = useMemo(() => {
    const val = data.detalles.reduce((acc, d) => {
      const denom = denominaciones.find((x) => x.id === d.denominacion_id)
      return acc + (denom ? Number(denom.valor) * d.cantidad : 0)
    }, 0)
    return Math.round(val * 100) / 100
  }, [data.detalles, denominaciones])

  const diferencia = useMemo(() => Math.round((totalContado - saldoSistema) * 100) / 100, [totalContado, saldoSistema])

  function actualizarCantidad(index, cantidad) {
    const detalles = [...data.detalles]
    detalles[index] = { ...detalles[index], cantidad: Math.max(0, cantidad) }
    setData('detalles', detalles)
  }

  function submit(e) {
    e.preventDefault()
    post(route('cash.arqueo.store', sesion.id), { preserveScroll: true })
  }

  return (
    <AuthenticatedLayout>
      <Head title={`Arqueo de Caja - ${sesion.caja.nombre}`} />
      
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Arqueo de Caja"
          description={`${sesion.caja.nombre} — Cajero: ${sesion.usuario.name}`}
          icon={Calculator}
          back={{ href: route('cash.caja.index'), label: 'Volver a Turno' }}
        />

        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conteo de Efectivo */}
          <Card className="md:col-span-2 shadow-sm border-border">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-semibold">Conteo de Efectivo</CardTitle>
              <CardDescription>Registra la cantidad física de billetes y monedas en caja</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 divide-y divide-border/60">
              {data.detalles.map((d, i) => {
                const denom = denominaciones.find((x) => x.id === d.denominacion_id)
                const subtotal = denom ? Math.round(Number(denom.valor) * d.cantidad * 100) / 100 : 0
                return (
                  <div key={d.denominacion_id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground">
                        {denom.tipo === 'billete' ? <Landmark className="h-4.5 w-4.5" /> : <Coins className="h-4.5 w-4.5" />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {formatoCOP(denom.valor)}
                        </div>
                        <div className="text-xxs text-muted-foreground uppercase tracking-wider">
                          {denom.tipo}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">×</span>
                        <Input
                          type="number"
                          min={0}
                          value={d.cantidad || ''}
                          onChange={(e) => actualizarCantidad(i, parseInt(e.target.value) || 0)}
                          className="h-9 w-20 text-center font-medium"
                          placeholder="0"
                        />
                      </div>
                      <div className="text-sm font-mono font-semibold w-32 text-right text-foreground">
                        {formatoCOP(subtotal)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Cuadre y Observaciones */}
          <div className="space-y-6">
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-semibold">Resumen de Cuadre</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Saldo Sistema</span>
                  <span className="font-mono font-medium text-foreground">{formatoCOP(saldoSistema)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total Contado</span>
                  <span className="font-mono font-medium text-foreground">{formatoCOP(totalContado)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Diferencia</span>
                  <span className={`font-mono font-bold text-base ${
                    diferencia === 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : diferencia > 0 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {diferencia > 0 ? '+' : ''}{formatoCOP(diferencia)}
                  </span>
                </div>
                
                {diferencia !== 0 && (
                  <div className={`text-xs p-3 rounded-lg border ${
                    diferencia > 0 
                      ? 'bg-amber-50/50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50' 
                      : 'bg-rose-50/50 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-900/50'
                  }`}>
                    {diferencia > 0 
                      ? 'Hay un sobrante de efectivo en caja con respecto al saldo esperado.' 
                      : 'Hay un faltante de efectivo en caja con respecto al saldo esperado.'}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border">
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Observaciones</Label>
                  <textarea
                    value={data.observaciones}
                    onChange={(e) => setData('observaciones', e.target.value)}
                    placeholder="Escribe aquí notas sobre sobrantes, faltantes o detalles del arqueo..."
                    className="w-full min-h-[80px] rounded-lg border border-input bg-background p-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  {errors.observaciones && <p className="text-xs text-destructive">{errors.observaciones}</p>}
                </div>

                {errors.detalles && <p className="text-xs text-destructive">{errors.detalles}</p>}

                <div className="flex gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => window.history.back()} 
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={processing} 
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {processing ? 'Registrando...' : 'Registrar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  )
}
