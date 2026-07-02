import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import OrdenForm from './OrdenForm';
import { Button } from '@/Components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Edit({ orden, proveedores, productos }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('purchasing.ordenes.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Editar Orden: {orden.numero}
                    </h2>
                </div>
            }
        >
            <Head title={`Editar Orden ${orden.numero}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <OrdenForm 
                        orden={orden}
                        proveedores={proveedores} 
                        productos={productos} 
                        isEditing={true} 
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
