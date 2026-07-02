import { Link, useForm } from '@inertiajs/react'
import { Building2, Loader2, User, Building, Mail, Lock } from 'lucide-react'
import LandingLayout from '@/Layouts/LandingLayout'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card'
import { Separator } from '@/Components/ui/separator'

export default function Register() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    tenant_name: '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('core.register'))
  }

  return (
    <LandingLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">NEXORA</h1>
                <p className="text-xs text-muted-foreground">
                  Plataforma Empresarial
                </p>
              </div>
            </div>
          </div>

          {/* Card */}
          <Card className="shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                Crear nueva empresa
              </CardTitle>
              <CardDescription>
                Configura tu empresa y comienza en minutos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-6">
                {/* Datos de la empresa */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">
                      Datos de la empresa
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="tenant_name"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Nombre de la empresa
                    </label>
                    <Input
                      id="tenant_name"
                      type="text"
                      placeholder="Mi Empresa S.A."
                      value={data.tenant_name}
                      onChange={(e) => setData('tenant_name', e.target.value)}
                      disabled={processing}
                      required
                      autoFocus
                      className={errors.tenant_name ? 'border-destructive' : ''}
                    />
                    {errors.tenant_name && (
                      <p className="text-sm text-destructive">
                        {errors.tenant_name}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Datos del administrador */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">
                      Datos del administrador
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Nombre completo
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Juan Pérez"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      disabled={processing}
                      required
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Correo electrónico
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="juan@miempresa.com"
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                      disabled={processing}
                      required
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="password"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Contraseña
                      </label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        disabled={processing}
                        required
                        className={errors.password ? 'border-destructive' : ''}
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="password_confirmation"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Confirmar
                      </label>
                      <Input
                        id="password_confirmation"
                        type="password"
                        placeholder="••••••••"
                        value={data.password_confirmation}
                        onChange={(e) =>
                          setData('password_confirmation', e.target.value)
                        }
                        disabled={processing}
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={processing}
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando empresa...
                    </>
                  ) : (
                    'Crear empresa'
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-center text-muted-foreground">
                ¿Ya tienes una empresa?{' '}
                <Link
                  href={route('core.login')}
                  className="font-medium text-primary hover:underline"
                >
                  Iniciar sesión
                </Link>
              </div>
            </CardFooter>
          </Card>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Al crear una empresa, aceptas nuestros{' '}
            <a href="#" className="underline hover:text-foreground">
              Términos de Servicio
            </a>{' '}
            y{' '}
            <a href="#" className="underline hover:text-foreground">
              Política de Privacidad
            </a>
            .
          </p>
        </div>
      </div>
    </LandingLayout>
  )
}
