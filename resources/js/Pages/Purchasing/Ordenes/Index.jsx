import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Plus, ShoppingCart, Eye, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '@/Components/ui/data-table';
import { Badge } from '@/Components/ui/badge';
import EmptyState from '@/Components/ui/empty-state';
import { TableSkeleton } from '@/Components/ui/skeleton';
import { ConfirmDialog } from '@/Components/ui/confirm-dialog';
import { usePermissions } from '@/Hooks/usePermissions';

export default function Index({ ordenes }) {
    const { can } = usePermissions();
    const loading = ordenes == null;

    const columns = [
        {
            header: 'Número',
            key: 'numero',
            cell: (row) => <span className="font-medium">{row.numero}</span>,
        },
        {
            header: 'Proveedor',
            key: 'proveedor',
        },
        {
            header: 'Fecha Emisión',
            key: 'fecha_emision',
        },
        {
            header: 'Estado',
            key: 'estado',
            cell: (row) => {
                const colors = {
                    'borrador': 'bg-gray-100 text-gray-800',
                    'enviada': 'bg-blue-100 text-blue-800',
                    'recibida': 'bg-green-100 text-green-800',
                    'cancelada': 'bg-red-100 text-red-800',
                };
                return (
                    <Badge variant="outline" className={`${colors[row.estado] || ''} capitalize`}>
                        {row.estado}
                    </Badge>
                );
            }
        },
        {
            header: 'Total',
            key: 'total',
            cell: (row) => `$${row.total}`,
        },
        {
            key: 'actions',
            alignEnd: true,
            cell: (row) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('purchasing.ordenes.show', row.id)}>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </Link>
                    </Button>
                    
                    {row.estado === 'borrador' && can('purchasing:edit') && (
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('purchasing.ordenes.edit', row.id)}>
                                <Edit className="h-4 w-4 text-blue-500" />
                            </Link>
                        </Button>
                    )}

                    {row.estado === 'borrador' && can('purchasing:delete') && (
                        <ConfirmDialog
                            trigger={
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            }
                            title="¿Eliminar esta orden?"
                            description="Se eliminará la orden de compra y todos sus detalles. Esta acción no se puede deshacer."
                            deleteUrl={route('purchasing.ordenes.destroy', row.id)}
                        />
                    )}
                </div>
            )
        }
    ];

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Órdenes de Compra</h2>}
        >
            <Head title="Órdenes de Compra" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Listado de Órdenes</h3>
                        {can('purchasing:create') && (
                            <Button asChild>
                                <Link href={route('purchasing.ordenes.create')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nueva Orden
                                </Link>
                            </Button>
                        )}
                    </div>

                    {loading ? (
                        <TableSkeleton rows={6} cols={5} />
                    ) : !ordenes || (ordenes.data?.length ?? ordenes.length) === 0 ? (
                        <EmptyState
                            icon={ShoppingCart}
                            title="No hay órdenes de compra"
                            description="Comience creando su primera orden de compra para reabastecer su inventario."
                            actionLabel={can('purchasing:create') ? "Nueva Orden" : null}
                            actionHref={route('purchasing.ordenes.create')}
                        />
                    ) : (
                        <div className="bg-white p-6 shadow-sm sm:rounded-lg border">
                            <DataTable
                                columns={columns}
                                data={ordenes.data}
                                searchPlaceholder="Buscar por número..."
                                searchColumn="numero"
                            />
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
