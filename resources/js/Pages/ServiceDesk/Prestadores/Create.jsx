import { useState } from 'react'
import { router, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { cn } from '@/lib/utils'
import { ArrowLeft, Users, Save, Wrench, Eye, EyeOff } from 'lucide-react'

const selectClass = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const TIPOS_VINCULACION = [
  { value: 'EMPLEADO', label: 'Empleado', desc: 'Vinculado por contrato laboral. Genera nómina.' },
  { value: 'CONTRATISTA', label: 'Contratista', desc: 'Prestación de servicios. No genera nómina.' },
  { value: 'COMISIONISTA', label: 'Comisionista', desc: 'Pago por comisiones (ventas o servicios).' },
  { value: 'APRENDIZ', label: 'Aprendiz', desc: 'Aprendiz o practicante.' },
  { value: 'SOCIO', label: 'Socio Trabajador', desc: 'Socio o propietario activo.' },
]

export default function CreatePrestador({ empleados }) {
  const [showPass, setShowPass] = useState(false)
  const [showPassConfirm, setShowPassConfirm] = useState(false)
  const { data, setData, post, processing, errors } = useForm({
    tipo_documento: 'CC',
    numero_documento: '',
    nombre_completo: '',
    email: '',
    telefono: '',
    tipo_vinculacion: 'CONTRATISTA',

    empleado_id: '',
    es_gratuito: false,
    generar_usuario: false,
    password: '',
    password_confirmation: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    post(route('service-desk.prestadores.store'))
  }

  return (
    <AuthenticatedLayout>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.get(route('service-desk.prestadores.index'))}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> Nuevo Prestador</h2>
          <p className="text-muted-foreground">Registra un técnico o contratista para asignarlo a órdenes de trabajo.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader><CardTitle className="text-lg">Datos del Prestador</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_documento">Tipo de documento</Label>
              <select id="tipo_documento" value={data.tipo_documento} onChange={(e) => setData('tipo_documento', e.target.value)} className={selectClass}>
                <option value="CC">Cédula</option>
                <option value="NIT">NIT</option>
                <option value="CE">Cédula Extranjería</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_documento">Número de documento</Label>
              <Input id="numero_documento" value={data.numero_documento} onChange={(e) => setData('numero_documento', e.target.value)} placeholder="Opcional" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nombre_completo">Nombre completo *</Label>
              <Input id="nombre_completo" value={data.nombre_completo} onChange={(e) => setData('nombre_completo', e.target.value)} placeholder="Nombre del técnico" />
              {errors.nombre_completo && <p className="text-xs text-destructive">{errors.nombre_completo}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico {data.generar_usuario && '*'}</Label>
              <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="correo@ejemplo.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" value={data.telefono} onChange={(e) => setData('telefono', e.target.value)} placeholder="Opcional" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Vinculación y Comisiones</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_vinculacion">Tipo de vinculación *</Label>
              <select id="tipo_vinculacion" value={data.tipo_vinculacion} onChange={(e) => setData('tipo_vinculacion', e.target.value)} className={selectClass}>
                {TIPOS_VINCULACION.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">{TIPOS_VINCULACION.find(t => t.value === data.tipo_vinculacion)?.desc}</p>
            </div>

            {data.tipo_vinculacion === 'EMPLEADO' && (
              <div className="md:col-span-2 rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  Creación Automática en Recursos Humanos
                </h4>
                <p className="text-xs text-muted-foreground">
                  Al guardar, el sistema registrará automáticamente a esta persona en la base de datos de empleados (RRHH).
                  <br /><br />
                  <strong>Importante:</strong> Deberás ir posteriormente al módulo de RRHH &gt; Contratos para definir su sueldo, tipo de contrato y afiliaciones a seguridad social.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3 pb-2 md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input type="checkbox" checked={data.es_gratuito} onChange={(e) => setData('es_gratuito', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                <span className="text-sm"><Wrench className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" /> Trabaja sin costo (no genera comisión)</span>
              </label>

              <div className="rounded-lg border border-border p-4 bg-muted/10 space-y-4">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input type="checkbox" checked={data.generar_usuario} onChange={(e) => setData('generar_usuario', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary" />
                  Crear credenciales de acceso (Usuario)
                </label>
                <p className="text-xs text-muted-foreground -mt-3 ml-6">
                  Se creará un usuario con rol TECNICO para que pueda acceder al sistema y gestionar sus órdenes.
                </p>

                {data.generar_usuario && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 ml-6">
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPass ? 'text' : 'password'}
                          value={data.password}
                          onChange={(e) => setData('password', e.target.value)}
                          className="pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className={cn(
                            'absolute right-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md',
                            'text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
                          )}
                          tabIndex={-1}
                        >
                          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password_confirmation">Confirmar Contraseña *</Label>
                      <div className="relative">
                        <Input
                          id="password_confirmation"
                          type={showPassConfirm ? 'text' : 'password'}
                          value={data.password_confirmation}
                          onChange={(e) => setData('password_confirmation', e.target.value)}
                          className="pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassConfirm(!showPassConfirm)}
                          className={cn(
                            'absolute right-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md',
                            'text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
                          )}
                          tabIndex={-1}
                        >
                          {showPassConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => router.get(route('service-desk.prestadores.index'))}>Cancelar</Button>
          <Button type="submit" disabled={processing} className="gap-2"><Save className="h-4 w-4" /> {processing ? 'Guardando…' : 'Guardar Prestador'}</Button>
        </div>
      </form>
    </AuthenticatedLayout>
  )
}
