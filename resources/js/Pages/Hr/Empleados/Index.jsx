import { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Search, IdCard, Plus, UserCircle2 } from 'lucide-react'

export default function EmpleadosIndex({ empleados, filters }) {
  const [search, setSearch] = useState(filters.search || '')

  const handleSearch = (e) => {
    e.preventDefault()
    router.get(route('hr.empleados.index'), { search }, { preserveState: true })
  }

  const columns = [
    { 
        key: 'empleado', 
        header: 'Empleado', 
        cell: (e) => (
            <div className="flex items-center gap-3">
                <div className="bg-slate-100 rounded-full p-2 text-slate-400">
                    <UserCircle2 className="h-6 w-6" />
                </div>
                <div>
                    <Link href={route('hr.empleados.show', e.id)} className="font-semibold text-primary hover:underline">
                        {e.nombres} {e.apellidos}
                    </Link>
                    <div className="text-xs text-muted-foreground">{e.documento}</div>
                </div>
            </div>
        )
    },
    { 
        key: 'cargo', 
        header: 'Cargo Actual', 
        cell: (e) => e.contrato_activo ? e.contrato_activo.cargo : <span className="text-muted-foreground italic">Sin contrato activo</span>
    },
    { 
        key: 'salario', 
        header: 'Salario Base', 
        cell: (e) => e.contrato_activo ? `$${Number(e.contrato_activo.salario_base).toLocaleString()}` : '—'
    },
    { 
        key: 'tipo_contrato', 
        header: 'Tipo de Contrato', 
        cell: (e) => {
            if (!e.contrato_activo) return '—'
            const tipos = {
                'indefinido': 'Indefinido',
                'termino_fijo': 'Término Fijo',
                'obra_labor': 'Obra o Labor',
                'prestacion_servicios': 'Prestación Servicios'
            }
            return tipos[e.contrato_activo.tipo_contrato] || e.contrato_activo.tipo_contrato
        }
    },
    { 
        key: 'estado', 
        header: 'Estado', 
        cell: (e) => (
            <Badge variant={e.estado ? 'secondary' : 'outline'} className={e.estado ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                {e.estado ? 'Activo' : 'Inactivo'}
            </Badge>
        )
    },
  ]

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><IdCard className="h-6 w-6 text-primary" /> Nómina y Empleados</h2>
          <p className="text-muted-foreground">Gestiona la información de tu personal y sus contratos.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="flex gap-2 w-full">
            <Input
              placeholder="Buscar por nombre o documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background max-w-[250px]"
            />
            <Button type="submit" variant="secondary" size="icon"><Search className="h-4 w-4" /></Button>
          </form>
          <Link href={route('hr.empleados.create')}>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nuevo Empleado</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {empleados.data.length > 0 ? (
            <DataTable columns={columns} data={empleados.data} />
          ) : (
            <div className="py-12">
              <EmptyState
                icon={IdCard}
                title="No hay empleados"
                description="Aún no se han registrado empleados en el sistema."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  )
}
