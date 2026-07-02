import { useEffect, useRef, useState } from 'react'
import { Head, usePage, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { useToast } from '@/Components/toasts/ToastProvider'
import { useTheme } from '@/Hooks/useTheme'
import '@/../css/dashboard.css'

interface DashboardProps {
  auth: { user: { name: string; email: string } }
  tenantName?: string
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
    cuentas_por_pagar?: unknown[]
    servicios_pendientes?: unknown[]
    cajas_abiertas?: Array<{ caja: string; cajero: string; saldo_actual: number; horas_abierta: number }>
  }
}

export default function Dashboard() {
  const { props } = usePage()
  const { auth, tenantName, stats = {}, alertsSummary } = props as DashboardProps
  const moduleMenus = Array.isArray(props.moduleMenus) ? props.moduleMenus : []
  const recentActivity = Array.isArray(props.recentActivity) ? props.recentActivity : []
  const activitySeries = Array.isArray(props.activitySeries) ? props.activitySeries : []
  const pendingTasks = Array.isArray(props.pendingTasks) ? props.pendingTasks : []
  const quickAccess = Array.isArray(props.quickAccess) ? props.quickAccess : []
  
  const { theme, toggleTheme } = useTheme()
  const { toast } = useToast()

  const fmtMoney = (n: number) => {
    if (!n) return '$ 0'
    if (n >= 1_000_000) return '$ ' + (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000)     return '$ ' + (n / 1_000).toFixed(0) + 'k'
    return '$ ' + n.toLocaleString('es-CO')
  }

  const [showTaskModal, setShowTaskModal] = useState(false)
  const [newTaskActividad, setNewTaskActividad] = useState('')
  const [newTaskDepto, setNewTaskDepto] = useState('')
  const [newTaskDate, setNewTaskDate] = useState('')

  const handleSaveTask = () => {
    if (newTaskActividad.trim()) {
      router.post(route('core.tasks.store'), {
        titulo: newTaskActividad,
        departamento: newTaskDepto || 'General',
        fecha_limite: newTaskDate || null,
      }, {
        onSuccess: () => {
          setNewTaskActividad('')
          setNewTaskDepto('')
          setNewTaskDate('')
          setShowTaskModal(false)
          toast('Tarea guardada', 'success')
        }
      })
    }
  }

  const toggleTask = (taskToToggle: Record<string, unknown>) => {
    if (!taskToToggle.isLocal) {
       toast('Esta es una tarea del sistema. Ve al módulo correspondiente para resolverla.', 'info')
       return
    }
    const isDone = taskToToggle.estado !== 'completada'
    router.put(route('core.tasks.update', taskToToggle.id as number), {
      estado: isDone ? 'completada' : 'pendiente'
    }, {
      preserveScroll: true
    })
  }

  const cycleTaskState = (task: Record<string, unknown>) => {
    if (!task.isLocal) return
    const states = ['pendiente', 'en_progreso', 'completada']
    const currentState = (task.estado as string) || 'pendiente'
    const nextIdx = (states.indexOf(currentState) + 1) % states.length
    const newState = states[nextIdx]
    
    router.put(route('core.tasks.update', task.id as number), {
      estado: newState
    }, {
      preserveScroll: true
    })
  }

  const qAccess = (quickAccess && quickAccess.length > 0) ? quickAccess : [
    { label: 'Nuevo usuario', route: 'core.users.create', icon: 'user-plus', color: 'indigo' },
    { label: 'Abrir Caja', route: 'cash.arqueo.index', icon: 'wallet', color: 'emerald' },
    { label: 'Ver usuarios', route: 'core.users.index', icon: 'users', color: 'emerald' },
    { label: 'Roles y Permisos', route: 'core.roles.index', icon: 'shield-lock', color: 'pro' },
    { label: 'Configuración', route: 'core.tenant.edit', icon: 'settings', color: 'default' },
  ]
  
  const personalTasks = Array.isArray(props.personalTasks) ? props.personalTasks : []
  const allTasks = [
    ...pendingTasks.map((t) => ({ ...t, done: false, isLocal: false })), 
    ...personalTasks.map((t) => ({
      ...t,
      title: t.titulo,
      depto: t.departamento,
      done: t.estado === 'completada',
      isLocal: true
    }))
  ]

  const getBtnClass = (color: string) => {
    if (color === 'emerald') return 'quick-btn success'
    if (color === 'indigo') return 'quick-btn accent'
    if (color === 'amber' || color === 'warning') return 'quick-btn warn'
    if (color === 'pro') return 'quick-btn pro'
    return 'quick-btn'
  }

  const getIcon = (iconName: string) => {
    const map: Record<string, string> = {
      'UserPlus': 'user-plus',
      'Package': 'package',
      'Wrench': 'tool',
      'ClipboardList': 'clipboard-list',
      'Truck': 'truck',
      'Calculator': 'calculator',
      'IdCard': 'id',
      'Wallet': 'wallet',
      'ShoppingCart': 'shopping-cart'
    }
    return map[iconName] || iconName || 'arrow-right'
  }

  const chartRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!chartRef.current || typeof window === 'undefined') return
    const w = window as Record<string, unknown>
    if (!w.Chart) return
    
    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return
    const isDark = theme === 'dark'
    const gridColor  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
    const tickColor  = '#898781'
    
    const labels = activitySeries.length > 0 ? activitySeries.map((s) => s.fecha.substring(5,10)) : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    const data = activitySeries.length > 0 ? activitySeries.map((s) => s.total) : [4, 7, 5, 9, 12, 3, 6]

    const ChartCtor = w.Chart as new (ctx: CanvasRenderingContext2D, config: Record<string, unknown>) => { destroy: () => void }
    const chartInstance = new ChartCtor(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Eventos',
          data,
          borderColor: '#2a78d6',
          backgroundColor: 'rgba(42,120,214,0.08)',
          borderWidth: 2,
          pointBackgroundColor: '#2a78d6',
          pointBorderColor: isDark ? '#222221' : '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 12 } }, border: { display: false } },
          y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 12 }, stepSize: 2 }, border: { display: false }, min: 0 }
        }
      }
    });
    
    return () => chartInstance.destroy()
  }, [theme, activitySeries])

  const stock = Array.isArray(alertsSummary?.stock_bajo) ? alertsSummary.stock_bajo : []
  const facturas = Array.isArray(alertsSummary?.facturas_por_vencer) ? alertsSummary.facturas_por_vencer : []
  const cajas = Array.isArray(alertsSummary?.cajas_abiertas) ? alertsSummary.cajas_abiertas : []

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css" crossOrigin="anonymous" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" crossOrigin="anonymous" />
      </Head>

      <div className="custom-dash-container" data-theme={theme}>
        {/* Quick Bar */}
        <div className="quick-bar">
          <span className="quick-label">Acceso rápido</span>
          <div className="quick-divider"></div>
          
          {qAccess.map((item, idx) => (
            <Link key={idx} href={item.route ? (route().has(item.route) ? route(item.route) : '#') : '#'} className={getBtnClass(item.color)} onClick={() => toast(`Abriendo ${item.label}`, 'info')}>
              <i className={`ti ti-${getIcon(item.icon)}`}></i> {item.label}
            </Link>
          ))}
          
          <div className="quick-more" onClick={() => toast('Mostrando más accesos rápidos', 'info')}>
            <i className="ti ti-dots" style={{ fontSize:14 }}></i> Más
          </div>
        </div>

        {/* KPIs */}
        <section className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-label">
              <i className="ti ti-trending-up" style={{ fontSize:13, color:'var(--text-success)' }}></i> Ventas del mes
            </div>
            <div className="kpi-value">{fmtMoney(stats.ventas_mes || 0)}</div>
            <div className="delta up">
              <i className="ti ti-arrow-up" style={{ fontSize:11 }}></i> +12.4% vs mes anterior
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">
              <i className="ti ti-receipt" style={{ fontSize:13, color:'var(--text-accent)' }}></i> Órdenes activas
            </div>
            <div className="kpi-value">{stats.ordenes_en_proceso || 0}</div>
            <div className="delta up">
              <i className="ti ti-arrow-up" style={{ fontSize:11 }}></i> +{stats.ordenes_hoy || 0} nuevas hoy
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">
              <i className="ti ti-box" style={{ fontSize:13, color:'var(--text-warning)' }}></i> Stock bajo
            </div>
            <div className="kpi-value">{stats.productos_bajo_stock || 0}</div>
            <div className="delta warn">
              <i className="ti ti-alert-triangle" style={{ fontSize:11 }}></i> Revisión necesaria
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">
              <i className="ti ti-users" style={{ fontSize:13, color:'var(--text-pro)' }}></i> Clientes activos
            </div>
            <div className="kpi-value">{stats.clientes || 0}</div>
            <div className="delta up">
              <i className="ti ti-arrow-up" style={{ fontSize:11 }}></i> Registrados en CRM
            </div>
          </div>
        </section>

        {/* Chart + Modules */}
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <div className="card-title"><i className="ti ti-chart-line"></i> Actividad de la semana</div>
              <div className="card-action">Ver detalles <i className="ti ti-arrow-right" style={{ fontSize:12 }}></i></div>
            </div>
            <div className="chart-wrap">
              <canvas id="weekChart" ref={chartRef}></canvas>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title"><i className="ti ti-apps"></i> Módulos activos</div>
            </div>
            <div className="modules-grid">
              {moduleMenus.length === 0 && (
                <div className="text-sm text-muted-foreground p-2">Sin módulos activos.</div>
              )}
              {moduleMenus.map((mod, idx) => {
                const lbl = (mod.section || '').toLowerCase()
                let icon = 'ti-apps'
                let bg = 'var(--bg-accent)'
                let tc = 'var(--text-accent)'
                if (lbl.includes('conta')) { icon = 'ti-book'; bg = 'var(--bg-accent)'; tc = 'var(--text-accent)' }
                if (lbl.includes('tesor') || lbl.includes('caja')) { icon = 'ti-cash'; bg = 'var(--bg-success)'; tc = 'var(--text-success)' }
                if (lbl.includes('crm')) { icon = 'ti-users'; bg = 'var(--bg-pro)'; tc = 'var(--text-pro)' }
                if (lbl.includes('inv')) { icon = 'ti-box'; bg = 'var(--bg-warning)'; tc = 'var(--text-warning)' }
                if (lbl.includes('compra')) { icon = 'ti-shopping-cart'; bg = 'var(--bg-danger)'; tc = 'var(--text-danger)' }
                if (lbl.includes('venta')) { icon = 'ti-chart-bar'; bg = 'var(--bg-success)'; tc = 'var(--text-success)' }
                if (lbl.includes('serv')) { icon = 'ti-tool'; bg = 'var(--bg-accent)'; tc = 'var(--text-accent)' }

                return (
                  <div key={idx} className="mod-item" onClick={() => toast(`Abriendo ${mod.section}`, 'info')}>
                    <div className="mod-icon" style={{ background: bg }}>
                      <i className={`ti ${icon}`} style={{ color: tc }}></i>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="mod-name" title={mod.section}>{mod.section}</div>
                      <div className="mod-count">Activo</div>
                    </div>
                    <i className="ti ti-chevron-right mod-arrow"></i>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Activity + Tasks */}
        <div className="row-bottom">
          <div className="card">
            <div className="card-header">
              <div className="card-title"><i className="ti ti-activity"></i> Actividad reciente</div>
              <div className="card-action">Ver todo <i className="ti ti-arrow-right" style={{ fontSize:12 }}></i></div>
            </div>
            <div>
              {recentActivity.length === 0 && (
                <div className="text-sm text-muted-foreground py-4" style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin actividad reciente.</div>
              )}
              {recentActivity.slice(0,5).map((act, idx) => (
                <div key={idx} className="act-item">
                  <div className="act-dot" style={{ background: 'var(--fill-success)' }}></div>
                  <div>
                    <div className="act-text"><strong>{act.description}</strong></div>
                    <div className="act-time">{act.created_at || 'Recientemente'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title"><i className="ti ti-checklist"></i> Tareas pendientes</div>
              <button className="card-action" onClick={() => setShowTaskModal(true)} style={{ background:'none', border:'none', padding:0, cursor:'pointer' }}>
                <i className="ti ti-plus" style={{ fontSize:12 }}></i> Agregar
              </button>
            </div>
            <div>
              {allTasks.length === 0 && (
                <div className="text-sm text-muted-foreground py-4" style={{ color: 'var(--text-muted)', fontSize: 13 }}>No hay tareas pendientes.</div>
              )}
              {allTasks.slice(0,5).map((task, idx) => (
                <div key={idx} className="task-item">
                  <div className={`chk ${task.done ? 'done' : ''}`} onClick={() => toggleTask(task)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {task.done && <i className="ti ti-check" style={{ fontSize: 10, color: 'white' }}></i>}
                  </div>
                  <span className={`task-label ${task.done ? 'done' : ''}`}>
                    {task.title || task.label || task.name}
                    {task.isLocal && task.depto && <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 400 }}>— {task.depto}</span>}
                    {task.isLocal && task.fecha_limite && <span style={{ fontSize: '11px', color: task.fecha_limite < new Date().toISOString() ? 'var(--text-danger)' : 'var(--text-muted)', marginLeft: '6px', fontWeight: 400 }}>— Vence: {new Date(task.fecha_limite).toLocaleDateString('es-CO')}</span>}
                  </span>
                  <span 
                    className={`tag ${task.isLocal ? (task.estado === 'en_progreso' ? 't-c' : (task.done ? 't-v' : 't-i')) : 't-v'}`} 
                    onClick={() => cycleTaskState(task)}
                    style={{ cursor: task.isLocal ? 'pointer' : 'default', userSelect: 'none' }}
                  >
                    {!task.isLocal ? 'Sistema' : (
                      task.estado === 'en_progreso' ? 'En progreso' :
                      task.done ? 'Completada' : 'Pendiente'
                    )}
                  </span>
                </div>
              ))}
              <Link href={route('core.tasks.index')} style={{ display: 'block', textAlign: 'center', fontSize: '13px', padding: '10px 0', borderTop: '0.5px solid var(--border)', color: 'var(--text-accent)', textDecoration: 'none', fontWeight: 500 }}>
                Abrir Tablero Kanban <i className="ti ti-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="row-bottom" style={{ marginTop: '16px' }}>
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <div className="card-title">
                <i className="ti ti-bell-ringing"></i> Centro de Alertas
              </div>
            </div>
            
            <div className="grid-2" style={{ gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              <div style={{ border: '0.5px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-warning)' }}><i className="ti ti-box"></i> Stock Bajo ({stock.length})</div>
                {stock.length === 0 ? <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Todo en orden.</div> : (
                  stock.slice(0, 3).map((s, i) => (
                    <div key={i} className="act-item" style={{ padding: '6px 0', border: 'none' }}>
                      <div className="act-dot" style={{ background: 'var(--fill-warning)' }}></div>
                      <div>
                        <div className="act-text"><strong>{s.nombre}</strong> <span className="pill pill-w">Crítico</span></div>
                        <div className="act-time">Stock: {s.stock_actual} / {s.stock_minimo}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ border: '0.5px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-danger)' }}><i className="ti ti-receipt"></i> Facturas por Vencer ({facturas.length})</div>
                {facturas.length === 0 ? <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin facturas próximas a vencer.</div> : (
                  facturas.slice(0, 3).map((f, i) => (
                    <div key={i} className="act-item" style={{ padding: '6px 0', border: 'none' }}>
                      <div className="act-dot" style={{ background: 'var(--fill-danger)' }}></div>
                      <div>
                        <div className="act-text"><strong>{f.numero}</strong> <span className="pill pill-d">Vence en {f.dias_restantes}d</span></div>
                        <div className="act-time">{f.cliente} — {fmtMoney(f.total)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ border: '0.5px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-success)' }}><i className="ti ti-cash"></i> Cajas Abiertas ({cajas.length})</div>
                {cajas.length === 0 ? <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Todas las cajas cerradas.</div> : (
                  cajas.slice(0, 3).map((c, i) => (
                    <div key={i} className="act-item" style={{ padding: '6px 0', border: 'none' }}>
                      <div className="act-dot" style={{ background: 'var(--fill-success)' }}></div>
                      <div>
                        <div className="act-text"><strong>{c.caja}</strong> <span className="pill pill-s">{c.horas_abierta}h abierta</span></div>
                        <div className="act-time">{c.cajero} — {fmtMoney(c.saldo_actual)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Task Modal Overlay */}
        {showTaskModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}>
            <div style={{ backgroundColor: 'var(--surface-2)', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: 600 }}>Nueva Tarea Personal</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Actividad / Nombre</label>
                  <input 
                    type="text" 
                    value={newTaskActividad}
                    onChange={e => setNewTaskActividad(e.target.value)}
                    placeholder="Ej: Revisar cierre de mes"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface-0)', fontSize: '14px', outline: 'none' }}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Departamento</label>
                  <select 
                    value={newTaskDepto}
                    onChange={e => setNewTaskDepto(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface-0)', fontSize: '14px', outline: 'none' }}
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
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Fecha Límite (Opcional)</label>
                  <input 
                    type="datetime-local" 
                    value={newTaskDate}
                    onChange={e => setNewTaskDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface-0)', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button 
                  onClick={() => setShowTaskModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-strong)', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveTask}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#000', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                >
                  Guardar Tarea
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AuthenticatedLayout>
  )
}
