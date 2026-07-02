import { router } from '@inertiajs/react'
import SuperAdminLayout from '@/Layouts/SuperAdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { DataTable } from '@/Components/ui/data-table'

const estadoLabels = {
  desarrollo: 'Desarrollo',
  qa: 'QA',
  certificacion: 'Certificación',
  publicado: 'Publicado',
  deprecado: 'Deprecado',
  retirado: 'Retirado',
}

const estadoVariant = (estado) =>
  estado === 'publicado' ? 'default'
    : estado === 'deprecado' || estado === 'retirado' ? 'destructive'
    : 'secondary'

export default function ModulosIndex({ modulos, estados }) {
  const cambiarEstado = (m, estado) => {
    router.put(route('superadmin.modules.estado', m.code), { estado }, { preserveScroll: true })
  }

  const columns = [
    { key: 'name', header: 'Módulo', className: 'font-medium' },
    { key: 'code', header: 'Código', className: 'font-mono text-xs text-muted-foreground' },
    { key: 'version', header: 'Versión', className: 'text-xs text-muted-foreground' },
    {
      key: 'estado',
      header: 'Estado',
      cell: (m) => <Badge variant={estadoVariant(m.estado)}>{estadoLabels[m.estado] || m.estado}</Badge>,
    },
    { key: 'empresas_count', header: 'Empresas', cell: (m) => <Badge variant="secondary">{m.empresas_count}</Badge> },
    {
      key: 'acciones',
      header: 'Cambiar estado',
      alignEnd: true,
      cell: (m) => m.is_core ? (
        <span className="text-xs text-muted-foreground">Core</span>
      ) : (
        <select
          value={m.estado}
          onChange={(e) => cambiarEstado(m, e.target.value)}
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        >
          {estados.map((est) => (
            <option key={est} value={est}>{estadoLabels[est] || est}</option>
          ))}
        </select>
      ),
    },
  ]

  return (
    <SuperAdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Centro de Módulos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Solo los módulos en estado <strong>Publicado</strong> pueden asignarse a empresas cliente.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Catálogo de módulos</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={modulos} rowKey={(m) => m.code} />
        </CardContent>
      </Card>
    </SuperAdminLayout>
  )
}
