import { useState } from 'react'
import { Head, usePage, Link, router } from '@inertiajs/react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { useToast } from '@/Components/toasts/ToastProvider'
import { routeExistsSafe, cn } from '@/lib/utils'
import { KPISkeleton, ChartSkeleton, WidgetSkeleton } from '@/Widgets/WidgetSkeleton'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { StatCard } from '@/Components/ui/stat-card'
import { getAccent, chartColors, type AccentColor } from '@/lib/accent'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/Components/ui/dialog'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { EmptyState } from '@/Components/ui/empty-state'
import {
  TrendingUp, Receipt, Package, Users, AlertTriangle, Activity,
  ArrowRight, LayoutDashboard, Book, Wallet, ShoppingCart, BarChart3,
  Wrench, User, Bell, ChevronRight, ClipboardList, Plus, Check, BellRing,
  UserPlus, Shield, Settings, type LucideIcon,
} from 'lucide-react'

interface DashboardProps {
  stats?: Record<string, number>
  recentActivity?: Array<{ description: string; created_at?: string }>
  activitySeries?: Array<{ fecha: string; total: number }>
  pendingTasks?: Array<{ label: string; count: number; route: string; accent: string }>
  quickAccess?: Array<{ label: string; route: string; icon: string; color: string }>
  personalTasks?: Array<{ id: number; titulo: string; departamento?: string; estado?: string; fecha_limite?: string }>
  moduleMenus?: Array<{ section: string; items: unknown[] }>
  alertsSummary?: {
    stock_bajo?: Array<{ nombre: string; stock_actual: number; stock_minimo: number }>
    facturas_por_vencer?: Array<{ numero: string; total: number; cliente: string; dias_restantes: number }>
    cuentas_por_pagar?: Array<{ id: number; numero: string; total: number; proveedor: string; estado: string; dias_desde_creacion: number }>
    servicios_pendientes?: Array<{ id: number; numero_orden: string; estado: string; cliente: string; fecha: string; dias: number }>
    cajas_abiertas?: Array<{ caja: string; cajero: string; saldo_actual: number; horas_abierta: number }>
  }
}

const quickIconMap: Record<string, LucideIcon> = {
  'user-plus': UserPlus,
  wallet: Wallet,
  users: Users,
  'shield-lock': Shield,
  settings: Settings,
  Package,
  Wrench,
  ClipboardList,
  Truck: Package,
  Calculator: Receipt,
  IdCard: User,
  ShoppingCart,
}

function getModuleMeta(section: string): { icon: LucideIcon; accent: AccentColor } {
  const lbl = section.toLowerCase()
  if (lbl.includes('conta')) return { icon: Book, accent: 'indigo' }
  if (lbl.includes('tesor') || lbl.includes('caja')) return { icon: Wallet, accent: 'emerald' }
  if (lbl.includes('crm')) return { icon: Users, accent: 'violet' }
  if (lbl.includes('inv')) return { icon: Package, accent: 'amber' }
  if (lbl.includes('compra')) return { icon: ShoppingCart, accent: 'rose' }
  if (lbl.includes('venta')) return { icon: BarChart3, accent: 'emerald' }
  if (lbl.includes('serv')) return { icon: Wrench, accent: 'sky' }
  if (lbl.includes('recursos') || lbl.includes('hr')) return { icon: User, accent: 'sky' }
  if (lbl.includes('nómina') || lbl.includes('payroll')) return { icon: Receipt, accent: 'emerald' }
  if (lbl.includes('notif')) return { icon: Bell, accent: 'amber' }
  return { icon: LayoutDashboard, accent: 'indigo' }
}

function quickBtnClasses(color: string): string {
  const base =
    'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors no-underline cursor-pointer'
  switch (color) {
    case 'emerald':
      return cn(
        base,
        'bg-emerald-50 dark:bg-emerald-500/10',
        'border-emerald-200 dark:border-emerald-500/20',
        'text-emerald-600 dark:text-emerald-400',
        'hover:bg-emerald-100 dark:hover:bg-emerald-500/20',
        'hover:border-emerald-300 dark:hover:border-emerald-500/30',
      )
    case 'indigo':
      return cn(
        base,
        'bg-indigo-50 dark:bg-indigo-500/10',
        'border-indigo-200 dark:border-indigo-500/20',
        'text-indigo-600 dark:text-indigo-400',
        'hover:bg-indigo-100 dark:hover:bg-indigo-500/20',
        'hover:border-indigo-300 dark:hover:border-indigo-500/30',
      )
    case 'pro':
      return cn(
        base,
        'bg-violet-50 dark:bg-violet-500/10',
        'border-violet-200 dark:border-violet-500/20',
        'text-violet-600 dark:text-violet-400',
        'hover:bg-violet-100 dark:hover:bg-violet-500/20',
        'hover:border-violet-300 dark:hover:border-violet-500/30',
      )
    default:
      return cn(base, 'bg-muted border-border text-foreground', 'hover:bg-accent hover:text-accent-foreground')
  }
}

