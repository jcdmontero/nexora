import { Link, useForm, router } from '@inertiajs/react'
import { useEffect, useState, useCallback } from 'react'
import { Building2, Loader2, AlertTriangle } from 'lucide-react'
import LandingLayout from '@/Layouts/LandingLayout'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card'

interface LoginProps {
  tenantName?: string
}

const MAX_ATTEMPTS = 5
const COOLDOWN_BASE_MS = 15_000
const STORAGE_KEY = 'nexora_login_attempts'

function getAttemptData(): { count: number; lockedUntil: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { count: 0, lockedUntil: 0 }
    const data = JSON.parse(raw)
    if (data.lockedUntil && Date.now() > data.lockedUntil) {
      localStorage.removeItem(STORAGE_KEY)
      return { count: 0, lockedUntil: 0 }
    }
    return data
  } catch {
    return { count: 0, lockedUntil: 0 }
  }
}

function recordAttempt(): { count: number; lockedUntil: number } {
  const data = getAttemptData()
  const newCount = data.count + 1
  const lockedUntil = newCount >= MAX_ATTEMPTS
    ? Date.now() + COOLDOWN_BASE_MS * Math.min(newCount - MAX_ATTEMPTS + 1, 5)
    : 0
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: newCount, lockedUntil }))
  return { count: newCount, lockedUntil }
}

function resetAttempts() {
  localStorage.removeItem(STORAGE_KEY)
}

export default function Login({ tenantName }: LoginProps) {
  const { data, setData, post, processing, errors, setError } = useForm({
    email: '',
    password: '',
    remember: false,
  })

  const [cooldown, setCooldown] = useState(0)
  const [attemptCount, setAttemptCount] = useState(0)

  useEffect(() => {
    const saved = getAttemptData()
    setAttemptCount(saved.count)
    if (saved.lockedUntil > Date.now()) {
      setCooldown(Math.ceil((saved.lockedUntil - Date.now()) / 1000))
    }
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      const remaining = Math.ceil((getAttemptData().lockedUntil - Date.now()) / 1000)
      if (remaining <= 0) {
        setCooldown(0)
        clearInterval(timer)
      } else {
        setCooldown(remaining)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown > 0])

  const submit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    const current = getAttemptData()
    if (current.lockedUntil > Date.now()) {
      const secs = Math.ceil((current.lockedUntil - Date.now()) / 1000)
      setCooldown(secs)
      setError('email', `Demasiados intentos. Espera ${secs} segundos.`)
      return
    }

    post(route('core.login'), {
      onStart: () => {},
      onError: () => {
        const result = recordAttempt()
        setAttemptCount(result.count)
        if (result.lockedUntil > 0) {
          setCooldown(Math.ceil((result.lockedUntil - Date.now()) / 1000))
        }
      },
      onSuccess: () => {
        resetAttempts()
      },
    })
  }, [post, processing, setError])

  const isLocked = cooldown > 0

  return (
    <LandingLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {tenantName || 'NEXORA'}
                </h1>
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
                Iniciar sesión
              </CardTitle>
              <CardDescription>
                Ingresa tus credenciales para acceder
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLocked && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Demasiados intentos fallidos. Espera {cooldown}s antes de intentar de nuevo.</span>
                </div>
              )}
              <form onSubmit={submit} className="space-y-4">
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
                    placeholder="tu@empresa.com"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    disabled={processing || isLocked}
                    required
                    autoFocus
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

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
                    disabled={processing || isLocked}
                    required
                    className={errors.password ? 'border-destructive' : ''}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={data.remember}
                    onChange={(e) => setData('remember', e.target.checked)}
                    disabled={processing || isLocked}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Recordarme
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={processing || isLocked}
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ingresando...
                    </>
                  ) : isLocked ? (
                    `Espera ${cooldown}s`
                  ) : (
                    'Ingresar'
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-center text-muted-foreground">
                ¿No tienes una empresa?{' '}
                <Link
                  href={route('core.register')}
                  className="font-medium text-primary hover:underline"
                >
                  Crear nueva empresa
                </Link>
              </div>
            </CardFooter>
          </Card>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            © 2026 NEXORA Platform. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </LandingLayout>
  )
}
