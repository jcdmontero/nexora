import React from 'react';
import { useForm } from '@inertiajs/react';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/Components/ui/card';

export default function Form({ sede, onCancel }) {
    const isEdit = !!sede;
    
    const { data, setData, post, put, processing, errors } = useForm({
        nombre: sede?.nombre || '',
        direccion: sede?.direccion || '',
        es_principal: sede?.es_principal || false,
        activo: sede?.activo ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('core.sedes.update', sede.id));
        } else {
            post(route('core.sedes.store'));
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>{isEdit ? 'Editar Sede' : 'Crear Nueva Sede'}</CardTitle>
                    <CardDescription>
                        {isEdit ? 'Actualiza los datos de la sucursal.' : 'Registra una nueva sucursal o establecimiento físico para tu empresa.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre de la Sede <span className="text-destructive">*</span></Label>
                        <Input
                            id="nombre"
                            value={data.nombre}
                            onChange={e => setData('nombre', e.target.value)}
                            placeholder="Ej. Sede Norte, Sede Principal"
                        />
                        {errors.nombre && <p className="text-sm text-destructive">{errors.nombre}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="direccion">Dirección (Opcional)</Label>
                        <Input
                            id="direccion"
                            value={data.direccion}
                            onChange={e => setData('direccion', e.target.value)}
                            placeholder="Ej. Calle Falsa 123"
                        />
                        {errors.direccion && <p className="text-sm text-destructive">{errors.direccion}</p>}
                    </div>

                    <div className="flex items-center gap-6 py-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.es_principal}
                                onChange={e => setData('es_principal', e.target.checked)}
                                className="rounded border-gray-300 text-primary shadow-sm focus:ring-primary h-4 w-4"
                            />
                            <span className="text-sm font-medium">Es la Sede Principal</span>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.activo}
                                onChange={e => setData('activo', e.target.checked)}
                                className="rounded border-gray-300 text-primary shadow-sm focus:ring-primary h-4 w-4"
                            />
                            <span className="text-sm font-medium">Sede Activa</span>
                        </label>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-3 bg-muted/50 py-4 border-t">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Guardar Cambios' : 'Crear Sede'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
