import { useState } from 'react'
import { useForm, router, Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/Components/ui/dialog'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { PageHeader } from '@/Components/ui/page-header'
import { ListToolbar } from '@/Components/ui/list-toolbar'
import { Pagination } from '@/Components/ui/pagination'
import { Wallet, Plus, Pencil, Trash2 } from 'lucide-react'
import { usePermissions } from '@/Hooks/usePermissions'

export default function CajasIndex({ cajas, sedes, filters }) {
  const { can } = usePermissions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchVal, setSearchVal] = useState(filters.search || '')

  const { data, setData, post, put, processing, errors, reset } = useForm({
    nombre: '',
    sede_id: '',
    activa: true,
  })

  function openCreate() {
    reset()
    setEditingId(null)
    setIsModalOpen(true)
  }

  function openEdit(caja) {
    setEditingId(caja.id)
    setData({
      nombre: caja.nombre,
      sede_id: caja.sede_id ? caja.sede_id.toString() : '',
      activa: caja.activa,
    })
    setIsModalOpen(true)
  }

  function submit(e) {
    e.preventDefault()
    const payload = {
      nombre: data.nombre,
      sede_id: data.sede_id || null,
      activa: data.activa,
    }
    const onSuccess = () => {
      setIsModalOpen(false)
      reset()
    }
    if (editingId) {
      put(route('cash.cajas.update', editingId), { 
        data: payload, 
        onSuccess, 
        preserveScroll: true 
      })
    } else {
      post(route('cash.cajas.store'), { 
        data: payload, 
        onSuccess, 
        preserveScroll: true 
      })
    }
  }

  function eliminar(caja) {
    if (confirm(`¿Eliminar la caja "${caja.nombre}"? Si tiene historial se desactivará.`)) {
      router.delete(route('cash.cajas.destroy', caja.id), { preserveScroll: true })
    }
  }

  const handleSearch = (value) => {
    setSearchVal(value)
    router.get(route('cash.cajas.index'), { search: value }, { 
      preserveState: true, 
      preserveScroll: true,
      replace: true 
    })
  }

  const handlePageChange = (page) => {
    router.get(route('cash.cajas.index'), { page, search: searchVal }, { 
      preserveState: true, 
      preserveScroll: true 
    })
  }

  const columns = [
    { 
      key: 'nombre', 
      header: 'Caja', 
      cell: (c) => <span className="font-semibold text-foreground">{c.nombre}</span> 
    },
    { key: 'sede.nombre', header: 'Sede', cell: (c) => c.sede?.nombre ?? <span className="text-muted-foreground text-xs">—</span> },
    { 
      key: 'sesion_actual.usuario.name', 
      header: 'En uso por', 
      cell: (c) => c.sesion_actual?.usuario?.name ? (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50">
          {c.sesion_actual.usuario.name}
        </Badge>
      ) : <Badge variant="secondary">Libre</Badge>
    },
    { 
      key: 'activa', 
      header: 'Estado', 
      cell: (c) => (
        <Badge variant={c.activa ? 'default' : 'outline'}>
          {c.activa ? 'Activa' : 'Inactiva'}
        </Badge>
      ) 
    },
    { 
      key: 'acciones', 
      header: 'Acciones', 
      alignEnd: true, 
      cell: (c) => (
        <div className="flex justify-end gap-1">
          {can('cash:manage') && (
            <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('cash:manage') && (
            <Button variant="ghost" size="icon" onClick={() => eliminar(c)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) 
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Administración de Cajas" />
      
      <PageHeader
        title="Administración de Cajas"
        description="Gestiona las cajas de tu negocio, asigna sedes y controla su disponibilidad."
        icon={Wallet}
        actions={
          can('cash:manage') && (
            <Button onClick={openCreate} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
              <Plus className="h-4 w-4" /> Nueva Caja
            </Button>
          )
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
        <div className="p-4">
          <ListToolbar
            search={searchVal}
            onSearch={handleSearch}
            placeholder="Buscar caja por nombre..."
            total={cajas.total}
          />
        </div>

        {cajas.data.length > 0 ? (
          <>
            <div className="border-t border-border/60">
              <DataTable columns={columns} data={cajas.data} rowKey={(c) => c.id} />
            </div>
            <Pagination 
              page={cajas.current_page} 
              totalPages={cajas.last_page} 
              onPage={handlePageChange} 
            />
          </>
        ) : (
          <div className="py-12 border-t">
            <EmptyState
              icon={Wallet}
              title="Sin cajas registradas"
              description="Crea tu primera caja registradora para empezar a registrar turnos y movimientos."
              action={can('cash:manage') ? { label: 'Crear primera caja', onClick: openCreate } : undefined}
            />
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Caja' : 'Nueva Caja'}</DialogTitle>
              <DialogDescription>
                Define los detalles de la caja registradora.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Nombre de la Caja <span className="text-destructive">*</span></Label>
                <Input
                  value={data.nombre}
                  onChange={(e) => setData('nombre', e.target.value)}
                  placeholder="Ej. Caja Principal, Caja Taller..."
                />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Sede / Sucursal</Label>
                <Select value={data.sede_id || '__none__'} onValueChange={(v) => setData('sede_id', v === '__none__' ? '' : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin sede específica (Global)</SelectItem>
                    {sedes.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sede_id && <p className="text-xs text-destructive">{errors.sede_id}</p>}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="activa"
                  type="checkbox"
                  checked={data.activa}
                  onChange={(e) => setData('activa', e.target.checked)}
                  className="rounded border-input text-primary h-4 w-4"
                />
                <Label htmlFor="activa" className="cursor-pointer text-xs font-semibold">
                  Caja activa (disponible para iniciar turnos)
                </Label>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={processing}>{editingId ? 'Guardar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  )
}
