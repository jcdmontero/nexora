import React from 'react'
import { Link, Head } from '@inertiajs/react'
import { ArrowLeft, Calendar, FileText, Settings, ShieldCheck, Tag } from 'lucide-react'

type EstadoTipo = { value: string; label: string } | string

interface OrdenDetail {
  id: number
  numero_orden: string
  tipo_equipo_manual: string
  numero_serie: string
  condicion_inicial: string
  observaciones_equipo: string
  fallas_checklist: string[]
  estado: EstadoTipo
  precio_cliente: number
  mano_obra_descripcion: string
  created_at: string
  verification_token: string
}

interface OrdenDetailProps {
  orden: OrdenDetail
}

export default function OrdenDetail({ orden }: OrdenDetailProps) {
  const getEstadoBadge = (estado: EstadoTipo) => {
    const value = typeof estado === 'object' ? estado.value : estado
    const label = typeof estado === 'object' ? estado.label : estado

    switch (value) {
      case 'recibido':
        return <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Recibido</span>
      case 'diagnostico':
        return <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Diagnóstico</span>
      case 'reparacion':
        return <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">En Reparación</span>
      case 'listo':
        return <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Listo</span>
      case 'entregado':
        return <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">Entregado</span>
      default:
        return <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">{label || value}</span>
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      <Head title={`Orden ${orden.numero_orden} - Nexora`} />

      {/* Header bar */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={route('portal.ordenes')} className="p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-extrabold tracking-wider text-slate-100">
              Detalle de Orden
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {orden.numero_orden}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-8">
        <div className="space-y-6">
          {/* Card: Status and Header */}
          <div className="p-6 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Orden de Servicio</span>
              <h2 className="text-2xl font-black text-slate-100 mt-1">{orden.numero_orden}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                <Calendar className="w-3.5 h-3.5" />
                Registrado el {orden.created_at}
              </div>
            </div>
            <div>
              {getEstadoBadge(orden.estado)}
            </div>
          </div>

          {/* Card: Device info */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-900/60 bg-slate-900/10 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-slate-200">Información del Equipo</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">Tipo de Equipo</span>
                  <span className="font-semibold text-slate-200">{orden.tipo_equipo_manual}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Número de Serie</span>
                  <span className="font-semibold text-slate-200">{orden.numero_serie || 'No registrado'}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Condición Recibido</span>
                <p className="text-sm text-slate-300 mt-1 bg-slate-950/40 p-3 rounded-lg border border-slate-900/45">
                  {orden.condicion_inicial || 'Sin observaciones de condición'}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Observaciones Generales</span>
                <p className="text-sm text-slate-300 mt-1 bg-slate-950/40 p-3 rounded-lg border border-slate-900/45">
                  {orden.observaciones_equipo || 'Ninguna'}
                </p>
              </div>
            </div>
          </div>

          {/* Card: Diagnóstico / Fallas reportadas */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-900/60 bg-slate-900/10 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-slate-200">Detalles de Servicio y Falla</h3>
            </div>
            <div className="p-6 space-y-4">
              {orden.fallas_checklist && orden.fallas_checklist.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 block mb-2">Fallas Reportadas</span>
                  <div className="flex flex-wrap gap-2">
                    {orden.fallas_checklist.map((falla, i) => (
                      <span key={i} className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 text-slate-300 rounded-md">
                        {falla}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs text-slate-500 block">Descripción del Trabajo / Mano de Obra</span>
                <p className="text-sm text-slate-300 mt-1 bg-slate-950/40 p-3 rounded-lg border border-slate-900/45">
                  {orden.mano_obra_descripcion || 'Diagnóstico preliminar / En evaluación técnica'}
                </p>
              </div>
            </div>
          </div>

          {/* Card: Totales / Cotización */}
          <div className="p-6 bg-indigo-950/10 border border-indigo-900/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-indigo-400 block">Valor a pagar</span>
                <span className="text-2xl font-black text-indigo-200">
                  $ {new Intl.NumberFormat('es-CO').format(orden.precio_cliente)}
                </span>
              </div>
            </div>

            <a
              href={route('document.verify', { tipo: 'orden', token: orden.verification_token })}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-sm font-semibold rounded-xl text-slate-100 transition-all shadow-md shadow-indigo-600/10 border border-indigo-500/30"
            >
              Verificar QR Oficial
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
