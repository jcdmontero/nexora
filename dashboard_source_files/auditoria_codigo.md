# AUDITORÍA COMPLETA DEL CÓDIGO


====================================================================================================
ARCHIVO: C:\laragon\www\nexora\dashboard_source_files\auditoria_codigo.md
====================================================================================================

```md

```


====================================================================================================
ARCHIVO: C:\laragon\www\nexora\dashboard_source_files\create_dashboard.js
====================================================================================================

```js
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

```


====================================================================================================
ARCHIVO: C:\laragon\www\nexora\dashboard_source_files\exportar.py
====================================================================================================

```py
from pathlib import Path
import mimetypes

# ===========================
# CONFIGURACIÓN
# ===========================

# Carpeta del proyecto a auditar
DIRECTORIO = r"C:\laragon\www\nexora\dashboard_source_files"

# Archivo de salida
SALIDA = "auditoria_codigo.md"

# Carpetas que NO se recorrerán
IGNORAR_CARPETAS = {
    ".git",
    ".idea",
    ".vscode",
    "__pycache__",
    "node_modules",
    "vendor",
    "dist",
    "build",
    "coverage",
    "storage",
    "logs",
    "tmp",
    "temp",
}

# Extensiones binarias
IGNORAR_EXTENSIONES = {
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".ico",
    ".webp",
    ".svg",
    ".pdf",
    ".zip",
    ".rar",
    ".7z",
    ".gz",
    ".tar",
    ".exe",
    ".dll",
    ".so",
    ".bin",
    ".mp3",
    ".mp4",
    ".avi",
    ".mov",
    ".ttf",
    ".woff",
    ".woff2",
    ".eot",
    ".sqlite",
    ".db",
    ".log"
}


def es_binario(archivo: Path):
    if archivo.suffix.lower() in IGNORAR_EXTENSIONES:
        return True

    mime, _ = mimetypes.guess_type(str(archivo))
    if mime is None:
        return False

    return not mime.startswith("text")


def leer_archivo(path: Path):
    codificaciones = [
        "utf-8",
        "utf-8-sig",
        "latin-1",
        "cp1252"
    ]

    for cod in codificaciones:
        try:
            with open(path, "r", encoding=cod) as f:
                return f.read()
        except:
            pass

    return None


with open(SALIDA, "w", encoding="utf-8") as salida:

    salida.write("# AUDITORÍA COMPLETA DEL CÓDIGO\n\n")

    for archivo in sorted(Path(DIRECTORIO).rglob("*")):

        if archivo.is_dir():
            continue

        if any(parte in IGNORAR_CARPETAS for parte in archivo.parts):
            continue

        if es_binario(archivo):
            continue

        contenido = leer_archivo(archivo)

        if contenido is None:
            continue

        print(archivo)

        salida.write("\n")
        salida.write("=" * 100 + "\n")
        salida.write(f"ARCHIVO: {archivo}\n")
        salida.write("=" * 100 + "\n\n")

        salida.write("```")
        if archivo.suffix:
            salida.write(archivo.suffix[1:])
        salida.write("\n")

        salida.write(contenido)

        salida.write("\n```\n\n")

print(f"\nArchivo generado: {SALIDA}")
```


====================================================================================================
ARCHIVO: C:\laragon\www\nexora\dashboard_source_files\resources\css\dashboard.css
====================================================================================================

```css
/* ── Dashboard Styles ── */
/* Extraído de Dashboard.tsx para cumplir FE-01: eliminar CSS inline */

/* ── RESET & BASE ── */
.custom-dash-container {
  --radius: 8px;
  --surface-0: #f4f3f0;
  --surface-1: #ededea;
  --surface-2: #ffffff;
  --text-primary:   #0b0b0b;
  --text-secondary: #52514e;
  --text-muted:     #898781;
  --border:        rgba(11,11,11,0.10);
  --border-strong: rgba(11,11,11,0.18);
  --bg-accent:     #e6f1fb;
  --border-accent: #85b7eb;
  --text-accent:   #185fa5;
  --fill-accent:   #378add;
  --bg-success:     #eaf3de;
  --border-success: #97c459;
  --text-success:   #3b6d11;
  --fill-success:   #639922;
  --bg-warning:     #faeeda;
  --border-warning: #ef9f27;
  --text-warning:   #854f0b;
  --fill-warning:   #ba7517;
  --bg-danger:     #fcebeb;
  --border-danger: #f09595;
  --text-danger:   #a32d2d;
  --fill-danger:   #e24b4a;
  --bg-pro:     #eeedfe;
  --border-pro: #afa9ec;
  --text-pro:   #534ab7;
  --fill-pro:   #7f77dd;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
}

