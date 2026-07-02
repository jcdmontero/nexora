import { useState } from 'react'
import { useForm, router } from '@inertiajs/react'
import { Modal } from '@/Components/ui/modal'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { cn } from '@/lib/utils'
import { Save, Users, Wrench, Eye, EyeOff } from 'lucide-react'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const TIPOS_VINCULACION = [
  { value: 'EMPLEADO', label: 'Empleado', desc: 'Vinculado por contrato laboral. Genera nómina.' },
  { value: 'CONTRATISTA', label: 'Contratista', desc: 'Prestación de servicios. No genera nómina.' },
  { value: 'COMISIONISTA', label: 'Comisionista', desc: 'Pago por comisiones (ventas o servicios).' },
  { value: 'APRENDIZ', label: 'Aprendiz', desc: 'Aprendiz o practicante.' },
  { value: 'SOCIO', label: 'Socio Trabajador', desc: 'Socio o propietario activo.' },
]

interface PrestadorFormModalProps {
  open: boolean
  onClose: () => void
  /** Empleados disponibles (para vinculación EMPLEADO) */
  empleados?: Array<{ id: number; nombres: string; apellidos: string; documento: string }>
}

export default function PrestadorFormModal({ open, onClose, empleados = [] }: PrestadorFormModalProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('service-desk.prestadores.store'), {
      preserveScroll: true,
      onSuccess: () => onClose(),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo Prestador"
      description="Registra un técnico o contratista para asignarlo a órdenes de trabajo."
      icon={Users}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Datos básicos */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Datos del Prestador</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="modal-tipo-doc">Tipo de documento</Label>
              <select
                id="modal-tipo-doc"
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
              <Label htmlFor="modal-num-doc">Número de documento</Label>
              <Input
                id="modal-num-doc"
                value={data.numero_documento}
                onChange={(e) => setData('numero_documento', e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="modal-nombre">Nombre completo *</Label>
              <Input
                id="modal-nombre"
                value={data.nombre_completo}
                onChange={(e) => setData('nombre_completo', e.target.value)}
                placeholder="Nombre del técnico"
              />
              {errors.nombre_completo && <p className="text-xs text-destructive">{errors.nombre_completo}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modal-email">
                Correo electrónico {data.generar_usuario && '*'}
              </Label>
              <Input
                id="modal-email"
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                placeholder="correo@ejemplo.com"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modal-tel">Teléfono</Label>
              <Input
                id="modal-tel"
                value={data.telefono}
                onChange={(e) => setData('telefono', e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
        </div>

        {/* Vinculación */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Vinculación y Comisiones</h4>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="modal-vinculacion">Tipo de vinculación *</Label>
              <select
                id="modal-vinculacion"
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
                  Se registrará automáticamente en empleados. Luego deberás ir a RRHH &gt; Contratos para definir sueldo y afiliaciones.
                </p>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={data.es_gratuito}
                onChange={(e) => setData('es_gratuito', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">
                <Wrench className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                Trabaja sin costo (no genera comisión)
              </span>
            </label>

            <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={data.generar_usuario}
                  onChange={(e) => setData('generar_usuario', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary"
                />
                Crear credenciales de acceso (Usuario)
              </label>
              <p className="text-xs text-muted-foreground -mt-2">
                Se creará un usuario con rol TECNICO para que pueda acceder al sistema.
              </p>

              {data.generar_usuario && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="modal-pass">Contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="modal-pass"
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
                    <Label htmlFor="modal-pass-confirm">Confirmar contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="modal-pass-confirm"
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
        </div>

        {/* Botones del pie */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={processing} className="gap-2">
            <Save className="h-4 w-4" />
            {processing ? 'Guardando…' : 'Guardar Prestador'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
