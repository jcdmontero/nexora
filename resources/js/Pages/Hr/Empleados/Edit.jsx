import { router, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { ArrowLeft, IdCard, Save, UserCircle2 } from 'lucide-react'

const selectClass = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export default function EditEmpleado({ empleado, sedes }) {
  const { data, setData, put, processing, errors } = useForm({
    documento: empleado.documento || '',
    nombres: empleado.nombres || '',
    apellidos: empleado.apellidos || '',
    email: empleado.email || '',
    telefono: empleado.telefono || '',
    sede_id: empleado.sede_id || '',
    estado: empleado.estado,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    put(route('hr.empleados.update', empleado.id))
  }

  return (
    <AuthenticatedLayout>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.get(route('hr.empleados.show', empleado.id))}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <IdCard className="h-6 w-6 text-primary" /> Editar Empleado
          </h2>
          <p className="text-muted-foreground">{empleado.nombres} {empleado.apellidos}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documento">Documento *</Label>
              <Input id="documento" value={data.documento} onChange={(e) => setData('documento', e.target.value)} />
              {errors.documento && <p className="text-xs text-destructive">{errors.documento}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sede_id">Sede *</Label>
              <select id="sede_id" value={data.sede_id} onChange={(e) => setData('sede_id', e.target.value)} className={selectClass}>
                {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              {errors.sede_id && <p className="text-xs text-destructive">{errors.sede_id}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres *</Label>
              <Input id="nombres" value={data.nombres} onChange={(e) => setData('nombres', e.target.value)} />
              {errors.nombres && <p className="text-xs text-destructive">{errors.nombres}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input id="apellidos" value={data.apellidos} onChange={(e) => setData('apellidos', e.target.value)} />
              {errors.apellidos && <p className="text-xs text-destructive">{errors.apellidos}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" value={data.telefono} onChange={(e) => setData('telefono', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={data.estado} onChange={(e) => setData('estado', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              <span className="text-sm font-medium">Empleado activo</span>
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => router.get(route('hr.empleados.show', empleado.id))}>
            Cancelar
          </Button>
          <Button type="submit" disabled={processing} className="gap-2">
            <Save className="h-4 w-4" /> {processing ? 'Guardando…' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </AuthenticatedLayout>
  )
}
