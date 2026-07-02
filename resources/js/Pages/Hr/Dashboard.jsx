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
