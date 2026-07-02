import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Form from './Form';

export default function Create() {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('inventory.bodegas.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Nueva Bodega</h2>
                </div>
            }
        >
            <Head title="Nueva Bodega" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <Form onCancel={() => window.history.back()} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
