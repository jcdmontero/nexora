import { useForm, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import ClienteForm from './ClienteForm'
import { Button } from '@/Components/ui/button'
import { ArrowLeft, Save, Info, User, Building2, Mail, Phone } from 'lucide-react'

export default function ClienteEdit({ cliente }) {
  const { data, setData, put, processing, errors } = useForm({
    tipo: cliente.tipo,
    tipo_documento: cliente.tipo_documento || '',
    numero_documento: cliente.numero_documento || '',
    nombres: cliente.nombres || '',
    apellidos: cliente.apellidos || '',
    razon_social: cliente.razon_social || '',
    nit: cliente.nit || '',
    nombre_contacto: cliente.nombre_contacto || '',
    telefono_contacto: cliente.telefono_contacto || '',
    cargo_contacto: cliente.cargo_contacto || '',
    email: cliente.email || '',
    telefono: cliente.telefono || '',
    direccion: cliente.direccion || '',
    ciudad: cliente.ciudad || '',
    notas: cliente.notas || '',
    activo: cliente.activo ?? true,
    portal_active: cliente.portal_active || false,
    password: '',
  })

  const submit = (e) => {
    e.preventDefault()
    put(route('crm.clientes.update', cliente.id))
  }

  const titulo = cliente.razon_social || `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim() || 'Cliente'
  const esEmpresa = data.tipo === 'juridico'

  return (
    <AuthenticatedLayout>
      <form onSubmit={submit} className="pb-12">
        {/* Encabezado con acciones */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Link
              href={route('crm.clientes.index')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Editar cliente</h2>
              <p className="mt-1 text-sm text-muted-foreground">Actualiza la información de {titulo}.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={route('crm.clientes.index')}>
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={processing} className="gap-2">
              <Save className="h-4 w-4" />
              {processing ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Formulario */}
          <div className="space-y-6 lg:col-span-2">
            <ClienteForm data={data} setData={setData} errors={errors} />
          </div>

          {/* Panel lateral: resumen */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    {(titulo[0] || '?').toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{titulo}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      {esEmpresa ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {esEmpresa ? 'Persona jurídica' : 'Persona natural'}
                    </p>
                  </div>
                </div>
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate text-foreground">{data.email || 'Sin correo'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="text-foreground">{data.telefono || 'Sin teléfono'}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-muted-foreground">Estado</span>
                    {data.activo
                      ? <span className="font-medium text-emerald-600">Activo</span>
                      : <span className="font-medium text-muted-foreground">Inactivo</span>}
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Info className="h-4 w-4 text-indigo-500" />
                  Recuerda
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Los cambios se aplican al guardar. Si desactivas el cliente, dejará de aparecer
                  como opción en documentos y operaciones nuevas.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </AuthenticatedLayout>
  )
}
