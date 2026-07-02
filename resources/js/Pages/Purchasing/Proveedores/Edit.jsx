import { useForm, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import ProveedorForm from './ProveedorForm'
import { Button } from '@/Components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function ProveedorEdit({ proveedor }) {
  const { data, setData, put, processing, errors } = useForm({
    tipo_documento: proveedor.tipo_documento || 'NIT',
    numero_documento: proveedor.numero_documento || '',
    razon_social: proveedor.razon_social || '',
    nombre_contacto: proveedor.nombre_contacto || '',
    email: proveedor.email || '',
    telefono: proveedor.telefono || '',
    direccion: proveedor.direccion || '',
    ciudad: proveedor.ciudad || '',
    notas: proveedor.notas || '',
    activo: proveedor.activo ?? true,
  })

  const submit = (e) => {
    e.preventDefault()
    put(route('purchasing.proveedores.update', proveedor.id))
  }

  return (
    <AuthenticatedLayout>
      <form onSubmit={submit} className="pb-12 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href={route('purchasing.proveedores.index')} 
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Editar proveedor</h2>
              <p className="text-sm text-slate-500 mt-1">{proveedor.razon_social}</p>
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
              {processing ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <ProveedorForm data={data} setData={setData} errors={errors} isEdit />
        </div>
      </form>
    </AuthenticatedLayout>
  )
}
