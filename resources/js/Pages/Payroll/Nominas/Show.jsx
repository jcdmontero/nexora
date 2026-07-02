import { useState } from 'react'
import { Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Separator } from '@/Components/ui/separator'
import {
  ArrowLeft,
  Printer,
  User,
  DollarSign,
  Percent,
  PiggyBank,
  Building2,
  ShieldCheck,
  FileText,
  BadgeCheck,
  Receipt,
} from 'lucide-react'

/**
 * Formato de moneda colombiana.
 */
const fmt = (valor) =>
  `$${Number(valor).toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

/**
 * Mapa de tipos de concepto a estilos visuales.
 */
const tipoConceptoEstilo = {
  DEVENGADO: {
    label: 'Devengado',
    className: 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20',
  },
  DEDUCCION: {
    label: 'Deducción',
    className: 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20',
  },
  PROVISION: {
    label: 'Provisión',
    className: 'text-sky-700 bg-sky-50 dark:text-sky-400 dark:bg-sky-900/20',
  },
  APORTE_PATRONAL: {
    label: 'Aporte Patronal',
    className: 'text-violet-700 bg-violet-50 dark:text-violet-400 dark:bg-violet-900/20',
  },
}

/**
 * Props recibidas del controlador NominaController@show.
 * @param {Object} props
 * @param {Object} props.nomina - Datos completos de la nómina
 * @param {Array} props.conceptos_disponibles - Catálogo de conceptos
 */
export default function NominaShow({ nomina, conceptos_disponibles }) {
  // Estado del período
  const estado = nomina.estado_periodo ?? 'BORRADOR'
  const esLiquidable = estado === 'BORRADOR' || estado === 'LIQUIDADA'

  // Agrupar detalles por tipo de concepto
  const detallesPorTipo = {
    DEVENGADO: nomina.detalles.filter((d) => d.concepto_tipo === 'DEVENGADO'),
    DEDUCCION: nomina.detalles.filter((d) => d.concepto_tipo === 'DEDUCCION'),
    PROVISION: nomina.detalles.filter((d) => d.concepto_tipo === 'PROVISION'),
    APORTE_PATRONAL: nomina.detalles.filter((d) => d.concepto_tipo === 'APORTE_PATRONAL'),
  }

  /** Tarjeta de resumen. */
  const ResumenCard = ({ label, value, icon: Icon, accent, isNegative }) => (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
              {label}
            </p>
            <p
              className={`mt-1.5 text-xl lg:text-2xl font-bold tracking-tight tabular-nums ${
                isNegative
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-foreground'
              }`}
            >
              {value}
            </p>
          </div>
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              accent === 'emerald'
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                : accent === 'rose'
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                : accent === 'violet'
                ? 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400'
                : accent === 'sky'
                ? 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400'
                : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
            }`}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  /** Tabla de conceptos agrupados por tipo. */
  const ConceptTable = ({ tipo, detalles }) => {
    const estilo = tipoConceptoEstilo[tipo] ?? {
      label: tipo,
      className: 'text-muted-foreground bg-muted/50',
    }
    const isDeduction = tipo === 'DEDUCCION'

    if (detalles.length === 0) return null

    return (
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${estilo.className}`}
              >
                {estilo.label}
              </span>
              <span className="text-muted-foreground font-mono text-xs">
                {detalles.length} concepto{detalles.length !== 1 ? 's' : ''}
              </span>
            </CardTitle>
            <span
              className={`text-sm font-bold tabular-nums ${
                isDeduction
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isDeduction ? '− ' : ''}
              {fmt(
                detalles.reduce((acc, d) => acc + d.valor, 0)
              )}
            </span>
          </div>
        </CardHeader>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Código</th>
                <th className="px-4 py-2.5 text-left font-medium">Concepto</th>
                {tipo === 'DEVENGADO' && (
                  <th className="px-4 py-2.5 text-right font-medium">Cantidad</th>
                )}
                {tipo === 'DEVENGADO' && (
                  <th className="px-4 py-2.5 text-right font-medium">Base Cálculo</th>
                )}
                <th className="px-4 py-2.5 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {detalles.map((d) => (
                <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {d.concepto_codigo ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 font-medium">{d.concepto_nombre}</td>
                  {tipo === 'DEVENGADO' && (
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {d.cantidad}
                    </td>
                  )}
                  {tipo === 'DEVENGADO' && (
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {d.base_calculo > 0 ? fmt(d.base_calculo) : '—'}
                    </td>
                  )}
                  <td
                    className={`px-4 py-2.5 text-right font-medium tabular-nums ${
                      isDeduction
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-foreground'
                    }`}
                  >
                    {isDeduction ? '− ' : ''}
                    {fmt(d.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y">
          {detalles.map((d) => (
            <div key={d.id} className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{d.concepto_nombre}</p>
                  {d.concepto_codigo && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {d.concepto_codigo}
                    </p>
                  )}
                </div>
                <span
                  className={`text-sm font-bold tabular-nums shrink-0 ${
                    isDeduction
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isDeduction ? '−' : ''}
                  {fmt(d.valor)}
                </span>
              </div>
              {tipo === 'DEVENGADO' && (
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Cant: {d.cantidad}</span>
                  {d.base_calculo > 0 && <span>Base: {fmt(d.base_calculo)}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <AuthenticatedLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4 min-w-0">
          <Link href={route('payroll.nominas.index')}>
            <Button variant="outline" size="icon" className="mt-1 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold truncate">
                {nomina.empleado_nombre}
              </h2>
              <Badge
                variant={estado === 'BORRADOR' ? 'outline' : 'default'}
                className={`capitalize ${
                  estado === 'LIQUIDADA'
                    ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
                    : estado === 'CONTABILIZADA'
                    ? 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400'
                    : estado === 'PAGADA'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : ''
                }`}
              >
                {estado.toLowerCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {nomina.cargo}
              <span className="mx-2">·</span>
              {nomina.codigo_periodo ?? nomina.mes_contable}
              {nomina.empleado_documento && (
                <>
                  <span className="mx-2">·</span>
                  {nomina.empleado_documento}
                </>
              )}
            </p>
            {(nomina.fecha_inicio || nomina.dias_laborados) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {nomina.fecha_inicio && `${nomina.fecha_inicio} al ${nomina.fecha_fin}`}
                {nomina.dias_laborados && (
                  <span className="ml-2">· {nomina.dias_laborados} días</span>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Link
            href={route('payroll.reportes.desprendible', nomina.id)}
          >
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Desprendible PDF
            </Button>
          </Link>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <ResumenCard
          label="Salario Base"
          value={fmt(nomina.ibc_seguridad_social)}
          icon={DollarSign}
          accent="indigo"
        />
        <ResumenCard
          label="IBC Seg. Social"
          value={fmt(nomina.ibc_seguridad_social)}
          icon={ShieldCheck}
          accent="sky"
        />
        <ResumenCard
          label="Total Devengado"
          value={fmt(nomina.total_devengado)}
          icon={BadgeCheck}
          accent="emerald"
        />
        <ResumenCard
          label="Total Deducciones"
          value={fmt(nomina.total_deducciones)}
          icon={Percent}
          accent="rose"
          isNegative
        />
        <ResumenCard
          label="Provisiones"
          value={fmt(nomina.total_provisiones)}
          icon={PiggyBank}
          accent="sky"
        />
        <ResumenCard
          label="Aportes Patronales"
          value={fmt(nomina.total_aportes_patronales)}
          icon={Building2}
          accent="violet"
        />
      </div>

      {/* Highlighted cards: Neto + Costo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="bg-primary text-primary-foreground ring-primary/20 border-0">
          <CardContent className="pt-6 pb-5">
            <p className="text-sm text-primary-foreground/80">Neto a Pagar</p>
            <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
              {fmt(nomina.neto_pagar)}
            </p>
            {nomina.auxilio_transporte > 0 && (
              <p className="text-xs text-primary-foreground/60 mt-1">
                Incluye aux. transporte: {fmt(nomina.auxilio_transporte)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/40 dark:to-indigo-900/20 ring-indigo-200/50 dark:ring-indigo-800/30">
          <CardContent className="pt-6 pb-5">
            <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
              Costo Laboral Total
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-indigo-700 dark:text-indigo-300">
              {fmt(nomina.costo_laboral_total)}
            </p>
            <p className="text-xs text-indigo-500/70 dark:text-indigo-400/60 mt-1">
              Devengado + Provisiones + Aportes Patronales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desglose de conceptos por tipo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Desglose de Conceptos
        </h3>

        <ConceptTable tipo="DEVENGADO" detalles={detallesPorTipo.DEVENGADO} />
        <ConceptTable tipo="DEDUCCION" detalles={detallesPorTipo.DEDUCCION} />

        <Separator className="my-2" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ConceptTable tipo="PROVISION" detalles={detallesPorTipo.PROVISION} />
          <ConceptTable tipo="APORTE_PATRONAL" detalles={detallesPorTipo.APORTE_PATRONAL} />
        </div>

        {/* Novedades asociadas */}
        {nomina.novedades?.length > 0 && (
          <Card>
            <CardHeader className="border-b bg-muted/30 py-3">
              <CardTitle className="text-sm font-semibold">
                Novedades Aplicadas ({nomina.novedades.length})
              </CardTitle>
            </CardHeader>
            <div className="divide-y">
              {nomina.novedades.map((nv) => (
                <div key={nv.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        nv.tipo === 'ingreso'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400'
                      }
                    >
                      {nv.tipo === 'ingreso' ? '+' : '−'}
                    </Badge>
                    <span className="text-sm">{nv.descripcion}</span>
                  </div>
                  <span
                    className={`text-sm font-medium tabular-nums ${
                      nv.tipo === 'ingreso'
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {nv.tipo === 'ingreso' ? '+' : '−'}
                    {fmt(nv.valor)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Si no hay detalles */}
      {nomina.detalles.length === 0 && (
        <Card className="mt-4">
          <CardContent className="py-12 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">
              No hay conceptos calculados para esta nómina.
            </p>
          </CardContent>
        </Card>
      )}
    </AuthenticatedLayout>
  )
}
