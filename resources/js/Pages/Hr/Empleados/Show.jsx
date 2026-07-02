import { useState } from 'react'
import { Link, useForm, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { ArrowLeft, UserCircle2, Mail, Phone, MapPin, FileSignature, CalendarDays, DollarSign, Building2, Briefcase, Edit, Wrench } from 'lucide-react'

const selectClass = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

const TIPOS_CONTRATO = {
  'indefinido': 'Indefinido',
  'termino_fijo': 'Término Fijo',
  'obra_labor': 'Obra o Labor',
  'prestacion_servicios': 'Prestación Servicios',
}

export default function EmpleadosShow({ empleado, sedes }) {
  const [activeTab, setActiveTab] = useState('contratos')
  const [showNewContract, setShowNewContract] = useState(false)

  const { data: cData, setData: setCData, post: postContrato, processing: cLoading, errors: cErrors, reset: resetC } = useForm({
    cargo_id: '',
    tipo_contrato: 'indefinido',
    salario_base: '',
    fecha_inicio: '',
    fecha_fin: '',
  })

  const contratos = empleado.contratos || []
  const contratoActivo = contratos.find(c => c.estado)

  const handleNewContract = (e) => {
    e.preventDefault()
    postContrato(route('hr.contratos.store', empleado.id), {
      preserveScroll: true,
      onSuccess: () => { setShowNewContract(false); resetC() }
    })
  }

  return (
    <AuthenticatedLayout>
      <div className="flex items-center gap-4 mb-6">
        <Link href={route('hr.empleados.index')}>
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
            <h2 className="text-2xl font-bold flex items-center gap-3">
                {empleado.nombres} {empleado.apellidos}
                <Badge variant={empleado.estado ? 'secondary' : 'outline'} className={empleado.estado ? 'bg-emerald-100 text-emerald-700' : ''}>
                    {empleado.estado ? 'Activo' : 'Inactivo'}
                </Badge>
            </h2>
            <p className="text-muted-foreground flex gap-2 items-center text-sm">
                <Briefcase className="h-4 w-4" /> Documento: {empleado.documento}
            </p>
        </div>
        <div className="flex gap-2">
          {empleado.user && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
              <UserCircle2 className="h-3 w-3" /> {empleado.user.email}
            </Badge>
          )}
          <Link href={route('hr.empleados.edit', empleado.id)}>
            <Button variant="outline" size="sm" className="gap-1"><Edit className="h-3.5 w-3.5" /> Editar</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo: Info Personal */}
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center text-center space-y-3 mb-6">
                        <div className="bg-slate-100 p-6 rounded-full text-slate-300">
                            <UserCircle2 className="h-16 w-16" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{empleado.nombres} {empleado.apellidos}</h3>
                            {contratoActivo?.cargo_rel && (
                              <p className="text-sm text-slate-500 flex items-center justify-center gap-1">
                                {contratoActivo.cargo_rel.es_productivo ? <Wrench className="h-3.5 w-3.5 text-amber-500" /> : <Briefcase className="h-3.5 w-3.5" />}
                                {contratoActivo.cargo}
                              </p>
                            )}
                            {contratoActivo?.cargo_rel?.departamento && (
                              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                                <Building2 className="h-3 w-3" /> {contratoActivo.cargo_rel.departamento.nombre}
                              </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 text-sm border-t pt-4 mt-4">
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span>{empleado.email || 'No registrado'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-slate-400" />
                            <span>{empleado.telefono || 'No registrado'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span>Sede: {empleado.sede?.nombre || '—'}</span>
                        </div>
                        {empleado.user && (
                          <div className="flex items-center gap-3 pt-2 border-t">
                            <UserCircle2 className="h-4 w-4 text-slate-400" />
                            <span className="text-xs text-muted-foreground">Usuario: {empleado.user.email}</span>
                          </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Panel Derecho: Tabs */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex space-x-1 bg-slate-100/50 p-1 rounded-xl">
                <button 
                    onClick={() => setActiveTab('contratos')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'contratos' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <FileSignature className="h-4 w-4" /> Contratos
                </button>
                <button 
                    onClick={() => setActiveTab('asistencias')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'asistencias' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <CalendarDays className="h-4 w-4" /> Asistencias
                </button>
            </div>

            {activeTab === 'contratos' && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
                        <CardTitle className="text-md">Historial de Contratos</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => setShowNewContract(!showNewContract)}>
                          {showNewContract ? 'Cancelar' : 'Nuevo Contrato'}
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      {showNewContract && (
                        <form onSubmit={handleNewContract} className="p-4 border-b bg-muted/20 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="nc-cargo" className="text-xs">Cargo</Label>
                              <select id="nc-cargo" value={cData.cargo_id} onChange={(e) => setCData('cargo_id', e.target.value)} className={selectClass} required>
                                <option value="">Seleccionar…</option>
                                {sedes && <option disabled>—</option> /* placeholder */ }
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="nc-tipo" className="text-xs">Tipo</Label>
                              <select id="nc-tipo" value={cData.tipo_contrato} onChange={(e) => setCData('tipo_contrato', e.target.value)} className={selectClass}>
                                {Object.entries(TIPOS_CONTRATO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="nc-salario" className="text-xs">Salario Base</Label>
                              <Input id="nc-salario" type="number" min="0" value={cData.salario_base} onChange={(e) => setCData('salario_base', e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="nc-inicio" className="text-xs">Inicio</Label>
                              <Input id="nc-inicio" type="date" value={cData.fecha_inicio} onChange={(e) => setCData('fecha_inicio', e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="nc-fin" className="text-xs">Fin</Label>
                              <Input id="nc-fin" type="date" value={cData.fecha_fin} onChange={(e) => setCData('fecha_fin', e.target.value)} />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button type="submit" size="sm" disabled={cLoading} className="gap-1">
                              <FileSignature className="h-3.5 w-3.5" /> {cLoading ? 'Guardando…' : 'Crear Contrato'}
                            </Button>
                          </div>
                        </form>
                      )}

                        {contratos.length === 0 ? (
                            <div className="py-8 text-center text-slate-500 text-sm">No hay contratos registrados.</div>
                        ) : (
                            <div className="divide-y">
                                {contratos.map(c => (
                                    <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold">{c.cargo}</h4>
                                                {c.estado && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 h-5 px-1.5 text-[10px]">ACTIVO</Badge>}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                              <span className="capitalize">{TIPOS_CONTRATO[c.tipo_contrato] || c.tipo_contrato}</span>
                                              {c.cargo_rel?.departamento && <><span>·</span><span>{c.cargo_rel.departamento.nombre}</span></>}
                                              {c.cargo_rel?.es_productivo && <Badge variant="outline" className="text-[10px] h-4 px-1 border-amber-200 text-amber-700 bg-amber-50">Productivo</Badge>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:flex gap-4 sm:gap-8 text-sm">
                                            <div>
                                                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><DollarSign className="h-3 w-3" /> Salario</p>
                                                <p className="font-medium">${Number(c.salario_base).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Vigencia</p>
                                                <p>{c.fecha_inicio} al {c.fecha_fin || 'Presente'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {activeTab === 'asistencias' && (
                <Card>
                    <CardHeader className="border-b bg-slate-50/50">
                        <CardTitle className="text-md">Registro de Asistencias (Últimos 30 días)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 text-center text-slate-500">
                        <CalendarDays className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                        <p>No se encontraron registros de asistencia recientes.</p>
                        <p className="text-xs text-slate-400 mt-1">El control de entrada/salida está inactivo para este empleado.</p>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