// Etiquetas para estados de servicio
const estadoServicioLabel: Record<string, string> = {
  recibido: 'Recibido',
  diagnosticado: 'Diagnosticado',
  en_proceso: 'En proceso',
}

// Etiquetas para estados de compra
const estadoCompraLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  enviada: 'Enviada',
  parcial: 'Parcial',
  aprobada: 'Aprobada',
}

export default function Dashboard() {
  const { props } = usePage()
  const { stats = {}, alertsSummary } = props as DashboardProps
  const moduleMenus = Array.isArray(props.moduleMenus) ? props.moduleMenus : []
  const recentActivity = Array.isArray(props.recentActivity) ? props.recentActivity : null
  const activitySeries = Array.isArray(props.activitySeries) ? props.activitySeries : null
  const pendingTasks = Array.isArray(props.pendingTasks) ? props.pendingTasks : null
  const quickAccess = Array.isArray(props.quickAccess) ? props.quickAccess : null
  const personalTasks = Array.isArray(props.personalTasks) ? props.personalTasks : null

  const isLoadingDeferred =
    recentActivity === null || activitySeries === null || pendingTasks === null || quickAccess === null

  const { toast } = useToast()

  const indigoText = getAccent('indigo').text

  const fmtMoney = (n: number) => {
    if (!n) return '$ 0'
    if (n >= 1_000_000) return '$ ' + (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return '$ ' + (n / 1_000).toFixed(0) + 'k'
    return '$ ' + n.toLocaleString('es-CO')
  }

  const [showTaskModal, setShowTaskModal] = useState(false)
  const [newTaskActividad, setNewTaskActividad] = useState('')
  const [newTaskDepto, setNewTaskDepto] = useState('')
  const [newTaskDate, setNewTaskDate] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveTask = () => {
    if (newTaskActividad.trim() && !isSaving) {
      setIsSaving(true)
      router.post(
        route('core.tasks.store'),
        { titulo: newTaskActividad, departamento: newTaskDepto || 'General', fecha_limite: newTaskDate || null },
        {
          onSuccess: () => {
            setNewTaskActividad('')
            setNewTaskDepto('')
            setNewTaskDate('')
            setShowTaskModal(false)
            toast('Tarea guardada', 'success')
          },
          onFinish: () => setIsSaving(false),
        },
      )
    }
  }

  const toggleTask = (taskToToggle: { id: number; isLocal: boolean; estado?: string }) => {
    if (!taskToToggle.isLocal) {
      toast('Esta es una tarea del sistema. Ve al módulo correspondiente para resolverla.', 'info')
      return
    }
    const isDone = taskToToggle.estado !== 'completada'
    router.put(route('core.tasks.update', taskToToggle.id), { estado: isDone ? 'completada' : 'pendiente' }, { preserveScroll: true })
  }

  const cycleTaskState = (task: { id: number; isLocal: boolean; estado?: string }) => {
    if (!task.isLocal) return
    const states = ['pendiente', 'en_progreso', 'completada']
    const currentState = task.estado || 'pendiente'
    router.put(route('core.tasks.update', task.id), { estado: states[(states.indexOf(currentState) + 1) % states.length] }, { preserveScroll: true })
  }

  const qAccess = quickAccess?.length
    ? quickAccess
    : [
        { label: 'Nuevo usuario', route: 'core.users.create', icon: 'user-plus', color: 'indigo' },
        { label: 'Abrir Caja', route: 'cash.caja.index', icon: 'wallet', color: 'emerald' },
        { label: 'Ver usuarios', route: 'core.users.index', icon: 'users', color: 'emerald' },
        { label: 'Roles y Permisos', route: 'core.roles.index', icon: 'shield-lock', color: 'pro' },
        { label: 'Configuración', route: 'core.tenant.edit', icon: 'settings', color: 'default' },
      ]

  const getModuleRoute = (section: string): string => {
    const lbl = section.toLowerCase()
    if (lbl.includes('conta')) return 'accounting.periodos.index'
    if (lbl.includes('tesor') || lbl.includes('caja')) return 'cash.caja.index'
    if (lbl.includes('crm')) return 'crm.clientes.index'
    if (lbl.includes('inv')) return 'inventory.productos.index'
    if (lbl.includes('compra')) return 'purchasing.ordenes.index'
    if (lbl.includes('venta')) return 'sales.facturas.index'
    if (lbl.includes('serv')) return 'service-desk.ordenes.index'
    if (lbl.includes('recursos') || lbl.includes('hr')) return 'hr.dashboard'
    if (lbl.includes('nómina') || lbl.includes('payroll')) return 'payroll.periodos.index'
    if (lbl.includes('notif')) return 'notifications.index'
    return ''
  }

  const personalTasksArr = personalTasks ?? []
  const allTasks = [
    ...(pendingTasks ?? []).map((t, idx) => ({
      keyId: `pending-${idx}`,
      id: idx,
      title: t.label,
      depto: 'Sistema',
      done: false,
      isLocal: false,
      fecha_limite: undefined,
      estado: 'pendiente',
    })),
    ...personalTasksArr.map((t) => ({
      keyId: `personal-${t.id}`,
      id: t.id,
      title: t.titulo,
      depto: t.departamento,
      done: t.estado === 'completada',
      isLocal: true,
      fecha_limite: t.fecha_limite,
      estado: t.estado,
    })),
  ]

  const stock = Array.isArray(alertsSummary?.stock_bajo) ? alertsSummary.stock_bajo : []
  const facturas = Array.isArray(alertsSummary?.facturas_por_vencer) ? alertsSummary.facturas_por_vencer : []
  const cxp = Array.isArray(alertsSummary?.cuentas_por_pagar) ? alertsSummary.cuentas_por_pagar : []
  const servicios = Array.isArray(alertsSummary?.servicios_pendientes) ? alertsSummary.servicios_pendientes : []
  const cajas = Array.isArray(alertsSummary?.cajas_abiertas) ? alertsSummary.cajas_abiertas : []

  const chartData = (activitySeries?.length ?? 0) > 0
    ? activitySeries.map((s) => ({ fecha: s.fecha.substring(5, 10), total: s.total }))
    : [
        { fecha: 'Lun', total: 4 },
        { fecha: 'Mar', total: 7 },
        { fecha: 'Mié', total: 5 },
        { fecha: 'Jue', total: 9 },
        { fecha: 'Vie', total: 12 },
        { fecha: 'Sáb', total: 3 },
        { fecha: 'Dom', total: 6 },
      ]

  // Verifica si la ruta de auditoría existe para los botones "Ver detalles/todo"
  const auditExists = routeExistsSafe('core.audit.index')

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />

      <div className="space-y-5">
        {/* ── Quick Access Bar ── */}
        <div className="flex items-center gap-2.5 p-3.5 bg-card border border-border rounded-xl flex-wrap">
          <span className="text-xs text-muted-foreground whitespace-nowrap mr-1">Acceso rápido</span>
          <div className="w-px h-7 bg-border mx-1" />
          {qAccess.map((item) => {
            const Icon = quickIconMap[item.icon] ?? ArrowRight
            const hasRoute = item.route && routeExistsSafe(item.route)
            const href = hasRoute ? route(item.route!) : '#'
            return (
              <Link
                key={item.label}
                href={href}
                className={quickBtnClasses(item.color)}
                onClick={(e) => {
                  if (!hasRoute) {
                    e.preventDefault()
                    toast(`El acceso a "${item.label}" no está disponible en este momento`, 'warning')
                  }
                }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* ── KPIs ── */}
        {isLoadingDeferred ? (
          <KPISkeleton />
        ) : (
          <div className="grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-3">
            <StatCard label="Ventas del mes" value={fmtMoney(stats.ventas_mes || 0)} icon={TrendingUp} hint="vs mes anterior" accent="emerald" index={0} />
            <StatCard label="Órdenes activas" value={stats.ordenes_en_proceso || 0} icon={ClipboardList} hint={`${stats.ordenes_hoy || 0} nuevas hoy`} accent="indigo" index={1} />
            <StatCard label="Stock bajo" value={stats.productos_bajo_stock || 0} icon={AlertTriangle} hint="Revisión necesaria" accent="amber" index={2} />
            <StatCard label="Clientes activos" value={stats.clientes || 0} icon={Users} hint="Registrados en CRM" accent="violet" index={3} />
          </div>
        )}

        {/* ── Chart + Modules ── */}
        <div className="grid grid-cols-[1fr_340px] max-lg:grid-cols-1 gap-4">
          {isLoadingDeferred ? (
            <ChartSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className={cn('h-4 w-4', indigoText)} />
                  Actividad de la semana
                </CardTitle>
                {auditExists ? (
                  <Link
                    href={route('core.audit.index')}
                    className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end text-xs flex items-center gap-1 no-underline hover:opacity-75', indigoText)}
                    aria-label="Ver registro completo de actividad semanal"
                  >
                    Ver detalles
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <span className="col-start-2 row-span-2 row-start-1 self-start justify-self-end" />
                )}
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="fecha" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          background: 'var(--card)',
                          color: 'var(--card-foreground)',
                        }}
                      />
                      <Line type="monotone" dataKey="total" stroke={chartColors.indigo} strokeWidth={2} dot={{ r: 4, fill: chartColors.indigo }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className={cn('h-4 w-4', indigoText)} />
                Módulos activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-2">
                {moduleMenus.length === 0 && (
                  <EmptyState
                    icon={LayoutDashboard}
                    title="Sin módulos activos"
                    description="No tienes módulos habilitados. Contacta al administrador para activarlos."
                    className="py-8 col-span-full"
                  />
                )}
                {moduleMenus.map((mod) => {
                  const { icon: ModIcon, accent } = getModuleMeta(mod.section)
                  const a = getAccent(accent)
                  const routeName = getModuleRoute(mod.section)
                  const hasRoute = routeName && routeExistsSafe(routeName)
                  const href = hasRoute ? route(routeName) : '#'

                  return (
                    <Link
                      key={mod.section}
                      href={href}
                      className={cn(
                        'flex items-center gap-2.5 p-2.5 rounded-lg border no-underline transition-colors min-w-0',
                        a.border,
                        a.hoverBg,
                        a.hover,
                      )}
                      onClick={(e) => {
                        if (!hasRoute) {
                          e.preventDefault()
                          toast(`El módulo ${mod.section} no tiene una ruta principal configurada en este momento`, 'warning')
                        }
                      }}
                    >
                      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', a[50])}>
                        <ModIcon className={cn('h-4 w-4', a.text)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-foreground truncate" title={mod.section}>
                          {mod.section}
                        </div>
                        <div className="text-[11px] text-muted-foreground">Activo</div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Activity + Tasks ── */}
        {isLoadingDeferred ? (
          <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-4">
            <WidgetSkeleton lines={5} />
            <WidgetSkeleton lines={5} />
          </div>
        ) : (
          <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className={cn('h-4 w-4', indigoText)} />
                  Actividad reciente
                </CardTitle>
                {auditExists ? (
                  <Link
                    href={route('core.audit.index')}
                    className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end text-xs flex items-center gap-1 no-underline hover:opacity-75', indigoText)}
                    aria-label="Ver registro completo de actividad"
                  >
                    Ver todo
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <span className="col-start-2 row-span-2 row-start-1 self-start justify-self-end" />
                )}
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <EmptyState
                    icon={Activity}
                    title="Sin actividad reciente"
                    description="Aún no hay registros de actividad. Cuando realices acciones en el sistema, aparecerán aquí."
                    className="py-8"
                  />
                ) : (
                  recentActivity.slice(0, 5).map((act, idx) => (
                    <div key={`${act.description}-${idx}`} className="flex items-start gap-3 py-2.5 border-b border-border last:border-b-0">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-emerald-500" />
                      <div>
                        <div className="text-sm text-foreground leading-tight">
                          <strong className="font-medium">{act.description}</strong>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{act.created_at || 'Recientemente'}</div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className={cn('h-4 w-4', indigoText)} />
                  Tareas pendientes
                </CardTitle>
                <button
                  className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end text-xs flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer hover:opacity-75', indigoText)}
                  onClick={() => setShowTaskModal(true)}
                  aria-label="Agregar nueva tarea personal"
                >
                  <Plus className="h-3 w-3" />
                  Agregar
                </button>
              </CardHeader>
              <CardContent>
                {allTasks.length === 0 ? (
                  <EmptyState
                    icon={ClipboardList}
                    title="No hay tareas pendientes"
                    description="Estás al día. Crea una nueva tarea cuando lo necesites."
                    className="py-8"
                  />
                ) : (
                  allTasks.slice(0, 5).map((task) => (
                    <div key={task.keyId} className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-b-0">
                      <button
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',
                          task.done ? 'bg-emerald-500 border-emerald-500' : 'border-foreground/20 hover:border-foreground/40',
                        )}
                        onClick={() => toggleTask(task)}
                        role="checkbox"
                        aria-checked={task.done}
                        aria-label={`Marcar tarea "${task.title}" como ${task.done ? 'pendiente' : 'completada'}`}
                      >
                        {task.done && <Check className="h-2.5 w-2.5 text-white" />}
                      </button>
                      <span className={cn('text-sm flex-1', task.done && 'text-muted-foreground line-through')}>
                        {task.title}
                        {task.isLocal && task.depto && (
                          <span className="text-[11px] text-muted-foreground ml-1.5 font-normal">— {task.depto}</span>
                        )}
                        {task.isLocal && task.fecha_limite && (
                          <span
                            className={cn(
                              'text-[11px] ml-1.5 font-normal',
                              new Date(task.fecha_limite) < new Date()
                                ? 'text-rose-500 dark:text-rose-400'
                                : 'text-muted-foreground',
                            )}
                          >
                            — Vence: {new Date(task.fecha_limite).toLocaleDateString('es-CO')}
                          </span>
                        )}
                      </span>
                      <button
                        className={cn(
                          'text-[11px] px-2 py-0.5 rounded-full border font-medium transition-colors shrink-0',
                          !task.isLocal &&
                            'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
                          task.isLocal &&
                            task.estado === 'en_progreso' &&
                            'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
                          task.isLocal &&
                            task.done &&
                            'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
                          task.isLocal &&
                            !task.done &&
                            task.estado !== 'en_progreso' &&
                            'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
                        )}
                        onClick={() => cycleTaskState(task)}
                        disabled={!task.isLocal}
                        aria-label={
                          !task.isLocal
                            ? 'Tarea del sistema'
                            : task.estado === 'en_progreso'
                              ? `Cambiar estado de "${task.title}" a completada`
                              : task.done
                                ? `Cambiar estado de "${task.title}" a pendiente`
                                : `Cambiar estado de "${task.title}" a en progreso`
                        }
                      >
                        {!task.isLocal
                          ? 'Sistema'
                          : task.estado === 'en_progreso'
                            ? 'En progreso'
                            : task.done
                              ? 'Completada'
                              : 'Pendiente'}
                      </button>
                    </div>
                  ))
                )}
                <Link
                  href={route('core.tasks.index')}
                  className={cn('block text-center text-xs no-underline font-medium py-2.5 border-t border-border mt-1 hover:opacity-75', indigoText)}
                >
                  Abrir Tablero Kanban <ArrowRight className="inline h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Alerts ── */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className={cn('h-4 w-4', indigoText)} />
                Centro de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
                {/* Stock bajo */}
                <div className="border border-border rounded-lg p-3">
                  <div className="text-xs font-medium mb-2 text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    Stock Bajo ({stock.length})
                  </div>
                  {stock.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Todo en orden.</div>
                  ) : (
                    stock.slice(0, 3).map((s, i) => (
                      <div key={`${s.nombre}-${i}`} className="flex items-start gap-3 py-1.5 border-b border-border last:border-b-0">
                        <div className="w-2 h-2 rounded-full mt-1 shrink-0 bg-amber-500" />
                        <div>
                          <div className="text-xs text-foreground leading-tight">
                            <strong className="font-medium">{s.nombre}</strong>{' '}
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                              Crítico
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Stock: {s.stock_actual} / {s.stock_minimo}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Facturas por vencer */}
                <div className="border border-border rounded-lg p-3">
                  <div className="text-xs font-medium mb-2 text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5" />
                    Facturas por Vencer ({facturas.length})
                  </div>
                  {facturas.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Sin facturas próximas a vencer.</div>
                  ) : (
                    facturas.slice(0, 3).map((f, i) => (
                      <div key={`${f.numero}-${i}`} className="flex items-start gap-3 py-1.5 border-b border-border last:border-b-0">
                        <div className="w-2 h-2 rounded-full mt-1 shrink-0 bg-rose-500" />
                        <div>
                          <div className="text-xs text-foreground leading-tight">
                            <strong className="font-medium">{f.numero}</strong>{' '}
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">
                              Vence en {f.dias_restantes}d
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {f.cliente} — {fmtMoney(f.total)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Cuentas por pagar */}
                <div className="border border-border rounded-lg p-3">
                  <div className="text-xs font-medium mb-2 text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Cuentas por Pagar ({cxp.length})
                  </div>
                  {cxp.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Sin cuentas pendientes.</div>
                  ) : (
                    cxp.slice(0, 3).map((c, i) => (
                      <div key={`${c.numero}-${i}`} className="flex items-start gap-3 py-1.5 border-b border-border last:border-b-0">
                        <div className="w-2 h-2 rounded-full mt-1 shrink-0 bg-rose-500" />
                        <div>
                          <div className="text-xs text-foreground leading-tight">
                            <strong className="font-medium">{c.numero}</strong>{' '}
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">
                              {estadoCompraLabel[c.estado] || c.estado}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {c.proveedor} — {fmtMoney(c.total)} · {c.dias_desde_creacion}d
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Servicios pendientes */}
                <div className="border border-border rounded-lg p-3">
                  <div className="text-xs font-medium mb-2 text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5" />
                    Servicios Pendientes ({servicios.length})
                  </div>
                  {servicios.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Sin servicios pendientes.</div>
                  ) : (
                    servicios.slice(0, 3).map((s, i) => (
                      <div key={`${s.numero_orden}-${i}`} className="flex items-start gap-3 py-1.5 border-b border-border last:border-b-0">
                        <div className="w-2 h-2 rounded-full mt-1 shrink-0 bg-sky-500" />
                        <div>
                          <div className="text-xs text-foreground leading-tight">
                            <strong className="font-medium">{s.numero_orden}</strong>{' '}
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium">
                              {estadoServicioLabel[s.estado] || s.estado}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {s.cliente} · {s.dias}d pendiente
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Cajas abiertas */}
                <div className="border border-border rounded-lg p-3">
                  <div className="text-xs font-medium mb-2 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5" />
                    Cajas Abiertas ({cajas.length})
                  </div>
                  {cajas.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Todas las cajas cerradas.</div>
                  ) : (
                    cajas.slice(0, 3).map((c, i) => (
                      <div key={`${c.caja}-${i}`} className="flex items-start gap-3 py-1.5 border-b border-border last:border-b-0">
                        <div className="w-2 h-2 rounded-full mt-1 shrink-0 bg-emerald-500" />
                        <div>
                          <div className="text-xs text-foreground leading-tight">
                            <strong className="font-medium">{c.caja}</strong>{' '}
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                              {c.horas_abierta}h abierta
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {c.cajero} — {fmtMoney(c.saldo_actual)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Task Modal ── */}
        <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={(e) => { e.preventDefault(); handleSaveTask() }}>
              <DialogHeader>
                <DialogTitle>Nueva Tarea Personal</DialogTitle>
                <DialogDescription>Crea una tarea para organizar tu trabajo diario.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Actividad / Nombre</Label>
                  <Input
                    value={newTaskActividad}
                    onChange={(e) => setNewTaskActividad(e.target.value)}
                    placeholder="Ej: Revisar cierre de mes"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Departamento</Label>
                  <select
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    value={newTaskDepto}
                    onChange={(e) => setNewTaskDepto(e.target.value)}
                  >
                    <option value="">Selecciona un departamento...</option>
                    <option value="Ventas">Ventas</option>
                    <option value="Contabilidad">Contabilidad</option>
                    <option value="Inventario">Inventario</option>
                    <option value="RRHH">Recursos Humanos</option>
                    <option value="Soporte">Soporte</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Fecha Límite (Opcional)</Label>
                  <Input
                    type="datetime-local"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setShowTaskModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving || !newTaskActividad.trim()}>
                  {isSaving ? 'Guardando...' : 'Guardar Tarea'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  )
}
