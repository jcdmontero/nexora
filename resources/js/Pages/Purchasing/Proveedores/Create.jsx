import { useForm, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import ProveedorForm from './ProveedorForm'
import { Button } from '@/Components/ui/button'
import { ArrowLeft, CheckCircle2, Truck, Lightbulb } from 'lucide-react'

export default function ProveedorCreate() {
  const { data, setData, post, processing, errors } = useForm({
    tipo_documento: 'NIT',
    numero_documento: '',
    razon_social: '',
    nombre_contacto: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    notas: '',
    activo: true,
  })

  const submit = (e) => {
    e.preventDefault()
    post(route('purchasing.proveedores.store'))
  }

  return (
    <AuthenticatedLayout>
      <form onSubmit={submit} className="pb-12">
        {/* Header Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href={route('purchasing.proveedores.index')} 
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Nuevo proveedor</h2>
              <p className="text-sm text-slate-500 mt-1">Registra un nuevo proveedor para tus compras.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={route('purchasing.proveedores.index')}>
              <Button type="button" variant="outline" className="rounded-xl border-slate-200 text-slate-700">
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={processing}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {processing ? 'Creando...' : 'Crear proveedor'}
            </Button>
          </div>
        </div>

        {/* Contenido Principal (2 Columnas) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <ProveedorForm data={data} setData={setData} errors={errors} />
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              
              <div className="w-full h-40 bg-slate-50 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                 <Truck className="w-20 h-20 text-blue-200 absolute bottom-4" />
              </div>

              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-[10px] text-slate-500">i</span>
                Información importante
              </h3>
              
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Completa la información del proveedor para facilitar el proceso de abastecimiento.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  ['Los campos con * son obligatorios', true],
                  ['El contacto principal es clave para las órdenes', true],
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
                  Un correo electrónico válido es necesario si planeas enviar órdenes de compra automáticas en el futuro.
                </p>
              </div>
            </div>
          </div>

        </div>
      </form>
    </AuthenticatedLayout>
  )
}
