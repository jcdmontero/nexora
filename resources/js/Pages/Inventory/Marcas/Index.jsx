import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Badge } from '@/Components/ui/badge'
import { Tag, Plus, Search, Pencil, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/Components/ui/alert-dialog"
import { usePermissions } from '@/Hooks/usePermissions'
import MarcaFormModal from './MarcaFormModal'

export default function MarcasIndex({ marcas, filters }) {
  const { can } = usePermissions()
  const [search, setSearch] = useState(filters.search || '')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMarca, setEditingMarca] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null)

  const confirmDelete = () => {
    if (itemToDelete) {
      router.delete(route('inventory.marcas.destroy', itemToDelete.id), {
        preserveScroll: true,
        onSuccess: () => setItemToDelete(null),
      })
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    router.get(route('inventory.marcas.index'), { search }, { preserveState: true })
  }

  const columns = [
    {
      header: 'Nombre de Marca',
      accessorKey: 'nombre',
      cell: (row) => <span className="font-medium text-foreground">{row.nombre}</span>,
    },
    {
      header: 'Estado',
      accessorKey: 'is_active',
      cell: (row) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'} className={row.is_active ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : ''}>
          {row.is_active ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
    {
      header: '',
      id: 'actions',
      alignEnd: true,
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          {can('inventory:edit') && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => {
                setEditingMarca(row)
                setIsModalOpen(true)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('inventory:delete') && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setItemToDelete(row)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Marcas de Inventario" />

      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Marcas</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Fabricantes o marcas comerciales de tus productos.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar marca..."
                className="w-full bg-card pl-9 shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            {can('inventory:create') && (
              <Button size="sm" className="h-9 shrink-0" onClick={() => {
                setEditingMarca(null)
                setIsModalOpen(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Marca
              </Button>
            )}
          </div>
        </div>

        <Card className="border-border shadow-sm overflow-hidden bg-card">
          {marcas.data.length > 0 ? (
            <DataTable
              columns={columns}
              data={marcas.data}
              rowKey={(row) => row.id}
            />
          ) : (
            <EmptyState
              icon={Tag}
              title={search ? 'No se encontraron marcas' : 'Catálogo de marcas vacío'}
              description={
                search 
                  ? 'Intenta con otro término de búsqueda.'
                  : 'Aún no has registrado ninguna marca. Comienza creando tu primera marca comercial.'
              }
              action={
                can('inventory:create') && !search
                  ? { label: 'Crear Primera Marca', onClick: () => {
                      setEditingMarca(null)
                      setIsModalOpen(true)
                    } 
                  }
                  : undefined
              }
              className="py-20"
            />
          )}
        </Card>
      </div>

      <MarcaFormModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false)
          setEditingMarca(null)
        }} 
        marca={editingMarca}
      />

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar marca?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la marca de forma permanente. 
              Si esta marca tiene productos asociados, la acción fallará para evitar inconsistencias.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthenticatedLayout>
  )
}
