import { useState } from 'react'
import { router, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Badge } from '@/Components/ui/badge'
import { EmptyState } from '@/Components/ui/empty-state'
import { Building2, Briefcase, Plus, Pencil, Trash2, Save, X, Wrench } from 'lucide-react'

const selectClass = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

const CATEGORIAS = ['Administrativo', 'Operativo', 'Comercial']

export default function Organigrama({ departamentos: initialDeptos }) {
  const [departamentos, setDepartamentos] = useState(initialDeptos)
  const [editDept, setEditDept] = useState(null) // { id, nombre, descripcion } or null for new
  const [editCargo, setEditCargo] = useState(null) // { id, departamento_id, nombre, categoria_laboral, salario_base_sugerido, es_productivo } or null for new

  const refresh = () => router.reload({ only: ['departamentos'] })

  // ─── Departamento ───
  const saveDept = (e) => {
    e.preventDefault()
    const form = e.target
    const data = { nombre: form.nombre.value, descripcion: form.descripcion.value }
    if (editDept?.id) {
      router.put(route('hr.catalogos.departamentos.update', editDept.id), data, { preserveState: true, onSuccess: () => { setEditDept(null); refresh() } })
    } else {
      router.post(route('hr.catalogos.departamentos.store'), data, { preserveState: true, onSuccess: () => { setEditDept(null); refresh() } })
    }
  }

  const deleteDept = (id) => {
    if (!confirm('¿Eliminar este departamento? Se eliminarán también los cargos asociados.')) return
    router.delete(route('hr.catalogos.departamentos.destroy', id), { preserveState: true, onSuccess: refresh })
  }

  // ─── Cargo ───
  const saveCargo = (e) => {
    e.preventDefault()
    const form = e.target
    const data = {
      departamento_id: form.dept_id.value,
      nombre: form.nombre.value,
      categoria_laboral: form.categoria.value,
      salario_base_sugerido: form.salario.value || null,
      es_productivo: form.es_productivo.checked,
    }
    if (editCargo?.id) {
      router.put(route('hr.catalogos.cargos.update', editCargo.id), data, { preserveState: true, onSuccess: () => { setEditCargo(null); refresh() } })
    } else {
      router.post(route('hr.catalogos.cargos.store'), data, { preserveState: true, onSuccess: () => { setEditCargo(null); refresh() } })
    }
  }

  const deleteCargo = (id) => {
    if (!confirm('¿Eliminar este cargo?')) return
    router.delete(route('hr.catalogos.cargos.destroy', id), { preserveState: true, onSuccess: refresh })
  }

  // ─── Render ───
  return (
    <AuthenticatedLayout>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Organigrama
          </h2>
          <p className="text-muted-foreground">Departamentos, cargos y perfiles laborales.</p>
        </div>
        <Button onClick={() => setEditDept({})} className="gap-2"><Plus className="h-4 w-4" /> Nuevo Departamento</Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Panel izquierdo: Departamentos */}
        <div className="xl:col-span-1 space-y-4">
          {departamentos.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <EmptyState icon={Building2} title="Sin departamentos" description="Crea el primer departamento para comenzar." />
              </CardContent>
            </Card>
          ) : (
            departamentos.map((dept) => (
              <Card key={dept.id} className="overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg"><Building2 className="h-5 w-5 text-primary" /></div>
                    <div>
                      <h3 className="font-semibold">{dept.nombre}</h3>
                      <p className="text-xs text-muted-foreground">{dept.cargos?.length ?? 0} cargos</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditDept(dept)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDept(dept.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="divide-y">
                  {dept.cargos?.length > 0 ? dept.cargos.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20">
                      <div className="flex items-center gap-2">
                        {c.es_productivo ? <Wrench className="h-3.5 w-3.5 text-amber-500" /> : <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span className="text-sm">{c.nombre}</span>
                        {c.es_productivo && <Badge variant="outline" className="text-[10px] h-4 px-1 border-amber-200 text-amber-700 bg-amber-50">Técnico</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditCargo({ ...c, departamento_id: dept.id })}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCargo(c.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  )) : (
                    <p className="px-4 py-3 text-xs text-muted-foreground text-center">Sin cargos</p>
                  )}
                </div>
                <div className="border-t px-4 py-2">
                  <Button variant="ghost" size="sm" className="w-full gap-1 text-xs text-muted-foreground" onClick={() => setEditCargo({ departamento_id: dept.id })}>
                    <Plus className="h-3 w-3" /> Agregar cargo
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Panel derecho: Formularios */}
        <div className="xl:col-span-2 space-y-6">
          {/* Formulario Departamento */}
          {(editDept !== null) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{editDept?.id ? 'Editar Departamento' : 'Nuevo Departamento'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setEditDept(null)}><X className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveDept} className="space-y-4">
                  <input type="hidden" name="id" value={editDept?.id || ''} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dept-nombre">Nombre del departamento *</Label>
                      <Input id="dept-nombre" name="nombre" defaultValue={editDept?.nombre || ''} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dept-descripcion">Descripción</Label>
                      <Input id="dept-descripcion" name="descripcion" defaultValue={editDept?.descripcion || ''} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditDept(null)}>Cancelar</Button>
                    <Button type="submit" size="sm" className="gap-1"><Save className="h-3.5 w-3.5" /> Guardar</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Formulario Cargo */}
          {(editCargo !== null) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{editCargo?.id ? 'Editar Cargo' : 'Nuevo Cargo'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setEditCargo(null)}><X className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveCargo} className="space-y-4">
                  <input type="hidden" name="dept_id" value={editCargo?.departamento_id || ''} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cargo-departamento">Departamento</Label>
                      <select name="dept_id" defaultValue={editCargo?.departamento_id || ''} className={selectClass} onChange={(e) => setEditCargo({ ...editCargo, departamento_id: e.target.value })}>
                        <option value="">Seleccionar…</option>
                        {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cargo-nombre">Nombre del cargo *</Label>
                      <Input id="cargo-nombre" name="nombre" defaultValue={editCargo?.nombre || ''} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cargo-categoria">Categoría Laboral</Label>
                      <select name="categoria" defaultValue={editCargo?.categoria_laboral || 'Operativo'} className={selectClass}>
                        {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cargo-salario">Salario Base Sugerido</Label>
                      <Input id="cargo-salario" name="salario" type="number" min="0" defaultValue={editCargo?.salario_base_sugerido || ''} placeholder="0" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-2">
                    <input type="checkbox" name="es_productivo" defaultChecked={editCargo?.es_productivo || false} className="h-4 w-4 rounded border-gray-300" />
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <Wrench className="h-4 w-4 text-amber-500" /> Cargo productivo (puede ser técnico en Service Desk)
                    </span>
                  </label>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditCargo(null)}>Cancelar</Button>
                    <Button type="submit" size="sm" className="gap-1"><Save className="h-3.5 w-3.5" /> Guardar</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
