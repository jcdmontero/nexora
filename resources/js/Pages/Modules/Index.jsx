import { router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Badge } from '@/Components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card'
import { EmptyState } from '@/Components/ui/empty-state'
import { CardGridSkeleton } from '@/Components/ui/skeleton'
import { Package } from 'lucide-react'

export default function ModulesIndex({ modules, activeCodes, loading }) {
  const toggle = (code, isActive) => {
    if (isActive) {
      router.post(route('core.modules.deactivate'), { module_code: code })
    } else {
      router.post(route('core.modules.activate'), { module_code: code })
    }
  }

  return (
    <AuthenticatedLayout>
      <h2 className="text-2xl font-bold mb-6">Módulos</h2>
      {loading ? (
        <CardGridSkeleton count={6} columns={3} />
      ) : modules.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No hay módulos disponibles"
          description="Los módulos extienden la funcionalidad de tu plataforma. Espera a que nuevos módulos sean publicados."
        />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => {
          const isActive = activeCodes.includes(mod.code)
          return (
            <Card key={mod.code} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{mod.name}</CardTitle>
                  <Badge variant={isActive ? 'default' : 'outline'}>
                    {isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <CardDescription>v{mod.version}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground flex-1 mb-4">{mod.description}</p>
                <button
                  onClick={() => toggle(mod.code, isActive)}
                  className={`self-start h-7 px-3 rounded-lg text-sm font-medium transition-colors inline-flex items-center ${
                    isActive
                      ? 'border border-destructive text-destructive hover:bg-destructive/10'
                      : 'bg-primary text-primary-foreground hover:bg-primary/80'
                  }`}
                >
                  {isActive ? 'Desactivar' : 'Activar'}
                </button>
              </CardContent>
            </Card>
          )
        })}
      </div>
      )}
    </AuthenticatedLayout>
  )
}
