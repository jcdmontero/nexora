import { useState, useEffect, type FormEvent } from 'react'
import { useForm, usePage, Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { PageHeader } from '@/Components/ui/page-header'
import { PatternLock } from '@/Components/ui/pattern-lock'
import { usePermissions } from '@/Hooks/usePermissions'
import { MediaUploader } from '@/Components/ui/media-uploader'
import {
  Wrench, User, Smartphone, Lock, ListChecks, Package, DollarSign,
  IdCard, ClipboardList, Pencil, Check, ChevronRight, ChevronDown,
  Inbox, UserCheck, Search, Wrench as WrenchIcon, FlaskConical, PackageCheck, Truck,
  Clock, Plus, Trash2, Activity, TriangleAlert, Phone, Mail, Save, Hammer, FileText,
  FileSpreadsheet, Bell, Download, Printer, X, Ban, Image
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───

interface ClienteData {
  id: number
  nombre: string
  documento: string
  telefono: string
  email: string
}

interface EquipoData {
  tipo: string
  marca: string
  modelo: string
  numero_serie: string
}

interface ServicioLinea {
  id: number
  nombre: string
  cantidad: number
  precio: number
}

interface RepuestoLinea {
  id: number
  nombre: string
  cantidad: number
  precio: number
}

interface ActividadData {
  id: number
  prestador: string
  servicio: string
  resultado: string
  resultado_label: string
  resultado_color: string
  horas_invertidas: number
  costo_hora: number
  costo_total: number
  comision_tipo: string
  comision_valor: number
  descripcion: string
}

interface MediaItem {
  id: number
  ruta: string
  tipo: 'imagen' | 'video'
  fase?: string
  mime_type?: string
  tamaño?: number
  duracion?: number
  nombre_original?: string
  descripcion?: string
  created_at?: string
}

interface EstadoOption {
  value: string
  label: string
  color: string
}

interface PrestadorOption {
  id: number
  nombre: string
}

interface ServicioDisponible {
  id: number
  nombre: string
  costo_tecnico_base: number
}

interface OrdenShowData {
  id: number
  numero_orden: string
  estado: string
  estado_label: string
  estado_color: string
  factura: { id: number; numero: string } | null
  cliente: ClienteData | null
  equipo: EquipoData
  numero_serie: string
  accesorios_equipo: string | null
  observaciones_equipo: string | null
  condicion_inicial: string | null
  fallas_checklist: string[]
  accesorios_checklist: string[]
  fallas_otras: string | null
  accesorios_otros: string | null
  bloqueado: boolean
  tipo_bloqueo: string | null
  codigo_bloqueo: string | null
  notas_fases: Record<string, string>
  tecnico: string | null
  prestador_id: number | null
  prestador_user_id: number | null
  tipo_mano_obra: string | null
  mano_obra_descripcion: string | null
  tipo_comision: string | null
  valor_comision_fijo: number | null
  porcentaje_comision: number | null
  precio_cliente: number
  costo_diagnostico: number
  costo_revision: number
  total_final: number
  abono_inicial: number
  total_servicios: number
  total_repuestos: number
  total_cliente: number
  fecha_recibido: string | null
  fecha_entregado: string | null
  servicios: ServicioLinea[]
  repuestos: RepuestoLinea[]
  actividades: ActividadData[]
  multimedia: MediaItem[]
  total_actividades: number
  total_comisiones: number
  total_horas: number
}

interface ReciboData {
  id: number
  numero: string
  fecha: string
  monto: number
  metodo_pago: string
  concepto: string
  estado: string
}

interface ShowProps {
  orden: OrdenShowData
  estados: EstadoOption[]
  prestadores: PrestadorOption[]
  serviciosDisponibles: ServicioDisponible[]
  recibos?: ReciboData[]
}

// ─── Constants ───

const FLUJO = [
  { value: 'recibido', label: 'Recibido', icon: Inbox },
  { value: 'diagnostico', label: 'Diagnóstico', icon: Search },
  { value: 'asignado', label: 'Asignado', icon: UserCheck },
  { value: 'reparacion', label: 'Reparación', icon: WrenchIcon },
  { value: 'pruebas', label: 'Pruebas', icon: FlaskConical },
  { value: 'listo', label: 'Listo', icon: PackageCheck },
  { value: 'entregado', label: 'Entregado', icon: Truck },
] as const

const FASES_MULTIMEDIA = [
  { value: 'recibido', label: 'Recibimiento', icon: Inbox },
  { value: 'diagnostico', label: 'Diagnóstico', icon: Search },
  { value: 'reparacion', label: 'Reparación', icon: WrenchIcon },
  { value: 'pruebas', label: 'En pruebas', icon: FlaskConical },
  { value: 'listo', label: 'Listo para entrega', icon: PackageCheck },
  { value: 'entregado', label: 'Entrega', icon: Truck },
] as const

const money = (n: number | string | null | undefined): string =>
  '$ ' + Number(n || 0).toLocaleString('es-CO')

const bloqueoLabel: Record<string, string> = {
  pin: 'PIN', patron: 'Patrón', contrasena: 'Contraseña', huella: 'Huella',
}

// ─── Subcomponents ───

function Card({ title, icon: Icon, children, action }: {
  title: string
  icon?: typeof Wrench
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {Icon && <Icon className="h-4 w-4 text-indigo-500" />} {title}
        </h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Timeline({ estadoActual }: { estadoActual: string }) {
  const idx = FLUJO.findIndex((f) => f.value === estadoActual)
  const cancelado = estadoActual === 'cancelado'
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card p-5">
      <ol className="flex min-w-[640px] items-center">
        {FLUJO.map((f, i) => {
          const Icon = f.icon
          const done = !cancelado && i < idx
          const active = !cancelado && i === idx
          return (
            <li key={f.value} className={`flex items-center ${i < FLUJO.length - 1 ? 'flex-1' : ''}`}>
              <div className="flex flex-col items-center gap-1.5">
                <span className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                  done ? 'bg-emerald-500 text-white' : active ? 'bg-indigo-600 text-white ring-4 ring-indigo-600/20' : 'border border-border bg-background text-muted-foreground',
                )}>
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className={`whitespace-nowrap text-xs font-medium ${active || done ? 'text-foreground' : 'text-muted-foreground'}`}>{f.label}</span>
              </div>
              {i < FLUJO.length - 1 && <div className={`mx-2 h-0.5 flex-1 rounded-full ${done ? 'bg-emerald-500' : 'bg-border'}`} />}
            </li>
          )
        })}
      </ol>
      {cancelado && <p className="mt-3 text-center text-sm font-medium text-rose-600">Esta orden fue cancelada.</p>}
    </div>
  )
}

// ─── Main Component ───

export default function OrdenShow({ orden, estados = [], prestadores = [], serviciosDisponibles = [], recibos = [] }: ShowProps) {
  const { can, hasRole } = usePermissions()
  const { auth } = usePage().props as { auth: { user: { id: number } } }
  const esTecnicoAsignado = !!orden.prestador_user_id && orden.prestador_user_id === auth.user.id
  const [tab, setTab] = useState<'detalles' | 'proceso' | 'finanzas'>('detalles')

  const [multimediaList, setMultimediaList] = useState<MediaItem[]>(orden.multimedia || [])

  useEffect(() => {
    setMultimediaList(orden.multimedia || [])
  }, [orden.multimedia])

  const [fasesAbiertas, setFasesAbiertas] = useState<Record<string, boolean>>({
    [orden.estado]: true // La fase actual abierta por defecto
  })

  const toggleFase = (faseVal: string) => {
    setFasesAbiertas(prev => ({
      ...prev,
      [faseVal]: !prev[faseVal]
    }))
  }

  // ─── Abono creation state ───
  const [abonoMonto, setAbonoMonto] = useState('')
  const [abonoMetodoPago, setAbonoMetodoPago] = useState('efectivo')
  const [abonoNotas, setAbonoNotas] = useState('')
  const [creandoAbono, setCreandoAbono] = useState(false)

  // ─── Auto-print recibo ticket after creation ───
  const nuevoReciboId = (usePage().props as Record<string, unknown>).nuevo_recibo_id as number | undefined
  useEffect(() => {
    if (nuevoReciboId != null) {
      window.open(route('cash.recibos.pdf', nuevoReciboId), '_blank')
    }
  }, [nuevoReciboId])

  // ─── Abono handlers ───
  function handleCrearAbono(e: FormEvent) {
    e.preventDefault()
    if (!abonoMonto || Number(abonoMonto) <= 0) return
    setCreandoAbono(true)
    router.post(route('cash.recibos.store'), {
      orden_id: orden.id,
      monto: abonoMonto,
      metodo_pago: abonoMetodoPago,
      notas: abonoNotas || null,
    }, {
      preserveScroll: true,
      preserveState: false,
      onSuccess: () => {
        setAbonoMonto('')
        setAbonoNotas('')
        setCreandoAbono(false)
      },
      onError: () => setCreandoAbono(false),
    })
  }

  function handleAnularRecibo(reciboId: number) {
    if (!confirm('¿Anular este recibo de abono?\n\nSe reversará el movimiento de caja y el asiento contable.')) return
    router.post(route('cash.recibos.anular', reciboId), {}, {
      preserveScroll: true,
      preserveState: false,
    })
  }
  const [cambioManual, setCambioManual] = useState(false)
  const [showActividadForm, setShowActividadForm] = useState(false)
  const [actData, setActDataLocal] = useState({
    prestador_id: (orden.prestador_id ?? '') as number | string,
    servicio_id: '',
    resultado: 'exitoso',
    horas_invertidas: '',
    costo_hora: '',
    comision_tipo: 'FIJO',
    comision_valor: '',
    descripcion: '',
  })
  const [actProcessing, setActProcessing] = useState(false)
  const { data, setData, put, processing } = useForm({
    estado: orden.estado,
    nota: '',
    mano_obra_descripcion: orden.mano_obra_descripcion || '',
  })

  const idxActual = FLUJO.findIndex((f) => f.value === orden.estado)
  const siguienteFase = idxActual >= 0 && idxActual < FLUJO.length - 1 ? FLUJO[idxActual + 1] : null

  const guardar = (estadoDestino: string): void => {
    router.put(
      route('service-desk.ordenes.estado', orden.id),
      { estado: estadoDestino, nota: data.nota, mano_obra_descripcion: data.mano_obra_descripcion },
      { preserveScroll: true, onSuccess: () => setData('nota', '') },
    )
  }

  const notificarAdministrador = (): void => {
    router.post(
      route('service-desk.ordenes.notificar-administrador', orden.id),
      {},
      { preserveScroll: true }
    )
  }

  const guardarProceso = (e: FormEvent): void => {
    e.preventDefault()
    guardar(data.estado)
  }

  const setActData = (key: string, value: string | number): void =>
    setActDataLocal((prev) => ({ ...prev, [key]: value }))

  const submitActividad = (e: FormEvent): void => {
    e.preventDefault()
    setActProcessing(true)
    router.post(route('service-desk.ordenes.actividades.store', orden.id), actData, {
      preserveScroll: true,
      onSuccess: () => {
        setActDataLocal({
          prestador_id: orden.prestador_id ?? '',
          servicio_id: '',
          resultado: 'exitoso',
          horas_invertidas: '',
          costo_hora: '',
          comision_tipo: 'FIJO',
          comision_valor: '',
          descripcion: '',
        })
        setShowActividadForm(false)
      },
      onFinish: () => setActProcessing(false),
    })
  }

  const eliminarActividad = (actividadId: number): void => {
    router.delete(route('service-desk.ordenes.actividades.destroy', [orden.id, actividadId]), {
      preserveScroll: true,
    })
  }

  const TABS = [
    { id: 'detalles' as const, label: 'Detalles', icon: Smartphone },
    { id: 'proceso' as const, label: 'Proceso', icon: Hammer },
    ...(!esTecnicoAsignado ? [{ id: 'finanzas' as const, label: 'Finanzas', icon: DollarSign }] : []),
  ]

  return (
    <AuthenticatedLayout>
      <Head title={`Orden ${orden.numero_orden}`} />
      <PageHeader
        title={`Orden ${orden.numero_orden}`}
        description={orden.cliente?.nombre ? `Cliente: ${orden.cliente.nombre}` : undefined}
        icon={Wrench}
        back={{ href: route('service-desk.ordenes.index'), label: 'Órdenes' }}
        actions={
          <>
            <span className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
              orden.estado_color === 'slate' && 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
              orden.estado_color === 'indigo' && 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
              orden.estado_color === 'amber' && 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
              orden.estado_color === 'sky' && 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
              orden.estado_color === 'violet' && 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
              orden.estado_color === 'emerald' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
              orden.estado_color === 'green' && 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300',
              orden.estado_color === 'rose' && 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
            )}>
              {orden.estado_label}
            </span>
            {orden.estado === 'listo' && can('service-desk:edit') && !esTecnicoAsignado && (
              <Link
                href={route('service-desk.ordenes.liquidar', orden.id)}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                <FileSpreadsheet className="h-4 w-4" /> Prefactura
              </Link>
            )}
            {orden.estado === 'entregado' && orden.factura && (
              <Link
                href={route('sales.facturas.show', orden.factura.id)}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <FileText className="h-4 w-4" /> Ver Factura {orden.factura.numero}
              </Link>
            )}
            {can('service-desk:edit') && orden.estado !== 'entregado' && orden.estado !== 'cancelado' && (
              <Link
                href={route('service-desk.ordenes.edit', orden.id)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Pencil className="h-4 w-4" /> Editar
              </Link>
            )}
          </>
        }
      />

      {/* Timeline de fases */}
      <div className="mb-6"><Timeline estadoActual={orden.estado} /></div>

      {/* Pestañas */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ───────── DETALLES ───────── */}
      {tab === 'detalles' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="Equipo" icon={Smartphone}>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-muted-foreground">Tipo</dt><dd className="font-medium text-foreground">{orden.equipo.tipo || '—'}</dd></div>
                <div><dt className="text-muted-foreground">Marca</dt><dd className="font-medium text-foreground">{orden.equipo.marca || '—'}</dd></div>
                <div><dt className="text-muted-foreground">Modelo</dt><dd className="font-medium text-foreground">{orden.equipo.modelo || '—'}</dd></div>
                <div><dt className="text-muted-foreground">Serie / IMEI</dt><dd className="font-medium text-foreground">{orden.numero_serie || '—'}</dd></div>
              </dl>
              {orden.condicion_inicial && (
                <div className="mt-4 rounded-lg bg-muted/40 p-3 text-sm">
                  <p className="text-xs font-medium text-muted-foreground">Condición inicial</p>
                  <p className="mt-1 text-foreground">{orden.condicion_inicial}</p>
                </div>
              )}
            </Card>

            <Card title="Checklist de recepción" icon={ListChecks}>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                    <TriangleAlert className="h-4 w-4 text-amber-500" /> Fallas reportadas
                  </p>
                  {orden.fallas_checklist.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {orden.fallas_checklist.map((f: string) => (
                        <span key={f} className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                          {f}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                  {orden.fallas_otras && <p className="mt-2 text-sm text-muted-foreground">Otras: {orden.fallas_otras}</p>}
                </div>
                <div className="border-t border-border pt-3">
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                    <Package className="h-4 w-4 text-sky-500" /> Accesorios entregados
                  </p>
                  {orden.accesorios_checklist.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {orden.accesorios_checklist.map((a: string) => (
                        <span key={a} className="rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                          {a}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                  {orden.accesorios_otros && <p className="mt-2 text-sm text-muted-foreground">Otros: {orden.accesorios_otros}</p>}
                </div>
              </div>
            </Card>

            {orden.bloqueado && (
              <Card title="Bloqueo del equipo" icon={Lock}>
                <p className="text-sm">
                  <span className="text-muted-foreground">Tipo:</span>{' '}
                  <span className="font-medium text-foreground">{bloqueoLabel[orden.tipo_bloqueo ?? ''] || orden.tipo_bloqueo}</span>
                </p>
                {orden.tipo_bloqueo === 'patron' && orden.codigo_bloqueo ? (
                  <div className="mt-3"><PatternLock value={orden.codigo_bloqueo} readOnly size={180} /></div>
                ) : orden.codigo_bloqueo ? (
                  <p className="mt-2 text-sm">
                    <span className="text-muted-foreground">Código:</span>{' '}
                    <span className="font-mono font-medium text-foreground">{orden.codigo_bloqueo}</span>
                  </p>
                ) : null}
              </Card>
            )}
          </div>

          <aside className="space-y-6">
            {orden.cliente && (
              <Card title="Cliente" icon={User}>
                <p className="font-medium text-foreground">{orden.cliente.nombre}</p>
                <dl className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {orden.cliente.documento && (
                    <div className="flex items-center gap-2"><IdCard className="h-4 w-4" /> {orden.cliente.documento}</div>
                  )}
                  {orden.cliente.telefono && (
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {orden.cliente.telefono}</div>
                  )}
                  {orden.cliente.email && (
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> <span className="truncate">{orden.cliente.email}</span></div>
                  )}
                </dl>
              </Card>
            )}
            <Card title="Datos" icon={ClipboardList}>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Técnico</dt>
                  <dd className="font-medium text-foreground">{orden.tecnico || 'Sin asignar'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Recibido</dt>
                  <dd className="text-foreground">{orden.fecha_recibido || '—'}</dd>
                </div>
                {orden.fecha_entregado && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Entregado</dt>
                    <dd className="text-foreground">{orden.fecha_entregado}</dd>
                  </div>
                )}
              </dl>
            </Card>
          </aside>
        </div>
      )}

      {/* ───────── PROCESO ───────── */}
      {tab === 'proceso' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {can('service-desk:edit') && orden.estado !== 'entregado' && orden.estado !== 'cancelado' && (
              <Card title="Avanzar el trabajo" icon={Hammer}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                    <span className="font-medium text-foreground">{orden.estado_label}</span>
                    {siguienteFase && (
                      <>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">{siguienteFase.label}</span>
                      </>
                    )}
                  </div>

                  {orden.estado === 'listo' && hasRole('TECNICO') && (
                    <div className="flex gap-2.5 rounded-lg border border-amber-100 bg-amber-50/50 p-3.5 text-sm text-amber-800 dark:border-amber-500/10 dark:bg-amber-500/5 dark:text-amber-400">
                      <TriangleAlert className="h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-semibold">Trabajo terminado (Listo)</p>
                        <p className="mt-0.5 text-xs text-amber-700/90 dark:text-amber-400/90">
                          El equipo ha sido marcado como Listo. Los técnicos no gestionan la entrega o cobro. Por favor, notifique al administrador para que inicie el proceso de cobro, prefactura y entrega al cliente.
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Nota de la fase actual</label>
                    <textarea
                      value={data.nota}
                      onChange={(e) => setData('nota', e.target.value)}
                      rows={2}
                      placeholder="Se guarda en el historial de la fase actual…"
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {siguienteFase && (
                      orden.estado === 'listo' && hasRole('TECNICO') ? (
                        <button
                          type="button"
                          disabled={processing}
                          onClick={notificarAdministrador}
                          className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:opacity-50"
                        >
                          <Bell className="h-4 w-4" /> Notificar al Administrador para Cobro
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={processing}
                          onClick={() => guardar(siguienteFase.value)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                          <Save className="h-4 w-4" /> Guardar y avanzar a {siguienteFase.label}
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => guardar(orden.estado)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" /> Solo guardar
                    </button>
                    {(!hasRole('TECNICO') || orden.estado !== 'listo') && (
                      <button
                        type="button"
                        onClick={() => setCambioManual((v) => !v)}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {cambioManual ? 'Ocultar' : 'Cambiar a otra fase'}
                      </button>
                    )}
                  </div>

                  {cambioManual && (
                    <form onSubmit={(e) => {
                      if (data.estado === 'cancelado') {
                        if (!confirm('¿Estás seguro de cancelar esta orden?\n\nSe reversarán:\n• Abonos recibidos\n• Factura (si existe)\n• Inventario de repuestos\n• Asientos contables')) {
                          e.preventDefault()
                          return
                        }
                      }
                      guardarProceso(e)
                    }} className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
                      <div className="flex-1 min-w-[200px]">
                        <label className="mb-1.5 block text-sm font-medium text-foreground">Cambiar a la fase</label>
                        <select
                          value={data.estado}
                          onChange={(e) => setData('estado', e.target.value)}
                          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {estados.map((e: EstadoOption) => (
                            <option key={e.value} value={e.value}>{e.label}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" /> Aplicar
                      </button>
                    </form>
                  )}
                </div>
              </Card>
            )}

            {/* Servicios/repuestos y actividades solo visibles a partir de Diagnóstico */}
            {['diagnostico', 'reparacion', 'pruebas', 'listo', 'entregado'].includes(orden.estado) && (
              <>
            <Card
              title="Servicios y repuestos"
              icon={Package}
              action={
                can('service-desk:edit') && orden.estado !== 'entregado' && orden.estado !== 'cancelado' && (
                  <Link
                    href={route('service-desk.ordenes.edit', orden.id)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Link>
                )
              }
            >
              {orden.servicios.length === 0 && orden.repuestos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no se han agregado servicios ni repuestos. Usa "Editar" para añadirlos durante la reparación.
                </p>
              ) : (
                <div className="space-y-4">
                  {orden.servicios.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Servicios</p>
                      {orden.servicios.map((s: ServicioLinea) => (
                        <div key={s.id} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{s.nombre} <span className="text-muted-foreground">×{s.cantidad}</span></span>
                          {!esTecnicoAsignado && <span className="tabular-nums">{money(s.cantidad * s.precio)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {orden.repuestos.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Repuestos</p>
                      {orden.repuestos.map((r: RepuestoLinea) => (
                        <div key={r.id} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{r.nombre} <span className="text-muted-foreground">×{r.cantidad}</span></span>
                          {!esTecnicoAsignado && <span className="tabular-nums">{money(r.cantidad * r.precio)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Card
              title="Actividades realizadas"
              icon={Activity}
              action={
                can('service-desk:edit') && orden.estado !== 'entregado' && orden.estado !== 'cancelado' && (
                  <button
                    type="button"
                    onClick={() => setShowActividadForm(!showActividadForm)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> {showActividadForm ? 'Cancelar' : 'Registrar actividad'}
                  </button>
                )
              }
            >
              {orden.actividades && orden.actividades.length > 0 && !esTecnicoAsignado && (
                <div className="mb-4 rounded-lg bg-muted/30 p-3">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span><span className="text-muted-foreground">Horas:</span> <span className="font-medium text-foreground">{orden.total_horas}h</span></span>
                    <span><span className="text-muted-foreground">Costo técnico:</span> <span className="font-medium text-foreground">{money(orden.total_actividades)}</span></span>
                    <span><span className="text-muted-foreground">Comisiones:</span> <span className="font-medium text-emerald-600">{money(orden.total_comisiones)}</span></span>
                  </div>
                </div>
              )}

              {showActividadForm && can('service-desk:edit') && (
                <form onSubmit={submitActividad} className="mb-4 rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">Técnico</label>
                      <select
                        value={actData.prestador_id}
                        onChange={(e) => setActData('prestador_id', e.target.value)}
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">Seleccionar…</option>
                        {prestadores.map((p: PrestadorOption) => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">Servicio (opcional)</label>
                      <select
                        value={actData.servicio_id}
                        onChange={(e) => {
                          const sid = e.target.value
                          setActData('servicio_id', sid)
                          const s = serviciosDisponibles.find((x) => String(x.id) === String(sid))
                          if (s && !actData.costo_hora) setActData('costo_hora', Number(s.costo_tecnico_base) || 0)
                        }}
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">Sin servicio específico</option>
                        {serviciosDisponibles.map((s: ServicioDisponible) => (
                          <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">Resultado</label>
                      <select
                        value={actData.resultado}
                        onChange={(e) => setActData('resultado', e.target.value)}
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="exitoso">Exitoso</option>
                        <option value="fallido">Fallido</option>
                        <option value="pendiente">Pendiente</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">Horas invertidas</label>
                      <input
                        type="number"
                        step="0.25"
                        min="0.01"
                        value={actData.horas_invertidas}
                        onChange={(e) => setActData('horas_invertidas', e.target.value)}
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        required
                      />
                    </div>
                    {!esTecnicoAsignado && (
                      <>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-foreground">Costo por hora</label>
                          <input
                            type="number"
                            min="0"
                            value={actData.costo_hora}
                            onChange={(e) => setActData('costo_hora', e.target.value)}
                            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-foreground">Tipo comisión</label>
                          <select
                            value={actData.comision_tipo}
                            onChange={(e) => setActData('comision_tipo', e.target.value)}
                            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="FIJO">Fijo</option>
                            <option value="PORCENTAJE">Porcentaje</option>
                            <option value="LIBRE">Libre</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-foreground">Comisión</label>
                          <input
                            type="number"
                            min="0"
                            value={actData.comision_valor}
                            onChange={(e) => setActData('comision_valor', e.target.value)}
                            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground">Descripción</label>
                    <textarea
                      value={actData.descripcion}
                      onChange={(e) => setActData('descripcion', e.target.value)}
                      rows={2}
                      placeholder="Detalle del trabajo realizado…"
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={actProcessing}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" /> Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowActividadForm(false)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {(!orden.actividades || orden.actividades.length === 0) && !showActividadForm ? (
                <p className="text-sm text-muted-foreground">Aún no se han registrado actividades del técnico.</p>
              ) : (
                <div className="space-y-2">
                  {(orden.actividades || []).map((a: ActividadData) => (
                    <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{a.prestador}</span>
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                            a.resultado_color === 'emerald' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' :
                            a.resultado_color === 'rose' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' :
                            'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
                          )}>
                            {a.resultado_label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <Clock className="inline h-3 w-3" /> {a.horas_invertidas}h
                          {!esTecnicoAsignado && <> × {money(a.costo_hora)}/h = <span className="font-medium text-foreground">{money(a.costo_total)}</span></>}
                        </p>
                        {!esTecnicoAsignado && a.comision_valor > 0 && <p className="mt-0.5 text-xs text-emerald-600">Comisión: {money(a.comision_valor)}</p>}
                        {a.descripcion && <p className="mt-1 text-xs text-muted-foreground">{a.descripcion}</p>}
                      </div>
                      {can('service-desk:edit') && orden.estado !== 'entregado' && orden.estado !== 'cancelado' && (
                        <button
                          type="button"
                          onClick={() => eliminarActividad(a.id)}
                          className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
            </>
            )}

            <Card title="Sección Multimedia por Fase" icon={Image}>
              <div className="space-y-3">
                {FASES_MULTIMEDIA.map((fase) => {
                  const itemsFase = (multimediaList || []).filter((item) => item.fase === fase.value)
                  const isActive = orden.estado === fase.value
                  const isExpanded = !!fasesAbiertas[fase.value]
                  const uploadDisabled = !can('service-desk:edit') || ['entregado', 'cancelado'].includes(orden.estado)
                  const FaseIcon = fase.icon

                  return (
                    <div
                      key={fase.value}
                      className={cn(
                        'rounded-xl border transition-all',
                        isActive
                          ? 'border-indigo-300 bg-card shadow-sm dark:border-indigo-500/40'
                          : 'border-border bg-muted/5',
                      )}
                    >
                      {/* Cabecera del Acordeón */}
                      <button
                        type="button"
                        onClick={() => toggleFase(fase.value)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                              isActive
                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            <FaseIcon className="h-4 w-4" />
                          </span>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                              {fase.label}
                              {isActive && (
                                <span className="inline-flex items-center rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-500/10 dark:text-indigo-400">
                                  Fase Actual
                                </span>
                              )}
                            </h4>
                            <p className="text-[11px] text-muted-foreground/80">
                              {itemsFase.length} {itemsFase.length === 1 ? 'archivo' : 'archivos'}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-muted-foreground transition-transform duration-200',
                            isExpanded && 'rotate-180',
                          )}
                        />
                      </button>

                      {/* Contenido expandible */}
                      {isExpanded && (
                        <div className="border-t border-border px-4 py-4 space-y-3 bg-card rounded-b-xl">
                          <MediaUploader
                            uploadUrl={route('service-desk.ordenes.multimedia.upload', orden.id)}
                            deleteUrl="/service-desk/multimedia"
                            items={itemsFase}
                            fase={fase.value}
                            maxMb={50}
                            disabled={uploadDisabled}
                            onChange={(newItemsFase) => {
                              const otherItems = (multimediaList || []).filter((item) => item.fase !== fase.value)
                              const updatedFaseItems = newItemsFase.map((item) => ({ ...item, fase: fase.value }))
                              setMultimediaList([...otherItems, ...updatedFaseItems])
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card title="Historial de fases" icon={ClipboardList}>
              <ol className="space-y-3">
                {FLUJO.filter((f) => f.value !== 'asignado').map((f) => {
                  const nota = (orden.notas_fases || {})[f.value]
                  const Icon = f.icon
                  return (
                    <li key={f.value} className="flex gap-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{f.label}</p>
                        {nota ? (
                          <p className="text-xs text-muted-foreground whitespace-pre-line">{nota}</p>
                        ) : (
                          <p className="text-xs italic text-muted-foreground/60">Sin notas</p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
              {orden.mano_obra_descripcion && (
                <div className="mt-4 rounded-lg bg-muted/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Descripción del trabajo</p>
                  <p className="mt-1 text-sm text-foreground whitespace-pre-line">{orden.mano_obra_descripcion}</p>
                </div>
              )}
            </Card>
          </aside>
        </div>
      )}

      {/* ───────── FINANZAS ───────── */}
      {tab === 'finanzas' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card title="Resumen de costos" icon={DollarSign}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mano de obra</span>
                  <span className="tabular-nums">{money(orden.precio_cliente)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Servicios</span>
                  <span className="tabular-nums">{money(orden.total_servicios)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Repuestos</span>
                  <span className="tabular-nums">{money(orden.total_repuestos)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>Total</span>
                  <span className="tabular-nums text-indigo-600 dark:text-indigo-400">{money(orden.total_cliente)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Abono</span>
                  <span className="tabular-nums text-emerald-600">− {money(orden.abono_inicial)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold">
                  <span>Saldo pendiente</span>
                  <span className="tabular-nums">{money((orden.total_cliente || 0) - (orden.abono_inicial || 0))}</span>
                </div>
              </div>
            </Card>

            <Card title="Abonos" icon={DollarSign}>
              <div className="space-y-4">
                {/* Crear nuevo abono */}
                {!['entregado', 'cancelado'].includes(orden.estado) && can('cash:create') && (
                  <form onSubmit={handleCrearAbono} className="flex flex-wrap items-end gap-2">
                    <div className="flex-1 min-w-[120px]">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Monto</p>
                      <input
                        type="number" step="0.01" min="0.01" required
                        value={abonoMonto}
                        onChange={e => setAbonoMonto(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="min-w-[110px]">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Pago</p>
                      <select
                        value={abonoMetodoPago}
                        onChange={e => setAbonoMetodoPago(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="transferencia">Transferencia</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={creandoAbono}
                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {creandoAbono ? 'Registrando...' : 'Registrar abono'}
                    </button>
                  </form>
                )}

                {/* Listado de recibos */}
                {recibos.length > 0 ? (
                  <div className="space-y-1.5 border-t border-border pt-3">
                    {recibos.map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-xs py-1.5">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{r.numero}</span>
                          <span className="text-muted-foreground ml-1.5">{r.fecha}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`font-medium ${r.estado === 'anulado' ? 'text-rose-500 line-through' : 'text-emerald-600'}`}>
                            {money(r.monto)}
                          </span>
                          <a
                            href={route('cash.recibos.pdf', r.id)}
                            target="_blank"
                            title="Imprimir ticket"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </a>
                          {r.estado !== 'anulado' && can('cash:create') && (
                            <button
                              type="button"
                              onClick={() => handleAnularRecibo(r.id)}
                              title="Anular recibo"
                              className="text-rose-400 hover:text-rose-600 transition-colors"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground border-t border-border pt-3">Sin abonos registrados.</p>
                )}
              </div>
            </Card>
          </div>
          <aside>
            {orden.estado === 'listo' ? (
              <Card title="Prefactura" icon={FileSpreadsheet}>
                <p className="text-sm text-muted-foreground mb-4">
                  El equipo está listo. Revisa y ajusta la prefactura antes de generar la factura final.
                </p>
                <Link
                  href={route('service-desk.ordenes.liquidar', orden.id)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Abrir Prefactura
                </Link>
              </Card>
            ) : orden.estado === 'entregado' ? (
              <Card title="Factura" icon={FileText}>
                <p className="text-sm text-muted-foreground mb-4">
                  La orden ya fue facturada y entregada.
                </p>
                {orden.factura ? (
                  <Link
                    href={route('sales.facturas.show', orden.factura.id)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                  >
                    <FileText className="h-4 w-4" /> Ver Factura {orden.factura.numero}
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">No se encontró la factura asociada.</p>
                )}
              </Card>
            ) : (
              <Card title="Facturación" icon={DollarSign}>
                <p className="text-sm text-muted-foreground">
                  La prefactura de la orden (revisión de servicios, repuestos y cobro en Caja) se habilitará cuando el equipo esté{' '}
                  <span className="font-medium text-foreground">Listo</span>.
                </p>
              </Card>
            )}
          </aside>
        </div>
      )}
    </AuthenticatedLayout>
  )
}
