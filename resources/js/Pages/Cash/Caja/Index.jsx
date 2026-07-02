import { useState } from 'react'
import { router, useForm, Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Pagination } from '@/Components/ui/pagination'
import { PageHeader } from '@/Components/ui/page-header'
import { Wallet, LockOpen, Lock, Calculator, CheckCircle2, ArrowDownCircle, ArrowUpCircle, Printer } from 'lucide-react'
import { usePermissions } from '@/Hooks/usePermissions'

export default function CajaIndex({ sesionActiva, cajasDisponibles, movimientos = [], historial }) {
  const { can } = usePermissions()
  
  const { data: openData, setData: setOpenData, post: postOpen, processing: opening, errors: openErrors } = useForm({
    caja_id: cajasDisponibles.length > 0 ? cajasDisponibles[0].id.toString() : '',
    saldo_inicial: '0.00',
  })

  const { data: closeData, setData: setCloseData, post: postClose, processing: closing, errors: closeErrors } = useForm({
    saldo_final: '',
    notas: '',
  })

  const handleOpen = (e) => {
    e.preventDefault()
    postOpen(route('cash.caja.abrir'), { preserveScroll: true })
  }

  const handleClose = (e) => {
    e.preventDefault()
    if (confirm('¿Estás seguro de cerrar la caja? Este turno no podrá reabrirse.')) {
      postClose(route('cash.caja.cerrar', sesionActiva.id), { preserveScroll: true })
    }
  }

  const handlePageChange = (page) => {
    router.get(route('cash.caja.index'), { page }, { preserveState: true, preserveScroll: true })
  }

  const columns = [
    { 
      key: 'caja.nombre', 
      header: 'Caja', 
      cell: (s) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{s.caja.nombre}</p>
          {s.caja.sede && <p className="text-xs text-muted-foreground">{s.caja.sede.nombre}</p>}
        </div>
      )
    },
    { key: 'usuario.name', header: 'Cajero', cell: (s) => s.usuario?.name ?? '—' },
    { 
      key: 'fecha_apertura', 
      header: 'Apertura', 
      cell: (s) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">{new Date(s.fecha_apertura).toLocaleDateString()}</p>
          <p className="text-muted-foreground">{new Date(s.fecha_apertura).toLocaleTimeString()}</p>
        </div>
      ) 
    },
    { key: 'saldo_inicial', header: 'Apertura ($)', cell: (s) => `$${Number(s.saldo_inicial).toLocaleString()}` },
    { 
      key: 'fecha_cierre', 
      header: 'Cierre', 
      cell: (s) => s.fecha_cierre ? (
        <div className="text-xs">
          <p className="font-medium text-foreground">{new Date(s.fecha_cierre).toLocaleDateString()}</p>
          <p className="text-muted-foreground">{new Date(s.fecha_cierre).toLocaleTimeString()}</p>
        </div>
      ) : <span className="text-muted-foreground text-xs">—</span>
    },
    { key: 'saldo_final', header: 'Cierre ($)', cell: (s) => s.saldo_final ? `$${Number(s.saldo_final).toLocaleString()}` : <span className="text-muted-foreground">—</span> },
    { 
      key: 'estado', 
      header: 'Estado', 
      cell: (s) => (
        <Badge variant={s.estado === 'abierta' ? 'default' : 'outline'} className={s.estado === 'abierta' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
          {s.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
        </Badge>
      ) 
    },
    {
      key: 'arqueado',
      header: 'Arqueo',
      cell: (s) => s.arqueado ? (
        <Badge variant="secondary" className="gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Arqueada
        </Badge>
      ) : s.estado === 'cerrada' ? (
        <Badge variant="outline" className="text-amber-600 border-amber-200 dark:border-amber-900/50">
          Pendiente
        </Badge>
      ) : <span className="text-muted-foreground text-xs">—</span>
    },
    {
      key: 'acciones',
      header: 'Acciones',
      alignEnd: true,
      cell: (s) => {
        if (s.estado === 'cerrada' && !s.arqueado && can('cash:close')) {
          return (
            <Link
              href={route('cash.arqueo.create', s.id)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold shadow-sm transition-colors hover:bg-muted text-foreground"
            >
              <Calculator className="h-3.5 w-3.5" />
              Arquear
            </Link>
          )
        }
        return null
      }
    }
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Turno de Caja" />
      
      <PageHeader
        title="Turno de Caja"
        description="Gestiona tus turnos de caja, aperturas, cierres y arqueos de efectivo."
        icon={Wallet}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Activo / Apertura */}
        <div className="lg:col-span-1">
          {!sesionActiva ? (
            <Card className="shadow-sm border-border">
              <CardHeader className="bg-indigo-50/20 dark:bg-indigo-950/10 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-base">
                  <LockOpen className="h-4.5 w-4.5" /> Abrir Turno
                </CardTitle>
                <CardDescription>Inicia tu turno de caja para registrar transacciones y movimientos.</CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                {cajasDisponibles.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-6">
                    No hay cajas disponibles en este momento.
                  </div>
                ) : (
                  <form onSubmit={handleOpen} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Caja Registradora</Label>
                      <Select value={openData.caja_id} onValueChange={(val) => setOpenData('caja_id', val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {cajasDisponibles.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.nombre} {c.sede ? `— ${c.sede}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {openErrors.caja_id && <p className="text-xs text-destructive">{openErrors.caja_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Saldo Inicial en Efectivo ($)</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={openData.saldo_inicial}
                        onChange={e => setOpenData('saldo_inicial', e.target.value)}
                        placeholder="0.00"
                        className="font-medium"
                      />
                      {openErrors.saldo_inicial && <p className="text-xs text-destructive">{openErrors.saldo_inicial}</p>}
                    </div>

                    <Button type="submit" disabled={opening} className="w-full">
                      {opening ? 'Abriendo...' : 'Abrir Caja'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-border border-emerald-100 dark:border-emerald-950">
              <CardHeader className="bg-emerald-50/20 dark:bg-emerald-950/10 border-b pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-base">
                    <Lock className="h-4.5 w-4.5" /> Turno Activo
                  </CardTitle>
                  <Badge className="bg-emerald-500 hover:bg-emerald-600">{sesionActiva.caja.nombre}</Badge>
                </div>
                <CardDescription>
                  Iniciado el: {new Date(sesionActiva.fecha_apertura).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Saldo Inicial</span>
                  <span className="font-mono font-semibold text-foreground">
                    ${Number(sesionActiva.saldo_inicial).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Ingresos</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    + ${Number(sesionActiva.ingresos_totales || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Egresos</span>
                  <span className="font-mono font-semibold text-rose-600">
                    − ${Number(sesionActiva.egresos_totales || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b-2 border-border">
                  <span className="text-sm font-bold text-foreground">Saldo Total</span>
                  <span className="font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    ${(Number(sesionActiva.saldo_inicial || 0) + Number(sesionActiva.ingresos_totales || 0) - Number(sesionActiva.egresos_totales || 0)).toLocaleString()}
                  </span>
                </div>
                
                <form onSubmit={handleClose} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      Efectivo en Caja (Cierre) <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={closeData.saldo_final}
                      onChange={e => setCloseData('saldo_final', e.target.value)}
                      placeholder="Ingresa el dinero físico contado..."
                      className="font-medium"
                    />
                    {closeErrors.saldo_final && <p className="text-xs text-destructive">{closeErrors.saldo_final}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Observaciones de Cierre</Label>
                    <textarea
                      value={closeData.notas}
                      onChange={e => setCloseData('notas', e.target.value)}
                      placeholder="Anota cualquier novedad, faltantes o sobrantes..."
                      className="w-full min-h-[60px] rounded-lg border border-input bg-background p-2.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  <Button type="submit" variant="destructive" disabled={closing} className="w-full">
                    {closing ? 'Cerrando...' : 'Cerrar Turno de Caja'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Historial General */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-border h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Historial de Sesiones</CardTitle>
              <CardDescription>Registro de aperturas, cierres y arqueos de todas las cajas</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
              {historial.data.length > 0 ? (
                <>
                  <div className="border-t border-border/60">
                    <DataTable columns={columns} data={historial.data} />
                  </div>
                  <Pagination 
                    page={historial.current_page} 
                    totalPages={historial.last_page} 
                    onPage={handlePageChange} 
                  />
                </>
              ) : (
                <div className="py-12 border-t">
                  <EmptyState 
                    icon={Wallet}
                    title="Sin Historial"
                    description="No se han registrado aperturas de caja todavía."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Movimientos de la sesión activa */}
      {sesionActiva && movimientos.length > 0 && (
        <div className="mt-6">
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Movimientos del Turno</CardTitle>
                  <CardDescription>
                    Ingresos y egresos registrados — {movimientos.length} movimiento{movimientos.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-emerald-600 font-semibold">
                    + ${movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0).toLocaleString()}
                  </span>
                  <span className="text-rose-600 font-semibold">
                    − ${movimientos.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {movimientos.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`shrink-0 rounded-full p-1.5 ${m.tipo === 'ingreso' ? 'bg-emerald-100 dark:bg-emerald-950/30' : 'bg-rose-100 dark:bg-rose-950/30'}`}>
                      {m.tipo === 'ingreso' ? (
                        <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <ArrowUpCircle className="h-4 w-4 text-rose-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.concepto}</p>
                      <p className="text-xs text-muted-foreground">{m.fecha} · {m.metodo_pago}{m.referencia ? ` · ${m.referencia}` : ''}</p>
                    </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold tabular-nums ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {m.tipo === 'ingreso' ? '+' : '−'} ${m.monto.toLocaleString()}
                        </span>
                        {m.recibo_id && (
                          <a
                            href={route('cash.recibos.pdf', m.recibo_id)}
                            target="_blank"
                            title="Imprimir ticket de abono"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AuthenticatedLayout>
  )
}