.custom-dash-container[data-theme='dark'] {
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

.custom-dash-container button { font-family: inherit; cursor: pointer; }

/* ── ACCESOS RÁPIDOS ── */
.custom-dash-container .quick-bar {
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
.custom-dash-container .quick-label {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  margin-right: 4px;
}
.custom-dash-container .quick-divider {
  width: 0.5px;
  height: 28px;
  background: var(--border);
  margin: 0 4px;
}
.custom-dash-container .quick-btn {
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
.custom-dash-container .quick-btn:hover { background: var(--surface-2); border-color: var(--border-strong); }
.custom-dash-container .quick-btn i { font-size: 15px; }
.custom-dash-container .quick-btn.accent { background: var(--bg-accent); border-color: var(--border-accent); color: var(--text-accent); }
.custom-dash-container .quick-btn.accent i { color: var(--text-accent); }
.custom-dash-container .quick-btn.accent:hover { border-color: var(--fill-accent); }
.custom-dash-container .quick-btn.success { background: var(--bg-success); border-color: var(--border-success); color: var(--text-success); }
.custom-dash-container .quick-btn.success i { color: var(--text-success); }
.custom-dash-container .quick-btn.pro { background: var(--bg-pro); border-color: var(--border-pro); color: var(--text-pro); }
.custom-dash-container .quick-btn.pro i { color: var(--text-pro); }
.custom-dash-container .quick-btn.warn { background: var(--bg-warning); border-color: var(--border-warning); color: var(--text-warning); }
.custom-dash-container .quick-btn.warn i { color: var(--text-warning); }
.custom-dash-container .quick-more {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  white-space: nowrap;
}
.custom-dash-container .quick-more:hover { color: var(--text-secondary); }

/* ── KPIs ── */
.custom-dash-container .kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.custom-dash-container .kpi-card {
  background: var(--surface-2);
  border: 0.5px solid var(--border);
  border-radius: 12px;
  padding: 16px 18px;
}
.custom-dash-container .kpi-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.custom-dash-container .kpi-value {
  font-size: 26px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 6px;
}
.custom-dash-container .delta {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
}
.custom-dash-container .delta.up   { color: var(--text-success); }
.custom-dash-container .delta.warn { color: var(--text-warning); }

/* ── GRID 2 COLS ── */
.custom-dash-container .grid-2 {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
  margin-bottom: 16px;
}

/* ── CARD ── */
.custom-dash-container .card {
  background: var(--surface-2);
  border: 0.5px solid var(--border);
  border-radius: 12px;
  padding: 18px 20px;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.custom-dash-container .card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.custom-dash-container .card-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}
.custom-dash-container .card-title i { font-size: 16px; color: var(--text-accent); }
.custom-dash-container .card-action {
  font-size: 12px;
  color: var(--text-accent);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.custom-dash-container .card-action:hover { opacity: 0.75; }

/* ── CHART ── */
.custom-dash-container .chart-wrap { position: relative; height: 250px; width: 100%; flex: 1; min-height: 0; }

/* ── MODULES GRID ── */
.custom-dash-container .modules-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.custom-dash-container .mod-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius);
  border: 0.5px solid var(--border);
  cursor: pointer;
  transition: border-color 0.12s;
  min-width: 0;
}
.custom-dash-container .mod-item:hover { border-color: var(--border-accent); }
.custom-dash-container .mod-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.custom-dash-container .mod-icon i { font-size: 16px; }
.custom-dash-container .mod-name { 
  font-size: 12px; 
  font-weight: 500; 
  color: var(--text-primary); 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
}
.custom-dash-container .mod-count { font-size: 11px; color: var(--text-muted); }
.custom-dash-container .mod-arrow { margin-left: auto; color: var(--text-muted); font-size: 14px; flex-shrink: 0; }

/* ── BOTTOM ROW ── */
.custom-dash-container .row-bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* ── ACTIVITY ── */
.custom-dash-container .act-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 0.5px solid var(--border);
}
.custom-dash-container .act-item:last-child { border-bottom: none; }
.custom-dash-container .act-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}
.custom-dash-container .act-text { font-size: 13px; color: var(--text-primary); line-height: 1.4; }
.custom-dash-container .act-text strong { font-weight: 500; }
.custom-dash-container .act-time { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

/* ── PILLS ── */
.custom-dash-container .pill {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
}
.custom-dash-container .pill-s { background: var(--bg-success); color: var(--text-success); }
.custom-dash-container .pill-w { background: var(--bg-warning); color: var(--text-warning); }
.custom-dash-container .pill-i { background: var(--bg-accent);  color: var(--text-accent);  }
.custom-dash-container .pill-d { background: var(--bg-danger);  color: var(--text-danger);  }

/* ── TASKS ── */
.custom-dash-container .task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 0.5px solid var(--border);
}
.custom-dash-container .task-item:last-child { border-bottom: none; }
.custom-dash-container .chk {
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
.custom-dash-container .chk.done { background: var(--fill-success); border-color: var(--fill-success); }
.custom-dash-container .chk.done i { font-size: 10px; color: white; }
.custom-dash-container .task-label { font-size: 13px; color: var(--text-primary); flex: 1; }
.custom-dash-container .task-label.done { color: var(--text-muted); text-decoration: line-through; }

.custom-dash-container .tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; }
.custom-dash-container .t-crm { background: var(--bg-pro);     color: var(--text-pro);     }
.custom-dash-container .t-v   { background: var(--bg-success); color: var(--text-success); }
.custom-dash-container .t-i   { background: var(--bg-warning); color: var(--text-warning); }
.custom-dash-container .t-c   { background: var(--bg-accent);  color: var(--text-accent);  }

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  .custom-dash-container .kpi-row { grid-template-columns: 1fr 1fr; }
  .custom-dash-container .grid-2 { grid-template-columns: 1fr; }
  .custom-dash-container .row-bottom { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .custom-dash-container .kpi-row { grid-template-columns: 1fr; }
  .custom-dash-container .modules-grid { grid-template-columns: 1fr; }
  .custom-dash-container .quick-bar { gap: 8px; }
}

