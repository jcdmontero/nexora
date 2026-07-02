import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Modal } from '@/Components/ui/modal'
import { DataTable } from '@/Components/ui/data-table'
import { cn } from '@/lib/utils'
import PrestadorEditModal from '@/Pages/ServiceDesk/Prestadores/PrestadorEditModal'
import {
  Briefcase, Users, UserCheck, ExternalLink,
  Mail, Phone, Hash, User, Wrench, Activity,
  Coins, Percent, Pencil, Trash2, AlertTriangle,
  ArrowUpRight, Clock, ChevronRight, ArrowLeft,
} from 'lucide-react'

// ─── Tipos ───

interface OrdenResumen {
  id: number
  numero_orden: string
  estado: string
  estado_label: string
  estado_color: string
  total_cliente: number
  fecha_recibido: string | null
}

interface PrestadorData {
  id: number
  nombre_completo: string
  tipo_documento: string
  numero_documento: string | null
  email: string | null
  telefono: string | null
  tipo_vinculacion: string
  activo: boolean
  es_gratuito: boolean
  tipo_comision: string | null
  porcentaje_comision: number
  user_id: number | null
  user_name: string | null
  ordenes_count: number
  total_comisiones: number
  ordenes: OrdenResumen[]
}

interface ShowProps {
  prestador: PrestadorData
}

// ─── Constantes ───

