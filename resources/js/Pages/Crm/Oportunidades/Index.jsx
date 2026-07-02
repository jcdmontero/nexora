import { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Briefcase, Plus, Search, Trash2, Calendar, DollarSign, GripVertical } from 'lucide-react'
import { usePermissions } from '@/Hooks/usePermissions'
import OportunidadModal from './OportunidadModal'

export default function OportunidadesIndex({ oportunidades, clientes, filters }) {
  const [search, setSearch] = useState(filters.search || '')
  const { can } = usePermissions()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOportunidad, setEditingOportunidad] = useState(null)

  const handleSearch = (e) => {
    e.preventDefault()
    router.get(route('crm.oportunidades.index'), { search }, { preserveState: true })
  }

  const deleteOportunidad = (e, id) => {
    e.stopPropagation(); // Evitar abrir el modal
    if (confirm('¿Eliminar esta oportunidad de negocio?')) {
      router.delete(route('crm.oportunidades.destroy', id), { preserveScroll: true })
    }
  }

  const openEdit = (oportunidad) => {
      if (can('crm:edit')) {
          setEditingOportunidad(oportunidad)
          setIsModalOpen(true)
      }
  }

  const openCreate = () => {
      setEditingOportunidad(null)
      setIsModalOpen(true)
  }

  const etapas = [
    { value: 'prospecto', label: 'Prospecto', color: 'border-slate-200 bg-slate-50' },
    { value: 'calificado', label: 'Calificado', color: 'border-indigo-200 bg-indigo-50' },
    { value: 'propuesta', label: 'Propuesta', color: 'border-amber-200 bg-amber-50' },
    { value: 'negociacion', label: 'Negociación', color: 'border-blue-200 bg-blue-50' },
    { value: 'ganado', label: 'Ganado', color: 'border-emerald-200 bg-emerald-50' },
    { value: 'perdido', label: 'Perdido', color: 'border-red-200 bg-red-50' },
  ]

  // Agrupar oportunidades por etapa
  const agruparOportunidades = () => {
      const grupos = {
          prospecto: [], calificado: [], propuesta: [], negociacion: [], ganado: [], perdido: []
      };
      
      if (oportunidades?.data) {
          oportunidades.data.forEach(op => {
              if (grupos[op.etapa]) {
                  grupos[op.etapa].push(op);
              }
          });
      }
      return grupos;
  }

  const columnas = agruparOportunidades();

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="h-6 w-6 text-primary" /> Pipeline de Ventas</h2>
          <p className="text-muted-foreground">Gestiona tus negociaciones y oportunidades en un tablero visual</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <Input
                placeholder="Buscar oportunidad..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-background max-w-[250px]"
            />
            <Button type="submit" variant="secondary" size="icon"><Search className="h-4 w-4" /></Button>
            </form>

            {can('crm:create') && (
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" /> Nueva Oportunidad
                </Button>
            )}
        </div>
      </div>

      {/* Tablero Kanban */}
      <div className="flex overflow-x-auto pb-6 gap-4 min-h-[60vh] snap-x">
          {etapas.map(etapa => (
              <div key={etapa.value} className={`flex-shrink-0 w-80 rounded-xl border ${etapa.color} flex flex-col h-full snap-start`}>
                  <div className="p-3 border-b border-inherit bg-white/50 flex justify-between items-center rounded-t-xl">
                      <h3 className="font-semibold text-gray-800">{etapa.label}</h3>
                      <Badge variant="secondary" className="bg-white">{columnas[etapa.value].length}</Badge>
                  </div>
                  
                  <div className="p-3 flex-1 overflow-y-auto space-y-3">
                      {columnas[etapa.value].map(op => (
                          <Card 
                            key={op.id} 
                            className="shadow-sm cursor-pointer hover:shadow-md hover:border-primary transition-all group"
                            onClick={() => openEdit(op)}
                          >
                              <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="font-semibold text-sm leading-tight text-gray-900 line-clamp-2">
                                          {op.titulo}
                                      </div>
                                      {can('crm:delete') && (
                                        <button 
                                            onClick={(e) => deleteOportunidad(e, op.id)} 
                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                      )}
                                  </div>
                                  
                                  <Link 
                                    href={route('crm.clientes.show', op.cliente_id)} 
                                    className="text-xs text-muted-foreground hover:underline hover:text-primary block mb-3"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {op.cliente?.nombres} {op.cliente?.apellidos} {op.cliente?.razon_social}
                                  </Link>

                                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 w-fit px-2 py-1 rounded mb-3">
                                      <DollarSign className="h-3 w-3" />
                                      {Number(op.valor_estimado).toLocaleString()}
                                  </div>

                                  <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2 mt-2">
                                      <div className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {op.fecha_cierre_esperada ? op.fecha_cierre_esperada.split('T')[0] : 'Sin fecha'}
                                      </div>
                                      <div className="flex items-center gap-1">
                                          <span className="font-semibold text-gray-700">{op.probabilidad}%</span> prob.
                                      </div>
                                  </div>
                              </CardContent>
                          </Card>
                      ))}

                      {columnas[etapa.value].length === 0 && (
                          <div className="h-24 border-2 border-dashed border-gray-200/60 rounded-lg flex items-center justify-center text-xs text-gray-400 font-medium">
                              Sin oportunidades
                          </div>
                      )}
                  </div>
              </div>
          ))}
      </div>

      <OportunidadModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientes={clientes}
        oportunidad={editingOportunidad}
      />
    </AuthenticatedLayout>
  )
}