```


====================================================================================================
ARCHIVO: C:\laragon\www\nexora\dashboard_source_files\resources\js\Pages\Dashboard.tsx
====================================================================================================

```tsx
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

```


====================================================================================================
ARCHIVO: C:\laragon\www\nexora\dashboard_source_files\resources\js\Pages\Hr\Dashboard.jsx
====================================================================================================

```jsx
import { useState, useEffect } from 'react'
import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { StatCard } from '@/Components/ui/stat-card'
import { PageHeader } from '@/Components/ui/page-header'
import {
  Users,
  FileText,
  DollarSign,
  HeartPulse,
  UserPlus,
  ArrowRight,
  Building2,
  CreditCard,
  Activity,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react'

/**
 * Dashboard de RRHH con KPIs y accesos rápidos.
 * @param {{ total_empleados_activos: number, total_contratos_vigentes: number, total_prestamos_activos: number, total_incapacidades_activas: number, empleados_ultimo_mes: number }} props
 */
export default function HrDashboard({
  total_empleados_activos = 0,
  total_contratos_vigentes = 0,
  total_prestamos_activos = 0,
  total_incapacidades_activas = 0,
  empleados_ultimo_mes = 0,
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const kpis = [
    {
      label: 'Empleados Activos',
      value: total_empleados_activos,
      icon: Users,
      accent: 'indigo',
      hint: 'Colaboradores activos en la empresa',
    },
    {
      label: 'Contratos Vigentes',
      value: total_contratos_vigentes,
      icon: FileText,
      accent: 'emerald',
      hint: 'Contratos actualmente activos',
    },
    {
      label: 'Préstamos Activos',
      value: total_prestamos_activos,
      icon: DollarSign,
      accent: 'amber',
      hint: 'Préstamos con saldo pendiente',
    },
    {
      label: 'Incapacidades Activas',
      value: total_incapacidades_activas,
      icon: HeartPulse,
      accent: 'rose',
      hint: 'Incapacidades vigentes hoy',
    },
    {
      label: 'Nuevos en el último mes',
      value: empleados_ultimo_mes,
      icon: UserPlus,
      accent: 'sky',
      hint: 'Empleados incorporados',
    },
  ]

  const quickAccessLinks = [
    {
      label: 'Empleados',
      description: 'Gestiona la información del personal',
      icon: Users,
      route: 'hr.empleados.index',
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400',
    },
    {
      label: 'Préstamos',
      description: 'Administra préstamos y cuotas',
      icon: CreditCard,
      route: 'hr.prestamos.index',
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
    },
    {
      label: 'Incapacidades',
      description: 'Registra incapacidades y licencias',
      icon: Stethoscope,
      route: 'hr.incapacidades.index',
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
    },
    {
      label: 'Organigrama',
      description: 'Departamentos y cargos',
      icon: Building2,
      route: 'hr.catalogos.organigrama',
      color: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400',
    },
    {
      label: 'Afiliaciones',
      description: 'EPS, AFP, ARL y CCF',
      icon: ShieldCheck,
      route: 'hr.afiliaciones.index',
      color: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400',
    },
    {
      label: 'Configuración Legal',
      description: 'SMMLV, UVT y aportes',
      icon: FileText,
      route: 'hr.configuracion-legal.index',
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400',
    },
  ].filter((a) => route().has(a.route))

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard RRHH" />

      <PageHeader
        title="Dashboard RRHH"
        description="Resumen general del módulo de Recursos Humanos"
        icon={Activity}
      />

      {/* KPIs Grid */}
      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5 transition-all duration-500 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Acceso rápido y módulos */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Acceso rápido */}
        <section className="rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Activity className="h-4 w-4 text-indigo-500" />
            Acceso rápido
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Las secciones más utilizadas del módulo de RRHH.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {quickAccessLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.route}
                  href={route(link.route)}
                  className="group flex items-start gap-3 rounded-xl border border-border bg-background p-4 transition-all hover:border-indigo-300 hover:shadow-sm hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${link.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {link.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {link.description}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                </Link>
              )
            })}
          </div>
        </section>

        {/* Resumen informativo */}
        <section className="rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Building2 className="h-4 w-4 text-indigo-500" />
            Resumen de Personal
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Indicadores clave de tu fuerza laboral.
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">Total empleados</p>
                  <p className="text-xs text-muted-foreground">Activos en el sistema</p>
                </div>
              </div>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {total_empleados_activos}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">Contratos vigentes</p>
                  <p className="text-xs text-muted-foreground">Relaciones laborales activas</p>
                </div>
              </div>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {total_contratos_vigentes}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                  <DollarSign className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">Préstamos activos</p>
                  <p className="text-xs text-muted-foreground">Con saldo pendiente</p>
                </div>
              </div>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {total_prestamos_activos}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                  <HeartPulse className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">Incapacidades activas</p>
                  <p className="text-xs text-muted-foreground">Vigentes al día de hoy</p>
                </div>
              </div>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {total_incapacidades_activas}
              </span>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{empleados_ultimo_mes}</span>{' '}
              {empleados_ultimo_mes === 1 ? 'empleado se ha' : 'empleados se han'} incorporado en
              los últimos 30 días.
            </p>
          </div>
        </section>
      </div>
    </AuthenticatedLayout>
  )
}

