import { useEffect } from 'react'
import { Link, usePage } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Separator } from '@/Components/ui/separator'
import {
  Printer,
  ArrowLeft,
  Building2,
  User,
  Hash,
  CalendarRange,
  DollarSign,
  ShieldCheck,
  PiggyBank,
  Building,
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
 * Props recibidas del controlador ReporteController@desprendible.
 * @param {Object} props
 * @param {Object} props.encabezado - Datos de la empresa y periodo
 * @param {Object} props.empleado - Datos del empleado
 * @param {Array} props.devengados - Conceptos de devengados
 * @param {Array} props.deducciones - Conceptos de deducciones
 * @param {Array} props.provisiones - Conceptos de provisiones
 * @param {Array} props.aportes_patronales - Conceptos de aportes patronales
 * @param {Object} props.totales - Totales generales
 */
export default function Desprendible({
  encabezado,
  empleado,
  devengados,
  deducciones,
  provisiones,
  aportes_patronales,
  totales,
}) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      {/* Botones de acción (ocultos en impresión) */}
      <div className="no-print">
        <AuthenticatedLayout>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href={route('payroll.nominas.index')}>
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Printer className="h-6 w-6 text-primary" />
                  Desprendible de Pago
                </h2>
                <p className="text-muted-foreground text-sm">
                  {empleado.nombres} · {encabezado.periodo ?? encabezado.mes_contable}
                </p>
              </div>
            </div>
            <Button onClick={handlePrint} className="gap-2 shrink-0">
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </Button>
          </div>

          {/* Vista previa del desprendible */}
          <div className="max-w-4xl mx-auto">
            <DesprendibleContent />
          </div>
        </AuthenticatedLayout>
      </div>

      {/* Contenido para impresión a página completa */}
      <div className="print-only">
        <DesprendibleContent />
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          @page {
            size: A4;
            margin: 15mm 10mm;
          }
          body {
            font-size: 10pt;
            color: #000;
            background: #fff;
          }
          .print-break-inside {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .print-table th {
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-bg-muted {
            background-color: #f8fafc !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-shadow {
            box-shadow: none !important;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>
    </>
  )

  function DesprendibleContent() {
    const totalDevengado = totales.total_devengado
    const totalDeduccion = totales.total_deducciones
    const netoPagar = totales.neto_pagar
    const ibcSS = totales.ibc_seguridad_social
    const ibcPara = totales.ibc_parafiscales
    const costoT = totales.costo_laboral_total

    return (
      <div className="bg-white dark:bg-card rounded-xl border border-border print:border-0 print:rounded-none shadow-sm print:shadow-none overflow-hidden">
        {/* Encabezado empresa */}
        <div className="p-6 pb-4 border-b border-border print:border-gray-300 print-bg-muted">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center print:bg-gray-200">
                <Building2 className="h-6 w-6 text-primary print:text-gray-700" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground print:text-black">
                  {encabezado.empresa ?? 'Empresa'}
                </h1>
                <p className="text-sm text-muted-foreground print:text-gray-600">
                  NIT: {encabezado.nit ?? '—'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-base font-semibold text-foreground print:text-black">
                DESPRENDIBLE DE PAGO
              </h2>
              <p className="text-xs text-muted-foreground print:text-gray-600">
                Generado: {encabezado.fecha_generacion}
              </p>
            </div>
          </div>
        </div>

        {/* Información del empleado */}
        <div className="p-6 pb-4 border-b border-border print:border-gray-300">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider print:text-gray-500">
                Empleado
              </p>
              <p className="mt-0.5 font-medium text-foreground print:text-black">
                {empleado.nombres}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider print:text-gray-500">
                Documento
              </p>
              <p className="mt-0.5 font-mono text-sm print:text-black">
                {empleado.documento ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider print:text-gray-500">
                Cargo
              </p>
              <p className="mt-0.5 text-sm print:text-black">
                {empleado.cargo ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider print:text-gray-500">
                Período
              </p>
              <p className="mt-0.5 text-sm print:text-black">
                {encabezado.periodo ?? encabezado.mes_contable ?? '—'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider print:text-gray-500">
                Salario Base
              </p>
              <p className="mt-0.5 font-medium tabular-nums print:text-black">
                {fmt(empleado.salario_base)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider print:text-gray-500">
                Días Laborados
              </p>
              <p className="mt-0.5 font-medium tabular-nums print:text-black">
                {empleado.dias_laborados}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider print:text-gray-500">
                Fecha Ingreso
              </p>
              <p className="mt-0.5 text-sm print:text-black">
                {empleado.fecha_ingreso ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider print:text-gray-500">
                Mes Contable
              </p>
              <p className="mt-0.5 text-sm print:text-black">
                {encabezado.mes_contable ?? '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Devengados */}
        <div className="p-6 pb-3">
          <h3 className="text-sm font-bold text-emerald-700 print:text-green-800 uppercase tracking-wider mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            INGRESOS Y DEVENGADOS
          </h3>
          {devengados.length > 0 ? (
            <table className="w-full text-sm print-table">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 pr-4 text-left font-semibold text-xs uppercase text-muted-foreground print:text-gray-600">
                    Código
                  </th>
                  <th className="py-2 pr-4 text-left font-semibold text-xs uppercase text-muted-foreground print:text-gray-600">
                    Concepto
                  </th>
                  <th className="py-2 pr-4 text-right font-semibold text-xs uppercase text-muted-foreground print:text-gray-600">
                    Cant.
                  </th>
                  <th className="py-2 text-right font-semibold text-xs uppercase text-muted-foreground print:text-gray-600">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {devengados.map((d, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-mono text-xs text-muted-foreground print:text-gray-600">
                      {d.codigo ?? '—'}
                    </td>
                    <td className="py-2 pr-4 font-medium print:text-black">
                      {d.nombre}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums print:text-black">
                      {d.cantidad ?? '—'}
                    </td>
                    <td className="py-2 text-right font-medium tabular-nums print:text-black">
                      {fmt(d.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-emerald-300 print:border-green-400">
                  <td colSpan={3} className="py-3 pr-4 text-right font-bold print:text-black">
                    TOTAL DEVENGADO
                  </td>
                  <td className="py-3 text-right font-bold text-emerald-700 print:text-green-800 tabular-nums">
                    {fmt(totalDevengado)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground print:text-gray-500 italic">
              Sin conceptos de ingresos registrados.
            </p>
          )}
        </div>

        <Separator className="print:border-gray-300" />

        {/* Deducciones */}
        <div className="p-6 pb-3">
          <h3 className="text-sm font-bold text-rose-700 print:text-red-800 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            DEDUCCIONES
          </h3>
          {deducciones.length > 0 ? (
            <table className="w-full text-sm print-table">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 pr-4 text-left font-semibold text-xs uppercase text-muted-foreground print:text-gray-600">
                    Código
                  </th>
                  <th className="py-2 pr-4 text-left font-semibold text-xs uppercase text-muted-foreground print:text-gray-600">
                    Concepto
                  </th>
                  <th className="py-2 text-right font-semibold text-xs uppercase text-muted-foreground print:text-gray-600">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {deducciones.map((d, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-mono text-xs text-muted-foreground print:text-gray-600">
                      {d.codigo ?? '—'}
                    </td>
                    <td className="py-2 pr-4 font-medium print:text-black">
                      {d.nombre}
                    </td>
                    <td className="py-2 text-right font-medium tabular-nums text-rose-600 print:text-red-700">
                      -{fmt(d.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-rose-300 print:border-red-300">
                  <td colSpan={2} className="py-3 pr-4 text-right font-bold print:text-black">
                    TOTAL DEDUCCIONES
                  </td>
                  <td className="py-3 text-right font-bold text-rose-700 print:text-red-800 tabular-nums">
                    -{fmt(totalDeduccion)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground print:text-gray-500 italic">
              Sin deducciones registradas.
            </p>
          )}
        </div>

        <Separator className="print:border-gray-300" />

        {/* Neto a Pagar */}
        <div className="p-6">
          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="text-lg font-bold text-foreground print:text-black">
                NETO A PAGAR
              </h3>
              <p className="text-xs text-muted-foreground print:text-gray-600">
                Total devengado menos deducciones
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-emerald-700 print:text-green-800">
              {fmt(netoPagar)}
            </p>
          </div>
        </div>

        {/* IBC y Costo Laboral */}
        <div className="p-6 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-sky-50 print:bg-blue-50 print-break-inside">
              <p className="text-xs font-semibold text-sky-700 print:text-blue-800 uppercase tracking-wider">
                IBC Seg. Social
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-sky-800 print:text-blue-900">
                {fmt(ibcSS)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-violet-50 print:bg-purple-50 print-break-inside">
              <p className="text-xs font-semibold text-violet-700 print:text-purple-800 uppercase tracking-wider">
                IBC Parafiscales
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-violet-800 print:text-purple-900">
                {fmt(ibcPara)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 print:bg-yellow-50 print-break-inside">
              <p className="text-xs font-semibold text-amber-700 print:text-yellow-800 uppercase tracking-wider">
                Total Provisiones
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-amber-800 print:text-yellow-900">
                {fmt(
                  provisiones.reduce((acc, p) => acc + p.valor, 0)
                )}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-50 print:bg-indigo-50 print-break-inside">
              <p className="text-xs font-semibold text-indigo-700 print:text-indigo-800 uppercase tracking-wider">
                Costo Laboral Total
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-indigo-800 print:text-indigo-900">
                {fmt(costoT)}
              </p>
            </div>
          </div>
        </div>

        {/* Aportes Patronales (solo si hay) */}
        {aportes_patronales.length > 0 && (
          <div className="p-6 pt-0 border-t border-border print:border-gray-300">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 print:text-gray-600">
              Aportes Patronales
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {aportes_patronales.map((ap, i) => (
                <div key={i} className="text-sm flex items-center justify-between p-2 rounded bg-muted/50 print:bg-gray-100 print-break-inside">
                  <span className="text-muted-foreground print:text-gray-600">
                    {ap.codigo ?? ap.nombre}
                  </span>
                  <span className="font-medium tabular-nums print:text-black">
                    {fmt(ap.valor)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Provisiones (solo si hay) */}
        {provisiones.length > 0 && (
          <div className="p-6 pt-0 border-t border-border print:border-gray-300">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 print:text-gray-600">
              Provisiones
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {provisiones.map((pr, i) => (
                <div key={i} className="text-sm flex items-center justify-between p-2 rounded bg-muted/50 print:bg-gray-100 print-break-inside">
                  <span className="text-muted-foreground print:text-gray-600">
                    {pr.codigo ?? pr.nombre}
                  </span>
                  <span className="font-medium tabular-nums print:text-black">
                    {fmt(pr.valor)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-border print:border-gray-300 text-center text-xs text-muted-foreground print:text-gray-500">
          <p>
            Este documento es un desprendible de pago informativo. 
            Generado el {encabezado.fecha_generacion} para {encabezado.empresa ?? 'la empresa'}.
          </p>
          <p className="mt-1">
            NIT: {encabezado.nit ?? '—'} · Período: {encabezado.periodo ?? encabezado.mes_contable}
          </p>
        </div>
      </div>
    )
  }
}
