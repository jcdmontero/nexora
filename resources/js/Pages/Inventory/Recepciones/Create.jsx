import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import { Loader2, ArrowLeft, PackageCheck, Wallet } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';

export default function Create({ orden, bodegas, numero_sugerido, sesion_caja }) {
    const { data, setData, post, processing, errors } = useForm({
        orden_compra_id: orden.id,
        bodega_id: bodegas.length > 0 ? bodegas[0].id : '',
        numero: numero_sugerido,
        fecha: new Date().toISOString().split('T')[0],
        metodo_pago: 'efectivo',
        fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notas: '',
        detalles: orden.detalles.map(d => ({
            producto_id: d.producto_id,
            producto_nombre: d.producto.nombre,
            producto_codigo: d.producto.codigo,
            cantidad_esperada: parseFloat(d.cantidad),
            cantidad: parseFloat(d.cantidad) // Por defecto reciben todo
        }))
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('inventory.recepciones.store'));
    };

    const updateCantidad = (index, value) => {
        const newDetalles = [...data.detalles];
        newDetalles[index].cantidad = value;
        setData('detalles', newDetalles);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('purchasing.ordenes.show', orden.id)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Recibir Mercancía (Orden: {orden.numero})
                    </h2>
                </div>
            }
        >
            <Head title={`Recibir Orden ${orden.numero}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PackageCheck className="w-5 h-5 text-primary" />
                                    Datos de Recepción
                                </CardTitle>
                                <CardDescription>
                                    Confirme los datos del documento de entrega del proveedor.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="numero">No. Albarán / Recepción <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="numero"
                                        value={data.numero}
                                        onChange={e => setData('numero', e.target.value)}
                                        className={errors.numero ? 'border-destructive' : ''}
                                    />
                                    {errors.numero && <p className="text-sm text-destructive">{errors.numero}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fecha">Fecha de Recepción <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="fecha"
                                        type="date"
                                        value={data.fecha}
                                        onChange={e => setData('fecha', e.target.value)}
                                        className={errors.fecha ? 'border-destructive' : ''}
                                    />
                                    {errors.fecha && <p className="text-sm text-destructive">{errors.fecha}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bodega_id">Bodega Destino <span className="text-destructive">*</span></Label>
                                    <select
                                        id="bodega_id"
                                        value={data.bodega_id}
                                        onChange={e => setData('bodega_id', e.target.value)}
                                        className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${errors.bodega_id ? 'border-destructive' : ''}`}
                                    >
                                        <option value="" disabled>Seleccione una bodega...</option>
                                        {bodegas.map(bodega => (
                                            <option key={bodega.id} value={bodega.id}>{bodega.nombre}</option>
                                        ))}
                                    </select>
                                    {errors.bodega_id && <p className="text-sm text-destructive">{errors.bodega_id}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-primary" />
                                    Pago y Contabilidad
                                </CardTitle>
                                <CardDescription>
                                    Seleccione el método de pago y la afectación contable para esta recepción de mercancía.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="metodo_pago">Método de Pago <span className="text-destructive">*</span></Label>
                                    <select
                                        id="metodo_pago"
                                        value={data.metodo_pago}
                                        onChange={e => setData('metodo_pago', e.target.value)}
                                        className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${errors.metodo_pago ? 'border-destructive' : ''}`}
                                    >
                                        <option value="efectivo">Efectivo (Desde Caja Registradora)</option>
                                        <option value="transferencia">Transferencia Bancaria</option>
                                        <option value="credito">Crédito (Cuenta por Pagar)</option>
                                    </select>
                                    {errors.metodo_pago && <p className="text-sm text-destructive">{errors.metodo_pago}</p>}
                                </div>

                                {data.metodo_pago === 'efectivo' && (
                                    <div className="space-y-2 flex flex-col justify-end">
                                        {sesion_caja ? (
                                            <div className="p-3 bg-green-50 text-green-800 rounded-md border border-green-200 text-sm">
                                                ✅ Caja abierta: <strong>{sesion_caja.caja_nombre}</strong>. Se registrará un egreso automático en tu turno.
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-red-50 text-red-800 rounded-md border border-red-200 text-sm font-semibold">
                                                ❌ No tienes una sesión de caja abierta. Debes abrir un turno para pagar en efectivo.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {data.metodo_pago === 'credito' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="fecha_vencimiento"
                                            type="date"
                                            value={data.fecha_vencimiento}
                                            onChange={e => setData('fecha_vencimiento', e.target.value)}
                                            className={errors.fecha_vencimiento ? 'border-destructive' : ''}
                                        />
                                        {errors.fecha_vencimiento && <p className="text-sm text-destructive">{errors.fecha_vencimiento}</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Productos a Recibir</CardTitle>
                                <CardDescription>
                                    Ajuste las cantidades si el proveedor entregó de más o de menos. 
                                    Al procesar, el stock se sumará automáticamente.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {typeof errors.detalles === 'string' && (
                                    <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                                        {errors.detalles}
                                    </div>
                                )}

                                <div className="border rounded-lg overflow-x-auto">
                                    <Table aria-label="Productos a recibir">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-right">Esperada</TableHead>
                                                <TableHead className="text-right w-48">Recibida</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.detalles.map((row, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <div className="font-medium">{row.producto_nombre}</div>
                                                        <div className="text-xs text-muted-foreground">Ref: {row.producto_codigo}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right text-muted-foreground">
                                                        {row.cantidad_esperada}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={row.cantidad}
                                                            onChange={e => updateCantidad(index, e.target.value)}
                                                            className={`text-right ${errors[`detalles.${index}.cantidad`] ? 'border-destructive' : ''}`}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Notas (Opcional)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={data.notas}
                                    onChange={e => setData('notas', e.target.value)}
                                    placeholder="Observaciones sobre la entrega..."
                                    rows={3}
                                />
                            </CardContent>
                            <CardFooter className="flex justify-end gap-3 bg-muted/50 py-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={processing || (data.metodo_pago === 'efectivo' && !sesion_caja)} 
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        'Confirmar Recepción y Subir Stock'
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
