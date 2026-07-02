import { useForm } from '@inertiajs/react'
import SuperAdminLayout from '@/Layouts/SuperAdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { Building, Boxes } from 'lucide-react'
import ModuleSelector from './ModuleSelector'

export default function TenantEdit({ tenant, modulosDisponibles, modulosActivos }) {
  const { data, setData, put, processing, errors } = useForm({
    name: tenant.name,
    slug: tenant.slug,
    email: tenant.email || '',
    plan: tenant.plan || '',
    is_active: tenant.is_active,
    modulos: modulosActivos.filter((c) => c !== 'core'),
  })

  const toggleModulo = (modulesToToggle) => {
    const arr = Array.isArray(modulesToToggle) ? modulesToToggle : [modulesToToggle]
    
    if (Array.isArray(modulesToToggle)) {
        setData('modulos', [...new Set([...data.modulos, ...arr])])
    } else {
        const code = modulesToToggle
        setData('modulos', data.modulos.includes(code)
          ? data.modulos.filter((c) => c !== code)
          : [...data.modulos, code])
    }
  }

  const submit = (e) => {
    e.preventDefault()
    put(route('superadmin.tenants.update', tenant.id))
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
      <h2 className="text-2xl font-bold mb-6">Editar empresa</h2>
      <form onSubmit={submit} className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Building className="w-4 h-4" /> {tenant.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Nombre', <Input value={data.name} onChange={(e) => setData('name', e.target.value)} required />, errors.name)}
              {field('Slug (subdominio)', <Input value={data.slug} onChange={(e) => setData('slug', e.target.value)} required />, errors.slug)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Email de contacto', <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />, errors.email)}
              {field('Plan', <Input value={data.plan} onChange={(e) => setData('plan', e.target.value)} />, errors.plan)}
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-primary" />
              <label htmlFor="is_active" className="text-sm">Empresa activa</label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Boxes className="w-4 h-4" /> Módulos habilitados</CardTitle>
          </CardHeader>
          <CardContent>
            <ModuleSelector modulos={modulosDisponibles} selected={data.modulos} onToggle={toggleModulo} />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={processing}>{processing ? 'Guardando...' : 'Guardar cambios'}</Button>
          <Button type="button" variant="outline" onClick={() => history.back()}>Cancelar</Button>
        </div>
      </form>
    </SuperAdminLayout>
  )
}