```


====================================================================================================
ARCHIVO: C:\laragon\www\nexora\dashboard_source_files\resources\js\Pages\PortalClientes\Dashboard.tsx
====================================================================================================

```tsx
import React from 'react'
import { Link, Head, router, usePage } from '@inertiajs/react'
import { ShieldCheck, LogOut, ClipboardList, Receipt, Wrench, ChevronRight, FileCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'

interface MetricData {
  ordenesActivas: number
  facturasPendientes: number
  totalPendiente: number
}

interface RecentOrder {
  id: number
  numero_orden: string
  estado: { value: string; label: string } | string
  precio_cliente: number
  created_at: string
}

interface DashboardProps {
  metrics: MetricData
  ordenesRecientes: RecentOrder[]
}

export default function Dashboard({ metrics, ordenesRecientes }: DashboardProps) {
  const { auth, tenant } = usePage().props as any
  const cliente = auth.cliente

  const handleLogout = () => {
    router.post(route('portal.logout'))
  }

  // Traducción y badges de estado
  const getEstadoBadge = (estado: any) => {
    const value = typeof estado === 'object' ? estado.value : estado
    const label = typeof estado === 'object' ? estado.label : estado

    switch (value) {
      case 'recibido':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Recibido</span>
      case 'diagnostico':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Diagnóstico</span>
      case 'reparacion':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">En Reparación</span>
      case 'listo':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Listo</span>
      case 'entregado':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">Entregado</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">{label || value}</span>
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      <Head title="Mi Portal - Nexora" />

      {/* Header bar */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
            <span className="font-extrabold tracking-wider bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              {tenant?.name || 'NEXORA'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors py-2 px-3 rounded-lg hover:bg-slate-900"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Hola, {cliente?.nombre_completo || 'Cliente'}
          </h2>
          <p className="text-slate-400 mt-1">
            Bienvenido a tu portal de servicios de {tenant?.name || 'la empresa'}.
          </p>
        </div>

        {/* Navigation Grid (Quick Links) */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link
            href={route('portal.ordenes')}
            className="flex flex-col items-center justify-center p-6 bg-slate-900/40 border border-slate-900 rounded-2xl hover:border-indigo-500/40 hover:bg-indigo-950/10 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Wrench className="w-6 h-6" />
            </div>
            <span className="font-semibold text-slate-200 group-hover:text-indigo-300">Órdenes de Servicio</span>
            <span className="text-xs text-slate-500 mt-1">Ver estado e historial</span>
          </Link>

          <Link
            href={route('portal.facturas')}
            className="flex flex-col items-center justify-center p-6 bg-slate-900/40 border border-slate-900 rounded-2xl hover:border-indigo-500/40 hover:bg-indigo-950/10 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Receipt className="w-6 h-6" />
            </div>
            <span className="font-semibold text-slate-200 group-hover:text-indigo-300">Facturación</span>
            <span className="text-xs text-slate-500 mt-1">Ver pagos y facturas</span>
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-900/20 border-slate-900 shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Servicios Activos</CardDescription>
              <CardTitle className="text-4xl font-extrabold text-indigo-400">
                {metrics.ordenesActivas}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900/20 border-slate-900 shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Facturas Pendientes</CardDescription>
              <CardTitle className="text-4xl font-extrabold text-yellow-400">
                {metrics.facturasPendientes}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900/20 border-slate-900 shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Total Pendiente</CardDescription>
              <CardTitle className="text-3xl font-extrabold text-slate-100">
                $ {new Intl.NumberFormat('es-CO').format(metrics.totalPendiente)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Orders Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight">Órdenes Recientes</h3>
            <Link
              href={route('portal.ordenes')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Ver todas <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden shadow-lg">
            {ordenesRecientes.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No tienes órdenes de servicio registradas recientemente.
              </div>
            ) : (
              <div className="divide-y divide-slate-900/60">
                {ordenesRecientes.map((orden) => (
                  <Link
                    key={orden.id}
                    href={route('portal.ordenes.show', orden.id)}
                    className="p-4 flex items-center justify-between hover:bg-slate-900/50 transition-colors duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-200 block group-hover:text-indigo-300">
                          {orden.numero_orden}
                        </span>
                        <span className="text-xs text-slate-500">{orden.created_at}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {getEstadoBadge(orden.estado)}
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-300" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

```


====================================================================================================
ARCHIVO: C:\laragon\www\nexora\dashboard_source_files\resources\js\Pages\SuperAdmin\Dashboard.jsx
====================================================================================================

```jsx
import { Head, usePage } from '@inertiajs/react'
import SuperAdminLayout from '@/Layouts/SuperAdminLayout'
import { WidgetShell, KPICard } from '@/Widgets'
import { Building2, CheckCircle2, PauseCircle, Users, Boxes, TrendingUp } from 'lucide-react'
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts'

export default function SuperDashboard() {
  const { stats, tenantGrowth = [] } = usePage().props

  const kpis = [
    { label: 'Empresas totales', value: stats.empresas, icon: Building2, accent: 'indigo', hint: 'Registradas' },
    { label: 'Activas', value: stats.empresas_activas, icon: CheckCircle2, accent: 'emerald', hint: 'Operando' },
    { label: 'Suspendidas', value: stats.empresas_suspendidas, icon: PauseCircle, accent: 'amber', hint: 'Inactivas' },
    { label: 'Usuarios', value: stats.usuarios, icon: Users, accent: 'sky', hint: 'Clientes' },
    { label: 'Módulos activos', value: stats.modulos_activos, icon: Boxes, accent: 'violet', hint: 'En plataforma' },
  ]

  return (
    <SuperAdminLayout>
      <Head title="SuperAdmin Dashboard" />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Resumen de la plataforma
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visión general de Nexora y todos los tenants.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map((k, i) => (
            <KPICard key={k.label} {...k} index={i} />
          ))}
        </div>

        {/* Growth chart */}
        {tenantGrowth.length > 0 && (
          <WidgetShell
            widgetId="super-growth"
            title="Crecimiento de tenants"
            description="Empresas registradas en los últimos 6 meses"
            icon={TrendingUp}
            accent="violet"
            size="full"
            showMenu={false}
          >
            <div className="mt-2 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tenantGrowth} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="superGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis
                    dataKey="mes"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs fill-muted-foreground"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-xs fill-muted-foreground"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--popover) / 0.95)',
                      backdropFilter: 'blur(8px)',
                    }}
                    cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="empresas"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fill="url(#superGrad)"
                    dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </WidgetShell>
        )}
      </div>
    </SuperAdminLayout>
  )
}

```


====================================================================================================
ARCHIVO: C:\laragon\www\nexora\dashboard_source_files\resources\js\Widgets\Alerts\AlertsDashboardWidget.tsx
====================================================================================================

```tsx
import { useState } from 'react'
import { Link } from '@inertiajs/react'
import {
  Bell, Package, Receipt, CreditCard, Wrench,
  AlertTriangle, Clock, ArrowRight, Circle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WidgetShell } from '../WidgetShell'
import { EmptyState } from '@/Components/ui/empty-state'
import type {
  AlertsSummary,
  StockBajoItem,
  FacturaPorVencerItem,
  CuentaPorPagarItem,
  ServicioPendienteItem,
  CajaAbiertaItem,
} from '../types'

// ── Tab definitions ───────────────────────────────────────────────────

interface TabDef {
  id: string
  label: string
  icon: typeof Package
  countKey: keyof AlertsSummary
  accentDot: string
  accentBadge: string
  emptyIcon: typeof Package
  emptyTitle: string
  emptyDesc: string
}

const TABS: TabDef[] = [
  {
    id: 'stock',
    label: 'Stock bajo',
    icon: Package,
    countKey: 'stock_bajo',
    accentDot: 'bg-amber-500',
    accentBadge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    emptyIcon: Package,
    emptyTitle: 'Inventario OK',
    emptyDesc: 'Todos los productos tienen stock suficiente.',
  },
  {
    id: 'facturas',
    label: 'Facturas por vencer',
    icon: Receipt,
    countKey: 'facturas_por_vencer',
    accentDot: 'bg-rose-500',
    accentBadge: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
    emptyIcon: Receipt,
    emptyTitle: 'Sin facturas por vencer',
    emptyDesc: 'No hay facturas pendientes próximas a vencer.',
  },
  {
    id: 'cuentas',
    label: 'Cuentas por pagar',
    icon: CreditCard,
    countKey: 'cuentas_por_pagar',
    accentDot: 'bg-violet-500',
    accentBadge: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
    emptyIcon: CreditCard,
    emptyTitle: 'Sin cuentas pendientes',
    emptyDesc: 'No hay órdenes de compra pendientes de pago.',
  },
  {
    id: 'servicios',
    label: 'Servicios',
    icon: Wrench,
    countKey: 'servicios_pendientes',
    accentDot: 'bg-sky-500',
    accentBadge: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
    emptyIcon: Wrench,
    emptyTitle: 'Sin servicios pendientes',
    emptyDesc: 'No hay órdenes de servicio en proceso.',
  },
  {
    id: 'cajas',
    label: 'Cajas abiertas',
    icon: CreditCard, // Wallet if imported, but we have CreditCard
    countKey: 'cajas_abiertas',
    accentDot: 'bg-emerald-500',
    accentBadge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    emptyIcon: CreditCard,
    emptyTitle: 'Sin cajas abiertas',
    emptyDesc: 'Todas las sesiones de caja están cerradas.',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return '$ ' + (n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + 'M'
  if (n >= 1_000)     return '$ ' + (n / 1_000).toLocaleString('es-CO', { maximumFractionDigits: 0 }) + 'k'
  return '$ ' + n.toLocaleString('es-CO')
}

function severityDot(nivel: string): string {
  return nivel === 'critico' ? 'bg-rose-500' : 'bg-amber-500'
}

function diasLabel(dias: number): string {
  if (dias < 0) return `Vencida hace ${Math.abs(dias)}d`
  if (dias === 0) return 'Vence hoy'
  if (dias === 1) return 'Vence mañana'
  return `${dias} días`
}

// ── Estado labels ─────────────────────────────────────────────────────

const ESTADO_SERVICIO: Record<string, { label: string; class: string }> = {
  recibido:      { label: 'Recibido',    class: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400' },
  diagnosticado: { label: 'Diagnóstico', class: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  en_proceso:    { label: 'En proceso',  class: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' },
}

const ESTADO_COMPRA: Record<string, { label: string; class: string }> = {
  pendiente: { label: 'Pendiente', class: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  enviada:   { label: 'Enviada',   class: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400' },
  parcial:   { label: 'Parcial',   class: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400' },
  aprobada:  { label: 'Aprobada',  class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
}

// ── Loading skeleton ──────────────────────────────────────────────────

function AlertsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-28 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="h-2 w-2 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
            <div className="h-5 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Sub-renderers ─────────────────────────────────────────────────────

function StockBajoList({ items }: { items: StockBajoItem[] }) {
  const hasRoute = (() => { try { return route().has('inventory.productos.index') } catch { return false } })()
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="group flex items-center gap-3 py-3 transition-colors hover:bg-muted/30 px-1 -mx-1 rounded-lg">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', severityDot(item.nivel))} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{item.nombre}</p>
            <p className="text-xs text-muted-foreground">
              {item.sku ? `SKU: ${item.sku} · ` : ''}Stock: {item.stock_actual} / mín. {item.stock_minimo}
            </p>
          </div>
          <span className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
            item.nivel === 'critico'
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
          )}>
            {item.nivel === 'critico' ? 'Crítico' : 'Bajo'}
          </span>
        </li>
      ))}
      {hasRoute && items.length > 0 && (
        <li className="pt-3">
          <Link
            href={route('inventory.productos.index')}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            Ver todo el inventario <ArrowRight className="h-3 w-3" />
          </Link>
        </li>
      )}
    </ul>
  )
}

function FacturasPorVencerList({ items }: { items: FacturaPorVencerItem[] }) {
  const hasRoute = (() => { try { return route().has('sales.facturas.index') } catch { return false } })()
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="group flex items-center gap-3 py-3 transition-colors hover:bg-muted/30 px-1 -mx-1 rounded-lg">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', item.dias_restantes <= 0 ? 'bg-rose-500' : item.dias_restantes <= 3 ? 'bg-amber-500' : 'bg-sky-500')} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{item.numero}</p>
            <p className="truncate text-xs text-muted-foreground">{item.cliente}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(item.total)}</span>
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
              item.dias_restantes <= 0
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                : item.dias_restantes <= 3
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                : 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
            )}>
              {diasLabel(item.dias_restantes)}
            </span>
          </div>
        </li>
      ))}
      {hasRoute && items.length > 0 && (
        <li className="pt-3">
          <Link
            href={route('sales.facturas.index')}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            Ver todas las facturas <ArrowRight className="h-3 w-3" />
          </Link>
        </li>
      )}
    </ul>
  )
}

function CuentasPorPagarList({ items }: { items: CuentaPorPagarItem[] }) {
  const hasRoute = (() => { try { return route().has('purchasing.ordenes.index') } catch { return false } })()
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        const cfg = ESTADO_COMPRA[item.estado]
        return (
          <li key={item.id} className="group flex items-center gap-3 py-3 transition-colors hover:bg-muted/30 px-1 -mx-1 rounded-lg">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', item.dias_desde_creacion > 30 ? 'bg-rose-500' : item.dias_desde_creacion > 15 ? 'bg-amber-500' : 'bg-sky-500')} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{item.numero}</p>
              <p className="truncate text-xs text-muted-foreground">{item.proveedor}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(item.total)}</span>
              <div className="flex items-center gap-1.5">
                {cfg && (
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.class)}>
                    {cfg.label}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">{item.dias_desde_creacion}d</span>
              </div>
            </div>
          </li>
        )
      })}
      {hasRoute && items.length > 0 && (
        <li className="pt-3">
          <Link
            href={route('purchasing.ordenes.index')}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            Ver todas las compras <ArrowRight className="h-3 w-3" />
          </Link>
        </li>
      )}
    </ul>
  )
}

