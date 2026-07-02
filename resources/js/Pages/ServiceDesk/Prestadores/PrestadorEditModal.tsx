import { useState } from 'react'
import { useForm } from '@inertiajs/react'
import { Modal } from '@/Components/ui/modal'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Badge } from '@/Components/ui/badge'
import { cn } from '@/lib/utils'
import { Save, Pencil, Wrench, UserCheck, Plus, KeyRound, Eye, EyeOff } from 'lucide-react'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const TIPOS_VINCULACION = [
  { value: 'EMPLEADO', label: 'Empleado', desc: 'Vinculado por contrato laboral. Genera nómina.' },
  { value: 'CONTRATISTA', label: 'Contratista', desc: 'Prestación de servicios. No genera nómina.' },
  { value: 'COMISIONISTA', label: 'Comisionista', desc: 'Pago por comisiones (ventas o servicios).' },
  { value: 'APRENDIZ', label: 'Aprendiz', desc: 'Aprendiz o practicante.' },
  { value: 'SOCIO', label: 'Socio Trabajador', desc: 'Socio o propietario activo.' },
]

interface PrestadorData {
  id: number
  nombre_completo: string
  tipo_documento: string
  numero_documento: string | null
  email: string | null
  telefono: string | null
  tipo_vinculacion: string
  activo: boolean
  es_gratuito: boolean
  user_id?: number | null
  empleado_id?: number | null
}

interface PrestadorEditModalProps {
  open: boolean
  onClose: () => void
  prestador: PrestadorData | null
}

export default function PrestadorEditModal({ open, onClose, prestador }: PrestadorEditModalProps) {
  const [showPass, setShowPass] = useState(false)
  const [showPassConfirm, setShowPassConfirm] = useState(false)
  const { data, setData, put, processing, errors } = useForm({
    tipo_documento: prestador?.tipo_documento || 'CC',
    numero_documento: prestador?.numero_documento || '',
    nombre_completo: prestador?.nombre_completo || '',
    email: prestador?.email || '',
    telefono: prestador?.telefono || '',
    tipo_vinculacion: prestador?.tipo_vinculacion || 'CONTRATISTA',
    empleado_id: prestador?.empleado_id || '',
    es_gratuito: prestador?.es_gratuito || false,
    activo: prestador?.activo ?? true,
    generar_usuario: false,
    password: '',
    password_confirmation: '',
  })

  if (!prestador) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    put(route('service-desk.prestadores.update', prestador.id), {
      preserveScroll: true,
      onSuccess: () => onClose(),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar Prestador"
      description={prestador.nombre_completo}
      icon={Pencil}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Datos básicos */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Datos del Prestador</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-tipo-doc">Tipo de documento</Label>
              <select
                id="edit-tipo-doc"
                value={data.tipo_documento}
                onChange={(e) => setData('tipo_documento', e.target.value)}
                className={selectClass}
              >
                <option value="CC">Cédula</option>
                <option value="NIT">NIT</option>
                <option value="CE">Cédula Extranjería</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-num-doc">Número de documento</Label>
              <Input
                id="edit-num-doc"
                value={data.numero_documento}
                onChange={(e) => setData('numero_documento', e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-nombre">Nombre completo *</Label>
              <Input
                id="edit-nombre"
                value={data.nombre_completo}
                onChange={(e) => setData('nombre_completo', e.target.value)}
              />
              {errors.nombre_completo && <p className="text-xs text-destructive">{errors.nombre_completo}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">
                Correo electrónico {data.generar_usuario && '*'}
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-tel">Teléfono</Label>
              <Input
                id="edit-tel"
                value={data.telefono}
                onChange={(e) => setData('telefono', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Vinculación y Estado */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Vinculación y Estado</h4>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-vinculacion">Tipo de vinculación *</Label>
              <select
                id="edit-vinculacion"
                value={data.tipo_vinculacion}
                onChange={(e) => setData('tipo_vinculacion', e.target.value)}
                className={selectClass}
              >
                {TIPOS_VINCULACION.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {TIPOS_VINCULACION.find((t) => t.value === data.tipo_vinculacion)?.desc}
              </p>
            </div>

            {data.tipo_vinculacion === 'EMPLEADO' && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
                <p className="text-xs font-medium">Creación automática en RRHH</p>
                <p className="text-xs text-muted-foreground">
                  Al guardar se registrará automáticamente en empleados. Luego ve a RRHH &gt; Contratos.
                </p>
              </div>
            )}

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.activo}
                  onChange={(e) => setData('activo', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">Activo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.es_gratuito}
                  onChange={(e) => setData('es_gratuito', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">
                  <Wrench className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  Sin costo
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Credenciales de acceso */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Credenciales de acceso</h4>
          {prestador?.user_id ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Usuario activo
                </span>
              </div>
              <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80">
                {prestador.email || 'Sin correo'} — puede acceder al sistema como técnico.
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Para restablecer la contraseña, ve a Usuarios en el panel de administración.
              </p>
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-border bg-muted/10 p-3">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={data.generar_usuario}
                  onChange={(e) => setData('generar_usuario', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary"
                />
                <Plus className="h-4 w-4 text-muted-foreground" />
                Crear credenciales de acceso
              </label>
              <p className="text-xs text-muted-foreground -mt-1 ml-6">
                Se creará un usuario con rol <Badge variant="outline" className="text-xs px-1.5 py-0">TÉCNICO</Badge> para que pueda acceder al sistema y gestionar sus órdenes.
              </p>

              {data.generar_usuario && (
                <div className="ml-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-pass">
                      <KeyRound className="mr-1 inline h-3.5 w-3.5 text-muted-foreground" />
                      Contraseña *
                    </Label>
                    <div className="relative">
                      <Input
                        id="edit-pass"
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
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-pass-confirm">Confirmar contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="edit-pass-confirm"
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
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={processing} className="gap-2">
            <Save className="h-4 w-4" />
            {processing ? 'Guardando…' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
