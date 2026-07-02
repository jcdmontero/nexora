import React from 'react';
import { useForm } from '@inertiajs/react';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/Components/ui/card';

export default function Form({ bodega, sedes, onCancel }) {
    const isEdit = !!bodega;
    
    const { data, setData, post, put, processing, errors } = useForm({
        sede_id: bodega?.sede_id || (sedes?.length > 0 ? sedes[0].id : ''),
        nombre: bodega?.nombre || '',
        direccion: bodega?.direccion || '',
        es_principal: bodega?.es_principal || false,
        activo: bodega?.activo ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('inventory.bodegas.update', bodega.id));
        } else {
            post(route('inventory.bodegas.store'));
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>{isEdit ? 'Editar Bodega' : 'Crear Bodega'}</CardTitle>
                    <CardDescription>
                        {isEdit ? 'Modifica los datos de la sucursal o bodega.' : 'Registra una nueva ubicación física para almacenar inventario.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="sede_id">Sede / Sucursal a la que pertenece <span className="text-destructive">*</span></Label>
                        <select
                            id="sede_id"
                            value={data.sede_id}
                            onChange={e => setData('sede_id', e.target.value)}
                            className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${errors.sede_id ? 'border-destructive' : ''}`}
                        >
                            <option value="" disabled>Seleccione una sede...</option>
                            {sedes?.map(sede => (
                                <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                            ))}
                        </select>
                        {errors.sede_id && <p className="text-sm text-destructive">{errors.sede_id}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre de la Bodega <span className="text-destructive">*</span></Label>
                        <Input
                            id="nombre"
                            value={data.nombre}
                            onChange={e => setData('nombre', e.target.value)}
                            placeholder="Ej. Bodega Principal Norte"
                        />
                        {errors.nombre && <p className="text-sm text-destructive">{errors.nombre}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="direccion">Dirección (Opcional)</Label>
                        <Input
                            id="direccion"
                            value={data.direccion}
                            onChange={e => setData('direccion', e.target.value)}
                            placeholder="Ej. Av. Siempre Viva 123"
                        />
                        {errors.direccion && <p className="text-sm text-destructive">{errors.direccion}</p>}
                    </div>

                    <div className="flex items-center gap-4 py-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.es_principal}
                                onChange={e => setData('es_principal', e.target.checked)}
                                className="rounded border-gray-300 text-primary shadow-sm focus:ring-primary"
                            />
                            <span className="text-sm font-medium">Es la Sede Principal</span>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.activo}
                                onChange={e => setData('activo', e.target.checked)}
                                className="rounded border-gray-300 text-primary shadow-sm focus:ring-primary"
                            />
                            <span className="text-sm font-medium">Sede Activa</span>
                        </label>
                    </div>
                    {data.es_principal && (
                        <p className="text-xs text-muted-foreground">Nota: Marcarla como principal le quitará el atributo a la sede principal anterior.</p>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end gap-3 bg-muted/50 py-4 border-t">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Guardar Cambios' : 'Crear Bodega'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
