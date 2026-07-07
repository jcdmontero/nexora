import { useState } from 'react'
import { useForm, router, Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { PageHeader } from '@/Components/ui/page-header'
import { Pagination } from '@/Components/ui/pagination'
import { ArrowLeftRight, Plus, ArrowRight } from 'lucide-react'

export default function TransferenciasIndex({ cajas, transferencias }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    caja_origen_id: '',
    caja_destino_id: '',
    monto: '',
    concepto: '',
  })

  const submit = (e) => {
    e.preventDefault()
    post(route('cash.transferencias.store'), {
      onSuccess: () => reset('monto', 'concepto'),
      preserveScroll: true,
    })
  }

  const handlePageChange = (page) => {
    router.get(route('cash.transferencias.index'), { page }, { preserveState: true, preserveScroll: true })
  }

  const columns = [
    { 
      key: 'created_at', 
      header: 'Fecha', 
      cell: (t) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">{new Date(t.created_at).toLocaleDateString()}</p>
          <p className="text-muted-foreground">{new Date(t.created_at).toLocaleTimeString()}</p>
        </div>
      ) 
    },
    { 
      key: 'origen_destino', 
      header: 'Origen → Destino', 
      cell: (t) => (
        <span className="flex items-center gap-1.5 text-sm">
          <span className="font-medium text-muted-foreground">{t.caja_origen.nombre}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground">{t.caja_destino.nombre}</span>
        </span>
      ) 
    },
    { 
      key: 'monto', 
      header: 'Monto ($)', 
      cell: (t) => (
        <span className="font-mono font-semibold text-foreground">${Number(t.monto).toLocaleString()}</span>
      ) 
    },
    { key: 'concepto', header: 'Concepto', cell: (t) => t.concepto ?? <span className="text-muted-foreground text-xs">—</span> },
    { key: 'usuario.name', header: 'Registrado por', cell: (t) => t.usuario?.name ?? '—' },
    { 
      key: 'estado', 
      header: 'Estado', 
      cell: (t) => (
        <Badge variant={t.estado === 'completada' ? 'default' : 'outline'} className={t.estado === 'completada' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
          {t.estado === 'completada' ? 'Completada' : 'Anulada'}
        </Badge>
      ) 
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Transferencias de Efectivo" />
      
      <PageHeader
        title="Transferencias de Efectivo"
        description="Transfiere dinero de forma segura entre diferentes cajas registradoras activas."
        icon={ArrowLeftRight}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <Card className="lg:col-span-1 h-fit shadow-sm border-border">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Plus className="h-4.5 w-4.5" /> Nueva Transferencia
            </CardTitle>
            <CardDescription>
              La caja de origen debe tener un turno abierto para egresar el dinero.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Caja de Origen <span className="text-destructive">*</span></Label>
                <Select value={data.caja_origen_id} onValueChange={(v) => setData('caja_origen_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona origen..." /></SelectTrigger>
                  <SelectContent>
                    {cajas.filter((c) => c.activa).map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.caja_origen_id && <p className="text-xs text-destructive">{errors.caja_origen_id}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Caja de Destino <span className="text-destructive">*</span></Label>
                <Select value={data.caja_destino_id} onValueChange={(v) => setData('caja_destino_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona destino..." /></SelectTrigger>
                  <SelectContent>
                    {cajas.filter((c) => c.activa).map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.caja_destino_id && <p className="text-xs text-destructive">{errors.caja_destino_id}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Monto a Transferir ($) <span className="text-destructive">*</span></Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  value={data.monto}
                  onChange={(e) => setData('monto', e.target.value)} 
                  placeholder="0.00" 
                  className="font-medium"
                />
                {errors.monto && <p className="text-xs text-destructive">{errors.monto}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Concepto</Label>
                <Input 
                  value={data.concepto} 
                  onChange={(e) => setData('concepto', e.target.value)}
                  placeholder="Ej. Traslado de efectivo para sencillo..." 
                />
              </div>

              <Button type="submit" disabled={processing} className="w-full gap-2 pt-2">
                <ArrowRight className="h-4 w-4" /> Transferir Efectivo
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Historial */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-border h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Historial de Transferencias</CardTitle>
              <CardDescription>Registro histórico de traslados de efectivo realizados</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
              {transferencias.data.length > 0 ? (
                <>
                  <div className="border-t border-border/60">
                    <DataTable columns={columns} data={transferencias.data} />
                  </div>
                  <Pagination 
                    page={transferencias.current_page} 
                    totalPages={transferencias.last_page} 
                    onPage={handlePageChange} 
                  />
                </>
              ) : (
                <div className="py-12 border-t">
                  <EmptyState 
                    icon={ArrowLeftRight} 
                    title="Sin transferencias"
                    description="No se han registrado traslados entre cajas todavía." 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
