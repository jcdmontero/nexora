import React from 'react'
import { useForm, Head } from '@inertiajs/react'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card'

interface LoginProps {
  tenantName?: string
}

export default function Login({ tenantName }: LoginProps) {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
    remember: false,
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('portal.login'))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4 py-12 relative overflow-hidden">
      <Head title="Acceso Portal Clientes" />
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-8 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shadow-xl mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            {tenantName || 'NEXORA'}
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Portal de Clientes
          </p>
        </div>

        {/* Card */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-slate-100">
              Ingresar al Portal
            </CardTitle>
            <CardDescription className="text-slate-400">
              Introduce tus datos de cliente para consultar tus órdenes, cotizaciones y facturas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-300"
                >
                  Correo electrónico
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  disabled={processing}
                  required
                  autoFocus
                  className={`bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-300"
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
                  className={`bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-400">
                  <input
                    type="checkbox"
                    checked={data.remember}
                    onChange={(e) => setData('remember', e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                  />
                  Recordarme
                </label>
              </div>

              <Button
                type="submit"
                disabled={processing}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-100 transition-all font-semibold shadow-lg shadow-indigo-600/20"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validando acceso...
                  </>
                ) : (
                  'Ingresar'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-800/50 py-4 text-center">
            <span className="text-xs text-slate-500">
              Validado por NEXORA Secure Link
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
