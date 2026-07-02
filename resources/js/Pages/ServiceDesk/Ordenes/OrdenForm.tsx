import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useForm, Link, router } from '@inertiajs/react'
import { PageHeader } from '@/Components/ui/page-header'
import { FormSection, Field } from '@/Components/ui/form-section'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { Stepper } from '@/Components/ui/stepper'
import { Modal } from '@/Components/ui/modal'
import { PatternLock } from '@/Components/ui/pattern-lock'
import {
  Wrench, User, Smartphone, Lock, ListChecks, Package,
  Save, X, Trash2, TriangleAlert, ChevronLeft, ChevronRight, AlertCircle, Plus, Camera, Image, Video,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MediaUploader } from '@/Components/ui/media-uploader'

// ─── Types ───

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

interface ClienteOption {
  id: number
  nombre: string
  documento: string
}

interface TipoEquipoOption {
  id: number
  nombre: string
}

interface MarcaOption {
  id: number
  nombre: string
}

interface ModeloOption {
  id: number
  nombre: string
  marca_id: number
  tipo_equipo_id: number
}

interface ServicioOption {
  id: number
  nombre: string
  tipo_equipo_id?: number | null
  precio_base: number
  costo_tecnico_base: number
}

interface FallaOption {
  id: number
  nombre: string
  tipo_equipo_id: number
}

interface ChecklistOption {
  id: number
  nombre: string
  categoria: string
  tipo_equipo_id: number
}

interface ProductoOption {
  id: number
  nombre: string
  codigo: string
  precio_venta: number
}

/** Datos de la orden cuando se edita. */
interface OrdenEditData {
  id: number
  numero_orden: string
  cliente_id?: number | null
  tipo_equipo_id?: number | null
  modelo_id?: number | null
  tecnico_id?: number | null
  prestador_id?: number | null
  numero_serie: string
  condicion_inicial: string
  fallas_checklist: string[]
  accesorios_checklist: string[]
  bloqueado: boolean
  tipo_bloqueo: string
  codigo_bloqueo: string
  tipo_comision: string
  valor_comision_fijo: number
  porcentaje_comision: number
  precio_cliente: number
  costo_diagnostico: number
  abono_inicial: number
  servicios: ServicioItem[]
  repuestos: RepuestoItem[]
}

interface OrdenFormProps {
  mode: 'create' | 'edit'
  orden?: OrdenEditData | null
  clientes: ClienteOption[]
  tipos: TipoEquipoOption[]
  marcas: MarcaOption[]
  modelos: ModeloOption[]
  servicios: ServicioOption[]
  fallas: FallaOption[]
  checklist: ChecklistOption[]
  productos: ProductoOption[]
  numeroSugerido: string
}

// ─── Constants ───

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const PASOS = [
  { title: 'Cliente y Equipo', description: 'Datos del ingreso' },
  { title: 'Recepción', description: 'Fallas y accesorios' },
]

const BLOQUEO_TIPOS = [
  { value: 'ninguno', label: '—' },
  { value: 'pin', label: 'PIN' },
  { value: 'patron', label: 'Patrón' },
  { value: 'contrasena', label: 'Contraseña' },
  { value: 'huella', label: 'Huella' },
] as const

