import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import OrdenForm from './OrdenForm'

interface ClienteOption {
  id: number
  nombre: string
  documento: string
}

interface TipoEquipoOption {
  id: number
  nombre: string
}

interface MarcaOption {
  id: number
  nombre: string
}

interface ModeloOption {
  id: number
  nombre: string
  marca_id: number
  tipo_equipo_id: number
}

interface ServicioOption {
  id: number
  nombre: string
  tipo_equipo_id?: number | null
  precio_base: number
  costo_tecnico_base: number
}

interface FallaOption {
  id: number
  nombre: string
  tipo_equipo_id: number
}

interface ChecklistOption {
  id: number
  nombre: string
  categoria: string
  tipo_equipo_id: number
}

interface ProductoOption {
  id: number
  nombre: string
  codigo: string
  precio_venta: number
}

interface CreateProps {
  clientes: ClienteOption[]
  tipos: TipoEquipoOption[]
  marcas: MarcaOption[]
  modelos: ModeloOption[]
  servicios: ServicioOption[]
  fallas: FallaOption[]
  checklist: ChecklistOption[]
  productos: ProductoOption[]
  numeroSugerido: string
}

export default function OrdenCreate(props: CreateProps) {
  return (
    <AuthenticatedLayout>
      <Head title="Nueva orden de reparación" />
      <OrdenForm mode="create" {...props} />
    </AuthenticatedLayout>
  )
}
