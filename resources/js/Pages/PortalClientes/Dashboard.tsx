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

interface PageProps {
  auth: { user: { name: string; email: string; cliente?: { nombre_completo?: string } } }
  tenant?: { name?: string }
}

type EstadoTipo = { value: string; label: string } | string

export default function Dashboard({ metrics, ordenesRecientes }: DashboardProps) {
  const { auth, tenant } = usePage().props as PageProps
  const cliente = auth.cliente

  const handleLogout = () => {
    router.post(route('portal.logout'))
  }

  // Traducción y badges de estado
  const getEstadoBadge = (estado: EstadoTipo) => {
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
