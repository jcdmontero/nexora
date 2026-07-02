import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Loader2, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';

export default function OrdenForm({ orden = null, proveedores = [], productos = [], numeroSugerido = '', isEditing = false }) {
    const { data, setData, post, put, processing, errors } = useForm({
        proveedor_id: orden?.proveedor_id?.toString() || '',
        numero: orden?.numero || numeroSugerido,
        fecha_emision: orden?.fecha_emision || new Date().toISOString().split('T')[0],
        fecha_esperada: orden?.fecha_esperada || '',
        notas: orden?.notas || '',
        detalles: orden?.detalles || [],
    });

    // Update totals when details change
    const subtotal = data.detalles.reduce((sum, item) => sum + (parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario || 0)), 0);
    const total = subtotal; // Simple logic for now, no taxes implemented in UI

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('purchasing.ordenes.update', orden.id));
        } else {
            post(route('purchasing.ordenes.store'));
        }
    };

    const addRow = () => {
        setData('detalles', [...data.detalles, { producto_id: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }]);
    };

    const removeRow = (index) => {
        const newDetalles = [...data.detalles];
        newDetalles.splice(index, 1);
        setData('detalles', newDetalles);
    };

    const updateRow = (index, field, value) => {
        const newDetalles = [...data.detalles];
        newDetalles[index][field] = value;

        // Auto-fill price when product is selected
        if (field === 'producto_id') {
            const product = productos.find(p => p.id.toString() === value);
            if (product) {
                newDetalles[index]['precio_unitario'] = product.costo_promedio || 0;
            }
        }

        // Calculate subtotal
        const qty = parseFloat(newDetalles[index]['cantidad']) || 0;
        const price = parseFloat(newDetalles[index]['precio_unitario']) || 0;
        newDetalles[index]['subtotal'] = (qty * price).toFixed(2);

        setData('detalles', newDetalles);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        Información Principal
                    </CardTitle>
                    <CardDescription>
                        Datos básicos de la orden de compra.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="proveedor_id">Proveedor <span className="text-destructive">*</span></Label>
                        <Select
                            value={data.proveedor_id}
                            onValueChange={(v) => setData('proveedor_id', v)}
                        >
                            <SelectTrigger id="proveedor_id" className={errors.proveedor_id ? 'border-destructive' : ''}>
                                <SelectValue placeholder="Seleccione un proveedor..." />
                            </SelectTrigger>
                            <SelectContent>
                                {proveedores.map(p => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.razon_social}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.proveedor_id && <p className="text-sm text-destructive">{errors.proveedor_id}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="numero">Número de Orden <span className="text-destructive">*</span></Label>
                        <Input
                            id="numero"
                            value={data.numero}
                            onChange={e => setData('numero', e.target.value)}
                            className={errors.numero ? 'border-destructive' : ''}
                        />
                        {errors.numero && <p className="text-sm text-destructive">{errors.numero}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fecha_emision">Fecha de Emisión <span className="text-destructive">*</span></Label>
                        <Input
                            id="fecha_emision"
                            type="date"
                            value={data.fecha_emision}
                            onChange={e => setData('fecha_emision', e.target.value)}
                            className={errors.fecha_emision ? 'border-destructive' : ''}
                        />
                        {errors.fecha_emision && <p className="text-sm text-destructive">{errors.fecha_emision}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fecha_esperada">Fecha Esperada</Label>
                        <Input
                            id="fecha_esperada"
                            type="date"
                            value={data.fecha_esperada}
                            onChange={e => setData('fecha_esperada', e.target.value)}
                            className={errors.fecha_esperada ? 'border-destructive' : ''}
                        />
                        {errors.fecha_esperada && <p className="text-sm text-destructive">{errors.fecha_esperada}</p>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Productos</CardTitle>
                    <CardDescription>Añada los productos que desea solicitar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {typeof errors.detalles === 'string' && (
                        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                            {errors.detalles}
                        </div>
                    )}

                    <div className="border rounded-lg overflow-x-auto">
                        <Table aria-label="Productos de la orden de compra">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Producto</TableHead>
                                    <TableHead className="w-[15%]">Cantidad</TableHead>
                                    <TableHead className="w-[20%]">Precio Unit.</TableHead>
                                    <TableHead className="w-[15%]">Subtotal</TableHead>
                                    <TableHead className="w-[10%] text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.detalles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            No hay productos en esta orden. Haga clic en "Añadir Producto" para comenzar.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.detalles.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Select
                                                    value={row.producto_id?.toString()}
                                                    onValueChange={(v) => updateRow(index, 'producto_id', v)}
                                                >
                                                    <SelectTrigger className={errors[`detalles.${index}.producto_id`] ? 'border-destructive' : ''}>
                                                        <SelectValue placeholder="Seleccione..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {productos.map(p => (
                                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                                {p.nombre} ({p.codigo})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={row.cantidad}
                                                    onChange={e => updateRow(index, 'cantidad', e.target.value)}
                                                    className={errors[`detalles.${index}.cantidad`] ? 'border-destructive' : ''}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={row.precio_unitario}
                                                    onChange={e => updateRow(index, 'precio_unitario', e.target.value)}
                                                    className={errors[`detalles.${index}.precio_unitario`] ? 'border-destructive' : ''}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium flex items-center h-full px-3 bg-muted/50 rounded-md border">
                                                    ${row.subtotal}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => removeRow(index)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-between items-start mt-4">
                        <Button type="button" variant="outline" onClick={addRow} size="sm">
                            <Plus className="w-4 h-4 mr-2" /> Añadir Producto
                        </Button>

                        <div className="bg-muted p-4 rounded-lg w-64 space-y-2 border">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2">
                                <span>Total:</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Notas Adicionales</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={data.notas}
                        onChange={e => setData('notas', e.target.value)}
                        placeholder="Instrucciones para el proveedor, condiciones de entrega..."
                        rows={3}
                        className={errors.notas ? 'border-destructive' : ''}
                    />
                    {errors.notas && <p className="text-sm text-destructive mt-1">{errors.notas}</p>}
                </CardContent>
                <CardFooter className="flex justify-end gap-3 bg-muted/50 py-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.history.back()}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            isEditing ? 'Actualizar Orden' : 'Crear Orden'
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
