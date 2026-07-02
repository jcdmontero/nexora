import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, Send, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { DataTable, type DataTableColumn } from '@/Components/ui/data-table';
import { Badge } from '@/Components/ui/badge';
import { usePermissions } from '@/Hooks/usePermissions';

const columns: DataTableColumn<typeof orden.detalles[0]>[] = [
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
    header: 'Cantidad',
    className: 'text-right',
    cell: (row) => parseFloat(row.cantidad).toString(),
    alignEnd: true,
  },
  {
    key: 'precio_unitario',
    header: 'Precio Unitario',
    className: 'text-right',
    cell: (row) => `$${row.precio_unitario}`,
    alignEnd: true,
  },
  {
    key: 'subtotal',
    header: 'Subtotal',
    className: 'text-right',
    cell: (row) => <span className="font-medium">${row.subtotal}</span>,
    alignEnd: true,
  },
]

export default function Show({ orden }) {
    const { can } = usePermissions();

    const changeState = (newState) => {
        if (confirm(`¿Cambiar el estado a ${newState}?`)) {
            router.patch(route('purchasing.ordenes.estado', orden.id), { estado: newState });
        }
    };

    const statusColors = {
        'borrador': 'bg-gray-100 text-gray-800',
        'enviada': 'bg-blue-100 text-blue-800',
        'recibida': 'bg-green-100 text-green-800',
        'cancelada': 'bg-red-100 text-red-800',
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('purchasing.ordenes.index')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight flex items-center gap-3">
                            Orden de Compra: {orden.numero}
                            <Badge variant="outline" className={`${statusColors[orden.estado] || ''} capitalize`}>
                                {orden.estado}
                            </Badge>
                        </h2>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mr-2" /> Imprimir
                        </Button>

                        {can('purchasing:edit') && orden.estado === 'borrador' && (
                            <Button variant="default" className="bg-blue-600 hover:bg-blue-700" onClick={() => changeState('enviada')}>
                                <Send className="w-4 h-4 mr-2" /> Enviar a Proveedor
                            </Button>
                        )}

                        {can('purchasing:edit') && orden.estado === 'enviada' && (
                            <Button variant="default" className="bg-green-600 hover:bg-green-700" asChild>
                                <Link href={route('inventory.recepciones.create', { orden_id: orden.id })}>
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Recibir Mercancía
                                </Link>
                            </Button>
                        )}

                        {can('purchasing:edit') && (orden.estado === 'borrador' || orden.estado === 'enviada') && (
                            <Button variant="destructive" onClick={() => changeState('cancelada')}>
                                <XCircle className="w-4 h-4 mr-2" /> Cancelar Orden
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Orden ${orden.numero}`} />

            <div className="py-12 print:py-0">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Datos del Proveedor</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="grid grid-cols-2 gap-1 text-sm">
                                    <span className="text-muted-foreground">Razón Social:</span>
                                    <span className="font-medium">{orden.proveedor?.razon_social}</span>
                                    
                                    <span className="text-muted-foreground">Documento:</span>
                                    <span>{orden.proveedor?.numero_documento}</span>
                                    
                                    <span className="text-muted-foreground">Email:</span>
                                    <span>{orden.proveedor?.email || '—'}</span>
                                    
                                    <span className="text-muted-foreground">Teléfono:</span>
                                    <span>{orden.proveedor?.telefono || '—'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Detalles de la Orden</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="grid grid-cols-2 gap-1 text-sm">
                                    <span className="text-muted-foreground">Número:</span>
                                    <span className="font-medium">{orden.numero}</span>
                                    
                                    <span className="text-muted-foreground">Fecha Emisión:</span>
                                    <span>{orden.fecha_emision}</span>
                                    
                                    <span className="text-muted-foreground">Fecha Esperada:</span>
                                    <span>{orden.fecha_esperada || '—'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Líneas de Compra</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={columns} data={orden.detalles} rowKey={(r) => r.id} />

                            <div className="flex justify-end mt-6">
                                <div className="w-64 bg-muted/30 p-4 rounded-lg border">
                                    <div className="flex justify-between text-sm mb-2 text-muted-foreground">
                                        <span>Subtotal:</span>
                                        <span>${orden.subtotal}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                                        <span>Total:</span>
                                        <span>${orden.total}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {orden.notas && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Notas Adicionales</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{orden.notas}</p>
                            </CardContent>
                        </Card>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
