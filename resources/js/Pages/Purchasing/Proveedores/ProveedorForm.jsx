import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { Switch } from '@/Components/ui/switch'

export default function ProveedorForm({ data, setData, errors, isEdit = false }) {
  return (
    <>
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg">Información principal</CardTitle>
          <CardDescription>Datos básicos del proveedor para su identificación.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="razon_social">Razón Social / Nombre <span className="text-red-500">*</span></Label>
              <Input
                id="razon_social"
                name="razon_social"
                value={data.razon_social}
                onChange={e => setData('razon_social', e.target.value)}
                error={errors.razon_social}
                placeholder="Ej. Suministros Globales SAS"
              />
              {errors.razon_social && <p className="text-sm text-red-500 mt-1">{errors.razon_social}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo Doc.</Label>
                <Select value={data.tipo_documento} onValueChange={(v) => setData('tipo_documento', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="CC">CC</SelectItem>
                    <SelectItem value="RUT">RUT</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tipo_documento && <p className="text-sm text-red-500 mt-1">{errors.tipo_documento}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero_documento">Número</Label>
                <Input
                  id="numero_documento"
                  name="numero_documento"
                  value={data.numero_documento}
                  onChange={e => setData('numero_documento', e.target.value)}
                  error={errors.numero_documento}
                />
                {errors.numero_documento && <p className="text-sm text-red-500 mt-1">{errors.numero_documento}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nombre_contacto">Persona de Contacto</Label>
              <Input
                id="nombre_contacto"
                name="nombre_contacto"
                value={data.nombre_contacto}
                onChange={e => setData('nombre_contacto', e.target.value)}
                error={errors.nombre_contacto}
                placeholder="Nombre de quien atiende"
              />
              {errors.nombre_contacto && <p className="text-sm text-red-500 mt-1">{errors.nombre_contacto}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={data.email}
                onChange={e => setData('email', e.target.value)}
                error={errors.email}
                placeholder="correo@empresa.com"
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>
          
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden mt-6">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg">Información de ubicación y estado</CardTitle>
          <CardDescription>Detalles adicionales para contacto y envío.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                value={data.telefono}
                onChange={e => setData('telefono', e.target.value)}
                error={errors.telefono}
              />
              {errors.telefono && <p className="text-sm text-red-500 mt-1">{errors.telefono}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                name="ciudad"
                value={data.ciudad}
                onChange={e => setData('ciudad', e.target.value)}
                error={errors.ciudad}
              />
              {errors.ciudad && <p className="text-sm text-red-500 mt-1">{errors.ciudad}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              name="direccion"
              value={data.direccion}
              onChange={e => setData('direccion', e.target.value)}
              error={errors.direccion}
            />
            {errors.direccion && <p className="text-sm text-red-500 mt-1">{errors.direccion}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas internas</Label>
            <textarea
              id="notas"
              name="notas"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={data.notas}
              onChange={e => setData('notas', e.target.value)}
            />
            {errors.notas && <p className="text-sm text-red-500 mt-1">{errors.notas}</p>}
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <Label className="text-base font-medium">Estado del proveedor</Label>
              <p className="text-sm text-slate-500 mt-1">
                Los proveedores inactivos no aparecerán en nuevas órdenes de compra.
              </p>
            </div>
            <Switch
              checked={data.activo}
              onCheckedChange={(v) => setData('activo', v)}
            />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
