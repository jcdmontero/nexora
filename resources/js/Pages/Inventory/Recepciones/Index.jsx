import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { PackageOpen, Eye } from 'lucide-react';
import { DataTable } from '@/Components/ui/data-table';
import EmptyState from '@/Components/ui/empty-state';
import { TableSkeleton } from '@/Components/ui/skeleton';
import { usePermissions } from '@/Hooks/usePermissions';

export default function Index({ recepciones }) {
    const { can } = usePermissions();
    const loading = recepciones == null;

    const columns = [
        {
            header: 'Albarán / No.',
            accessorKey: 'numero',
            cell: (row) => <span className="font-medium">{row.numero}</span>,
        },
        {
            header: 'Orden de Compra',
            accessorKey: 'orden_compra',
        },
        {
            header: 'Fecha',
            accessorKey: 'fecha',
        },
        {
            id: 'actions',
            alignEnd: true,
            cell: (row) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('inventory.recepciones.show', row.id)}>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </Link>
                    </Button>
                </div>
            )
        }
    ];

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Recepciones de Bodega</h2>}
        >
            <Head title="Recepciones de Bodega" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Historial de Recepciones</h3>
                    </div>

                    {loading ? (
                        <TableSkeleton rows={5} cols={3} />
                    ) : !recepciones || recepciones.length === 0 ? (
                        <EmptyState
                            icon={PackageOpen}
                            title="No hay recepciones registradas"
                            description="Las recepciones se crean al recibir una Orden de Compra enviada."
                        />
                    ) : (
                        <div className="bg-white p-6 shadow-sm sm:rounded-lg border">
                            <DataTable 
                                columns={columns} 
                                data={recepciones} 
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
