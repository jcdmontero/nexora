import { useState, useEffect } from 'react'
import { Head, useForm, usePage } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { PageHeader } from '@/Components/ui/page-header'
import { FormSection, Field } from '@/Components/ui/form-section'
import { Input } from '@/Components/ui/input'
import {
  Building2, Receipt, SlidersHorizontal, Bell, Save, Mail, MessageCircle, Send,
  CheckCircle2, XCircle, RefreshCw, QrCode, Loader2, Calculator,
} from 'lucide-react'

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const TABS = [
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'facturacion', label: 'Facturación', icon: Receipt },
  { id: 'contabilidad', label: 'Contabilidad', icon: Calculator },
  { id: 'sistema', label: 'Sistema', icon: SlidersHorizontal },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
]

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
      <span className="text-sm">
        <span className="font-medium text-foreground">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-input text-primary focus:ring-primary" />
    </label>
  )
}

function StatusPill({ estado }) {
  if (estado === 'online' || estado === 'success') return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> En línea</span>
  if (estado === 'checking') return <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Verificando…</span>
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600"><XCircle className="h-3.5 w-3.5" /> Desconectado</span>
}

export default function TenantEdit({ tenant, config = {}, zonas = [] }) {
  const csrf = usePage().props.csrf_token
  const [tab, setTab] = useState('empresa')
  const [estados, setEstados] = useState({ whatsapp: null, telegram: null })
  const [mensajes, setMensajes] = useState({})

  const { data, setData, post, processing, errors } = useForm({
    _method: 'put',
    name: tenant.name || '',
    slug: tenant.slug || '',
    email: tenant.email || '',
    logo: null,
    config: { ...config },
  })

  const setCfg = (k, v) => setData('config', { ...data.config, [k]: v })
  const bool = (v) => v === true || v === 'true'

  const verificar = async (servicio) => {
    setEstados((s) => ({ ...s, [servicio]: 'checking' }))
    try {
      const r = await fetch(route(`core.tenant.status.${servicio}`), { headers: { Accept: 'application/json' } })
      const j = await r.json()
      setEstados((s) => ({ ...s, [servicio]: j.status }))
      setMensajes((m) => ({ ...m, [servicio]: j.message, [`${servicio}_qr`]: j.qr_url }))
    } catch {
      setEstados((s) => ({ ...s, [servicio]: 'offline' }))
      setMensajes((m) => ({ ...m, [servicio]: 'No se pudo verificar el servicio.' }))
    }
  }

  const probarTelegram = async () => {
    setMensajes((m) => ({ ...m, telegram_test: 'Enviando…' }))
    try {
      const r = await fetch(route('core.tenant.test.telegram'), {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
      })
      const j = await r.json()
      setMensajes((m) => ({ ...m, telegram_test: j.message }))
    } catch {
      setMensajes((m) => ({ ...m, telegram_test: 'Error al enviar la prueba.' }))
    }
  }

  const probarEmail = async () => {
    setMensajes((m) => ({ ...m, email_test: 'Enviando…' }))
    try {
      const r = await fetch(route('core.tenant.test.email'), {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
        body: JSON.stringify({ email: data.email || '' }),
      })
      const j = await r.json()
      setMensajes((m) => ({ ...m, email_test: j.message }))
    } catch {
      setMensajes((m) => ({ ...m, email_test: 'Error al enviar el correo de prueba.' }))
    }
  }

  useEffect(() => {
    if (tab === 'notificaciones') {
      verificar('whatsapp'); verificar('telegram')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const submit = (e) => {
    e.preventDefault()
    post(route('core.tenant.update'), { forceFormData: true, preserveScroll: true })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Configuración de la empresa" />
      <form onSubmit={submit} className="pb-12">
        <PageHeader
          title="Configuración de la empresa"
          description="Datos, facturación, sistema y canales de notificación."
          icon={Building2}
          actions={
            <button type="submit" disabled={processing} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50">
              <Save className="h-4 w-4" /> {processing ? 'Guardando…' : 'Guardar cambios'}
            </button>
          }
        />

        {/* Pestañas */}
        <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1.5">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            )
          })}
        </div>

        <div className="mx-auto max-w-3xl space-y-6">
          {/* EMPRESA */}
          {tab === 'empresa' && (
            <FormSection title="Datos de la empresa" description="Información comercial y de contacto." icon={Building2}>
              <Field label="Nombre" htmlFor="name" required error={errors.name}>
                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
              </Field>
              <Field label="Identificador (slug)" htmlFor="slug" required error={errors.slug} hint="Subdominio de acceso.">
                <Input id="slug" value={data.slug} onChange={(e) => setData('slug', e.target.value)} required />
              </Field>
              <Field label="NIT" htmlFor="nit">
                <Input id="nit" value={data.config.nit || ''} onChange={(e) => setCfg('nit', e.target.value)} placeholder="900123456-7" />
              </Field>
              <Field label="Correo de contacto" htmlFor="email" error={errors.email}>
                <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
              </Field>
              <Field label="Teléfono" htmlFor="telefono">
                <Input id="telefono" value={data.config.telefono || ''} onChange={(e) => setCfg('telefono', e.target.value)} />
              </Field>
              <Field label="Ciudad" htmlFor="ciudad">
                <Input id="ciudad" value={data.config.ciudad || ''} onChange={(e) => setCfg('ciudad', e.target.value)} />
              </Field>
              <Field label="Dirección" htmlFor="direccion" full>
                <Input id="direccion" value={data.config.direccion || ''} onChange={(e) => setCfg('direccion', e.target.value)} />
              </Field>
              <Field label="Logo" htmlFor="logo" full error={errors.logo} hint="PNG o JPG, máx 2MB.">
                <div className="flex items-center gap-4">
                  {tenant.logo && <img src={tenant.logo} alt="Logo" className="h-12 w-12 rounded-lg border border-border object-contain" />}
                  <input id="logo" type="file" accept="image/*" onChange={(e) => setData('logo', e.target.files[0])} className="text-sm" />
                </div>
              </Field>
            </FormSection>
          )}

          {/* FACTURACIÓN */}
          {tab === 'facturacion' && (
            <FormSection title="Facturación" description="Formato y numeración de las facturas." icon={Receipt}>
              <Field label="Formato de factura" htmlFor="formato_factura">
                <select id="formato_factura" value={data.config.formato_factura || 'ticket'} onChange={(e) => setCfg('formato_factura', e.target.value)} className={selectClass}>
                  <option value="ticket">Ticket (térmica)</option>
                  <option value="carta">Carta / A4</option>
                </select>
              </Field>
              <Field label="Régimen Fiscal" htmlFor="regimen_fiscal">
                <select id="regimen_fiscal" value={data.config.regimen_fiscal || 'simplificado'} onChange={(e) => setCfg('regimen_fiscal', e.target.value)} className={selectClass}>
                  <option value="simplificado">Simplificado (No responsable de IVA - Contabilidad Básica)</option>
                  <option value="comun">Común (Responsable de IVA - Contabilidad Completa)</option>
                </select>
              </Field>
              <Field label="Resolución DIAN" htmlFor="resolucion_dian">
                <Input id="resolucion_dian" value={data.config.resolucion_dian || ''} onChange={(e) => setCfg('resolucion_dian', e.target.value)} />
              </Field>
              <Field label="Rango inicio" htmlFor="rango_inicio">
                <Input id="rango_inicio" type="number" value={data.config.rango_inicio || ''} onChange={(e) => setCfg('rango_inicio', e.target.value)} />
              </Field>
              <Field label="Rango fin" htmlFor="rango_fin">
                <Input id="rango_fin" type="number" value={data.config.rango_fin || ''} onChange={(e) => setCfg('rango_fin', e.target.value)} />
              </Field>
              <Field label="Siguiente factura" htmlFor="siguiente_factura">
                <Input id="siguiente_factura" type="number" value={data.config.siguiente_factura || '1'} onChange={(e) => setCfg('siguiente_factura', e.target.value)} />
              </Field>
              <Field label="Porcentaje IVA (%)" htmlFor="porcentaje_iva">
                <Input id="porcentaje_iva" type="number" value={data.config.porcentaje_iva || '19'} onChange={(e) => setCfg('porcentaje_iva', e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Toggle checked={bool(data.config.incluir_iva)} onChange={(v) => setCfg('incluir_iva', v ? 'true' : 'false')} label="Incluir IVA en las facturas" hint="Aplica el porcentaje configurado a los totales." />
              </div>
            </FormSection>
          )}

          {/* SISTEMA */}
          {tab === 'sistema' && (
            <FormSection title="Sistema" description="Moneda, zona horaria y numeración." icon={SlidersHorizontal}>
              <Field label="Moneda" htmlFor="moneda">
                <Input id="moneda" value={data.config.moneda || 'COP'} onChange={(e) => setCfg('moneda', e.target.value)} />
              </Field>
              <Field label="Símbolo" htmlFor="simbolo_moneda">
                <Input id="simbolo_moneda" value={data.config.simbolo_moneda || '$'} onChange={(e) => setCfg('simbolo_moneda', e.target.value)} />
              </Field>
              <Field label="Zona horaria" htmlFor="zona_horaria">
                <select id="zona_horaria" value={data.config.zona_horaria || 'America/Bogota'} onChange={(e) => setCfg('zona_horaria', e.target.value)} className={selectClass}>
                  {zonas.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
              </Field>
              <Field label="Próximo n° de orden" htmlFor="proximo_numero_orden">
                <Input id="proximo_numero_orden" type="number" value={data.config.proximo_numero_orden || '1'} onChange={(e) => setCfg('proximo_numero_orden', e.target.value)} />
              </Field>
            </FormSection>
          )}

          {/* CONTABILIDAD */}
          {tab === 'contabilidad' && (
            <FormSection title="Cuentas Contables PUC" description="Códigos del Plan Único de Cuentas usados por el sistema. Ajusta solo si tu contador lo requiere." icon={Calculator} columns={2}>
              <Field label="Caja general" htmlFor="cta_caja" hint="Egresos/Ingresos de efectivo">
                <Input id="cta_caja" value={data.config.cta_caja || '110505'} onChange={(e) => setCfg('cta_caja', e.target.value)} />
              </Field>
              <Field label="Bancos" htmlFor="cta_bancos" hint="Pagos con tarjeta/transferencia">
                <Input id="cta_bancos" value={data.config.cta_bancos || '111005'} onChange={(e) => setCfg('cta_bancos', e.target.value)} />
              </Field>
              <Field label="Clientes (CxC)" htmlFor="cta_clientes" hint="Ventas a crédito">
                <Input id="cta_clientes" value={data.config.cta_clientes || '1305'} onChange={(e) => setCfg('cta_clientes', e.target.value)} />
              </Field>
              <Field label="Proveedores (CxP)" htmlFor="cta_proveedores" hint="Compras a crédito">
                <Input id="cta_proveedores" value={data.config.cta_proveedores || '2205'} onChange={(e) => setCfg('cta_proveedores', e.target.value)} />
              </Field>
              <Field label="IVA por pagar" htmlFor="cta_iva" hint="Impuesto a las ventas">
                <Input id="cta_iva" value={data.config.cta_iva || '2408'} onChange={(e) => setCfg('cta_iva', e.target.value)} />
              </Field>
              <Field label="Anticipos clientes" htmlFor="cta_anticipos" hint="Abonos recibidos de clientes">
                <Input id="cta_anticipos" value={data.config.cta_anticipos || '2815'} onChange={(e) => setCfg('cta_anticipos', e.target.value)} />
              </Field>
              <Field label="Inventario" htmlFor="cta_inventario" hint="Mercancías para la venta">
                <Input id="cta_inventario" value={data.config.cta_inventario || '1405'} onChange={(e) => setCfg('cta_inventario', e.target.value)} />
              </Field>
               <Field label="Costo de ventas" htmlFor="cta_costo_ventas" hint="CMV / COGS">
                 <Input id="cta_costo_ventas" value={data.config.cta_costo_ventas || '6135'} onChange={(e) => setCfg('cta_costo_ventas', e.target.value)} />
               </Field>
               <Field label="Gasto Comisiones" htmlFor="cta_gasto_comisiones" hint="Pagos a técnicos">
                 <Input id="cta_gasto_comisiones" value={data.config.cta_gasto_comisiones || '5105'} onChange={(e) => setCfg('cta_gasto_comisiones', e.target.value)} />
               </Field>
             </FormSection>
          )}

          {/* NOTIFICACIONES */}
          {tab === 'notificaciones' && (
            <>
              <FormSection title="Canales activos" description="Define por qué medios se avisa a los clientes." icon={Bell} columns={1}>
                <Toggle checked={bool(data.config.notif_email_activo)} onChange={(v) => setCfg('notif_email_activo', v ? 'true' : 'false')} label="Correo electrónico" />
                <Toggle checked={bool(data.config.notif_whatsapp_activo)} onChange={(v) => setCfg('notif_whatsapp_activo', v ? 'true' : 'false')} label="WhatsApp" />
                <Toggle checked={bool(data.config.notif_telegram_activo)} onChange={(v) => setCfg('notif_telegram_activo', v ? 'true' : 'false')} label="Telegram" />
                <div className="border-t border-border pt-3" />
                <Toggle checked={bool(data.config.notificar_recibido)} onChange={(v) => setCfg('notificar_recibido', v ? 'true' : 'false')} label="Avisar al recibir el equipo" />
                <Toggle checked={bool(data.config.notificar_listo)} onChange={(v) => setCfg('notificar_listo', v ? 'true' : 'false')} label="Avisar cuando el equipo esté listo" />
                <Field label="URL de acceso para clientes" htmlFor="url_acceso" hint="Enlace que se incluye en los mensajes.">
                  <Input id="url_acceso" value={data.config.url_acceso || ''} onChange={(e) => setCfg('url_acceso', e.target.value)} placeholder="https://tuempresa.nexora.com/login" />
                </Field>
              </FormSection>

              {/* Estado de servicios */}
              <FormSection title="Estado de los servicios" description="Verifica la conexión de cada canal." icon={RefreshCw} columns={1}>
                {/* WhatsApp */}
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground"><MessageCircle className="h-4 w-4 text-emerald-500" /> WhatsApp</span>
                    <StatusPill estado={estados.whatsapp} />
                  </div>
                  {mensajes.whatsapp && <p className="mt-2 text-xs text-muted-foreground">{mensajes.whatsapp}</p>}
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => verificar('whatsapp')} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted"><RefreshCw className="h-3.5 w-3.5" /> Verificar</button>
                    {mensajes.whatsapp_qr && <a href={mensajes.whatsapp_qr} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted"><QrCode className="h-3.5 w-3.5" /> Ver QR</a>}
                  </div>
                </div>
                {/* Telegram */}
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground"><Send className="h-4 w-4 text-sky-500" /> Telegram</span>
                    <StatusPill estado={estados.telegram} />
                  </div>
                  {mensajes.telegram && <p className="mt-2 text-xs text-muted-foreground">{mensajes.telegram}</p>}
                  {mensajes.telegram_test && <p className="mt-1 text-xs text-indigo-600">{mensajes.telegram_test}</p>}
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => verificar('telegram')} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted"><RefreshCw className="h-3.5 w-3.5" /> Verificar</button>
                    <button type="button" onClick={probarTelegram} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted"><Send className="h-3.5 w-3.5" /> Enviar prueba</button>
                  </div>
                </div>
                {/* Correo */}
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground"><Mail className="h-4 w-4 text-indigo-500" /> Correo</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">El correo usa la configuración SMTP del servidor. Los mensajes llevan el logo de tu empresa.</p>
                  {mensajes.email_test && <p className="mt-1 text-xs text-indigo-600">{mensajes.email_test}</p>}
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={probarEmail} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted"><Send className="h-3.5 w-3.5" /> Enviar prueba</button>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">Se enviará a: {data.email || 'el correo de la empresa'}</p>
                </div>
              </FormSection>
            </>
          )}
        </div>
      </form>
    </AuthenticatedLayout>
  )
}
