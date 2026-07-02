import React from 'react'
import { Link, Head, usePage } from '@inertiajs/react'
import { ShieldCheck, ArrowLeft, Receipt, ChevronRight, Download, FileText } from 'lucide-react'

interface Factura {
  id: number
  numero: string
  subtotal: number
  impuestos: number
  total: number
  estado: string
  created_at: string
  verification_token: string
}

interface FacturasProps {
  facturas: Factura[]
}

export default function Facturas({ facturas }: FacturasProps) {
  const { tenant } = usePage().props as any

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pagada':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Pagada</span>
      case 'pendiente':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Pendiente</span>
      case 'anulada':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Anulada</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">{estado}</span>
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      <Head title="Mis Facturas - Nexora" />

      {/* Header bar */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={route('portal.dashboard')} className="p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-extrabold tracking-wider bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              Facturas y Recibos
            </span>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            {tenant?.name}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8">
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden shadow-lg">
          {facturas.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Receipt className="w-12 h-12 mx-auto text-slate-700 mb-4 animate-pulse" />
              <p className="text-lg font-semibold">No se encontraron facturas</p>
              <p className="text-sm mt-1">Todas las facturas de tus compras o reparaciones aparecerán en esta sección.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-900/60">
              {facturas.map((factura) => (
                <div
                  key={factura.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-slate-900/40 transition-colors duration-150 gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-slate-100">
                          {factura.numero}
                        </span>
                        {getEstadoBadge(factura.estado)}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Emitido el {factura.created_at}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-slate-900/60 sm:border-none pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-500 block">Total Facturado</span>
                      <span className="font-bold text-indigo-300">
                        $ {new Intl.NumberFormat('es-CO').format(factura.total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={route('core.sales.facturas.pdf', factura.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-slate-900 hover:bg-indigo-650 text-slate-300 hover:text-slate-100 rounded-xl transition-all border border-slate-800 flex items-center justify-center"
                        title="Descargar PDF"
                      >
                        <Download className="w-5 h-5" />
                      </a>

                      <a
                        href={route('document.verify', { tipo: 'factura', token: factura.verification_token })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-slate-900/60 hover:bg-slate-800 text-xs font-semibold rounded-xl transition-all text-slate-400 hover:text-slate-200 border border-slate-800"
                      >
                        Validar QR
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