function ServiciosPendientesList({ items }: { items: ServicioPendienteItem[] }) {
  const hasRoute = (() => { try { return route().has('service-desk.tickets.index') } catch { return false } })()
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        const cfg = ESTADO_SERVICIO[item.estado]
        return (
          <li key={item.id} className="group flex items-center gap-3 py-3 transition-colors hover:bg-muted/30 px-1 -mx-1 rounded-lg">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', cfg?.class.includes('sky') ? 'bg-sky-500' : cfg?.class.includes('amber') ? 'bg-amber-500' : 'bg-indigo-500')} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{item.numero_orden}</p>
              <p className="truncate text-xs text-muted-foreground">{item.cliente}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {cfg && (
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.class)}>
                  {cfg.label}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">{item.fecha}</span>
            </div>
          </li>
        )
      })}
      {hasRoute && items.length > 0 && (
        <li className="pt-3">
          <Link
            href={route('service-desk.tickets.index')}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            Ver todos los tickets <ArrowRight className="h-3 w-3" />
          </Link>
        </li>
      )}
    </ul>
  )
}

function CajasAbiertasList({ items }: { items: CajaAbiertaItem[] }) {
  const hasRoute = (() => { try { return route().has('cash.arqueo.index') } catch { return false } })()
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        return (
          <li key={item.id} className="group flex items-center gap-3 py-3 transition-colors hover:bg-muted/30 px-1 -mx-1 rounded-lg">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', item.nivel === 'critico' ? 'bg-rose-500' : 'bg-emerald-500')} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{item.caja}</p>
              <p className="truncate text-xs text-muted-foreground">{item.cajero}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(item.saldo_actual)}</span>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', item.nivel === 'critico' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400')}>
                {item.horas_abierta}h abierta
              </span>
            </div>
          </li>
        )
      })}
      {hasRoute && items.length > 0 && (
        <li className="pt-3">
          <Link
            href={route('cash.arqueo.index')}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            Ir a caja <ArrowRight className="h-3 w-3" />
          </Link>
        </li>
      )}
    </ul>
  )
}

