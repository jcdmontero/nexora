import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { DataTable, type DataTableColumn } from '@/Components/ui/data-table';
import { Badge } from '@/Components/ui/badge';

const columns: DataTableColumn<typeof traslado.detalles[0]>[] = [
  {
    key: 'producto',
    header: 'Producto',
    cell: (row) => (
      <>
        <div className="font-medium">{row.producto?.nombre}</div>
        <div className="text-xs text-muted-foreground">Ref: {row.producto?.codigo}</div>
      </>
    ),
  },
  {
    key: 'cantidad',
    header: 'Cantidad Movida',
    className: 'text-right',
    cell: (row) => (
      <span className="font-medium">
        {parseFloat(row.cantidad).toString()}{' '}
        <span className="font-normal text-xs text-muted-foreground">{row.producto?.unidad_medida}</span>
      </span>
    ),
    alignEnd: true,
  },
]

export default function Show({ traslado }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('inventory.traslados.index')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Traslado: {traslado.numero}
                        </h2>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            {traslado.estado.toUpperCase()}
                        </Badge>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mr-2" /> Imprimir
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title={`Traslado ${traslado.numero}`} />

            <div className="py-12 print:py-0">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Ruta del Traslado</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="text-muted-foreground">Bodega Origen:</span>
                                    <span className="font-medium">{traslado.origen?.nombre}</span>
                                    
                                    <span className="text-muted-foreground">Bodega Destino:</span>
                                    <span className="font-medium">{traslado.destino?.nombre}</span>
                                    
                                    <span className="text-muted-foreground">Fecha:</span>
                                    <span>{traslado.fecha}</span>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {traslado.notas && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{traslado.notas}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Productos Trasladados</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={columns} data={traslado.detalles} rowKey={(r) => r.id} />
                        </CardContent>
                    </Card>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
