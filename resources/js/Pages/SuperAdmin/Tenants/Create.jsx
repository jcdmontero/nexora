import { useForm } from '@inertiajs/react'
import SuperAdminLayout from '@/Layouts/SuperAdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { Separator } from '@/Components/ui/separator'
import { Building, User, Boxes } from 'lucide-react'
import ModuleSelector from './ModuleSelector'

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export default function TenantCreate({ modulosDisponibles }) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    slug: '',
    email: '',
    plan: '',
    modulos: [],
    admin_name: '',
    admin_email: '',
    admin_password: '',
    admin_password_confirmation: '',
  })

  const toggleModulo = (modulesToToggle) => {
    const arr = Array.isArray(modulesToToggle) ? modulesToToggle : [modulesToToggle]
    
    // Si pasamos un array (para activar paquete), nos aseguramos de que todos estén seleccionados
    if (Array.isArray(modulesToToggle)) {
        setData('modulos', [...new Set([...data.modulos, ...arr])])
    } else {
        // Toggle simple
        const code = modulesToToggle
        setData('modulos', data.modulos.includes(code)
          ? data.modulos.filter((c) => c !== code)
          : [...data.modulos, code])
    }
  }

  const submit = (e) => {
    e.preventDefault()
    post(route('superadmin.tenants.store'))
  }

  const field = (label, child, error) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      {child}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )

  return (
    <SuperAdminLayout>
      <h2 className="text-2xl font-bold mb-6">Nueva empresa</h2>
      <form onSubmit={submit} className="max-w-3xl space-y-6">
        {/* Datos empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Building className="w-4 h-4" /> Datos de la empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Nombre', (
                <Input value={data.name} onChange={(e) => { setData('name', e.target.value); if (!data.slug || data.slug === slugify(data.name)) setData('slug', slugify(e.target.value)) }} required />
              ), errors.name)}
              {field('Slug (subdominio)', (
                <Input value={data.slug} onChange={(e) => setData('slug', e.target.value)} required />
              ), errors.slug)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Email de contacto', (
                <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
              ), errors.email)}
              {field('Plan', (
                <Input value={data.plan} onChange={(e) => setData('plan', e.target.value)} placeholder="ej. Enterprise" />
              ), errors.plan)}
            </div>
          </CardContent>
        </Card>

        {/* Módulos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Boxes className="w-4 h-4" /> Módulos a habilitar</CardTitle>
          </CardHeader>
          <CardContent>
            <ModuleSelector modulos={modulosDisponibles} selected={data.modulos} onToggle={toggleModulo} />
          </CardContent>
        </Card>

        {/* Admin */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><User className="w-4 h-4" /> Administrador de la empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Nombre', (
                <Input value={data.admin_name} onChange={(e) => setData('admin_name', e.target.value)} required />
              ), errors.admin_name)}
              {field('Email', (
                <Input type="email" value={data.admin_email} onChange={(e) => setData('admin_email', e.target.value)} required />
              ), errors.admin_email)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Contraseña', (
                <Input type="password" value={data.admin_password} onChange={(e) => setData('admin_password', e.target.value)} required />
              ), errors.admin_password)}
              {field('Confirmar contraseña', (
                <Input type="password" value={data.admin_password_confirmation} onChange={(e) => setData('admin_password_confirmation', e.target.value)} required />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={processing}>{processing ? 'Creando...' : 'Crear empresa'}</Button>
          <Button type="button" variant="outline" onClick={() => history.back()}>Cancelar</Button>
        </div>
      </form>
    </SuperAdminLayout>
  )
}