const VINCULACION_CFG: Record<string, { label: string; icon: typeof Briefcase; class: string }> = {
  CONTRATISTA:  { label: 'Contratista',  icon: Briefcase,   class: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300' },
  EMPLEADO:     { label: 'Empleado',     icon: UserCheck,   class: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300' },
  FREELANCE:    { label: 'Freelance',    icon: ExternalLink,class: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-300' },
  COMISIONISTA: { label: 'Comisionista', icon: Users,       class: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300' },
  APRENDIZ:     { label: 'Aprendiz',     icon: Users,       class: 'bg-pink-50 text-pink-700 ring-pink-600/20 dark:bg-pink-500/10 dark:text-pink-300' },
  SOCIO:        { label: 'Socio',        icon: Users,       class: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300' },
}

const ESTADO_CLS: Record<string, string> = {
  recibido:    'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-300',
  asignado:    'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300',
  diagnostico: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300',
  reparacion:  'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300',
  pruebas:     'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300',
  listo:       'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  entregado:   'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-300',
  cancelado:   'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300',
}

const money = (n: number | string | null | undefined): string =>
  '$ ' + Number(n || 0).toLocaleString('es-CO')

// ─── Componente ───

export default function PrestadorShow({ prestador }: ShowProps) {
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const cfg = VINCULACION_CFG[prestador.tipo_vinculacion] || VINCULACION_CFG.CONTRATISTA
  const VinculacionIcon = cfg.icon
  const iniciales = prestador.nombre_completo
    .split(' ')
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // Columnas de la tabla de órdenes
  const columns = [
    {
      key: 'orden', header: 'Orden',
      cell: (o: OrdenResumen) => (
        <Link
          href={route('service-desk.ordenes.show', o.id)}
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          {o.numero_orden}
          <ArrowUpRight className="h-3 w-3 shrink-0" />
        </Link>
      ),
    },
    {
      key: 'estado', header: 'Estado',
      cell: (o: OrdenResumen) => {
        const cls = ESTADO_CLS[o.estado] || 'bg-slate-50 text-slate-700'
        return (
          <Badge variant="outline" className={cls}>
            {o.estado_label}
          </Badge>
        )
      },
    },
    {
      key: 'total', header: 'Total', alignEnd: true, hideOnMobile: true,
      cell: (o: OrdenResumen) => (
        <span className="tabular-nums font-medium text-foreground">{money(o.total_cliente)}</span>
      ),
    },
    {
      key: 'fecha', header: 'Recibido', hideOnMobile: true,
      cell: (o: OrdenResumen) => (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {o.fecha_recibido
            ? new Date(o.fecha_recibido).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—'}
        </span>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title={prestador.nombre_completo} />

      {/* ── Hero / Profile ── */}
      <div className="-mx-4 -mt-4 mb-8 rounded-none bg-gradient-to-b from-indigo-50/80 to-white px-4 pb-8 pt-6 dark:from-indigo-950/20 dark:to-background sm:-mx-6 sm:-mt-6 sm:rounded-b-3xl sm:px-8 lg:-mx-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          {/* Navegación secundaria */}
          <Link
            href={route('service-desk.prestadores.index')}
            className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronRight className="h-3 w-3 rotate-180" />
            Volver a prestadores
          </Link>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            {/* Avatar + nombre */}
            <div className="flex items-center gap-5">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold tracking-wide text-white shadow-lg shadow-indigo-600/20 dark:bg-indigo-500 dark:shadow-indigo-500/20">
                {iniciales}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">{prestador.nombre_completo}</h1>
                  <Badge variant="outline" className={cn('ring-1', cfg.class)}>
                    <VinculacionIcon className="mr-1 h-3 w-3" />
                    {cfg.label}
                  </Badge>
                  <span className={cn(
                    'inline-flex h-2 w-2 rounded-full',
                    prestador.activo ? 'bg-emerald-500' : 'bg-slate-300',
                  )} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Prestador de servicios técnicos &middot; {prestador.ordenes_count} órdenes asignadas
                </p>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => router.get(route('service-desk.prestadores.index'))}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setEditModalOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="mx-auto mb-8 grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Órdenes asignadas', value: prestador.ordenes_count, icon: Activity, color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/10' },
          { label: 'Total comisiones', value: money(prestador.total_comisiones), icon: Coins, color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10' },
          { label: 'Vinculación', value: cfg.label, icon: VinculacionIcon, color: 'text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10' },
          { label: 'Comisión', value: prestador.es_gratuito ? 'Gratuito' : prestador.tipo_comision === 'PORCENTAJE' ? `${prestador.porcentaje_comision}%` : prestador.tipo_comision ?? '—', icon: Percent, color: 'text-purple-600 bg-purple-50 dark:text-purple-300 dark:bg-purple-500/10' },
        ].map((stat) => {
          const StatIcon = stat.icon
          return (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', stat.color)}>
                  <StatIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-0.5 text-base font-semibold tracking-tight text-foreground">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Grid principal ── */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna izquierda — datos de contacto */}
        <div className="order-2 space-y-5 lg:order-1 lg:col-span-2">
          {/* Información de contacto */}
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-sky-500" />
                  Información de contacto
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="divide-y divide-border/50">
              {[
                { icon: Hash, label: 'Documento', value: prestador.numero_documento ? `${prestador.tipo_documento} ${prestador.numero_documento}` : 'No registrado' },
                { icon: Mail, label: 'Correo electrónico', value: prestador.email || 'No registrado' },
                { icon: Phone, label: 'Teléfono', value: prestador.telefono || 'No registrado' },
                { icon: User, label: 'Usuario asociado', value: prestador.user_name || 'Sin usuario' },
              ].map((item) => {
                const ItemIcon = item.icon
                const isLink = item.label === 'Correo electrónico' && prestador.email
                return (
                  <div key={item.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <ItemIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                      {isLink ? (
                        <a href={`mailto:${prestador.email}`} className="text-sm font-medium text-primary hover:underline">
                          {item.value}
                        </a>
                      ) : (
                        <p className="truncate text-sm font-medium text-foreground">{item.value}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            </CardContent>
          </Card>

          {/* Órdenes recientes */}
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-500" />
                  Órdenes asignadas
                  <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                    {prestador.ordenes_count}
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
            {prestador.ordenes.length > 0 ? (
              <DataTable columns={columns} data={prestador.ordenes} />
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Wrench className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Sin órdenes asignadas</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Este prestador aún no tiene órdenes de trabajo.
                </p>
              </div>
            )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — comisiones y resumen */}
        <aside className="order-1 space-y-5 lg:order-2">
          {/* Tarjeta de comisión */}
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-emerald-500" />
                  Configuración de comisión
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prestador.es_gratuito ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <Wrench className="mr-1.5 inline h-4 w-4" />
                  Técnico gratuito — no genera comisión
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-xs font-medium text-muted-foreground">Tipo</span>
                    <span className="text-sm font-semibold text-foreground">{prestador.tipo_comision ?? '—'}</span>
                  </div>
                  {prestador.tipo_comision === 'PORCENTAJE' && (
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-xs font-medium text-muted-foreground">Porcentaje</span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                        <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                        {prestador.porcentaje_comision}%
                      </span>
                    </div>
                  )}
                  {prestador.tipo_comision === 'FIJO' && (
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-xs font-medium text-muted-foreground">Valor fijo</span>
                      <span className="text-sm font-semibold text-foreground">{money(prestador.total_comisiones)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-xs font-medium text-muted-foreground">Total comisiones generadas</span>
                <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {money(prestador.total_comisiones)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Resumen rápido */}
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-sky-500" />
                  Resumen
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
            <ul className="space-y-2.5">
              {[
                { label: 'Vinculación', value: cfg.label, color: 'text-amber-600' },
                { label: 'Estado', value: prestador.activo ? 'Activo' : 'Inactivo', color: prestador.activo ? 'text-emerald-600' : 'text-slate-500' },
                { label: 'Órdenes', value: `${prestador.ordenes_count} asignadas`, color: 'text-indigo-600' },
                { label: 'Técnico gratuito', value: prestador.es_gratuito ? 'Sí' : 'No', color: prestador.es_gratuito ? 'text-emerald-600' : 'text-slate-500' },
              ].map((item) => (
                <li key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className={cn('text-sm font-medium', item.color)}>{item.value}</span>
                </li>
              ))}
            </ul>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* ── Modal de eliminación ── */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar prestador"
        icon={AlertTriangle}
        className="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            ¿Estás seguro de eliminar a <strong className="text-foreground">{prestador.nombre_completo}</strong>?
            Esta acción no se puede deshacer.
          </p>
          {prestador.ordenes_count > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
              Este prestador tiene {prestador.ordenes_count} órdenes asignadas. No se podrá eliminar hasta que se reassignen.
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-5">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              router.delete(route('service-desk.prestadores.destroy', prestador.id), {
                preserveScroll: true,
                onFinish: () => setShowDeleteModal(false),
              })
            }}
          >
            Eliminar
          </Button>
        </div>
      </Modal>

      {/* ── Modal de edición ── */}
      <PrestadorEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        prestador={prestador}
      />
    </AuthenticatedLayout>
  )
}
