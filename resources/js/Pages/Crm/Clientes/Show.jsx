import { useState } from 'react'
import { Link, router, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { DataTable } from '@/Components/ui/data-table'
import { ArrowLeft, UserPlus, Briefcase, Plus, Trash2, Pencil } from 'lucide-react'
import { usePermissions } from '@/Hooks/usePermissions'
import ContactoModal from './ContactoModal'
import OportunidadModal from '../Oportunidades/OportunidadModal'

export default function ClienteShow({ cliente }) {
  const { can } = usePermissions()
  const [isContactoModalOpen, setIsContactoModalOpen] = useState(false)
  const [editingContacto, setEditingContacto] = useState(null)
  
  const [isOportunidadModalOpen, setIsOportunidadModalOpen] = useState(false)
  const [editingOportunidad, setEditingOportunidad] = useState(null)

  const deleteContacto = (id) => {
    if (confirm('¿Eliminar este contacto?')) {
      router.delete(route('crm.contactos.destroy', id), { preserveScroll: true })
    }
  }

  const contactoColumns = [
    { key: 'nombre', header: 'Nombre', className: 'font-medium' },
    { key: 'cargo', header: 'Cargo', cell: (c) => c.cargo || '—' },
    { key: 'email', header: 'Email', cell: (c) => c.email || '—' },
    { key: 'telefono', header: 'Teléfono', cell: (c) => c.telefono || '—' },
    {
      key: 'is_principal',
      header: 'Rol',
      cell: (c) => c.is_principal ? <Badge variant="default">Principal</Badge> : <Badge variant="outline">Adicional</Badge>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      alignEnd: true,
      cell: (c) => (
        <div className="flex gap-2 justify-end">
          {can('crm:edit') && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => { setEditingContacto(c); setIsContactoModalOpen(true); }}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('crm:delete') && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteContacto(c.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const oportunidadColumns = [
    { 
        key: 'titulo', 
        header: 'Oportunidad', 
        className: 'font-medium',
        cell: (o) => (
            <span 
                className="cursor-pointer hover:underline hover:text-primary" 
                onClick={() => {
                    if (can('crm:edit')) {
                        setEditingOportunidad(o); 
                        setIsOportunidadModalOpen(true);
                    }
                }}
            >
                {o.titulo}
            </span>
        )
    },
    { key: 'valor_estimado', header: 'Valor', cell: (o) => `$${Number(o.valor_estimado).toLocaleString()}` },
    { key: 'etapa', header: 'Etapa', cell: (o) => <Badge variant="outline" className="capitalize">{o.etapa}</Badge> },
    { key: 'fecha_cierre_esperada', header: 'Cierre', cell: (o) => o.fecha_cierre_esperada || '—' },
    { key: 'probabilidad', header: 'Prob.', cell: (o) => `${o.probabilidad}%` },
  ]

  return (
    <AuthenticatedLayout>
      <div className="flex items-center gap-4 mb-6">
        <Link href={route('crm.clientes.index')}>
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            {cliente.nombre_completo}
            {cliente.activo ? <Badge>Activo</Badge> : <Badge variant="destructive">Inactivo</Badge>}
          </h2>
          <p className="text-muted-foreground">{cliente.documento}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info lateral */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Tipo</p>
                <p className="font-medium capitalize">{cliente.tipo}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{cliente.email || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Teléfono</p>
                <p className="font-medium">{cliente.telefono || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Dirección</p>
                <p className="font-medium">{cliente.direccion || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ciudad</p>
                <p className="font-medium">{cliente.ciudad || '—'}</p>
              </div>
              {cliente.notas && (
                <div>
                  <p className="text-muted-foreground">Notas</p>
                  <p className="font-medium text-xs mt-1 bg-muted p-2 rounded-md">{cliente.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Listados */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Contactos</CardTitle>
                <CardDescription>Personas asociadas a este cliente</CardDescription>
              </div>
              {can('crm:create') && (
                <Button size="sm" variant="outline" className="gap-2" onClick={() => { setEditingContacto(null); setIsContactoModalOpen(true); }}>
                    <Plus className="h-4 w-4" /> Añadir
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {cliente.contactos?.length > 0 ? (
                <DataTable columns={contactoColumns} data={cliente.contactos} />
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                  No hay contactos registrados.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Oportunidades</CardTitle>
                <CardDescription>Negociaciones activas y pasadas</CardDescription>
              </div>
              <div className="flex gap-2">
                  {can('crm:create') && (
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => { setEditingOportunidad(null); setIsOportunidadModalOpen(true); }}>
                          <Plus className="h-4 w-4" /> Añadir
                      </Button>
                  )}
                  <Link href={route('crm.oportunidades.index')}>
                    <Button size="sm" variant="secondary">Ver pipeline</Button>
                  </Link>
              </div>
            </CardHeader>
            <CardContent>
              {cliente.oportunidades?.length > 0 ? (
                <DataTable columns={oportunidadColumns} data={cliente.oportunidades} />
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                  No hay oportunidades comerciales registradas.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ContactoModal 
        isOpen={isContactoModalOpen}
        onClose={() => setIsContactoModalOpen(false)}
        clienteId={cliente.id}
        contacto={editingContacto}
      />

      <OportunidadModal 
        isOpen={isOportunidadModalOpen}
        onClose={() => setIsOportunidadModalOpen(false)}
        clienteId={cliente.id}
        oportunidad={editingOportunidad}
      />
    </AuthenticatedLayout>
  )
}
