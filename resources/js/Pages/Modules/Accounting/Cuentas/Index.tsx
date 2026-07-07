import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Card } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { Calculator, Plus, Search } from 'lucide-react'
import { usePermissions } from '@/Hooks/usePermissions'
import CuentaFormModal from './CuentaFormModal'

export default function CuentasIndex({ cuentas, filters }) {
  const { can } = usePermissions()
  const [search, setSearch] = useState(filters.search || '')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    router.get(route('accounting.cuentas.index'), { search }, { preserveState: true })
  }

  const columns = [
    {
      key: 'codigo',
      header: 'Código PUC',
      className: 'w-[120px] font-medium',
    },
    {
      key: 'nombre',
      header: 'Nombre de la Cuenta',
      className: 'font-medium',
    },
    {
      key: 'tipo',
      header: 'Naturaleza',
      className: 'w-[150px]',
      cell: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.tipo} / {row.naturaleza || 'debito'}
        </Badge>
      )
    },
    {
      key: 'nivel',
      header: 'Nivel',
      hideOnMobile: true,
      cell: (row) => <span className="font-mono text-sm">{row.nivel || 1}</span>
    },
    {
      key: 'acepta_movimientos',
      header: 'Movimientos',
      hideOnMobile: true,
      cell: (row) => (
        <Badge variant={row.acepta_movimientos ? "default" : "secondary"}>
          {row.acepta_movimientos ? 'Sí' : 'No (Agrupadora)'}
        </Badge>
      )
    }
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Plan de Cuentas" />

      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Plan de Cuentas</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona la estructura contable y agrupadora de la empresa.
            </p>
          </div>
          
          <div className="flex w-full sm:w-auto items-center gap-3">
            <form onSubmit={handleSearch} className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar cuenta..."
                className="pl-9 h-9 w-full rounded-md bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            {can('accounting:create') && (
              <Button size="sm" className="h-9 shrink-0" onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cuenta
              </Button>
            )}
          </div>
        </div>

        {/* Content Section */}
        <Card className="border-border shadow-sm overflow-hidden bg-card">
          {cuentas.data.length > 0 ? (
            <DataTable
              columns={columns}
              data={cuentas.data}
              rowKey={(row) => row.id}
            />
          ) : (
            <EmptyState
              icon={Calculator}
              title={search ? 'No se encontraron cuentas' : 'Plan de cuentas vacío'}
              description={
                search 
                  ? 'Intenta con otro código o nombre de cuenta.'
                  : 'Aún no has configurado el plan único de cuentas (PUC) para esta empresa.'
              }
              action={
                can('accounting:create') && !search
                  ? { label: 'Crear Primera Cuenta', onClick: () => setIsModalOpen(true) }
                  : undefined
              }
              className="py-20"
            />
          )}
        </Card>
      </div>

      <CuentaFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </AuthenticatedLayout>
  )
}
