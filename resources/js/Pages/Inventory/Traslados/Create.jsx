import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import { Loader2, ArrowLeft, ArrowRightLeft, Plus, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';

export default function Create({ bodegas, productos, numero_sugerido }) {
    const { data, setData, post, processing, errors } = useForm({
        numero: numero_sugerido,
        fecha: new Date().toISOString().split('T')[0],
        bodega_origen_id: '',
        bodega_destino_id: '',
        notas: '',
        detalles: []
    });

    const [productoSeleccionado, setProductoSeleccionado] = useState('');
    const [cantidadSeleccionada, setCantidadSeleccionada] = useState('');

    const addProduct = () => {
        if (!productoSeleccionado || !cantidadSeleccionada) return;
        
        const prod = productos.find(p => p.id === parseInt(productoSeleccionado));
        if (!prod) return;

        // Check if already in list
        if (data.detalles.some(d => d.producto_id === prod.id)) {
            alert('El producto ya está en la lista de traslado.');
            return;
        }

        setData('detalles', [
            ...data.detalles,
            {
                producto_id: prod.id,
                nombre: prod.nombre,
                codigo: prod.codigo,
                unidad: prod.unidad_medida,
                cantidad: parseFloat(cantidadSeleccionada)
            }
        ]);

        setProductoSeleccionado('');
        setCantidadSeleccionada('');
    };

    const removeProduct = (index) => {
        const newDetalles = [...data.detalles];
        newDetalles.splice(index, 1);
        setData('detalles', newDetalles);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (data.bodega_origen_id === data.bodega_destino_id) {
            alert('La bodega de origen y destino no pueden ser la misma.');
            return;
        }
        post(route('inventory.traslados.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('inventory.traslados.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Nuevo Traslado
                    </h2>
                </div>
            }
        >
            <Head title="Nuevo Traslado" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ArrowRightLeft className="w-5 h-5 text-primary" />
                                    Datos del Movimiento
                                </CardTitle>
                                <CardDescription>
                                    Registra el traslado de mercancía entre dos sucursales.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="numero">No. Documento <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="numero"
                                        value={data.numero}
                                        onChange={e => setData('numero', e.target.value)}
                                        className={errors.numero ? 'border-destructive' : ''}
                                    />
                                    {errors.numero && <p className="text-sm text-destructive">{errors.numero}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fecha">Fecha <span className="text-destructive">*</span></Label>
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
                                    <Label htmlFor="bodega_origen_id">Bodega Origen <span className="text-destructive">*</span></Label>
                                    <select
                                        id="bodega_origen_id"
                                        value={data.bodega_origen_id}
                                        onChange={e => setData('bodega_origen_id', e.target.value)}
                                        className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${errors.bodega_origen_id ? 'border-destructive' : ''}`}
                                    >
                                        <option value="" disabled>Seleccione origen...</option>
                                        {bodegas.map(b => (
                                            <option key={b.id} value={b.id}>{b.nombre}</option>
                                        ))}
                                    </select>
                                    {errors.bodega_origen_id && <p className="text-sm text-destructive">{errors.bodega_origen_id}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bodega_destino_id">Bodega Destino <span className="text-destructive">*</span></Label>
                                    <select
                                        id="bodega_destino_id"
                                        value={data.bodega_destino_id}
                                        onChange={e => setData('bodega_destino_id', e.target.value)}
                                        className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${errors.bodega_destino_id ? 'border-destructive' : ''}`}
                                    >
                                        <option value="" disabled>Seleccione destino...</option>
                                        {bodegas.map(b => (
                                            <option key={b.id} value={b.id}>{b.nombre}</option>
                                        ))}
                                    </select>
                                    {errors.bodega_destino_id && <p className="text-sm text-destructive">{errors.bodega_destino_id}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Productos a Trasladar</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {typeof errors.detalles === 'string' && (
                                    <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                                        {errors.detalles}
                                    </div>
                                )}

                                <div className="flex items-end gap-4 mb-6 p-4 bg-muted/30 rounded-lg border">
                                    <div className="flex-1 space-y-2">
                                        <Label>Producto</Label>
                                        <select
                                            value={productoSeleccionado}
                                            onChange={e => setProductoSeleccionado(e.target.value)}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        >
                                            <option value="">Buscar producto...</option>
                                            {productos.map(p => (
                                                <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-32 space-y-2">
                                        <Label>Cantidad</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={cantidadSeleccionada}
                                            onChange={e => setCantidadSeleccionada(e.target.value)}
                                        />
                                    </div>
                                    <Button type="button" variant="secondary" onClick={addProduct}>
                                        <Plus className="w-4 h-4 mr-2" /> Agregar
                                    </Button>
                                </div>

                                {data.detalles.length > 0 ? (
                                    <div className="border rounded-lg overflow-x-auto">
                                        <Table aria-label="Productos a trasladar">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Producto</TableHead>
                                                    <TableHead className="text-right">Cantidad</TableHead>
                                                    <TableHead className="w-16"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.detalles.map((row, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <div className="font-medium">{row.nombre}</div>
                                                            <div className="text-xs text-muted-foreground">Ref: {row.codigo}</div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {row.cantidad} <span className="text-xs text-muted-foreground">{row.unidad}</span>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(index)}>
                                                                <Trash2 className="w-4 h-4 text-destructive" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <p className="text-center text-sm text-muted-foreground py-8" role="status">
                                        No has agregado productos para trasladar.
                                    </p>
                                )}
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
                                    placeholder="Motivo del traslado..."
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
                                <Button type="submit" disabled={processing || data.detalles.length === 0} className="bg-primary">
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        'Confirmar Traslado'
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
