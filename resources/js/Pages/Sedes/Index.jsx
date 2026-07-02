import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Plus, Building, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/Components/ui/data-table';
import EmptyState from '@/Components/ui/empty-state';
import { usePermissions } from '@/Hooks/usePermissions';
import { Badge } from '@/Components/ui/badge';

export default function Index({ sedes }) {
    const { can } = usePermissions();
    const { delete: destroy } = useForm();

    const handleDelete = (id) => {
        if (confirm('¿Estás seguro de eliminar esta sede?')) {
            destroy(route('core.sedes.destroy', id));
        }
    };

    const columns = [
        {
            header: 'Nombre de la Sede',
            accessorKey: 'nombre',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium">{row.nombre}</span>
                    {row.es_principal && <Badge variant="secondary" className="bg-blue-100 text-blue-800">Principal</Badge>}
                </div>
            ),
        },
        {
            header: 'Dirección',
            accessorKey: 'direccion',
            cell: (row) => <span className="text-muted-foreground">{row.direccion || '—'}</span>,
        },
        {
            header: 'Estado',
            accessorKey: 'activo',
            cell: (row) => (
                <Badge variant={row.activo ? 'default' : 'secondary'} className={row.activo ? 'bg-green-100 text-green-800' : ''}>
                    {row.activo ? 'Activa' : 'Inactiva'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            alignEnd: true,
            cell: (row) => (
                <div className="flex justify-end gap-2">
                    {can('tenant:edit') && (
                        <>
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={route('core.sedes.edit', row.id)}>
                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            </Button>
                            {!row.es_principal && (
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Gestión de Sedes</h2>}
        >
            <Head title="Sedes de la Empresa" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Sedes y Sucursales</h3>
                        {can('tenant:edit') && (
                            <Button asChild>
                                <Link href={route('core.sedes.create')}>
                                    <Plus className="w-4 h-4 mr-2" /> Nueva Sede
                                </Link>
                            </Button>
                        )}
                    </div>

                    {!sedes || sedes.length === 0 ? (
                        <EmptyState
                            icon={Building}
                            title="No hay sedes creadas"
                            description="Debes tener al menos una sede para asociar tus usuarios y bodegas."
                            action={
                                can('tenant:edit') && (
                                    <Button asChild>
                                        <Link href={route('core.sedes.create')}>
                                            Crear Primera Sede
                                        </Link>
                                    </Button>
                                )
                            }
                        />
                    ) : (
                        <div className="bg-white p-6 shadow-sm sm:rounded-lg border">
                            <DataTable 
                                columns={columns} 
                                data={sedes} 
                                searchPlaceholder="Buscar sede..."
                                searchColumn="nombre"
                            />
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
