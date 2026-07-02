import { useState, useMemo, useEffect } from 'react'
import { useForm, usePage, Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { PageHeader } from '@/Components/ui/page-header'
import { Input } from '@/Components/ui/input'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { cn } from '@/lib/utils'
import {
  Wrench, User, Smartphone, Lock, ListChecks, Hammer, Package, DollarSign,
  Save, X, ChevronRight, ChevronDown, Plus, Trash2, Check, Search,
  Inbox, UserCheck, FlaskConical, PackageCheck, Truck, AlertCircle,
  Activity, Coins, Percent, Edit3, Clock, ChevronLeft, Bell, ArrowLeft,
  Download, Send, Printer, Ban
} from 'lucide-react'
import { usePermissions } from '@/Hooks/usePermissions'
import { useCaja } from '@/Hooks/useCaja'
import { MediaUploader } from '@/Components/ui/media-uploader'

// ─── Types ───

interface PrestadorOption {
  id: number
  name: string
  tipo: string
  comision: number
}

interface ProductoOption {
  id: number
  nombre: string
  codigo: string
  precio_venta: number
}

interface ServicioOption {
  id: number
  nombre: string
  precio_base: number
  costo_tecnico_base: number
}

interface ServicioItem {
  servicio_id: number
  nombre: string
  cantidad: number
  precio_aplicado: number
  costo_tecnico_aplicado: number
}

interface RepuestoItem {
  producto_id: number
  nombre: string
  cantidad: number
  precio_unitario: number
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

interface OrdenData {
  id: number
  numero_orden: string
  estado?: string
  cliente_id: number | string | null
  tipo_equipo_id: number | string | null
  modelo_id: number | string | null
  numero_serie: string
  condicion_inicial: string
  fallas_checklist: string[]
  fallas_otras: string
  accesorios_checklist: string[]
  bloqueado: boolean
  tipo_bloqueo: string
  codigo_bloqueo: string
  prestador_id: number | string | null
  prestador_user_id?: number | null
  tipo_comision: string
  valor_comision_fijo: number
  porcentaje_comision: number
  precio_cliente: number
  costo_diagnostico: number
  abono_inicial: number
  servicios: ServicioItem[]
  repuestos: RepuestoItem[]
  total_actividades?: number
  total_comisiones?: number
  total_horas?: number
  fecha_entregado?: string
  notas_fases?: Record<string, string>
  multimedia?: Array<{
    id: number
    ruta: string
    tipo: 'imagen' | 'video'
    fase?: string
    mime_type?: string
    tamaño?: number
    nombre_original?: string
  }>
}

interface EditProps {
  orden: OrdenData
  clientes: Array<{ id: number; nombre: string; documento: string }>
  tipos: Array<{ id: number; nombre: string }>
  marcas: Array<{ id: number; nombre: string }>
  modelos: Array<{ id: number; nombre: string; marca_id: number; tipo_equipo_id: number }>
  servicios: ServicioOption[]
  fallas: Array<{ id: number; nombre: string; tipo_equipo_id: number }>
  checklist: Array<{ id: number; nombre: string; categoria: string; tipo_equipo_id: number }>
  productos: ProductoOption[]
  tecnicos: PrestadorOption[]
  numeroSugerido: string
  recibos?: ReciboData[]
}

// ─── Constants ───

const FASES = [
  { value: 'recibido', label: 'Recibido', icon: Inbox, color: 'slate' },
  { value: 'diagnostico', label: 'Diagnóstico', icon: Search, color: 'amber' },
  { value: 'asignado', label: 'Asignado', icon: UserCheck, color: 'indigo' },
  { value: 'reparacion', label: 'Reparación', icon: Hammer, color: 'sky' },
  { value: 'pruebas', label: 'Pruebas', icon: FlaskConical, color: 'violet' },
  { value: 'listo', label: 'Listo', icon: PackageCheck, color: 'emerald' },
  { value: 'entregado', label: 'Entregado', icon: Truck, color: 'green' },
]

const TIPOS_COMISION = [
  { value: 'FIJO', label: 'Costo Fijo', icon: Coins, desc: 'Monto fijo acordado con el técnico.' },
  { value: 'PORCENTAJE', label: 'Porcentaje', icon: Percent, desc: '% del valor total de la orden.' },
  { value: 'LIBRE', label: 'Valor Libre', icon: Edit3, desc: 'Se asigna manualmente al liquidar.' },
]

const ESTADO_BG: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
  indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  green: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
}

const money = (n: number | string | null | undefined): string =>
  '$ ' + Number(n || 0).toLocaleString('es-CO')

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

// ─── Component ───

export default function OrdenEdit({
  orden: ordenData,
  clientes = [],
  tipos = [],
  modelos = [],
  servicios = [],
  checklist = [],
  productos = [],
  tecnicos = [],
  recibos = [],
}: EditProps) {
  const { can, hasRole } = usePermissions()
  const { auth } = usePage().props as { auth: { user: { id: number } } }
  const estadoInicial = ordenData.estado ?? 'recibido'
  const isEntregadoOCancelado = ['entregado', 'cancelado'].includes(estadoInicial)

  // ¿El usuario autenticado es el técnico asignado a esta orden?
  const tieneTecnicoAsignado = !!ordenData.prestador_id
  const esTecnicoAsignado = !!(
    tieneTecnicoAsignado &&
    ordenData.prestador_user_id &&
    ordenData.prestador_user_id === auth.user.id
  )

  // Estado local del formulario
  const { data, setData, put, processing, errors } = useForm({
    cliente_id: ordenData.cliente_id ?? '',
    tipo_equipo_id: ordenData.tipo_equipo_id ?? '',
    modelo_id: ordenData.modelo_id ?? '',
    numero_serie: ordenData.numero_serie ?? '',
    condicion_inicial: ordenData.condicion_inicial ?? '',
    fallas_checklist: ordenData.fallas_checklist ?? [],
    accesorios_checklist: ordenData.accesorios_checklist ?? [],
    bloqueado: ordenData.bloqueado ?? false,
    tipo_bloqueo: ordenData.tipo_bloqueo ?? 'ninguno',
    codigo_bloqueo: ordenData.codigo_bloqueo ?? '',
    prestador_id: ordenData.prestador_id ?? '',
    tipo_comision: ordenData.tipo_comision ?? 'FIJO',
    valor_comision_fijo: ordenData.valor_comision_fijo ?? 0,
    porcentaje_comision: ordenData.porcentaje_comision ?? 0,
    precio_cliente: ordenData.precio_cliente ?? 0,
    costo_diagnostico: ordenData.costo_diagnostico ?? 0,
    abono_inicial: ordenData.abono_inicial ?? 0,
    servicios: ordenData.servicios ?? [],
    repuestos: ordenData.repuestos ?? [],
  })

  const { abriendo: abriendoCaja, cajaAbierta, verificarCaja, abrirCaja } = useCaja()
  const [baseApertura, setBaseApertura] = useState(50000)
  useEffect(() => { verificarCaja() }, [])

  // Si el técnico asignado abre una orden nueva (recibido, asignado o diagnostico), lo situamos directo en reparacion
  const estadoDeTrabajo = (esTecnicoAsignado && ['recibido', 'diagnostico', 'asignado'].includes(estadoInicial))
    ? 'reparacion'
    : estadoInicial;

  // Estado actual de la orden (nos lo pasa el controlador o lo ajustamos)
  const [estadoActual, setEstadoActual] = useState(estadoDeTrabajo)
  const [faseExpandida, setFaseExpandida] = useState(estadoDeTrabajo)
  const [notaFase, setNotaFase] = useState('')
  const [buscandoProducto, setBuscandoProducto] = useState('')
  const [showRepuestoForm, setShowRepuestoForm] = useState(false)
  const [showServicioForm, setShowServicioForm] = useState(false)
  const [guardando, setGuardando] = useState(false)

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
  function handleCrearAbono(e: React.FormEvent) {
    e.preventDefault()
    if (!abonoMonto || Number(abonoMonto) <= 0) return
    setCreandoAbono(true)
    router.post(route('cash.recibos.store'), {
      orden_id: ordenData.id,
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

  const idxActual = FASES.findIndex(f => f.value === estadoActual)
  const faseActual = FASES[idxActual]
  const faseSiguiente = idxActual < FASES.length - 1 ? FASES[idxActual + 1] : null

  // Índice de la fase que el usuario tiene expandida (para la barra inferior)
  const idxVista = FASES.findIndex(f => f.value === faseExpandida)
  const faseSiguienteVista = idxVista < FASES.length - 1 ? FASES[idxVista + 1] : null

  const FASE_TECNICO = ['reparacion', 'pruebas']
  const FASE_ADMIN = ['recibido', 'diagnostico', 'asignado', 'listo']

  const puedeEditarVista = !isEntregadoOCancelado && (
    (can('service-desk:edit') && (!tieneTecnicoAsignado || FASE_ADMIN.includes(faseExpandida))) ||
    (esTecnicoAsignado && FASE_TECNICO.includes(faseExpandida))
  )

  const puedeEditarFaseActual = !isEntregadoOCancelado && (
    (can('service-desk:edit') && (!tieneTecnicoAsignado || FASE_ADMIN.includes(estadoActual))) ||
    (esTecnicoAsignado && FASE_TECNICO.includes(estadoActual))
  )
  const esAdminSoloLectura = !puedeEditarFaseActual && can('service-desk:edit') && !esTecnicoAsignado && tieneTecnicoAsignado && !isEntregadoOCancelado

  // Totales calculados
  const totalServicios = data.servicios.reduce((s: number, x: ServicioItem) => s + x.cantidad * x.precio_aplicado, 0)
  const totalRepuestos = data.repuestos.reduce((s: number, x: RepuestoItem) => s + x.cantidad * x.precio_unitario, 0)
  const totalGeneral = Number(data.precio_cliente || 0) + totalServicios + totalRepuestos
  const costoActividades = (ordenData as OrdenData).total_actividades ?? 0
  const saldo = totalGeneral - Number(data.abono_inicial || 0)

  // Filtros de catálogo
  const tipoId = data.tipo_equipo_id ? Number(data.tipo_equipo_id) : null
  const aplicaTipo = (item: { tipo_equipo_id?: number | null }) => item.tipo_equipo_id == null || item.tipo_equipo_id === tipoId
  const modelosFiltrados = useMemo(
    () => modelos.filter((m) => !tipoId || m.tipo_equipo_id == null || m.tipo_equipo_id === tipoId),
    [modelos, tipoId],
  )

  // ─── Acciones ───

  const guardarYAvanzar = () => {
    setGuardando(true)
    // Avanza desde la fase que el usuario está viendo expandida
    const estadoDestino = faseSiguienteVista ? faseSiguienteVista.value : estadoActual

    router.put(
      route('service-desk.ordenes.update', ordenData.id),
      {
        ...data,
        estado: estadoDestino,
        nota_fase: notaFase,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setEstadoActual(estadoDestino)
          setFaseExpandida(estadoDestino)
          setNotaFase('')
        },
        onFinish: () => setGuardando(false),
      },
    )
  }

  const notificarAdministrador = () => {
    router.post(
      route('service-desk.ordenes.notificar-administrador', ordenData.id),
      {},
      { preserveScroll: true }
    )
  }

  const soloGuardar = () => {
    setGuardando(true)
    const estadoDestino = (esTecnicoAsignado && estadoActual === 'pruebas')
      ? 'listo'
      : estadoActual

    router.put(
      route('service-desk.ordenes.update', ordenData.id),
      {
        ...data,
        estado: estadoDestino,
        nota_fase: notaFase,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setNotaFase('')
          if (estadoDestino !== estadoActual) {
            setEstadoActual(estadoDestino)
            setFaseExpandida(estadoDestino)
          }
        },
        onFinish: () => setGuardando(false),
      },
    )
  }

  // Servicios
  const addServicio = (id: string) => {
    const s = servicios.find((x: ServicioOption) => x.id === Number(id))
    if (!s || data.servicios.some((x: ServicioItem) => x.servicio_id === s.id)) return
    setData('servicios', [
      ...data.servicios,
      { servicio_id: s.id, nombre: s.nombre, cantidad: 1, precio_aplicado: Number(s.precio_base), costo_tecnico_aplicado: Number(s.costo_tecnico_base) },
    ])
    setShowServicioForm(false)
  }
  const updServicio = (i: number, campo: keyof ServicioItem, val: number) => {
    const next = [...data.servicios] as ServicioItem[]
    next[i] = { ...next[i], [campo]: val }
    setData('servicios', next)
  }
  const delServicio = (i: number) => setData('servicios', data.servicios.filter((_: ServicioItem, idx: number) => idx !== i))

  // Repuestos
  const productosFiltrados = buscandoProducto
    ? productos.filter(
        (p: ProductoOption) =>
          p.nombre.toLowerCase().includes(buscandoProducto.toLowerCase()) ||
          p.codigo.toLowerCase().includes(buscandoProducto.toLowerCase()),
      )
    : productos

  const addRepuesto = (id: number) => {
    const p = productos.find((x: ProductoOption) => x.id === Number(id))
    if (!p || data.repuestos.some((x: RepuestoItem) => x.producto_id === p.id)) return
    setData('repuestos', [
      ...data.repuestos,
      { producto_id: p.id, nombre: p.nombre, cantidad: 1, precio_unitario: Number(p.precio_venta) },
    ])
    setShowRepuestoForm(false)
    setBuscandoProducto('')
  }
  const updRepuesto = (i: number, campo: keyof RepuestoItem, val: number) => {
    const next = [...data.repuestos] as RepuestoItem[]
    next[i] = { ...next[i], [campo]: val }
    setData('repuestos', next)
  }
  const delRepuesto = (i: number) => setData('repuestos', data.repuestos.filter((_: RepuestoItem, idx: number) => idx !== i))

  // ─── Render de fase ───

  const renderFase = (fase: typeof FASES[number]) => {
    const esCompleta = idxActual > FASES.indexOf(fase)
    const esActual = FASES.indexOf(fase) === idxActual
    const esFutura = FASES.indexOf(fase) > idxActual
    const expandida = faseExpandida === fase.value
    const Icon = fase.icon
    const puedeEditar = !isEntregadoOCancelado && (
      (can('service-desk:edit') && (!tieneTecnicoAsignado || FASE_ADMIN.includes(fase.value))) ||
      (esTecnicoAsignado && FASE_TECNICO.includes(fase.value))
    )

    return (
      <div
        key={fase.value}
        className={cn(
          'rounded-xl border transition-all',
          esActual
            ? 'border-indigo-300 bg-card shadow-sm dark:border-indigo-500/40'
            : esCompleta
              ? 'border-emerald-200 bg-card/80 dark:border-emerald-500/20'
              : 'border-border bg-card/50',
          esFutura && 'opacity-60',
        )}
      >
        {/* Cabecera de la fase */}
        <button
          type="button"
          onClick={() => setFaseExpandida(expandida ? '' : fase.value)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-left"
        >
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                esCompleta
                  ? 'bg-emerald-500 text-white'
                  : esActual
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-600/20'
                    : 'border border-border bg-background text-muted-foreground',
              )}
            >
              {esCompleta ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </span>
            <div>
              <span className={cn('text-sm font-semibold', esActual ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground')}>
                {fase.label}
              </span>
              {esCompleta && (
                <span className="ml-2 text-xs font-medium text-emerald-600">Completada</span>
              )}
              {!puedeEditar && expandida && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                  Solo lectura
                </span>
              )}
            </div>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              expandida && 'rotate-180',
            )}
          />
        </button>

        {/* Contenido de la fase */}
        {expandida && (
          <div className="border-t border-border px-5 py-4 space-y-5">
            {!puedeEditar && esActual && !esFutura && !esCompleta && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-300">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {can('service-desk:edit') && !esTecnicoAsignado
                    ? 'El técnico asignado gestiona esta fase. El administrador solo puede consultar.'
                    : 'No tienes permisos para editar esta fase.'}
                </span>
              </div>
            )}
            {/* FASE: RECIBIDO */}
            {fase.value === 'recibido' && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Cliente</p>
                    <select
                      value={data.cliente_id}
                      onChange={e => setData('cliente_id', e.target.value)}
                      className={selectClass}
                      disabled={!puedeEditar || esCompleta}
                    >
                      <option value="">Selecciona un cliente…</option>
                      {clientes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}{c.documento ? ` — ${c.documento}` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Tipo de equipo</p>
                    <select
                      value={data.tipo_equipo_id}
                      onChange={e => {
                        setData('tipo_equipo_id', e.target.value)
                        setData('modelo_id', '')
                      }}
                      className={selectClass}
                      disabled={!puedeEditar || esCompleta}
                    >
                      <option value="">Selecciona…</option>
                      {tipos.map((t) => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Modelo</p>
                    <select
                      value={data.modelo_id}
                      onChange={e => setData('modelo_id', e.target.value)}
                      className={selectClass}
                      disabled={!puedeEditar || esCompleta}
                    >
                      <option value="">Selecciona…</option>
                      {modelosFiltrados.map((m) => (
                          <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Número de serie / IMEI</p>
                    <Input
                      value={data.numero_serie}
                      onChange={e => setData('numero_serie', e.target.value)}
                      placeholder="SN-123456789"
                      disabled={!puedeEditar || esCompleta}
                    />
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <p className="text-sm font-medium text-foreground">Condición inicial del equipo</p>
                  <textarea
                    value={data.condicion_inicial}
                    onChange={e => setData('condicion_inicial', e.target.value)}
                    rows={2}
                    placeholder="Rayones, golpes, estado físico general…"
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    disabled={!puedeEditar || esCompleta}
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Fallas reportadas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['No enciende', 'Pantalla rota', 'No carga', 'Lento', 'Se recalienta', 'Sin audio', 'No conecta WiFi'].map(f => {
                      const sel = data.fallas_checklist.includes(f)
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => {
                            const arr = data.fallas_checklist
                            setData(
                              'fallas_checklist',
                              arr.includes(f) ? arr.filter((x: string) => x !== f) : [...arr, f],
                            )
                          }}
                          disabled={!puedeEditar || esCompleta}
                          className={cn(
                            'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                            sel
                              ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                              : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/50',
                          )}
                        >
                          {f}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Accesorios entregados
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Cargador', 'Cable USB', 'Audífonos', 'Case/Funda', 'Cable de poder', 'Mouse', 'Teclado'].map(a => {
                      const sel = data.accesorios_checklist.includes(a)
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => {
                            const arr = data.accesorios_checklist
                            setData(
                              'accesorios_checklist',
                              arr.includes(a) ? arr.filter((x: string) => x !== a) : [...arr, a],
                            )
                          }}
                          disabled={!puedeEditar || esCompleta}
                          className={cn(
                            'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                            sel
                              ? 'border-sky-400 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
                              : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/50',
                          )}
                        >
                          {a}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3">
                    <input
                      type="checkbox"
                      checked={data.bloqueado}
                      onChange={e => setData('bloqueado', e.target.checked)}
                      disabled={!puedeEditar || esCompleta}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    />
                    <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Lock className="h-4 w-4 text-muted-foreground" /> El equipo tiene bloqueo de seguridad
                    </span>
                  </label>
                  {data.bloqueado && (
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Tipo de bloqueo</p>
                        <select
                          value={data.tipo_bloqueo}
                          onChange={e => {
                            setData('tipo_bloqueo', e.target.value)
                            setData('codigo_bloqueo', '')
                          }}
                          className={selectClass}
                          disabled={!puedeEditar || esCompleta}
                        >
                          <option value="pin">PIN</option>
                          <option value="patron">Patrón</option>
                          <option value="contrasena">Contraseña</option>
                          <option value="huella">Huella</option>
                        </select>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">
                          {data.tipo_bloqueo === 'pin' ? 'PIN' : 'Contraseña'}
                        </p>
                        <Input
                          value={data.codigo_bloqueo}
                          onChange={e => setData('codigo_bloqueo', e.target.value)}
                          placeholder={data.tipo_bloqueo === 'pin' ? '1234' : 'Clave del equipo'}
                          disabled={!puedeEditar || esCompleta}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* FASE: ASIGNADO */}
            {fase.value === 'asignado' && (
              <>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Seleccionar técnico</p>
                  <select
                    value={data.prestador_id}
                    onChange={e => setData('prestador_id', e.target.value)}
                    className={selectClass}
                    disabled={!puedeEditar}
                  >
                    <option value="">— Sin técnico asignado —</option>
                    {tecnicos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}{t.tipo ? ` (${t.tipo})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Tipo de comisión</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {TIPOS_COMISION.map(tc => {
                      const TcIcon = tc.icon
                      const sel = data.tipo_comision === tc.value
                      return (
                        <button
                          key={tc.value}
                          type="button"
                          onClick={() => {
                            setData('tipo_comision', tc.value)
                            if (tc.value === 'FIJO') setData('porcentaje_comision', 0)
                            if (tc.value === 'PORCENTAJE') setData('valor_comision_fijo', 0)
                          }}
                          disabled={!puedeEditar}
                          className={cn(
                            'relative flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-all',
                            sel
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border bg-background hover:border-muted-foreground/40',
                          )}
                        >
                          <div className={cn('rounded-lg p-1.5', sel ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                            <TcIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{tc.label}</p>
                            <p className="text-xs text-muted-foreground leading-tight mt-0.5">{tc.desc}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {data.tipo_comision === 'FIJO' && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Valor de comisión fija</p>
                    <div className="relative max-w-xs">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">$</span>
                      <Input
                        type="number" min="0"
                        value={data.valor_comision_fijo}
                        onChange={e => setData('valor_comision_fijo', e.target.value)}
                        className="pl-7"
                        disabled={!puedeEditar}
                      />
                    </div>
                  </div>
                )}

                {data.tipo_comision === 'PORCENTAJE' && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Porcentaje para el técnico</p>
                    <div className="relative max-w-xs">
                      <Input
                        type="number" min="0" max="100"
                        value={data.porcentaje_comision}
                        onChange={e => setData('porcentaje_comision', e.target.value)}
                        placeholder="50"
                        disabled={!puedeEditar}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">%</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* FASE: DIAGNÓSTICO */}
            {/* FASE: DIAGNÓSTICO — precios y abono */}
            {fase.value === 'diagnostico' && !esTecnicoAsignado && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Precio al cliente (mano de obra base)</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">$</span>
                    <Input
                      type="number" min="0"
                      value={data.precio_cliente}
                      onChange={e => setData('precio_cliente', e.target.value)}
                      className="pl-7"
                      disabled={!puedeEditar}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Abono inicial</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">$</span>
                    <Input
                      type="number" min="0"
                      value={data.abono_inicial}
                      onChange={e => setData('abono_inicial', e.target.value)}
                      className="pl-7"
                      disabled={!puedeEditar}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Costo de diagnóstico</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">$</span>
                    <Input
                      type="number" min="0"
                      value={data.costo_diagnostico}
                      onChange={e => setData('costo_diagnostico', e.target.value)}
                      className="pl-7"
                      disabled={!puedeEditar}
                    />
                  </div>
                </div>
              </div>
            )}

                {/* Servicios en DIAGNÓSTICO */}
                {fase.value === 'diagnostico' && (
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-foreground">Servicios de diagnóstico</p>
                      {puedeEditar && (
                        <button
                          type="button"
                          onClick={() => setShowServicioForm(!showServicioForm)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <Plus className="h-3.5 w-3.5" /> Agregar servicio
                        </button>
                      )}
                    </div>

                    {showServicioForm && (
                      <div className="mb-3 rounded-lg border border-border bg-muted/20 p-3">
                        <div className="flex gap-2">
                          <select
                            onChange={e => addServicio(e.target.value)}
                            className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm"
                            defaultValue=""
                          >
                            <option value="" disabled>Seleccionar servicio…</option>
                            {servicios.map((s) => (
                              <option key={s.id} value={s.id}>{s.nombre}{!esTecnicoAsignado ? ` — ${money(s.precio_base)}` : ''}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowServicioForm(false)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {data.servicios.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay servicios registrados.</p>
                    ) : (
                      <div className="space-y-2">
                        {data.servicios.map((s, i: number) => (
                          <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{s.nombre}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="number"
                                min="0.01"
                                value={s.cantidad}
                                onChange={e => updServicio(i, 'cantidad', Number(e.target.value))}
                                className="h-8 w-16 rounded-lg border border-input bg-background px-2 text-xs text-center"
                                disabled={!puedeEditar}
                              />
                              {!esTecnicoAsignado && (
                                <input
                                  type="number"
                                  min="0"
                                  value={s.precio_aplicado}
                                  onChange={e => updServicio(i, 'precio_aplicado', Number(e.target.value))}
                                  className="h-8 w-24 rounded-lg border border-input bg-background px-2 text-xs text-right"
                                  disabled={!puedeEditar}
                                />
                              )}
                              {puedeEditar && (
                                <button
                                  type="button"
                                  onClick={() => delServicio(i)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Resumen de contextos previos en REPARACIÓN */}
                {fase.value === 'reparacion' && (
                  <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumen previo a la reparación</p>

                    {(ordenData.fallas_checklist.length > 0 || ordenData.fallas_otras) && (
                      <div>
                        <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Fallas reportadas
                        </p>
                        {ordenData.fallas_checklist.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {ordenData.fallas_checklist.map((f: string) => (
                              <span key={f} className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                        {ordenData.fallas_otras && (
                          <p className="mt-1.5 text-xs text-muted-foreground">{ordenData.fallas_otras}</p>
                        )}
                      </div>
                    )}

                    {ordenData.notas_fases?.diagnostico && (
                      <div className="border-t border-border pt-3">
                        <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <Search className="h-3.5 w-3.5 text-amber-500" /> Diagnóstico
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{ordenData.notas_fases.diagnostico}</p>
                      </div>
                    )}

                    {ordenData.bloqueado && (
                      <div className="border-t border-border pt-3">
                        <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Bloqueo del equipo
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {ordenData.tipo_bloqueo === 'patron' ? 'Patrón' :
                           ordenData.tipo_bloqueo === 'pin' ? 'PIN' :
                           ordenData.tipo_bloqueo === 'contrasena' ? 'Contraseña' :
                           ordenData.tipo_bloqueo === 'huella' ? 'Huella' : ordenData.tipo_bloqueo}
                          {ordenData.codigo_bloqueo && (
                            <>
                              {' — '}
                              <span className="font-mono text-foreground">{ordenData.codigo_bloqueo}</span>
                            </>
                          )}
                        </p>
                      </div>
                    )}

                    {!ordenData.fallas_checklist.length && !ordenData.fallas_otras && !ordenData.notas_fases?.diagnostico && !ordenData.bloqueado && (
                      <p className="text-xs text-muted-foreground italic">No hay datos de fases anteriores registrados.</p>
                    )}
                  </div>
                )}

                {/* Repuestos en REPARACIÓN */}
                {fase.value === 'reparacion' && (
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-foreground">Repuestos utilizados</p>
                      {puedeEditar && (
                        <button
                          type="button"
                          onClick={() => setShowRepuestoForm(!showRepuestoForm)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <Plus className="h-3.5 w-3.5" /> Agregar repuesto
                        </button>
                      )}
                    </div>

                    {showRepuestoForm && (
                      <div className="mb-3 space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <input
                            type="text"
                            value={buscandoProducto}
                            onChange={e => setBuscandoProducto(e.target.value)}
                            placeholder="Buscar producto por nombre o código…"
                            className="h-8 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {productosFiltrados.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => addRepuesto(p.id)}
                              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-muted"
                            >
                              <span className="font-medium text-foreground truncate">{p.nombre}</span>
                              {!esTecnicoAsignado && <span className="shrink-0 ml-2 tabular-nums text-muted-foreground">{money(p.precio_venta)}</span>}
                            </button>
                          ))}
                          {productosFiltrados.length === 0 && (
                            <p className="text-xs text-muted-foreground px-2 py-1">Sin resultados.</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => { setShowRepuestoForm(false); setBuscandoProducto('') }}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}

                    {data.repuestos.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay repuestos registrados.</p>
                    ) : (
                      <div className="space-y-2">
                        {data.repuestos.map((r, i: number) => (
                          <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{r.nombre}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="number"
                                min="0.01"
                                value={r.cantidad}
                                onChange={e => updRepuesto(i, 'cantidad', Number(e.target.value))}
                                className="h-8 w-16 rounded-lg border border-input bg-background px-2 text-xs text-center"
                                disabled={!puedeEditar}
                              />
                              {!esTecnicoAsignado && (
                                <input
                                  type="number"
                                  min="0"
                                  value={r.precio_unitario}
                                  onChange={e => updRepuesto(i, 'precio_unitario', Number(e.target.value))}
                                  className="h-8 w-24 rounded-lg border border-input bg-background px-2 text-xs text-right"
                                  disabled={!puedeEditar}
                                />
                              )}
                              {puedeEditar && (
                                <button
                                  type="button"
                                  onClick={() => delRepuesto(i)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

            {/* FASE: PRUEBAS */}
            {fase.value === 'pruebas' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
                  <input
                    type="checkbox"
                    id="pruebas_pasadas"
                    className="h-5 w-5 rounded border-input text-emerald-600 focus:ring-emerald-500"
                    disabled={!puedeEditar}
                  />
                  <label htmlFor="pruebas_pasadas" className="text-sm font-medium text-foreground cursor-pointer">
                    El equipo pasó todas las pruebas de funcionamiento
                  </label>
                </div>
              </div>
            )}

            {/* FASE: LISTO */}
            {fase.value === 'listo' && (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                  <p className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    <PackageCheck className="h-4 w-4" /> El equipo está listo para facturar y entregar al cliente.
                  </p>
                </div>
                {!esTecnicoAsignado && (
                  <div className="rounded-xl border border-border p-5 bg-card">
                    <h3 className="text-base font-semibold text-foreground mb-4">Revisión y Prefactura</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Antes de emitir la factura final, debes generar la prefactura. En este paso podrás revisar los servicios, repuestos, agregar un abono y aplicar descuentos si es necesario.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={route('service-desk.ordenes.liquidar', ordenData.id)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Crear Prefactura
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FASE: ENTREGADO */}
            {fase.value === 'entregado' && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-500/20 dark:bg-green-500/5">
                <p className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-300">
                  <Check className="h-4 w-4" /> Orden entregada al cliente.
                </p>
                {(ordenData as OrdenData).fecha_entregado && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Fecha de entrega: {new Date((ordenData as OrdenData).fecha_entregado!).toLocaleString('es-CO')}
                  </p>
                )}
              </div>
            )}

            {/* Nota de fase (visible en todas las fases activas) */}
            {esActual && !esCompleta && (
              <div className="border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Nota de esta fase ({fase.label})
                </p>
                <textarea
                  value={notaFase}
                  onChange={e => setNotaFase(e.target.value)}
                  rows={2}
                  placeholder="Registra cualquier observación importante de esta fase…"
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={!puedeEditar}
                />
              </div>
            )}

            {/* Evidencia fotográfica de esta fase */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Evidencia fotográfica — {fase.label}
              </p>
              <MediaUploader
                uploadUrl={route('service-desk.ordenes.multimedia.upload', ordenData.id)}
                deleteUrl="/service-desk/multimedia"
                items={(ordenData.multimedia || []).filter(m => m.fase === fase.value)}
                fase={fase.value}
                maxMb={50}
                disabled={!puedeEditar || esFutura}
                onChange={(newFaseItems) => {
                  const otherItems = (ordenData.multimedia || []).filter(m => m.fase !== fase.value)
                  const updatedFaseItems = newFaseItems.map(item => ({ ...item, fase: fase.value }))
                  setOrdenData(prev => ({
                    ...prev,
                    multimedia: [...otherItems, ...updatedFaseItems]
                  }))
                }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <AuthenticatedLayout>
      <Head title={`Editar orden ${ordenData.numero_orden}`} />

      <PageHeader
        title={`Orden ${ordenData.numero_orden}`}
        description="Gestiona las fases de la orden de trabajo."
        icon={Wrench}
        back={{ href: route('service-desk.ordenes.show', ordenData.id), label: 'Volver a la orden' }}
        actions={
          <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-sm font-medium', ESTADO_BG[FASES[idxActual]?.color] || ESTADO_BG.slate)}>
            {FASES[idxActual]?.label || estadoActual}
          </span>
        }
      />

      {/* Timeline horizontal */}
      <div className="mb-6 overflow-x-auto rounded-xl border border-border bg-card p-5">
        <ol className="flex min-w-[640px] items-center">
          {FASES.map((f, i) => {
            const Icon = f.icon
            const done = i < idxActual
            const active = i === idxActual
            return (
              <li key={f.value} className={`flex items-center ${i < FASES.length - 1 ? 'flex-1' : ''}`}>
                <button
                  type="button"
                  onClick={() => setFaseExpandida(f.value)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                      done ? 'bg-emerald-500 text-white' : active ? 'bg-indigo-600 text-white ring-4 ring-indigo-600/20' : 'border border-border bg-background text-muted-foreground',
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span className={`whitespace-nowrap text-xs font-medium ${active || done ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {f.label}
                  </span>
                </button>
                {i < FASES.length - 1 && (
                  <div className={`mx-2 h-0.5 flex-1 rounded-full ${done ? 'bg-emerald-500' : 'bg-border'}`} />
                )}
              </li>
            )
          })}
        </ol>
      </div>

      {estadoActual === 'listo' && hasRole('TECNICO') && (
        <div className="mb-6 flex gap-2.5 rounded-lg border border-amber-100 bg-amber-50/50 p-3.5 text-sm text-amber-800 dark:border-amber-500/10 dark:bg-amber-500/5 dark:text-amber-400">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-semibold">Trabajo terminado (Listo)</p>
            <p className="mt-0.5 text-xs text-amber-700/90 dark:text-amber-400/90">
              El equipo ha sido marcado como Listo. Los técnicos no gestionan la entrega o cobro. Por favor, notifique al administrador para que inicie el proceso de cobro, prefactura y entrega al cliente.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Fases expandibles */}
        <div className="space-y-4 lg:col-span-2">
          {FASES.filter(f => !esTecnicoAsignado || !['recibido', 'asignado', 'listo'].includes(f.value)).map(f => renderFase(f))}
        </div>

        {/* Sidebar financiero (oculto para el técnico) */}
        {!esTecnicoAsignado && (
          <aside className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-4">
                <DollarSign className="h-4 w-4 text-indigo-500" /> Resumen financiero
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mano de obra</span>
                  <span className="tabular-nums font-medium">{money(data.precio_cliente)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Servicios ({data.servicios.length})</span>
                  <span className="tabular-nums font-medium">{money(totalServicios)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Repuestos ({data.repuestos.length})</span>
                  <span className="tabular-nums font-medium">{money(totalRepuestos)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-indigo-600 dark:text-indigo-400">
                  <span>Total</span>
                  <span className="tabular-nums">{money(totalGeneral)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Abono</span>
                  <span className="tabular-nums">− {money(data.abono_inicial)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold">
                  <span>Saldo pendiente</span>
                  <span className="tabular-nums">{money(saldo)}</span>
                </div>
              </div>
            </div>

            {costoActividades > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                  <Activity className="h-4 w-4 text-indigo-500" /> Costo de actividades
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total horas</span>
                    <span className="tabular-nums font-medium">{((ordenData as OrdenData).total_horas ?? 0)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Costo técnico</span>
                    <span className="tabular-nums font-medium">{money(costoActividades)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comisiones</span>
                    <span className="tabular-nums font-medium text-emerald-600">{money((ordenData as OrdenData).total_comisiones ?? 0)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Abonos */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Abonos</h3>

              <p className="text-2xl font-bold text-emerald-600 tabular-nums mb-2">{money(data.abono_inicial)}</p>

              {!cajaAbierta && (
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-2">
                  Para registrar abonos necesitas un turno de caja abierto.
                </p>
              )}

              {/* Crear abono */}
              {cajaAbierta && !isEntregadoOCancelado && can('cash:create') && (
                <form onSubmit={handleCrearAbono} className="flex flex-wrap items-end gap-2 mb-3 border-b border-border pb-3">
                  <div className="flex-1 min-w-[100px]">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Monto</p>
                    <input
                      type="number" step="0.01" min="0.01" required
                      value={abonoMonto}
                      onChange={e => setAbonoMonto(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="min-w-[100px]">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Pago</p>
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
                    className="inline-flex h-[34px] items-center gap-1 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {creandoAbono ? '...' : 'Registrar'}
                  </button>
                </form>
              )}

              {recibos.length > 0 ? (
                <div className="space-y-1.5 mt-2 border-t border-border pt-3">
                  {recibos.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-xs py-1">
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
                <p className="text-xs text-muted-foreground mt-1">Sin abonos registrados.</p>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Botones de acción inferiores (solo fase actual) */}
      {(can('service-desk:edit') || esTecnicoAsignado) && !isEntregadoOCancelado && (
        <div className="sticky bottom-0 mt-6 -mx-4 -mb-4 rounded-t-xl border border-border bg-card px-6 py-4 shadow-lg backdrop-blur-md sm:-mx-6 sm:-mb-4 lg:-mx-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{FASES[idxVista]?.label || FASES[idxActual]?.label}</span>
              {faseSiguienteVista && puedeEditarVista && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-indigo-600 dark:text-indigo-400">{faseSiguienteVista.label}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {puedeEditarVista ? (
                <>
                  <button
                    type="button"
                    onClick={soloGuardar}
                    disabled={guardando || processing}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" /> Solo guardar
                  </button>
                  {faseExpandida === 'listo' && !esTecnicoAsignado && (
                    <a
                      href={route('service-desk.ordenes.liquidar', ordenData.id)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                    >
                      <Check className="h-4 w-4" /> Crear Prefactura
                    </a>
                  )}
                  {faseSiguiente && (
                    <button
                      type="button"
                      onClick={guardarYAvanzar}
                      disabled={guardando || processing}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" /> Guardar y avanzar a {faseSiguiente.label}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href={route('service-desk.ordenes.index')}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <ArrowLeft className="h-4 w-4" /> Volver a órdenes
                  </Link>
                  {faseExpandida === 'listo' && hasRole('TECNICO') && (
                    <button
                      type="button"
                      disabled={processing}
                      onClick={notificarAdministrador}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:opacity-50"
                    >
                      <Bell className="h-4 w-4" /> Notificar al Administrador para Cobro
                    </button>
                  )}
                  {!esTecnicoAsignado && (
                    <button
                      type="button"
                      onClick={() => {
                        router.post(
                          route('service-desk.ordenes.notificar-tecnico', ordenData.id),
                          {},
                          {
                            preserveScroll: true,
                            onSuccess: () => {},
                          },
                        )
                      }}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
                    >
                      <Bell className="h-4 w-4" /> Notificar técnico
                    </button>
                  )}
                  {esTecnicoAsignado && estadoActual === 'asignado' && faseExpandida === 'asignado' && (
                    <button
                      type="button"
                      disabled={guardando || processing}
                      onClick={() => {
                        setGuardando(true)
                        router.put(
                          route('service-desk.ordenes.update', ordenData.id),
                          {
                            ...data,
                            estado: 'diagnostico',
                          },
                          {
                            preserveScroll: true,
                            onSuccess: () => {
                              setEstadoActual('diagnostico')
                              setFaseExpandida('diagnostico')
                            },
                            onFinish: () => setGuardando(false),
                          }
                        )
                      }}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600 disabled:opacity-50"
                    >
                      <Search className="h-4 w-4" /> Iniciar diagnóstico
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  )
}
