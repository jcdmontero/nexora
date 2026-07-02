import { Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { FileText, BarChart3, Calendar } from 'lucide-react'

const ESTADO_COLOR = {
    borrador:   'secondary',
    liquidado:  'default',
    aprobado:   'default',
    cerrado:    'outline',
}

export default function ReportesIndex({ periodos = [] }) {
    return (
        <AuthenticatedLayout>
            <div className="flex flex-col gap-6 max-w-5xl mx-auto">
                <div className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    <h1 className="text-2xl font-bold">Reportes de Nómina</h1>
                </div>

                {periodos.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No hay períodos de nómina disponibles para generar reportes.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {periodos.map(periodo => (
                            <Card key={periodo.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            {periodo.codigo} — {periodo.mes_contable}
                                        </CardTitle>
                                        <Badge variant={ESTADO_COLOR[periodo.estado] ?? 'secondary'}>
                                            {periodo.estado}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-3">
                                    <Link
                                        href={route('payroll.reportes.resumen', periodo.id)}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Resumen de período
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    )
}
