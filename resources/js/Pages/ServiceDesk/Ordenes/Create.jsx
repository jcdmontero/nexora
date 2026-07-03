import { useForm, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { useToast } from '@/Components/toasts/ToastProvider'
import { enqueue } from '@/lib/sync-queue'
import { ArrowLeft, Wrench, Save } from 'lucide-react'

const selectClass =
    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export default function OrdenCreate({ clientes = [], tipos = [], marcas = [], modelos = [], tecnicos = [], numeroSugerido }) {
    const { data, setData, post, processing, errors } = useForm({
        cliente_id: '',
        tipo_equipo_id: '',
        marca_id: '',
        modelo_id: '',
        numero_serie: '',
        prestador_id: '',
        accesorios_equipo: '',
        observaciones_equipo: '',
    })
    const { toast } = useToast()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!navigator.onLine) {
            await enqueue({
                type: 'service-desk.order',
                endpoint: route('service-desk.ordenes.store'),
                method: 'POST',
                data,
            })
            toast('Orden guardada offline. Se sincronizará cuando vuelva internet.', 'info')
            router.visit(route('service-desk.ordenes.index'))
            return
        }
        post(route('service-desk.ordenes.store'))
    }

    const marcasFiltradas = data.tipo_equipo_id
        ? marcas.filter(m => !m.tipo_equipo_id || m.tipo_equipo_id === parseInt(data.tipo_equipo_id))
        : marcas

    const modelosFiltrados = modelos.filter(m => {
        if (data.marca_id && m.marca_id !== parseInt(data.marca_id)) return false
        if (data.tipo_equipo_id && m.tipo_equipo_id !== parseInt(data.tipo_equipo_id)) return false
        return true
    })

    return (
        <AuthenticatedLayout>
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" type="button" onClick={() => router.get(route('service-desk.ordenes.index'))}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Wrench className="h-6 w-6 text-primary" /> Nueva Orden de Reparación
                    </h2>
                    {numeroSugerido && <p className="text-sm text-muted-foreground">Número sugerido: {numeroSugerido}</p>}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
                {/* Cliente y Técnico */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Cliente y Técnico</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cliente_id">Cliente <span className="text-destructive">*</span></Label>
                            <select
                                id="cliente_id"
                                name="cliente_id"
                                value={data.cliente_id}
                                onChange={e => setData('cliente_id', e.target.value)}
                                className={selectClass}
                                required
                            >
                                <option value="">Seleccionar cliente…</option>
                                {clientes.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre || `Cliente #${c.id}`}</option>
                                ))}
                            </select>
                            {errors.cliente_id && <p className="text-xs text-destructive">{errors.cliente_id}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prestador_id">Técnico asignado</Label>
                            <select
                                id="prestador_id"
                                name="prestador_id"
                                value={data.prestador_id}
                                onChange={e => setData('prestador_id', e.target.value)}
                                className={selectClass}
                            >
                                <option value="">Sin asignar</option>
                                {tecnicos.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Equipo */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Equipo a reparar</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tipo_equipo_id">Tipo de equipo</Label>
                            <select
                                id="tipo_equipo_id"
                                name="tipo_equipo_id"
                                value={data.tipo_equipo_id}
                                onChange={e => setData('tipo_equipo_id', e.target.value)}
                                className={selectClass}
                            >
                                <option value="">Seleccionar tipo…</option>
                                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="marca_id">Marca</Label>
                            <select
                                id="marca_id"
                                name="marca_id"
                                value={data.marca_id}
                                onChange={e => setData('marca_id', e.target.value)}
                                className={selectClass}
                            >
                                <option value="">Seleccionar marca…</option>
                                {marcasFiltradas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="modelo_id">Modelo</Label>
                            <select
                                id="modelo_id"
                                name="modelo_id"
                                value={data.modelo_id}
                                onChange={e => setData('modelo_id', e.target.value)}
                                className={selectClass}
                            >
                                <option value="">Seleccionar modelo…</option>
                                {modelosFiltrados.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="numero_serie">Número de serie</Label>
                            <Input
                                id="numero_serie"
                                name="numero_serie"
                                value={data.numero_serie}
                                onChange={e => setData('numero_serie', e.target.value)}
                                placeholder="Ej. SN-ABC123"
                            />
                            {errors.numero_serie && <p className="text-xs text-destructive">{errors.numero_serie}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="accesorios_equipo">Accesorios recibidos</Label>
                            <Input
                                id="accesorios_equipo"
                                name="accesorios_equipo"
                                value={data.accesorios_equipo}
                                onChange={e => setData('accesorios_equipo', e.target.value)}
                                placeholder="Ej. Cable USB, cargador, funda…"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Problema */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Descripción del problema</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="observaciones_equipo">Problema reportado</Label>
                            <textarea
                                id="observaciones_equipo"
                                name="descripcion_problema"
                                value={data.observaciones_equipo}
                                onChange={e => setData('observaciones_equipo', e.target.value)}
                                rows={4}
                                placeholder="Describe el problema que presenta el equipo…"
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button type="submit" disabled={processing} className="gap-2">
                        <Save className="h-4 w-4" />
                        {processing ? 'Guardando…' : 'Crear Orden'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.get(route('service-desk.ordenes.index'))}>
                        Cancelar
                    </Button>
                </div>
            </form>
        </AuthenticatedLayout>
    )
}
