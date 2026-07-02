import { useForm, usePage } from '@inertiajs/react'
import { User, Mail, Lock, Save, KeyRound, Loader2 } from 'lucide-react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card'
import { Separator } from '@/Components/ui/separator'
import { useToast } from '@/Components/toasts/ToastProvider'
import { PageHeader } from '@/Components/ui/page-header'

interface UserData {
  id: number
  name: string
  email: string
  is_superadmin: boolean
  roles: string[]
}

interface ProfileProps {
  user: UserData
}

export default function ProfileEdit({ user }: ProfileProps) {
  const { flash } = usePage().props as { flash: { success?: string; error?: string } }

  // Formulario de datos básicos
  const { data, setData, put, processing, errors } = useForm({
    name: user.name,
    email: user.email,
  })

  // Formulario de cambio de contraseña
  const passwordForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const submitProfile = (e: React.FormEvent) => {
    e.preventDefault()
    put(route('core.profile.update'))
  }

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault()
    passwordForm.put(route('core.profile.password'), {
      onSuccess: () => {
        passwordForm.reset()
      },
    })
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const roleLabel = user.roles[0] || (user.is_superadmin ? 'SuperAdmin' : 'Usuario')

  return (
    <AuthenticatedLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <PageHeader
          title="Mi Perfil"
          description="Gestiona tus datos personales y contraseña"
        />

        {/* Tarjeta de información del usuario */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent px-6 py-8 sm:px-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-lg">
                {initials}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Información personal */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Información Personal</CardTitle>
                <CardDescription>
                  Actualiza tus datos básicos de la cuenta
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitProfile} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    disabled={processing}
                    className="pl-10"
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    disabled={processing}
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={processing}>
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar cambios
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Cambio de contraseña */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Cambiar Contraseña</CardTitle>
                <CardDescription>
                  Actualiza tu contraseña de acceso a la plataforma
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitPassword} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="current_password" className="text-sm font-medium text-foreground">
                  Contraseña actual
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="current_password"
                    type="password"
                    value={passwordForm.data.current_password}
                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                    disabled={passwordForm.processing}
                    className="pl-10"
                    placeholder="••••••••"
                  />
                </div>
                {passwordForm.errors.current_password && (
                  <p className="text-sm text-destructive">{passwordForm.errors.current_password}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={passwordForm.data.password}
                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                    disabled={passwordForm.processing}
                    className="pl-10"
                    placeholder="••••••••"
                  />
                </div>
                {passwordForm.errors.password && (
                  <p className="text-sm text-destructive">{passwordForm.errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password_confirmation" className="text-sm font-medium text-foreground">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password_confirmation"
                    type="password"
                    value={passwordForm.data.password_confirmation}
                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                    disabled={passwordForm.processing}
                    className="pl-10"
                    placeholder="••••••••"
                  />
                </div>
                {passwordForm.errors.password_confirmation && (
                  <p className="text-sm text-destructive">{passwordForm.errors.password_confirmation}</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={passwordForm.processing} variant="secondary">
                  {passwordForm.processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Cambiar contraseña
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  )
}
