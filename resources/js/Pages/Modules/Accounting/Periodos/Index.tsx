import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, useForm } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Lock, Unlock } from 'lucide-react'
import EmptyState from '@/Components/ui/empty-state'

export default function PeriodosIndex({ periodos }) {
  const { post, processing } = useForm()

  const handleClose = (id) => {
    if (confirm('¿Está seguro de cerrar este periodo? Una vez cerrado, no podrá modificar asientos en fechas correspondientes a este mes.')) {
      post(route('accounting.periodos.close', id))
    }
  }

  const handleReopen = (id) => {
    if (confirm('¿Está seguro de REABRIR este periodo? Podrán modificarse asientos pasados. Tenga cuidado si ya se presentaron impuestos de este mes.')) {
      post(route('accounting.periodos.reopen', id))
    }
  }

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  return (
    <AuthenticatedLayout>
      <Head title="Cierres Contables" />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cierres de Periodo</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Administra los cierres mensuales. Un mes cerrado bloquea todas las transacciones pasadas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {periodos.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Lock}
              title="No hay periodos"
              description="Los periodos se abrirán automáticamente cuando registres el primer comprobante contable."
            />
          </div>
        ) : (
          periodos.map(periodo => (
            <Card key={periodo.id} className={periodo.estado === 'cerrado' ? 'border-primary/50 bg-primary/5' : ''}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{meses[periodo.mes - 1]} {periodo.anio}</CardTitle>
                    <CardDescription>
                      {periodo.fecha_inicio} al {periodo.fecha_fin}
                    </CardDescription>
                  </div>
                  {periodo.estado === 'cerrado' ? (
                    <Lock className="text-primary w-5 h-5" />
                  ) : (
                    <Unlock className="text-muted-foreground w-5 h-5" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end mt-2">
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      periodo.estado === 'cerrado' ? 'bg-primary/10 text-primary' : 'bg-green-100 text-green-800'
                    }`}>
                      {periodo.estado.toUpperCase()}
                    </span>
                    {periodo.cerrado_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Cerrado el {new Date(periodo.cerrado_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div>
                    {periodo.estado === 'abierto' ? (
                      <Button size="sm" onClick={() => handleClose(periodo.id)} disabled={processing}>
                        Cerrar Mes
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleReopen(periodo.id)} disabled={processing}>
                        Reabrir
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AuthenticatedLayout>
  )
}
