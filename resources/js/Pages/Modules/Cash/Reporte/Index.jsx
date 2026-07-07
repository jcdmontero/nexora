import { useState } from 'react'
import { useForm, Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { DataTable } from '@/Components/ui/data-table'
import { PageHeader } from '@/Components/ui/page-header'
import { BarChart3, TrendingUp, TrendingDown, Wallet, Calendar, Building } from 'lucide-react'

function formatoCOP(v) {
  return '$ ' + new Intl.NumberFormat('es-CO').format(Math.round(v || 0))
}

export default function ReporteConsolidado({ reporte, sedes, filters }) {
  const { data, setData, get, processing } = useForm({
    desde: filters.desde || '',
    hasta: filters.hasta || '',
    sede_id: filters.sede_id || '__none__',
  })

  const filtrar = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (data.desde) params.set('desde', data.desde)
    if (data.hasta) params.set('hasta', data.hasta)
    if (data.sede_id && data.sede_id !== '__none__') params.set('sede_id', data.sede_id)
    get(route('cash.reporte.consolidado') + '?' + params.toString(), { preserveScroll: true })
  }

  const columns = [
    { 
      key: 'nombre', 
      header: 'Caja', 
      cell: (f) => <span className="font-semibold text-foreground">{f.nombre}</span> 
    },
    { 
      key: 'sede', 
      header: 'Sede / Sucursal', 
      cell: (f) => f.sede ?? <span className="text-muted-foreground text-xs">—</span> 
    },
    { 
      key: 'cajero_actual', 
      header: 'Cajero en Turno', 
      cell: (f) => f.cajero_actual ?? <span className="text-muted-foreground text-xs">Sin turno activo</span> 
    },
    { 
      key: 'sesiones_periodo', 
      header: 'Turnos (Rango)', 
      cell: (f) => (
        <span className="font-medium text-foreground">{f.sesiones_periodo} turnos</span>
      ) 
    },
    { 
      key: 'ingresos', 
      header: 'Ingresos (+)', 
      alignEnd: true, 
      cell: (f) => (
        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">+{formatoCOP(f.ingresos)}</span>
      ) 
    },
    { 
      key: 'egresos', 
      header: 'Egresos (-)', 
      alignEnd: true, 
      cell: (f) => (
        <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">-{formatoCOP(f.egresos)}</span>
      ) 
    },
    { 
      key: 'saldo_actual', 
      header: 'Saldo Actual', 
      alignEnd: true, 
      cell: (f) => (
        <span className="font-mono font-bold text-foreground">{formatoCOP(f.saldo_actual)}</span>
      ) 
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Reporte Consolidado de Cajas" />
      
      <PageHeader
        title="Reporte Consolidado de Cajas"
        description={`Resumen acumulado del flujo de efectivo para el periodo del ${reporte.desde} al ${reporte.hasta}.`}
        icon={BarChart3}
      />

      {/* KPIs consolidados */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm border-border hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <TrendingUp className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ingresos Acumulados</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{formatoCOP(reporte.totales.ingresos)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                <TrendingDown className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Egresos Acumulados</p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5">{formatoCOP(reporte.totales.egresos)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Wallet className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Efectivo en Cajas</p>
                <p className="text-2xl font-bold text-foreground font-mono mt-0.5">{formatoCOP(reporte.totales.saldo_actual)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6 shadow-sm border-border">
        <CardContent className="pt-6">
          <form onSubmit={filtrar} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Fecha Desde</Label>
              <Input type="date" value={data.desde} onChange={(e) => setData('desde', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Fecha Hasta</Label>
              <Input type="date" value={data.hasta} onChange={(e) => setData('hasta', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5"><Building className="h-3.5 w-3.5 text-muted-foreground" /> Filtrar por Sede</Label>
              <Select value={data.sede_id} onValueChange={(v) => setData('sede_id', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Todas las sedes</SelectItem>
                  {sedes.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={processing} className="w-full">
              {processing ? 'Consultando...' : 'Filtrar Reporte'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Detalle */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Desglose por Caja</CardTitle>
          <CardDescription>Resumen de transacciones individuales por caja registradora</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t border-border/60">
            <DataTable columns={columns} data={reporte.cajas} rowKey={(f) => f.id} />
          </div>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  )
}
