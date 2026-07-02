import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { DataTable, type DataTableColumn } from '@/Components/ui/data-table';

const columns: DataTableColumn<typeof recepcion.detalles[0]>[] = [
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
    header: 'Cantidad Recibida',
    className: 'text-right',
    cell: (row) => (
      <span className="font-medium">{parseFloat(row.cantidad).toString()}</span>
    ),
    alignEnd: true,
  },
]

export default function Show({ recepcion }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('inventory.recepciones.index')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Recepción: {recepcion.numero}
                        </h2>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mr-2" /> Imprimir
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title={`Recepción ${recepcion.numero}`} />

            <div className="py-12 print:py-0">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Datos de Recepción</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="grid grid-cols-2 gap-1 text-sm">
                                    <span className="text-muted-foreground">Número de Albarán:</span>
                                    <span className="font-medium">{recepcion.numero}</span>
                                    
                                    <span className="text-muted-foreground">Fecha de Recepción:</span>
                                    <span>{recepcion.fecha}</span>
                                    
                                    <span className="text-muted-foreground">Orden de Compra:</span>
                                    <span>{recepcion.orden_compra?.numero || 'N/A'}</span>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {recepcion.notas && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{recepcion.notas}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Productos Recibidos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={columns} data={recepcion.detalles} rowKey={(r) => r.id} />
                        </CardContent>
                    </Card>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