// ── Main Widget ───────────────────────────────────────────────────────

interface AlertsDashboardWidgetProps {
  data?: AlertsSummary
}

export function AlertsDashboardWidget({ data }: AlertsDashboardWidgetProps) {
  const [activeTab, setActiveTab] = useState(TABS[0].id)

  const stock = data ? (Array.isArray(data.stock_bajo) ? data.stock_bajo : Object.values(data.stock_bajo || {})) : []
  const facturas = data ? (Array.isArray(data.facturas_por_vencer) ? data.facturas_por_vencer : Object.values(data.facturas_por_vencer || {})) : []
  const cuentas = data ? (Array.isArray(data.cuentas_por_pagar) ? data.cuentas_por_pagar : Object.values(data.cuentas_por_pagar || {})) : []
  const servicios = data ? (Array.isArray(data.servicios_pendientes) ? data.servicios_pendientes : Object.values(data.servicios_pendientes || {})) : []
  const cajas = data ? (Array.isArray(data.cajas_abiertas) ? data.cajas_abiertas : Object.values(data.cajas_abiertas || {})) : []

  // Count total alerts
  const totalAlerts = data
    ? stock.length + facturas.length + cuentas.length + servicios.length + cajas.length
    : 0

  // Don't render if loaded and no alerts
  if (data && totalAlerts === 0) return null

  const activeTabDef = TABS.find((t) => t.id === activeTab) ?? TABS[0]

  const getList = (id: string) => {
    switch(id) {
      case 'stock': return stock
      case 'facturas': return facturas
      case 'cuentas': return cuentas
      case 'servicios': return servicios
      case 'cajas': return cajas
      default: return []
    }
  }

  return (
    <WidgetShell
      widgetId="alerts-dashboard"
      title="Centro de alertas"
      description={data ? `${totalAlerts} ${totalAlerts === 1 ? 'alerta activa' : 'alertas activas'}` : undefined}
      icon={Bell}
      accent="amber"
      size="full"
      headerActions={
        data && totalAlerts > 0 ? (
          <span className={cn(
            'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5',
            'text-[10px] font-bold tabular-nums',
            'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
          )}>
            {totalAlerts}
          </span>
        ) : undefined
      }
    >
      {/* Loading state */}
      {!data ? (
        <AlertsSkeleton />
      ) : (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {TABS.map((tab) => {
              const count = getList(tab.id).length
              const isActive = activeTab === tab.id
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-foreground/[0.06] text-foreground shadow-sm ring-1 ring-foreground/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    count === 0 && !isActive && 'opacity-50',
                  )}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {count > 0 && (
                    <span className={cn(
                      'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums',
                      isActive ? tab.accentBadge : 'bg-muted text-muted-foreground',
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="min-h-[120px]">
            {activeTab === 'stock' && (
              stock.length === 0
                ? <EmptyState icon={activeTabDef.emptyIcon} title={activeTabDef.emptyTitle} description={activeTabDef.emptyDesc} />
                : <StockBajoList items={stock} />
            )}
            {activeTab === 'facturas' && (
              facturas.length === 0
                ? <EmptyState icon={activeTabDef.emptyIcon} title={activeTabDef.emptyTitle} description={activeTabDef.emptyDesc} />
                : <FacturasPorVencerList items={facturas} />
            )}
            {activeTab === 'cuentas' && (
              cuentas.length === 0
                ? <EmptyState icon={activeTabDef.emptyIcon} title={activeTabDef.emptyTitle} description={activeTabDef.emptyDesc} />
                : <CuentasPorPagarList items={cuentas} />
            )}
            {activeTab === 'servicios' && (
              servicios.length === 0
                ? <EmptyState icon={activeTabDef.emptyIcon} title={activeTabDef.emptyTitle} description={activeTabDef.emptyDesc} />
                : <ServiciosPendientesList items={servicios} />
            )}
            {activeTab === 'cajas' && (
              cajas.length === 0
                ? <EmptyState icon={activeTabDef.emptyIcon} title={activeTabDef.emptyTitle} description={activeTabDef.emptyDesc} />
                : <CajasAbiertasList items={cajas} />
            )}
          </div>
        </div>
      )}
    </WidgetShell>
  )
}

```


====================================================================================================
ARCHIVO: C:\laragon\www\nexora\dashboard_source_files\resources\js\Widgets\DashboardActionsContext.tsx
====================================================================================================

```tsx
import { createContext, useContext } from 'react'

interface DashboardActionsContextValue {
  toggleWidget: (widgetId: string) => void
  pinWidget: (widgetId: string) => void
  unpinWidget: (widgetId: string) => void
  isWidgetPinned: (widgetId: string) => boolean
}

const DashboardActionsContext = createContext<DashboardActionsContextValue | null>(null)

export const DashboardActionsProvider = DashboardActionsContext.Provider

export function useDashboardActions(): DashboardActionsContextValue {
  return useContext(DashboardActionsContext) ?? {
    toggleWidget: () => {},
    pinWidget: () => {},
    unpinWidget: () => {},
    isWidgetPinned: () => false,
  }
}

```


====================================================================================================
ARCHIVO: C:\laragon\www\nexora\dashboard_source_files\resources\js\Widgets\DashboardGrid.tsx
====================================================================================================

```tsx
/**
 * DashboardGrid — Grid responsivo para componer widgets.
 *
 * Desktop: 4 columnas
 * Tablet:  2 columnas
 * Móvil:   1 columna
 *
 * Preparado para integrar @dnd-kit/core en Fase 3.
 * Por ahora es un grid CSS estático con soporte para WidgetShell.
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { DashboardGridProps } from './types'

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

export default DashboardGrid

```

