import { useForm, Link } from '@inertiajs/react'
import { useState } from 'react'
import { z } from 'zod'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import ClienteForm from './ClienteForm'
import { Button } from '@/Components/ui/button'
import { ArrowLeft, CheckCircle2, Building2, Lightbulb } from 'lucide-react'

export default function ClienteCreate() {
  const { data, setData, post, processing, errors } = useForm({
    tipo: 'juridico',
    tipo_documento: 'NIT',
    numero_documento: '',
    nombres: '',
    apellidos: '',
    razon_social: '',
    nit: '',
    nombre_contacto: '',
    telefono_contacto: '',
    cargo_contacto: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    notas: '',
    regimen_tributario: 'simplificado',
    porcentaje_retencion_fuente: '0',
    porcentaje_retencion_iva: '0',
    porcentaje_retencion_ica: '0',
    activo: true,
    portal_active: false,
    password: '',
  })

  const [clientErrors, setClientErrors] = useState({})

  const clienteSchema = z.object({
    numero_documento: z.string().min(1, 'El número de documento es obligatorio'),
    email: z.string().email('Ingresa un correo válido').optional().or(z.literal('')),
  }).superRefine((data, ctx) => {
    if (data.tipo === 'juridico' && (!data.razon_social || data.razon_social.length < 2)) {
      ctx.addIssue({ path: ['razon_social'], message: 'La razón social es obligatoria' })
    }
    if (data.tipo === 'natural') {
      if (!data.nombres || data.nombres.trim().length === 0) {
        ctx.addIssue({ path: ['nombres'], message: 'Los nombres son obligatorios' })
      }
      if (!data.apellidos || data.apellidos.trim().length === 0) {
        ctx.addIssue({ path: ['apellidos'], message: 'Los apellidos son obligatorios' })
      }
    }
  })

  const submit = (e) => {
    e.preventDefault()
    setClientErrors({})

    const result = clienteSchema.safeParse(data)
    if (!result.success) {
      const fieldErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (!fieldErrors[field]) fieldErrors[field] = issue.message
      }
      setClientErrors(fieldErrors)
      return
    }

    post(route('crm.clientes.store'))
  }

  return (
    <AuthenticatedLayout>
      <form onSubmit={submit} className="pb-12">
        {/* Header Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href={route('crm.clientes.index')} 
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Nuevo cliente</h2>
              <p className="text-sm text-slate-500 mt-1">Registra un nuevo cliente para gestionar tus relaciones comerciales.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={route('crm.clientes.index')}>
              <Button type="button" variant="outline" className="rounded-xl border-slate-200 text-slate-700">
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={processing}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {processing ? 'Creando...' : 'Crear cliente'}
            </Button>
          </div>
        </div>

        {/* Contenido Principal (2 Columnas) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Formulario */}
          <div className="space-y-6 lg:col-span-2">
            <ClienteForm data={data} setData={setData} errors={{ ...errors, ...clientErrors }} />
          </div>

          {/* Columna Derecha: Panel Informativo */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              
              {/* Ilustración Placeholder */}
              <div className="w-full h-40 bg-slate-50 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                 <Building2 className="w-20 h-20 text-blue-200 absolute bottom-4" />
              </div>

              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-[10px] text-slate-500">i</span>
                Información importante
              </h3>
              
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Completa la información del cliente para ofrecerte una mejor experiencia.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  ['Los campos marcados con * son obligatorios', true],
                  ['Puedes editar esta información más tarde', true],
                  ['Los datos de contacto son confidenciales', true],
                  ['Asegúrate de verificar el NIT', true],
                ].map(([text, check], i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100/50">
                <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-1.5">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  Consejo
                </h4>
                <p className="text-xs text-blue-800/80 leading-relaxed">
                  Un cliente bien registrado te ayudará a gestionar mejor tus ventas y ofrecer un servicio más personalizado.
                </p>
              </div>
            </div>
          </div>

        </div>
      </form>
    </AuthenticatedLayout>
  )
}
