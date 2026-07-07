import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Label } from '@/Components/ui/label';
import { AlertTriangle, Info, Calendar } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import PageHeader from '@/Components/ui/page-header';
import EmptyState from '@/Components/ui/empty-state';
import { useToast } from '@/Components/toasts/ToastProvider';

interface CierreAnualProps {
    aniosDisponibles: number[];
}

export default function Index({ aniosDisponibles }: CierreAnualProps) {
    const { data, setData, post, processing, errors } = useForm({
        anio: '',
    });

    const { toast } = useToast();

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.anio) {
            toast({
                title: 'Error',
                description: 'Por favor, selecciona un año para realizar el cierre.',
                variant: 'destructive',
            });
            return;
        }

        post(route('accounting.cierre-anual.cerrar'), {
            preserveScroll: true,
            onSuccess: () => {
                // El backend retorna flash.success que se muestra en un toast automáticamente.
                setData('anio', '');
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Cierre Anual Contable" />
            
            <PageHeader 
                title="Cierre Anual Contable" 
                description="Realiza el cierre de las cuentas de resultados (ingresos, gastos, costos) y determina la utilidad o pérdida del ejercicio."
            />

            <div className="mt-6">
                {aniosDisponibles.length === 0 ? (
                    <EmptyState
                        icon={Calendar}
                        title="No hay años disponibles para cierre"
                        description="Para realizar un cierre anual, deben existir periodos contables cerrados (los 12 meses del año) y no debe existir un asiento previo de cierre anual para ese año."
                    />
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Ejecutar Cierre</CardTitle>
                                <CardDescription>Selecciona el año que deseas cerrar de manera definitiva.</CardDescription>
                            </CardHeader>
                            <form onSubmit={onSubmit}>
                                <CardContent className="space-y-4">
                                    <Alert variant="warning" className="border-amber-500/50 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20 dark:text-amber-400">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Acción Irreversible</AlertTitle>
                                        <AlertDescription>
                                            El cierre anual cancelará los saldos de las cuentas de clase 4, 5 y 6,
                                            transfiriendo la diferencia a la cuenta de Patrimonio (Utilidades Retenidas 3610).
                                        </AlertDescription>
                                    </Alert>

                                    <div className="space-y-2">
                                        <Label htmlFor="anio">Año Contable</Label>
                                        <Select
                                            value={data.anio}
                                            onValueChange={(val) => setData('anio', val)}
                                        >
                                            <SelectTrigger id="anio" className={errors.anio ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Seleccionar año..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {aniosDisponibles.map((anio) => (
                                                    <SelectItem key={anio} value={anio.toString()}>
                                                        {anio}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.anio && (
                                            <p className="text-sm font-medium text-red-500">{errors.anio}</p>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end border-t p-6">
                                    <Button 
                                        type="submit" 
                                        disabled={processing || !data.anio}
                                        className="w-full sm:w-auto"
                                    >
                                        {processing ? 'Procesando en segundo plano...' : 'Procesar Cierre Anual'}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Requisitos del Cierre</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
                                        <li>Los 12 periodos mensuales del año deben estar en estado <strong>Cerrado</strong>.</li>
                                        <li>No debe existir un asiento de cierre anual previo (sin reversar) para el mismo año.</li>
                                        <li>La cuenta <strong>3610 (Utilidades Retenidas)</strong> debe existir en el plan de cuentas.</li>
                                        <li>No deben haber asientos descuadrados en todo el sistema.</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>Proceso asíncrono</AlertTitle>
                                <AlertDescription>
                                    Debido al volumen de datos, el cálculo de saldos y la generación del asiento de cierre
                                    se realizan en segundo plano. Recibirás una notificación por correo y en el sistema
                                    cuando el proceso haya finalizado.
                                </AlertDescription>
                            </Alert>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
