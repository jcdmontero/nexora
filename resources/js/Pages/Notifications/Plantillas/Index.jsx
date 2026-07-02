import { useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'
import { PageHeader } from '@/Components/ui/page-header'
import { Modal } from '@/Components/ui/modal'
import { Field } from '@/Components/ui/form-section'
import { usePermissions } from '@/Hooks/usePermissions'
import { Mail, MessageCircle, Send, Pencil, FileText } from 'lucide-react'

const canalMeta = { email: { label: 'Correo', icon: Mail }, whatsapp: { label: 'WhatsApp', icon: MessageCircle }, telegram: { label: 'Telegram', icon: Send } }

export default function PlantillasIndex({ plantillas = [], canales = [], variables = [] }) {
  const { can } = usePermissions()
  const [editing, setEditing] = useState(null)
  const { data, setData, put, processing, errors, reset } = useForm({
    nombre: '', asunto: '', contenido: '', canales: [], activo: true,
  })

  const abrir = (p) => {
    setData({ nombre: p.nombre, asunto: p.asunto || '', contenido: p.contenido, canales: p.canales || [], activo: p.activo })
    setEditing(p)
  }
  const cerrar = () => { setEditing(null); reset() }
  const toggleCanal = (c) => setData('canales', data.canales.includes(c) ? data.canales.filter((x) => x !== c) : [...data.canales, c])

  const submit = (e) => {
    e.preventDefault()
    put(route('notifications.plantillas.update', editing.id), { preserveScroll: true, onSuccess: cerrar })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Plantillas de notificación" />
      <PageHeader
        title="Plantillas de notificación"
        description="Personaliza los mensajes que se envían a tus clientes en cada evento."
        icon={FileText}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plantillas.map((p) => (
          <div key={p.id} className="flex flex-col rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground">{p.nombre}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.asunto}</p>
              </div>
              <Badge variant={p.activo ? 'default' : 'outline'}>{p.activo ? 'Activa' : 'Inactiva'}</Badge>
            </div>
            <p className="mt-3 line-clamp-3 flex-1 whitespace-pre-line text-sm text-muted-foreground">{p.contenido}</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {(p.canales || []).map((c) => {
                  const Icon = canalMeta[c]?.icon || Mail
                  return <Icon key={c} className="h-4 w-4 text-muted-foreground" title={canalMeta[c]?.label} />
                })}
              </div>
              {can('notifications:manage') && (
                <button onClick={() => abrir(p)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted">
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={editing !== null}
        onClose={cerrar}
        title="Editar plantilla"
        description="Usa variables entre llaves; se reemplazan al enviar."
        icon={FileText}
        className="max-w-2xl"
        footer={
          <>
            <button type="button" onClick={cerrar} className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted">Cancelar</button>
            <button type="submit" form="plantilla-form" disabled={processing} className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {processing ? 'Guardando…' : 'Guardar'}
            </button>
          </>
        }
      >
        <form id="plantilla-form" onSubmit={submit} className="space-y-4">
          <Field label="Nombre" htmlFor="nombre" required error={errors.nombre}>
            <Input id="nombre" value={data.nombre} onChange={(e) => setData('nombre', e.target.value)} required />
          </Field>
          <Field label="Asunto (correo)" htmlFor="asunto" error={errors.asunto}>
            <Input id="asunto" value={data.asunto} onChange={(e) => setData('asunto', e.target.value)} />
          </Field>
          <Field label="Mensaje" htmlFor="contenido" required error={errors.contenido}>
            <textarea id="contenido" value={data.contenido} onChange={(e) => setData('contenido', e.target.value)} rows={6} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required />
          </Field>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Canales</p>
            <div className="flex flex-wrap gap-2">
              {canales.map((c) => {
                const Icon = canalMeta[c]?.icon || Mail
                const sel = data.canales.includes(c)
                return (
                  <button key={c} type="button" onClick={() => toggleCanal(c)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${sel ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/50'}`}>
                    <Icon className="h-4 w-4" /> {canalMeta[c]?.label || c}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Variables disponibles</p>
            <div className="flex flex-wrap gap-1.5">
              {variables.map((v) => (
                <code key={v} className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-foreground">{`{${v}}`}</code>
              ))}
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3">
            <input type="checkbox" checked={data.activo} onChange={(e) => setData('activo', e.target.checked)} className="h-4 w-4 rounded border-input text-primary focus:ring-primary" />
            <span className="text-sm font-medium text-foreground">Plantilla activa</span>
          </label>
        </form>
      </Modal>
    </AuthenticatedLayout>
  )
}
