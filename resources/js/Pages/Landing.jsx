import { useState } from 'react'
import { Link, useForm } from '@inertiajs/react'
import { cn } from '@/lib/utils'
import {
  Building2, Loader2, Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle2,
  X, Sparkles, ShieldCheck, Zap, TrendingUp, Star,
} from 'lucide-react'
import LandingLayout from '@/Layouts/LandingLayout'
import { Button, buttonVariants } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card'
import { Modal } from '@/Components/ui/modal'
import { Reveal } from '@/Components/Reveal'

export default function Landing() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
  })

  const submit = (e) => {
    e.preventDefault()
    post(route('core.login'), {
      onFinish: () => reset('password'),
    })
  }

  const closeLogin = () => {
    setLoginOpen(false)
    reset()
  }

  const modules = [
    {
      icon: '🔧',
      title: 'Soporte y Taller',
      description: 'Gestiona tu taller técnico con control de órdenes de trabajo, repuestos y estados en tiempo real.',
      features: ['Órdenes de trabajo automatizadas', 'Control de repuestos y mano de obra', 'Historial detallado por dispositivo', 'Notificaciones de estado automáticas'],
    },
    {
      icon: '📦',
      title: 'Inventario y Bodega',
      description: 'Control de existencias preciso con Kardex automático. Evita pérdidas por descuadres de stock.',
      features: ['Historial de Kardex en tiempo real', 'Alertas automáticas de stock mínimo', 'Etiquetado con códigos de barras y QR', 'Trazabilidad de movimientos (E/S)'],
    },
    {
      icon: '🛒',
      title: 'Punto de Venta (POS)',
      description: 'Facturación rápida y amigable integrada directamente con tu inventario de bodega y caja.',
      features: ['Interfaz táctil de alta velocidad', 'Múltiples medios de pago en caja', 'Cierres y arqueos de caja diarios', 'Integración de facturación DIAN'],
    },
    {
      icon: '👥',
      title: 'CRM y Clientes',
      description: 'Control de oportunidades, contactos comerciales y seguimiento de cotizaciones en un solo panel.',
      features: ['Registro único de clientes y contactos', 'Filtro y embudo de oportunidades', 'Historial de cotizaciones enviadas', 'Seguimiento post-venta centralizado'],
    },
    {
      icon: '📈',
      title: 'Compras y Proveedores',
      description: 'Organiza tus órdenes de compra, control de recepciones y cuentas por pagar a proveedores.',
      features: ['Órdenes de compra automatizadas', 'Recepción e ingreso directo a bodega', 'Control de cuentas por pagar', 'Historial de precios de compra'],
    },
    {
      icon: '⚖️',
      title: 'Contabilidad NIIF',
      description: 'Cumplimiento normativo y contabilidad automática generada a partir de tu operación diaria.',
      features: ['Catálogo de cuentas (PUC) estándar', 'Asientos contables automáticos', 'Trazabilidad de partida doble', 'Balances y estados financieros básicos'],
    },
    {
      icon: '💰',
      title: 'Nómina Electrónica',
      description: 'Liquidación de salarios colombianos y generación de archivos listos para reporte DIAN/UGPP.',
      features: ['Cálculo automático de prestaciones', 'Nómina electrónica parametrizada', 'Seguridad social y provisiones', 'Reportes de nómina exportables'],
    },
    {
      icon: '💵',
      title: 'Caja y Tesorería',
      description: 'Control de egresos, ingresos y conciliaciones bancarias para flujo de caja saludable.',
      features: ['Arqueos automáticos de caja', 'Registro de egresos y gastos menores', 'Control de cuentas bancarias', 'Flujo de caja consolidado en vivo'],
    },
    {
      icon: '👔',
      title: 'Recursos Humanos',
      description: 'Hojas de vida de empleados, control de contratos laborales, permisos y novedades.',
      features: ['Expedientes de personal completos', 'Control de fechas de contratos', 'Gestión de incapacidades y licencias', 'Evaluación y registro de novedades'],
    },
  ]

  const benefits = [
    { icon: Zap, title: 'Puesta en Marcha Llave en Mano', text: 'Nos encargamos de todo. Nuestros ingenieros migran tus datos antiguos e inicializan la plataforma lista para facturar.' },
    { icon: ShieldCheck, title: 'Auditoría y Control Incorruptible', text: 'Trazabilidad absoluta con logs inmutables. Cada cambio de datos queda registrado para cumplimiento contable y DIAN.' },
    { icon: TrendingUp, title: 'Capacidades Bajo Demanda', text: 'Paga únicamente por lo que tu negocio usa. Solicita la activación de nuevos módulos en minutos desde tu panel central.' },
  ]

  const testimonials = [
    { name: 'Carlos Mendoza', role: 'Dueño, Taller Mendoza - Bogotá', initials: 'CM', text: '"Nexora transformó completamente nuestro taller. Pasamos de controlar todo en papel a tener visibilidad total. La migración fue increíblemente fácil."', stars: 5 },
    { name: 'Laura Rodríguez', role: 'Gerente, Distribuidora Central - Medellín', initials: 'LR', text: '"Lo que más me gusta es la flexibilidad. Solo pagamos por lo que usamos. El módulo de almacén nos ayudó a reducir pérdidas en un 40% el primer trimestre."', stars: 5 },
    { name: 'Andrés Pérez', role: 'Director, SuperMarket Plus - Cali', initials: 'AP', text: '"El POS es increíblemente rápido. Nuestros cajeros lo aprendieron en minutos. Y la facturación electrónica funciona perfecto con la DIAN."', stars: 5 },
  ]

  const pricing = [
    { name: 'Plan Esencial', price: '$49', description: 'Ideal para optimizar un área clave de tu operación.', features: ['1 Módulo activo a tu elección', 'Aprovisionamiento inicial de sandbox', 'Usuarios de la empresa ilimitados', 'Auditoría automática de base de datos'], featured: false },
    { name: 'Plan Crecimiento', price: '$149', description: 'Para coordinar inventario, ventas y clientes en tiempo real.', features: ['Hasta 4 Módulos activos', 'Migración básica de saldos e inventario', 'Localización DIAN/NIIF y facturación electrónica', 'Infraestructura cloud optimizada'], featured: true, badge: 'Más Popular' },
    { name: 'Plan Corporativo', price: 'Custom', description: 'Suite completa gestionada para toda la organización.', features: ['Módulos y capacidades ilimitados', 'Integraciones personalizadas y soporte dedicado', 'Ingeniero asignado para implementaciones', 'SLA de disponibilidad garantizado'], featured: false },
  ]

  return (
    <LandingLayout>
      {/* ─────────────────────────── Header ─────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-110">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight">NEXORA</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#modules" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Módulos</a>
              <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Beneficios</a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonios</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Precios</a>
            </nav>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setLoginOpen(true)}>
                Iniciar Sesión
              </Button>
              <Link href={route('core.register')} className={cn(buttonVariants({ size: 'sm' }), 'hidden sm:inline-flex')}>
                Crear Empresa de Prueba
              </Link>
              {/* Botón menú móvil */}
              <button
                type="button"
                className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setMobileNav((v) => !v)}
                aria-label="Abrir menú"
              >
                {mobileNav ? <X className="w-5 h-5" /> : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>}
              </button>
            </div>
          </div>

          {/* Nav móvil desplegable */}
          {mobileNav && (
            <nav className="md:hidden pb-4 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <a href="#modules" onClick={() => setMobileNav(false)} className="px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">Módulos</a>
              <a href="#benefits" onClick={() => setMobileNav(false)} className="px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">Beneficios</a>
              <a href="#testimonials" onClick={() => setMobileNav(false)} className="px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">Testimonios</a>
              <a href="#pricing" onClick={() => setMobileNav(false)} className="px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">Precios</a>
            </nav>
          )}
        </div>
      </header>

      {/* ─────────────────────────── Hero ─────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 pt-16 px-4 overflow-hidden">
        {/* Blobs decorativos animados */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-4 h-4" />
            Software modular para negocios modernos
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 [animation-delay:150ms]">
            El ERP Modular para tu Negocio.{' '}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Entregado Llave en Mano.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 [animation-delay:300ms]">
            Sin configuraciones confusas ni meses de implementación. Nuestro equipo técnico migra tus datos e inicializa la plataforma a la medida de tu operación.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-6 duration-1000 [animation-delay:450ms]">
            <Link href={route('core.register')} className={cn(buttonVariants({ size: 'lg' }), 'group')}>
              <span>Crear Empresa de Prueba</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#modules" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
              Ver Módulos
            </a>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-16 animate-in fade-in duration-1000 [animation-delay:600ms]">
            {[
              { value: '500+', label: 'Negocios activos' },
              { value: '9', label: 'Módulos disponibles' },
              { value: '99.9%', label: 'Uptime garantizado' },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">{m.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── Benefits ─────────────────────────── */}
      <section id="benefits" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <Reveal direction="up" className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Diseñado para <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">tu éxito</span>
            </h2>
            <p className="text-muted-foreground text-lg">Todo lo que necesitas para llevar tu negocio al siguiente nivel.</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((b, i) => {
              const Icon = b.icon
              return (
                <Reveal key={b.title} direction="up" delay={i * 150}>
                  <Card className="h-full group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                        <Icon className="w-6 h-6" />
                      </div>
                      <CardTitle>{b.title}</CardTitle>
                      <CardDescription className="text-base">{b.text}</CardDescription>
                    </CardHeader>
                  </Card>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── Modules ─────────────────────────── */}
      <section id="modules" className="py-24 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <Reveal direction="up" className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Módulos <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Potentes</span>
            </h2>
            <p className="text-muted-foreground text-lg">Elige exactamente lo que tu negocio necesita. Sin pagar de más.</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8">
            {modules.map((mod, i) => (
              <Reveal key={mod.title} direction="up" delay={i * 150}>
                <Card className="h-full group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110">
                      {mod.icon}
                    </div>
                    <CardTitle>{mod.title}</CardTitle>
                    <CardDescription>{mod.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {mod.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── Testimonials ─────────────────────────── */}
      <section id="testimonials" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <Reveal direction="up" className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Lo que dicen nuestros <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">clientes</span>
            </h2>
            <p className="text-muted-foreground text-lg">Más de 500 negocios ya confían en Nexora.</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} direction="up" delay={i * 150}>
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.stars }).map((_, s) => (
                        <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic mb-6">{t.text}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 text-primary-foreground flex items-center justify-center font-bold text-sm">
                        {t.initials}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── Pricing ─────────────────────────── */}
      <section id="pricing" className="py-24 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <Reveal direction="up" className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Planes <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Flexibles</span>
            </h2>
            <p className="text-muted-foreground text-lg">Escoge el plan perfecto para tu negocio.</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {pricing.map((plan, i) => (
              <Reveal key={plan.name} direction="up" delay={i * 150} className="h-full">
                <Card
                  className={[
                    'h-full relative flex flex-col overflow-visible',
                    plan.featured
                      ? 'border-2 border-primary shadow-xl ring-primary/20 pt-8'
                      : 'pt-8',
                  ].join(' ')}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full shadow-md whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}
                  <CardHeader className="pt-4 text-center">
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="text-4xl font-bold">
                      {plan.price}
                      {plan.price !== 'Custom' && <span className="text-base font-normal text-muted-foreground">/mes</span>}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 text-center">
                    <ul className="space-y-3">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-center justify-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="mt-auto pb-6 pt-4">
                    <Button className="w-full" variant={plan.featured ? 'default' : 'outline'} asChild>
                      <Link href={route('core.register')}>
                        {plan.price === 'Custom' ? 'Contactar Ventas' : 'Empezar Ahora'}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── CTA final ─────────────────────────── */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary/5 to-purple-600/5">
        <Reveal direction="up" className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            ¿Listo para <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">transformar</span> tu negocio?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Crea una cuenta de prueba hoy mismo y experimenta el poder de NEXORA.
          </p>
          <Link href={route('core.register')} className={cn(buttonVariants({ size: 'lg' }), 'group')}>
            <span>Crear Empresa de Prueba</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>

      {/* ─────────────────────────── Footer ─────────────────────────── */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-xl font-bold">NEXORA</span>
              </div>
              <p className="text-sm text-muted-foreground">El software que se adapta a tu negocio, no al revés.</p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#modules" className="hover:text-foreground transition-colors">Módulos</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Precios</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Sobre Nosotros</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Centro de Ayuda</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentación</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Estado del Sistema</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2026 Nexora. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      {/* ─────────────────────────── Login Modal (premium, accesible) ─────────────────────────── */}
      <Modal
        open={loginOpen}
        onClose={closeLogin}
        title="Iniciar Sesión"
        description="Ingresa a tu panel de Nexora"
        icon={Building2}
        className="max-w-md"
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="modal-email" className="text-sm font-medium">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="modal-email"
                type="email"
                placeholder="tu@empresa.com"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                disabled={processing}
                required
                autoFocus
                className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="modal-password" className="text-sm font-medium">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="modal-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                disabled={processing}
                required
                className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          <Button type="submit" disabled={processing} className="w-full" size="lg">
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ingresando...
              </>
            ) : (
              'Ingresar a mi cuenta'
            )}
          </Button>

          <div className="text-sm text-center text-muted-foreground pt-2">
            ¿No tienes cuenta de prueba?{' '}
            <Link
              href={route('core.register')}
              className="font-medium text-primary hover:underline"
              onClick={() => setLoginOpen(false)}
            >
              Crear empresa de prueba
            </Link>
          </div>
        </form>
      </Modal>
    </LandingLayout>
  )
}
