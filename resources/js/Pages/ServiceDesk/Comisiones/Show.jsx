import { useState } from 'react'
import { router, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { ArrowLeft, DollarSign, CheckCircle2, CreditCard, FileText, UserCircle2, CalendarDays, Wrench } from 'lucide-react'

const money = (n) => '$' + Number(n || 0).toLocaleString('es-CO')

const ESTADO_STYLES = {
  BORRADOR: { label: 'Borrador', class: 'bg-slate-100 text-slate-700' },
  APROBADO: { label: 'Aprobado', class: 'bg-blue-100 text-blue-700' },
  PAGADO: { label: 'Pagado', class: 'bg-emerald-100 text-emerald-700' },
  ANULADO: { label: 'Anulado', class: 'bg-rose-100 text-rose-700' },
}

export default function ComisionesShow({ liquidacion }) {
  const [showPay, setShowPay] = useState(false)
  const { data: pData, setData: setPData, post: postPay, processing: pLoading } = useForm({
    metodo_pago: '',
    referencia_pago: '',
  })

  const estadoCfg = ESTADO_STYLES[liquidacion.estado] || {}
  const totalDetalles = liquidacion.detalles?.reduce((s, d) => s + Number(d.valor_comision), 0) || 0
  const pagos = liquidacion.pagos || []

  const handleApprove = () => {
    if (!confirm('¿Aprobar esta liquidación? Se generará una cuenta por pagar.')) return
    router.post(route('service-desk.comisiones.approve', liquidacion.id), {}, { preserveScroll: true })
  }

  const handlePay = (e) => {
    e.preventDefault()
    postPay(route('service-desk.comisiones.pay', liquidacion.id), { preserveScroll: true, onSuccess: () => setShowPay(false) })
  }

  return (
    <AuthenticatedLayout>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.get(route('service-desk.comisiones.index'))}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" /> {liquidacion.codigo}
            </h2>
            <Badge variant="outline" className={estadoCfg.class}>{estadoCfg.label}</Badge>
          </div>
          <p className="text-muted-foreground">
            {liquidacion.periodo_inicio} al {liquidacion.periodo_fin}
          </p>
        </div>
        <div className="flex gap-2">
          {liquidacion.estado === 'BORRADOR' && (
            <Button onClick={handleApprove} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <CheckCircle2 className="h-4 w-4" /> Aprobar
            </Button>
          )}
          {liquidacion.estado === 'APROBADO' && (
            <Button onClick={() => setShowPay(!showPay)} className="gap-2">
              <CreditCard className="h-4 w-4" /> {showPay ? 'Cancelar' : 'Registrar Pago'}
            </Button>
          )}
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={() => window.open(route('service-desk.comisiones.pdf', liquidacion.id), '_blank')}
          >
            <FileText className="h-4 w-4" /> Descargar Finiquito
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-3 rounded-xl"><UserCircle2 className="h-8 w-8 text-primary" /></div>
                <div>
                  <p className="font-semibold">{liquidacion.prestador?.nombre_completo || '—'}</p>
                  <Badge variant="outline" className="text-xs">
                    {liquidacion.prestador?.tipo_vinculacion || '—'}
                  </Badge>
                </div>
              </div>
              {liquidacion.prestador?.porcentaje_comision && (
                <p className="text-sm text-muted-foreground">Comisión por defecto: {liquidacion.prestador.porcentaje_comision}%</p>
              )}
              {liquidacion.observaciones && (
                <div className="mt-3 p-3 bg-muted/30 rounded-lg text-sm">
                  <p className="text-muted-foreground">{liquidacion.observaciones}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {(liquidacion.aprobado_por || liquidacion.fecha_aprobacion) && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Aprobación</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                {liquidacion.aprobado_por && <p>Aprobado por: <strong>{liquidacion.aprobado_por.name}</strong></p>}
                {liquidacion.fecha_aprobacion && <p className="text-muted-foreground">{new Date(liquidacion.fecha_aprobacion).toLocaleString()}</p>}
              </CardContent>
            </Card>
          )}

          {pagos.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Pagos</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {pagos.map((pago, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className={pago.estado === 'PAGADO' ? 'text-emerald-600 font-medium' : ''}>
                      {pago.estado === 'PAGADO' ? '✅ Pagado' : '⏳ Pendiente'}
                    </span>
                    <span className="tabular-nums font-medium">{money(pago.monto)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {showPay && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Registrar Pago</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handlePay} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Método de pago</Label>
                    <select value={pData.metodo_pago} onChange={(e) => setPData('metodo_pago', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                      <option value="">Seleccionar…</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="nequi">Nequi</option>
                      <option value="daviplata">Daviplata</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Referencia</Label>
                    <Input value={pData.referencia_pago} onChange={(e) => setPData('referencia_pago', e.target.value)} placeholder="N° de transferencia o comprobante" />
                  </div>
                  <Button type="submit" disabled={pLoading} className="w-full gap-2">
                    <CreditCard className="h-4 w-4" /> {pLoading ? 'Guardando…' : `Pagar ${money(liquidacion.total_comisiones)}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Panel derecho: Detalles */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Detalle de Comisiones</span>
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{money(liquidacion.total_comisiones)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {liquidacion.detalles?.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Sin detalles</div>
              ) : (
                <div className="divide-y">
                  {liquidacion.detalles.map((det, i) => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/20">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <p className="text-sm font-medium truncate">{det.concepto}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          OT {det.orden?.numero_orden || '—'}
                          {det.porcentaje_comision ? ` · ${det.porcentaje_comision}%` : ''}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-semibold tabular-nums">{money(det.valor_comision)}</p>
                        <p className="text-xs text-muted-foreground">base: {money(det.base_calculo)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
