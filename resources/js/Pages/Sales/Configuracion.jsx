import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Settings, FileText, KeySquare } from 'lucide-react'
import { EmptyState } from '@/Components/ui/empty-state'

export default function ConfiguracionIndex() {
  return (
    <AuthenticatedLayout>
      <Head title="Configuración de Ventas" />
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6 text-primary" /> Configuración de Ventas y Facturación</h2>
        <p className="text-muted-foreground">Administra resoluciones, certificados y preferencias del módulo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Resoluciones DIAN</CardTitle>
            <CardDescription>Rangos de facturación autorizados por la DIAN.</CardDescription>
          </CardHeader>
          <CardContent>
             <EmptyState
                icon={FileText}
                title="Sin Resoluciones"
                description="Agrega tu primera resolución de facturación para empezar a emitir documentos."
              />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeySquare className="h-5 w-5" /> Certificado Digital</CardTitle>
            <CardDescription>Archivo .pfx necesario para firmar el XML.</CardDescription>
          </CardHeader>
          <CardContent>
             <EmptyState
                icon={KeySquare}
                title="No configurado"
                description="Actualmente estás usando el simulador (Mock Provider) interno."
              />
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  )
}
