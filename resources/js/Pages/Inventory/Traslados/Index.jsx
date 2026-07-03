import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Plus, ArrowRightLeft, Eye } from 'lucide-react';
import { DataTable } from '@/Components/ui/data-table';
import EmptyState from '@/Components/ui/empty-state';
import { TableSkeleton } from '@/Components/ui/skeleton';
import { usePermissions } from '@/Hooks/usePermissions';

export default function Index({ traslados }) {
    const { can } = usePermissions();
    const loading = traslados == null;

    const columns = [
        {
            header: 'Número',
            accessorKey: 'numero',
            cell: (row) => <span className="font-medium">{row.numero}</span>,
        },
        {
            header: 'Fecha',
            accessorKey: 'fecha',
        },
        {
            header: 'Origen',
            accessorKey: 'origen',
        },
        {
            header: 'Destino',
            accessorKey: 'destino',
        },
        {
            id: 'actions',
            alignEnd: true,
            cell: (row) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('inventory.traslados.show', row.id)}>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </Link>
                    </Button>
                </div>
            )
        }
    ];

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Traslados de Mercancía</h2>}
        >
            <Head title="Traslados de Bodegas" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Historial de Traslados</h3>
                        {can('inventory:create') && (
                            <Button asChild>
                                <Link href={route('inventory.traslados.create')}>
                                    <Plus className="w-4 h-4 mr-2" /> Nuevo Traslado
                                </Link>
                            </Button>
                        )}
                    </div>

                    {loading ? (
                        <TableSkeleton rows={5} cols={4} />
                    ) : !traslados || traslados.length === 0 ? (
                        <EmptyState
                            icon={ArrowRightLeft}
                            title="No hay traslados registrados"
                            description="Aquí aparecerán los movimientos de mercancía entre tus bodegas."
                        />
                    ) : (
                        <div className="bg-white p-6 shadow-sm sm:rounded-lg border">
                            <DataTable 
                                columns={columns} 
                                data={traslados} 
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
