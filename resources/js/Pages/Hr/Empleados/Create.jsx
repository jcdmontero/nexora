import { useState } from 'react'
import { router, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Separator } from '@/Components/ui/separator'
import { ArrowLeft, IdCard, Save, UserPlus, ChevronDown } from 'lucide-react'

const selectClass = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export default function CreateEmpleado({ sedes, roles }) {
  const { data, setData, post, processing, errors } = useForm({
    documento: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    sede_id: '',
    crear_usuario: false,
    user_email: '',
    user_password: '',
    user_role: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    post(route('hr.empleados.store'))
  }

  return (
    <AuthenticatedLayout>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.get(route('hr.empleados.index'))}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <IdCard className="h-6 w-6 text-primary" /> Nuevo Empleado
          </h2>
          <p className="text-muted-foreground">Registra un nuevo colaborador y su contrato inicial.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Datos personales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos Personales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documento">Documento *</Label>
              <Input id="documento" name="documento" value={data.documento} onChange={(e) => setData('documento', e.target.value)} placeholder="Cédula o NIT" />
              {errors.documento && <p className="text-xs text-destructive">{errors.documento}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sede_id">Sede *</Label>
              <select id="sede_id" name="sede_id" value={data.sede_id} onChange={(e) => setData('sede_id', e.target.value)} className={selectClass}>
                <option value="">Seleccionar sede…</option>
                {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              {errors.sede_id && <p className="text-xs text-destructive">{errors.sede_id}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres *</Label>
              <Input id="nombres" name="nombres" value={data.nombres} onChange={(e) => setData('nombres', e.target.value)} placeholder="Nombres" />
              {errors.nombres && <p className="text-xs text-destructive">{errors.nombres}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input id="apellidos" name="apellidos" value={data.apellidos} onChange={(e) => setData('apellidos', e.target.value)} placeholder="Apellidos" />
              {errors.apellidos && <p className="text-xs text-destructive">{errors.apellidos}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" name="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="correo@ejemplo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" value={data.telefono} onChange={(e) => setData('telefono', e.target.value)} placeholder="Teléfono" />
            </div>
          </CardContent>
        </Card>



        {/* Usuario de sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Usuario de Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={data.crear_usuario} onChange={(e) => setData('crear_usuario', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              <span className="text-sm font-medium">Crear usuario para acceso al sistema</span>
            </label>

            {data.crear_usuario && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border">
                <div className="space-y-2">
                  <Label htmlFor="user_email">Correo de acceso</Label>
                  <Input id="user_email" type="email" value={data.user_email} onChange={(e) => setData('user_email', e.target.value)} placeholder={data.email || 'correo@ejemplo.com'} />
                  <p className="text-xs text-muted-foreground">Si se deja vacío, usa el correo personal.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user_password">Contraseña</Label>
                  <Input id="user_password" type="text" value={data.user_password} onChange={(e) => setData('user_password', e.target.value)} placeholder="Se generará automáticamente" />
                  <p className="text-xs text-muted-foreground">Mín. 8 caracteres. Vacío = aleatoria.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user_role">Rol *</Label>
                  <select id="user_role" value={data.user_role} onChange={(e) => setData('user_role', e.target.value)} className={selectClass}>
                    <option value="">Seleccionar rol…</option>
                    {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botón guardar */}
        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => router.get(route('hr.empleados.index'))}>
            Cancelar
          </Button>
          <Button type="submit" disabled={processing} className="gap-2">
            <Save className="h-4 w-4" /> {processing ? 'Guardando…' : 'Guardar Empleado'}
          </Button>
        </div>
      </form>
    </AuthenticatedLayout>
  )
}