export default function OrdenForm({
  mode = 'create', orden = null,
  clientes = [], tipos = [], marcas = [], modelos = [], servicios = [],
  fallas = [], checklist = [], productos = [], numeroSugerido,
}: OrdenFormProps) {
  const isEdit = mode === 'edit'
  const [step, setStep] = useState(1)
  const [stepError, setStepError] = useState('')
  const [errorSummary, setErrorSummary] = useState<string | null>(null)
  const [modalCat, setModalCat] = useState<'fallas' | 'accesorios' | null>(null)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [creando, setCreando] = useState(false)
  const [serialValidating, setSerialValidating] = useState(false)
  const [liveSerialError, setLiveSerialError] = useState<string | null>(null)
  const validationTimer = useRef<number | null>(null)

  const { data, setData, post, put, processing, errors } = useForm({
    cliente_id: orden?.cliente_id ?? '',
    tipo_equipo_id: orden?.tipo_equipo_id ?? '',
    modelo_id: orden?.modelo_id ?? '',
    numero_serie: orden?.numero_serie ?? '',
    condicion_inicial: orden?.condicion_inicial ?? '',
    fallas_checklist: orden?.fallas_checklist ?? [] as string[],
    accesorios_checklist: orden?.accesorios_checklist ?? [] as string[],
    bloqueado: orden?.bloqueado ?? false,
    tipo_bloqueo: orden?.tipo_bloqueo ?? 'ninguno',
    codigo_bloqueo: orden?.codigo_bloqueo ?? '',
    servicios: orden?.servicios ?? [] as ServicioItem[],
    repuestos: orden?.repuestos ?? [] as RepuestoItem[],
    multimedia_archivos: [] as File[],
  })

  const tipoId = data.tipo_equipo_id ? Number(data.tipo_equipo_id) : null
  const aplicaTipo = (item: { tipo_equipo_id?: number | null }): boolean =>
    item.tipo_equipo_id == null || item.tipo_equipo_id === tipoId

  const fallasCheck = useMemo(
    () => checklist.filter((c) => c.categoria === 'fallas' && (c.tipo_equipo_id == null || c.tipo_equipo_id === tipoId)),
    [checklist, tipoId],
  )
  const accesoriosCheck = useMemo(
    () => checklist.filter((c) => c.categoria === 'accesorios' && (c.tipo_equipo_id == null || c.tipo_equipo_id === tipoId)),
    [checklist, tipoId],
  )
  const modelosFiltrados = useMemo(
    () => modelos.filter((m) => (!tipoId || m.tipo_equipo_id == null || m.tipo_equipo_id === tipoId)),
    [modelos, tipoId],
  )
  const serviciosDisponibles = useMemo(
    () => servicios.filter(aplicaTipo),
    [servicios, tipoId],
  )

  const toggleCheck = (campo: 'fallas_checklist' | 'accesorios_checklist', nombre: string): void => {
    const actual = data[campo]
    setData(campo, actual.includes(nombre) ? actual.filter((n) => n !== nombre) : [...actual, nombre])
  }

  const abrirModal = (cat: 'fallas' | 'accesorios'): void => { setNuevoNombre(''); setModalCat(cat) }

  const crearItem = (e?: FormEvent): void => {
    e?.preventDefault()
    const nombre = nuevoNombre.trim()
    if (!nombre) return
    setCreando(true)
    router.post(
      route('service-desk.checklist.store'),
      { nombre, categoria: modalCat, tipo_equipo_id: data.tipo_equipo_id || null, activo: true },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          const campo = modalCat === 'fallas' ? 'fallas_checklist' : 'accesorios_checklist'
          setData(campo, [...new Set([...data[campo], nombre])])
          setModalCat(null); setNuevoNombre('')
        },
        onFinish: () => setCreando(false),
      },
    )
  }

  const addServicio = (id: string): void => {
    const s = servicios.find((x: ServicioOption) => x.id === Number(id))
    if (!s || data.servicios.some((x: ServicioItem) => x.servicio_id === s.id)) return
    setData('servicios', [...data.servicios, {
      servicio_id: s.id, nombre: s.nombre, cantidad: 1,
      precio_aplicado: Number(s.precio_base),
      costo_tecnico_aplicado: Number(s.costo_tecnico_base),
    }])
  }
  const updServicio = (i: number, campo: keyof ServicioItem, val: number): void => {
    const next = [...data.servicios] as ServicioItem[]
    next[i] = { ...next[i], [campo]: val }
    setData('servicios', next)
  }
  const delServicio = (i: number): void =>
    setData('servicios', data.servicios.filter((_: ServicioItem, idx: number) => idx !== i))

  const addRepuesto = (id: number): void => {
    const p = productos.find((x: ProductoOption) => x.id === Number(id))
    if (!p || data.repuestos.some((x: RepuestoItem) => x.producto_id === p.id)) return
    setData('repuestos', [...data.repuestos, {
      producto_id: p.id, nombre: p.nombre, cantidad: 1, precio_unitario: Number(p.precio_venta),
    }])
  }
  const updRepuesto = (i: number, campo: keyof RepuestoItem, val: number): void => {
    const next = [...data.repuestos] as RepuestoItem[]
    next[i] = { ...next[i], [campo]: val }
    setData('repuestos', next)
  }
  const delRepuesto = (i: number): void =>
    setData('repuestos', data.repuestos.filter((_: RepuestoItem, idx: number) => idx !== i))

  const totalServicios = data.servicios.reduce((s: number, x: ServicioItem) => s + x.cantidad * x.precio_aplicado, 0)
  const totalRepuestos = data.repuestos.reduce((s: number, x: RepuestoItem) => s + x.cantidad * x.precio_unitario, 0)

  useEffect(() => {
    if (!data.numero_serie.trim()) {
      setLiveSerialError(null)
      setSerialValidating(false)
      return
    }

    if (validationTimer.current) {
      window.clearTimeout(validationTimer.current)
    }

    validationTimer.current = window.setTimeout(async () => {
      setSerialValidating(true)
      try {
        const params = new URLSearchParams({ numero_serie: data.numero_serie.trim() })
        if (data.modelo_id) params.set('modelo_id', String(data.modelo_id))
        if (orden?.id) params.set('orden_id', String(orden.id))

        const response = await fetch(`${route('service-desk.ordenes.validar-numero-serie')}?${params.toString()}`, {
          headers: { Accept: 'application/json' },
        })

        if (response.ok) {
          setLiveSerialError(null)
        } else if (response.status === 422) {
          const body = await response.json()
          setLiveSerialError(body.errors?.numero_serie?.[0] ?? 'Número de serie no válido.')
        } else {
          setLiveSerialError('No fue posible validar el número de serie.')
        }
      } catch {
        setLiveSerialError('No fue posible validar el número de serie.')
      } finally {
        setSerialValidating(false)
      }
    }, 500)

    return () => {
      if (validationTimer.current) {
        window.clearTimeout(validationTimer.current)
      }
    }
  }, [data.numero_serie, data.modelo_id, orden?.id])

  const validarPaso = (n: number): string =>
    (n === 1 && !data.cliente_id ? 'Selecciona un cliente para continuar.' : '')

  const volverAPasoDeErrores = (errors: Record<string, string>): void => {
    if (errors.cliente_id || errors.tipo_equipo_id || errors.modelo_id || errors.numero_serie) {
      setStep(1)
      setStepError('Corrige los campos del cliente y equipo antes de continuar.')
      return
    }

    if (errors.condicion_inicial || errors.fallas_checklist || errors.accesorios_checklist) {
      setStep(2)
      setStepError('Corrige los campos de recepción antes de continuar.')
      return
    }

    setStep(1)
    setStepError('Corrige los campos marcados antes de continuar.')
  }

  const siguiente = (): void => {
    const err = validarPaso(step)
    if (err) { setStepError(err); return }

    if (step === 1 && liveSerialError) {
      setStepError('Corrige el IMEI/número de serie antes de continuar.')
      return
    }

    setStepError(''); setStep((s) => Math.min(2, s + 1))
  }
  const atras = (): void => { setStepError(''); setStep((s) => Math.max(1, s - 1)) }

  const normalizeErrors = (errors: Record<string, string | string[]>): Record<string, string> =>
    Object.fromEntries(
      Object.entries(errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : String(value)]),
    )

  const guardar = (): void => {
    const options = {
      preserveState: true,
      preserveScroll: true,
      onError: (errors: Record<string, string | string[]>) => {
        const normalized = normalizeErrors(errors)
        volverAPasoDeErrores(normalized)
        const summary = Object.values(normalized).join(' ')
        setErrorSummary(summary)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      },
      onSuccess: () => {
        setStepError('')
        setErrorSummary(null)
      },
    }

    if (isEdit) put(route('service-desk.ordenes.update', orden!.id), options)
    else post(route('service-desk.ordenes.store'), options)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') { e.preventDefault(); crearItem() }
  }

  return (
    <form onSubmit={(e: FormEvent) => e.preventDefault()} className="pb-12">
      <PageHeader
        title={isEdit ? `Editar orden ${orden!.numero_orden}` : 'Nueva orden de reparación'}
        description={isEdit ? 'Modifica los datos de la orden.' : `Número sugerido: ${numeroSugerido}`}
        icon={Wrench}
        back={{ href: route('service-desk.ordenes.index'), label: 'Órdenes' }}
      />

      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <Stepper steps={PASOS} current={step} onStepClick={(n: number) => setStep(n)} />
      </div>

      {stepError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {stepError}
        </div>
      )}
      {errorSummary && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-semibold">Error al crear la orden:</p>
          <p>{errorSummary}</p>
        </div>
      )}

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Paso 1 */}
        {step === 1 && (
          <>
            <FormSection title="Cliente" description="¿Quién trae el equipo?" icon={User} columns={1}>
              <Field label="Cliente" htmlFor="cliente_id" required error={errors.cliente_id}>
                <select
                  id="cliente_id"
                  value={data.cliente_id}
                  onChange={(e) => setData('cliente_id', e.target.value)}
                  className={selectClass}
                >
                  <option value="">Selecciona un cliente…</option>
                  {clientes.map((c: ClienteOption) => (
                    <option key={c.id} value={c.id}>{c.nombre}{c.documento ? ` — ${c.documento}` : ''}</option>
                  ))}
                </select>
              </Field>
            </FormSection>

            <FormSection title="Equipo" description="Tipo, marca, serie y bloqueo del equipo recibido." icon={Smartphone}>
              <Field label="Tipo de equipo" htmlFor="tipo_equipo_id" error={errors.tipo_equipo_id}>
                <select
                  id="tipo_equipo_id"
                  value={data.tipo_equipo_id}
                  onChange={(e) => { setData('tipo_equipo_id', e.target.value); setData('modelo_id', '') }}
                  className={selectClass}
                >
                  <option value="">Selecciona…</option>
                  {tipos.map((t: TipoEquipoOption) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </Field>
              <Field label="Modelo" htmlFor="modelo_id" error={errors.modelo_id}>
                <select
                  id="modelo_id"
                  value={data.modelo_id}
                  onChange={(e) => setData('modelo_id', e.target.value)}
                  className={selectClass}
                >
                  <option value="">Selecciona…</option>
                  {modelosFiltrados.map((m: ModeloOption) => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </Field>
              <Field
                label="Número de serie / IMEI"
                htmlFor="numero_serie"
                error={errors.numero_serie ?? liveSerialError}
                hint={serialValidating ? 'Validando número de serie…' : undefined}
                full
              >
                <Input
                  id="numero_serie"
                  value={data.numero_serie}
                  onChange={(e) => setData('numero_serie', e.target.value)}
                  placeholder="Ej. SN-123456789 o IMEI"
                />
              </Field>

              <div className="sm:col-span-2 space-y-4 border-t border-border pt-4">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3">
                  <input
                    type="checkbox"
                    checked={data.bloqueado}
                    onChange={(e) => setData('bloqueado', e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Lock className="h-4 w-4 text-muted-foreground" /> El equipo tiene bloqueo de seguridad
                  </span>
                </label>
                {data.bloqueado && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
                    <Field label="Tipo de bloqueo" htmlFor="tipo_bloqueo">
                      <select
                        id="tipo_bloqueo"
                        value={data.tipo_bloqueo}
                        onChange={(e) => { setData('tipo_bloqueo', e.target.value); setData('codigo_bloqueo', '') }}
                        className={selectClass}
                      >
                        {BLOQUEO_TIPOS.map((bt) => (
                          <option key={bt.value} value={bt.value}>{bt.label}</option>
                        ))}
                      </select>
                    </Field>
                    {data.tipo_bloqueo === 'patron' ? (
                      <div className="flex flex-col items-center rounded-lg border border-border bg-muted/20 p-3">
                        <p className="mb-2 text-xs font-medium text-foreground">Dibuja el patrón</p>
                        <PatternLock
                          value={data.codigo_bloqueo}
                          onChange={(v: string) => setData('codigo_bloqueo', v)}
                          size={170}
                        />
                      </div>
                    ) : data.tipo_bloqueo === 'pin' || data.tipo_bloqueo === 'contrasena' ? (
                      <Field
                        label={data.tipo_bloqueo === 'pin' ? 'PIN' : 'Contraseña'}
                        htmlFor="codigo_bloqueo"
                      >
                        <Input
                          id="codigo_bloqueo"
                          value={data.codigo_bloqueo}
                          onChange={(e) => setData('codigo_bloqueo', e.target.value)}
                          placeholder={data.tipo_bloqueo === 'pin' ? 'Ej. 1234' : 'Clave del equipo'}
                        />
                      </Field>
                    ) : null}
                  </div>
                )}
              </div>
            </FormSection>
          </>
        )}

        {/* Paso 2 */}
        {step === 2 && (
          <>
            <FormSection title="Recepción del equipo" description="Marca las fallas reportadas y los accesorios que entrega el cliente." icon={ListChecks} columns={1}>
            <div className="sm:col-span-2">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <TriangleAlert className="h-4 w-4 text-amber-500" /> Fallas reportadas
              </p>
              <div className="flex flex-wrap gap-2">
                {fallasCheck.map((f: ChecklistOption) => {
                  const sel = data.fallas_checklist.includes(f.nombre)
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleCheck('fallas_checklist', f.nombre)}
                      className={cn(
                        'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                        sel
                          ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                          : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/50',
                      )}
                    >
                      {f.nombre}
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => abrirModal('fallas')}
                  className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Plus className="h-3 w-3" /> Otra falla
                </button>
              </div>
              {fallasCheck.length === 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {tipoId
                    ? 'No hay fallas en el checklist para este tipo. Agrega una con el botón.'
                    : 'Selecciona un tipo de equipo en el paso anterior para ver el checklist.'}
                </p>
              )}
            </div>
            <div className="sm:col-span-2 border-t border-border pt-4">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Package className="h-4 w-4 text-sky-500" /> Accesorios entregados
              </p>
              <div className="flex flex-wrap gap-2">
                {accesoriosCheck.map((a: ChecklistOption) => {
                  const sel = data.accesorios_checklist.includes(a.nombre)
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleCheck('accesorios_checklist', a.nombre)}
                      className={cn(
                        'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                        sel
                          ? 'border-sky-400 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
                          : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/50',
                      )}
                    >
                      {a.nombre}
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => abrirModal('accesorios')}
                  className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Plus className="h-3 w-3" /> Otro accesorio
                </button>
              </div>
              {accesoriosCheck.length === 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {tipoId
                    ? 'No hay accesorios en el checklist para este tipo. Agrega uno con el botón.'
                    : 'Selecciona un tipo de equipo para ver los accesorios.'}
                </p>
              )}
            </div>
            <Field label="Condición inicial / observaciones" htmlFor="condicion_inicial" full>
              <textarea
                id="condicion_inicial"
                value={data.condicion_inicial}
                onChange={(e) => setData('condicion_inicial', e.target.value)}
                rows={2}
                placeholder="Estado físico, rayones, golpes…"
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </Field>
          </FormSection>
          <div className="mt-6">
            <FormSection title="Evidencia Multimedia" description="Adjunta fotos y videos del estado del equipo al recibirlo." icon={Camera} columns={1}>
              <div className="sm:col-span-2">
                {isEdit ? (
                  <MediaUploader
                    uploadUrl={route('service-desk.ordenes.multimedia.upload', orden!.id)}
                    deleteUrl="/service-desk/multimedia"
                    items={orden?.multimedia ?? []}
                    fase="recibido"
                    maxMb={50}
                  />
                ) : (
                  <div className="space-y-3">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      id="multimedia_archivos"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          const newFiles = Array.from(e.target.files)
                          setData('multimedia_archivos', [...data.multimedia_archivos, ...newFiles])
                        }
                        e.target.value = ''
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('multimedia_archivos')?.click()}
                      className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-primary/5"
                    >
                      <Plus className="h-4 w-4" /> Agregar fotos o videos
                    </button>
                    <p className="text-xs text-muted-foreground">Las fotos se subirán al crear la orden de servicio.</p>
                    
                    {data.multimedia_archivos.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                        {data.multimedia_archivos.map((file, idx) => {
                          const isVideo = file.type.startsWith('video/')
                          const url = URL.createObjectURL(file)
                          return (
                            <div key={idx} className="group relative rounded-lg border border-border bg-background overflow-hidden">
                              {isVideo ? (
                                 <div className="aspect-square flex items-center justify-center bg-muted">
                                   <Video className="h-8 w-8 text-muted-foreground" />
                                 </div>
                              ) : (
                                 <img src={url} alt={file.name} className="aspect-square w-full object-cover" />
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newList = [...data.multimedia_archivos]
                                    newList.splice(idx, 1)
                                    setData('multimedia_archivos', newList)
                                  }}
                                  className="rounded-full bg-white/90 p-1.5 text-red-600 hover:bg-white"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="p-2 truncate text-xs text-muted-foreground">
                                {file.name}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </FormSection>
          </div>
        </>
        )}

        {/* Navegación */}
        <div className="flex items-center justify-between gap-3">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={atras}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" /> Atrás
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={route('service-desk.ordenes.index')}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              <X className="h-4 w-4" /> Cancelar
            </Link>

            {isEdit && (
              <button
                type="button"
                onClick={guardar}
                disabled={processing}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> {processing ? 'Guardando…' : 'Guardar cambios'}
              </button>
            )}

            {step < 2 ? (
              <button
                type="button"
                onClick={siguiente}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            ) : !isEdit ? (
              <button
                type="button"
                onClick={guardar}
                disabled={processing}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> {processing ? 'Guardando…' : 'Crear orden'}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Modal: crear falla/accesorio en tiempo real */}
      <Modal
        open={modalCat !== null}
        onClose={() => setModalCat(null)}
        title={modalCat === 'fallas' ? 'Nueva falla' : 'Nuevo accesorio'}
        description="Se agrega al catálogo y queda disponible para próximas órdenes."
        icon={modalCat === 'fallas' ? TriangleAlert : Package}
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalCat(null)}
              className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={crearItem}
              disabled={creando || !nuevoNombre.trim()}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> {creando ? 'Agregando…' : 'Agregar'}
            </button>
          </>
        }
      >
        <Field
          label={modalCat === 'fallas' ? 'Nombre de la falla' : 'Nombre del accesorio'}
          htmlFor="nuevo_item"
        >
          <Input
            id="nuevo_item"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={modalCat === 'fallas' ? 'Ej. No carga' : 'Ej. Cargador'}
            autoFocus
          />
        </Field>
        {!data.tipo_equipo_id && (
          <p className="mt-2 text-xs text-muted-foreground">
            Se creará como general (visible para todos los tipos de equipo).
          </p>
        )}
      </Modal>
    </form>
  )
}
