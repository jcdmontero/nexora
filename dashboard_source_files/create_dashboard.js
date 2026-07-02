const fs = require('fs');
const path = require('path');

const content = `import { useEffect, useRef, useState } from 'react'
import { Head, usePage, Link } from '@inertiajs/react'

export default function Dashboard() {
  const { props } = usePage() as any
  const { auth, tenantName, moduleMenus = [], stats = {}, recentActivity = [], activitySeries = [], pendingTasks = [], quickAccess = [], alertsSummary } = props
  
  const [isDark, setIsDark] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [showToast, setShowToast] = useState(false)

  const toggleDark = () => {
    setIsDark(!isDark)
    displayToast('Tema cambiado')
  }

  const displayToast = (msg: string) => {
    setToastMsg(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2400)
  }

  const fmtMoney = (n: number) => {
    if (!n) return '$ 0'
    if (n >= 1_000_000) return '$ ' + (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000)     return '$ ' + (n / 1_000).toFixed(0) + 'k'
    return '$ ' + n.toLocaleString('es-CO')
  }

  // Quick Access Fallback
  const qAccess = (quickAccess && quickAccess.length > 0) ? quickAccess : [
    { label: 'Nuevo cliente', route: 'core.dashboard', icon: 'user-plus', color: 'indigo' },
    { label: 'Nuevo producto', route: 'core.dashboard', icon: 'package', color: 'emerald' },
    { label: 'Nueva OT', route: 'core.dashboard', icon: 'clipboard-plus', color: 'pro' },
    { label: 'Nueva compra', route: 'core.dashboard', icon: 'file-plus', color: 'warning' },
    { label: 'Nueva factura', route: 'core.dashboard', icon: 'receipt', color: 'default' },
  ]

  const getBtnClass = (color: string) => {
    if (color === 'emerald') return 'quick-btn success'
    if (color === 'indigo') return 'quick-btn accent'
    if (color === 'amber' || color === 'warning') return 'quick-btn warn'
    if (color === 'pro') return 'quick-btn pro'
    return 'quick-btn'
  }

  const getIcon = (iconName: string) => {
    const map: any = {
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

  // Chart setup
  const chartRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!chartRef.current || typeof window === 'undefined') return
    const w = window as any
    if (!w.Chart) return
    
    const ctx = chartRef.current.getContext('2d')
    const gridColor  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
    const tickColor  = '#898781'
    
    const labels = activitySeries.length > 0 ? activitySeries.map((s: any) => s.fecha.substring(5,10)) : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    const data = activitySeries.length > 0 ? activitySeries.map((s: any) => s.total) : [4, 7, 5, 9, 12, 3, 6]

    const chartInstance = new w.Chart(ctx, {
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
  }, [isDark, activitySeries])

  // Count Alerts
  const stock = alertsSummary?.stock_bajo || []
  const facturas = alertsSummary?.facturas_por_vencer || []
  const cuentas = alertsSummary?.cuentas_por_pagar || []
  const servicios = alertsSummary?.servicios_pendientes || []
  const cajas = alertsSummary?.cajas_abiertas || []

  return (
    <div className="dash" data-theme={isDark ? 'dark' : 'light'}>
      <Head title="Dashboard">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      </Head>

      {/* TOAST */}
      <div id="toast" className={\`toast \${showToast ? 'show' : ''}\`} role="status" aria-live="polite">
        <i className="ti ti-check" aria-hidden="true"></i>
        <span>{toastMsg}</span>
      </div>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-name">Nexora</div>
          <div className="brand-sub">{tenantName || 'Mi Empresa S.A.S.'}</div>
        </div>

        <nav className="nav-section">
          <div className="nav-label">General</div>
          <Link href={route('core.dashboard')} className="nav-item active">
            <i className="ti ti-layout-dashboard"></i> Dashboard
          </Link>
          {moduleMenus.map((mod: any, idx: number) => {
             const lbl = (mod.section || '').toLowerCase()
             let icon = 'ti-apps'
             if (lbl.includes('conta')) icon = 'ti-book'
             if (lbl.includes('tesor')) icon = 'ti-cash'
             if (lbl.includes('crm')) icon = 'ti-users'
             if (lbl.includes('inv')) icon = 'ti-box'
             if (lbl.includes('compra')) icon = 'ti-shopping-cart'
             if (lbl.includes('venta')) icon = 'ti-chart-bar'
             if (lbl.includes('serv')) icon = 'ti-tool'
             if (lbl.includes('notif')) icon = 'ti-bell'
             
             return (
               <Link key={idx} href="#" className="nav-item">
                 <i className={\`ti \${icon}\`}></i> {mod.section}
               </Link>
             )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-row">
            <div className="avatar">{auth?.user?.name?.substring(0,2).toUpperCase() || 'AD'}</div>
            <div>
              <div className="user-name">{auth?.user?.name || 'Admin'}</div>
              <div className="user-role">Administrador</div>
            </div>
            <button className="icon-btn" style={{ border:'none', width:28, height:28, marginLeft:'auto' }}>
              <i className="ti ti-settings" style={{ fontSize:15 }}></i>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        {/* Topbar */}
        <div className="topbar">
          <h1 className="page-title">Dashboard</h1>
          <div className="topbar-right">
            <div className="search-box">
              <i className="ti ti-search"></i>
              <span>Buscar en Nexora...</span>
            </div>
            <button className="icon-btn">
              <i className="ti ti-bell" style={{ fontSize:16 }}></i>
              <div className="notif-dot"></div>
            </button>
            <button className="icon-btn" onClick={toggleDark}>
              <i className="ti ti-moon" style={{ fontSize:16 }}></i>
            </button>
          </div>
        </div>

        {/* Quick Bar */}
        <div className="quick-bar">
          <span className="quick-label">Acceso rápido</span>
          <div className="quick-divider"></div>
          
          {qAccess.map((item: any, idx: number) => (
            <Link key={idx} href={item.route ? (route().has(item.route) ? route(item.route) : '#') : '#'} className={getBtnClass(item.color)} onClick={() => displayToast(\`Abriendo \${item.label}\`)}>
              <i className={\`ti ti-\${getIcon(item.icon)}\`}></i> {item.label}
            </Link>
          ))}
          
          <div className="quick-more" onClick={() => displayToast('Mostrando más accesos rápidos')}>
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
              {moduleMenus.map((mod: any, idx: number) => {
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
                  <div key={idx} className="mod-item" onClick={() => displayToast(\`Abriendo \${mod.section}\`)}>
                    <div className="mod-icon" style={{ background: bg }}>
                      <i className={\`ti \${icon}\`} style={{ color: tc }}></i>
                    </div>
                    <div>
                      <div className="mod-name">{mod.section}</div>
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
                <div className="text-sm text-muted-foreground py-4">Sin actividad reciente.</div>
              )}
              {recentActivity.slice(0,5).map((act: any, idx: number) => (
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
              <button className="card-action" style={{ background:'none', border:'none', padding:0 }}>
                <i className="ti ti-plus" style={{ fontSize:12 }}></i> Agregar
              </button>
            </div>
            <div>
              {pendingTasks.length === 0 && (
                <div className="text-sm text-muted-foreground py-4">No hay tareas pendientes.</div>
              )}
              {pendingTasks.slice(0,5).map((task: any, idx: number) => (
                <div key={idx} className="task-item">
                  <div className="chk"></div>
                  <span className="task-label">{task.title || task.label || task.name}</span>
                  <span className="tag t-v">Pendiente</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ALERTS SECTION (Requested by user) ── */}
        <div className="row-bottom" style={{ marginTop: '16px' }}>
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <div className="card-title">
                <i className="ti ti-bell-ringing"></i> Centro de Alertas (Facturas, Stock, Cajas y más)
              </div>
            </div>
            
            <div className="grid-2" style={{ gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {/* Stock */}
              <div style={{ border: '0.5px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-warning)' }}><i className="ti ti-box"></i> Stock Bajo ({stock.length})</div>
                {stock.length === 0 ? <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Todo en orden.</div> : (
                  stock.slice(0, 3).map((s: any, i: number) => (
                    <div key={i} className="act-item" style={{ padding: '6px 0' }}>
                      <div className="act-dot" style={{ background: 'var(--fill-warning)' }}></div>
                      <div>
                        <div className="act-text"><strong>{s.nombre}</strong> <span className="pill pill-w">Crítico</span></div>
                        <div className="act-time">Stock: {s.stock_actual} / {s.stock_minimo}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Facturas */}
              <div style={{ border: '0.5px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-danger)' }}><i className="ti ti-receipt"></i> Facturas por Vencer ({facturas.length})</div>
                {facturas.length === 0 ? <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin facturas próximas a vencer.</div> : (
                  facturas.slice(0, 3).map((f: any, i: number) => (
                    <div key={i} className="act-item" style={{ padding: '6px 0' }}>
                      <div className="act-dot" style={{ background: 'var(--fill-danger)' }}></div>
                      <div>
                        <div className="act-text"><strong>{f.numero}</strong> <span className="pill pill-d">Vence en {f.dias_restantes}d</span></div>
                        <div className="act-time">{f.cliente} — {fmtMoney(f.total)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cajas */}
              <div style={{ border: '0.5px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-success)' }}><i className="ti ti-cash"></i> Cajas Abiertas ({cajas.length})</div>
                {cajas.length === 0 ? <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Todas las cajas cerradas.</div> : (
                  cajas.slice(0, 3).map((c: any, i: number) => (
                    <div key={i} className="act-item" style={{ padding: '6px 0' }}>
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

      </main>
    </div>
  )
}

const cssStyles = \`
/* ── RESET & BASE ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --radius: 8px;

  /* Surfaces */
  --surface-0: #f4f3f0;
  --surface-1: #ededea;
  --surface-2: #ffffff;

  /* Text */
  --text-primary:   #0b0b0b;
  --text-secondary: #52514e;
  --text-muted:     #898781;

  /* Borders */
  --border:        rgba(11,11,11,0.10);
  --border-strong: rgba(11,11,11,0.18);

  /* Role — accent (blue) */
  --bg-accent:     #e6f1fb;
  --border-accent: #85b7eb;
  --text-accent:   #185fa5;
  --fill-accent:   #378add;

  /* Role — success (green) */
  --bg-success:     #eaf3de;
  --border-success: #97c459;
  --text-success:   #3b6d11;
  --fill-success:   #639922;

  /* Role — warning (amber) */
  --bg-warning:     #faeeda;
  --border-warning: #ef9f27;
  --text-warning:   #854f0b;
  --fill-warning:   #ba7517;

  /* Role — danger (red) */
  --bg-danger:     #fcebeb;
  --border-danger: #f09595;
  --text-danger:   #a32d2d;
  --fill-danger:   #e24b4a;

  /* Role — pro (purple) */
  --bg-pro:     #eeedfe;
  --border-pro: #afa9ec;
  --text-pro:   #534ab7;
  --fill-pro:   #7f77dd;
}

[data-theme='dark'] {
  --surface-0: #111110;
  --surface-1: #1a1a19;
  --surface-2: #222221;

  --text-primary:   #ffffff;
  --text-secondary: #c3c2b7;
  --text-muted:     #898781;

  --border:        rgba(255,255,255,0.10);
  --border-strong: rgba(255,255,255,0.18);

  --bg-accent:     #042c53;
  --border-accent: #185fa5;
  --text-accent:   #85b7eb;
  --fill-accent:   #378add;

  --bg-success:     #173404;
  --border-success: #3b6d11;
  --text-success:   #97c459;
  --fill-success:   #639922;

  --bg-warning:     #412402;
  --border-warning: #854f0b;
  --text-warning:   #ef9f27;
  --fill-warning:   #ba7517;

  --bg-danger:     #501313;
  --border-danger: #a32d2d;
  --text-danger:   #f09595;
  --fill-danger:   #e24b4a;

  --bg-pro:     #26215c;
  --border-pro: #534ab7;
  --text-pro:   #afa9ec;
  --fill-pro:   #7f77dd;
}

body {
  font-family: var(--font-sans);
  background: var(--surface-0);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
}

button { font-family: inherit; cursor: pointer; }

/* ── LAYOUT ── */
.dash {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
  background: var(--surface-0);
  color: var(--text-primary);
}

/* ── SIDEBAR ── */
.sidebar {
  background: var(--surface-2);
  border-right: 0.5px solid var(--border);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.brand {
  padding: 20px 20px 16px;
  border-bottom: 0.5px solid var(--border);
  flex-shrink: 0;
}
.brand-name {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: -0.4px;
}
.brand-sub {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.nav-section { padding: 16px 12px 8px; }

.nav-label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 8px;
  margin-bottom: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 1px;
  text-decoration: none;
  transition: background 0.12s;
}
.nav-item:hover { background: var(--surface-1); color: var(--text-primary); }
.nav-item.active { background: var(--bg-accent); color: var(--text-accent); }
.nav-item i { font-size: 16px; color: var(--text-muted); }
.nav-item.active i { color: var(--text-accent); }

.nav-badge {
  margin-left: auto;
  background: var(--fill-danger);
  color: white;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.sidebar-footer {
  margin-top: auto;
  padding: 16px 12px;
  border-top: 0.5px solid var(--border);
  flex-shrink: 0;
}
.user-row { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-pro);
  color: var(--text-pro);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}
.user-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.user-role { font-size: 11px; color: var(--text-muted); }

/* ── MAIN ── */
.main { padding: 24px; overflow-y: auto; height: 100vh; }

/* ── TOPBAR ── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.page-title { font-size: 20px; font-weight: 500; color: var(--text-primary); }
.topbar-right { display: flex; align-items: center; gap: 10px; }

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-2);
  border: 0.5px solid var(--border);
  border-radius: var(--radius);
  padding: 7px 12px;
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
}
.search-box i { font-size: 15px; }

.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: var(--radius);
  border: 0.5px solid var(--border);
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  position: relative;
}
.icon-btn:hover { background: var(--surface-1); }
.notif-dot {
  position: absolute;
  top: 6px; right: 6px;
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--fill-danger);
  border: 1.5px solid var(--surface-2);
}

/* ── ACCESOS RÁPIDOS ── */
.quick-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 14px 18px;
  background: var(--surface-2);
  border: 0.5px solid var(--border);
  border-radius: 12px;
  flex-wrap: wrap;
}
.quick-label {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  margin-right: 4px;
}
.quick-divider {
  width: 0.5px;
  height: 28px;
  background: var(--border);
  margin: 0 4px;
}
.quick-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: var(--radius);
  border: 0.5px solid var(--border);
  background: var(--surface-1);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  transition: border-color 0.15s, background 0.15s;
  text-decoration: none;
}
.quick-btn:hover { background: var(--surface-2); border-color: var(--border-strong); }
.quick-btn i { font-size: 15px; }

.quick-btn.accent { background: var(--bg-accent); border-color: var(--border-accent); color: var(--text-accent); }
.quick-btn.accent i { color: var(--text-accent); }
.quick-btn.accent:hover { border-color: var(--fill-accent); }

.quick-btn.success { background: var(--bg-success); border-color: var(--border-success); color: var(--text-success); }
.quick-btn.success i { color: var(--text-success); }

.quick-btn.pro { background: var(--bg-pro); border-color: var(--border-pro); color: var(--text-pro); }
.quick-btn.pro i { color: var(--text-pro); }

.quick-btn.warn { background: var(--bg-warning); border-color: var(--border-warning); color: var(--text-warning); }
.quick-btn.warn i { color: var(--text-warning); }

.quick-more {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  white-space: nowrap;
}
.quick-more:hover { color: var(--text-secondary); }

/* ── TOAST ── */
.toast {
  position: fixed;
  bottom: 24px; right: 24px;
  background: var(--surface-2);
  border: 0.5px solid var(--border-strong);
  border-radius: var(--radius);
  padding: 10px 16px;
  font-size: 13px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 999;
}
.toast.show { opacity: 1; }
.toast i { color: var(--text-accent); font-size: 15px; }

/* ── KPIs ── */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.kpi-card {
  background: var(--surface-2);
  border: 0.5px solid var(--border);
  border-radius: 12px;
  padding: 16px 18px;
}
.kpi-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.kpi-value {
  font-size: 26px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 6px;
}
.delta {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
}
.delta.up   { color: var(--text-success); }
.delta.warn { color: var(--text-warning); }

/* ── GRID 2 COLS ── */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
  margin-bottom: 16px;
}

/* ── CARD ── */
.card {
  background: var(--surface-2);
  border: 0.5px solid var(--border);
  border-radius: 12px;
  padding: 18px 20px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.card-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-title i { font-size: 16px; color: var(--text-accent); }
.card-action {
  font-size: 12px;
  color: var(--text-accent);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.card-action:hover { opacity: 0.75; }

/* ── CHART ── */
.chart-wrap { position: relative; height: 200px; }

/* ── MODULES GRID ── */
.modules-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.mod-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius);
  border: 0.5px solid var(--border);
  cursor: pointer;
  transition: border-color 0.12s;
}
.mod-item:hover { border-color: var(--border-accent); }
.mod-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mod-icon i { font-size: 16px; }
.mod-name { font-size: 12px; font-weight: 500; color: var(--text-primary); }
.mod-count { font-size: 11px; color: var(--text-muted); }
.mod-arrow { margin-left: auto; color: var(--text-muted); font-size: 14px; }

/* ── BOTTOM ROW ── */
.row-bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* ── ACTIVITY ── */
.act-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 0.5px solid var(--border);
}
.act-item:last-child { border-bottom: none; }
.act-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}
.act-text { font-size: 13px; color: var(--text-primary); line-height: 1.4; }
.act-text strong { font-weight: 500; }
.act-time { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

/* ── PILLS ── */
.pill {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
}
.pill-s { background: var(--bg-success); color: var(--text-success); }
.pill-w { background: var(--bg-warning); color: var(--text-warning); }
.pill-i { background: var(--bg-accent);  color: var(--text-accent);  }
.pill-d { background: var(--bg-danger);  color: var(--text-danger);  }

/* ── TASKS ── */
.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 0.5px solid var(--border);
}
.task-item:last-child { border-bottom: none; }
.chk {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid var(--border-strong);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.chk.done { background: var(--fill-success); border-color: var(--fill-success); }
.chk.done i { font-size: 10px; color: white; }
.task-label { font-size: 13px; color: var(--text-primary); flex: 1; }
.task-label.done { color: var(--text-muted); text-decoration: line-through; }

.tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; }
.t-crm { background: var(--bg-pro);     color: var(--text-pro);     }
.t-v   { background: var(--bg-success); color: var(--text-success); }
.t-i   { background: var(--bg-warning); color: var(--text-warning); }
.t-c   { background: var(--bg-accent);  color: var(--text-accent);  }

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  .dash { grid-template-columns: 1fr; }
  .sidebar { position: static; height: auto; flex-direction: row; flex-wrap: wrap; }
  .kpi-row { grid-template-columns: 1fr 1fr; }
  .grid-2 { grid-template-columns: 1fr; }
  .row-bottom { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .kpi-row { grid-template-columns: 1fr; }
  .modules-grid { grid-template-columns: 1fr; }
  .quick-bar { gap: 8px; }
}
\`
\`;

fs.writeFileSync(path.join('c:\\\\laragon\\\\www\\\\nexora\\\\resources\\\\js\\\\Pages\\\\Dashboard.tsx'), content);
console.log('Successfully wrote Dashboard.tsx');
