import { Input } from '@/Components/ui/input'
import { User, Building2, MapPin, FileText, Phone, Mail, File, Key, Receipt } from 'lucide-react'

const InputIcon = ({ icon: Icon, className, ...props }) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400">
      <Icon className="w-4 h-4" />
    </div>
    <Input 
      className={`pl-9 border-muted-200 focus-visible:ring-primary rounded-xl h-10 ${className}`} 
      {...props} 
    />
  </div>
)

export default function ClienteForm({ data, setData, errors, isEdit = false }) {
  const esEmpresa = data.tipo === 'juridico'

  const field = (label, child, error, required = false) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-muted-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {child}
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Selector de Tipo (Segmented Control) */}
      <div className="flex p-1 bg-muted-100/80 rounded-2xl">
        <button
          type="button"
          onClick={() => setData('tipo', 'natural')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            !esEmpresa 
              ? 'bg-card text-primary shadow-sm ring-1 ring-muted-200/50' 
              : 'text-muted-500 hover:text-muted-700'
          }`}
        >
          <User className="w-4 h-4" /> Persona
        </button>
        <button
          type="button"
          onClick={() => setData('tipo', 'juridico')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            esEmpresa 
              ? 'bg-card text-primary shadow-sm ring-1 ring-muted-200/50' 
              : 'text-muted-500 hover:text-muted-700'
          }`}
        >
          <Building2 className="w-4 h-4" /> Empresa
        </button>
      </div>

      {/* Información General */}
      <div className="bg-card rounded-2xl border border-muted-100 shadow-sm p-6 lg:p-8 relative">
        <div className="flex gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-muted-900">Información general</h3>
            <p className="text-sm text-muted-500">Datos básicos de la empresa</p>
          </div>
        </div>

        {esEmpresa ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {field('Razón social', <InputIcon icon={Building2} name="razon_social" value={data.razon_social || ''} onChange={e => setData('razon_social', e.target.value)} placeholder="Ej. Comercializadora del Norte S.A.S." required />, errors.razon_social, true)}
              {field('NIT', <InputIcon icon={FileText} name="nit" value={data.nit || ''} onChange={e => setData('nit', e.target.value)} placeholder="Ej. 900123456-7" required />, errors.nit, true)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {field('Contacto principal', <InputIcon icon={User} name="nombre_contacto" value={data.nombre_contacto || ''} onChange={e => setData('nombre_contacto', e.target.value)} placeholder="Nombre del contacto" />, errors.nombre_contacto)}
              {field('Tel. de contacto', <InputIcon icon={Phone} name="telefono_contacto" value={data.telefono_contacto || ''} onChange={e => setData('telefono_contacto', e.target.value)} placeholder="Ej. +57 300 123 4567" />, errors.telefono_contacto)}
              {field('Cargo', <InputIcon icon={User} name="cargo_contacto" value={data.cargo_contacto || ''} onChange={e => setData('cargo_contacto', e.target.value)} placeholder="Ej. Gerente comercial" />, errors.cargo_contacto)}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {field('Nombres', <InputIcon icon={User} name="nombres" value={data.nombres || ''} onChange={e => setData('nombres', e.target.value)} placeholder="Nombres" required />, errors.nombres, true)}
              {field('Apellidos', <InputIcon icon={User} name="apellidos" value={data.apellidos || ''} onChange={e => setData('apellidos', e.target.value)} placeholder="Apellidos" required />, errors.apellidos, true)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {field('Tipo documento', (
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400">
                     <FileText className="w-4 h-4" />
                  </div>
                  <select name="tipo_documento" value={data.tipo_documento || ''} onChange={e => setData('tipo_documento', e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-muted-200 bg-card pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary">
                    <option value="">—</option>
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </div>
              ), errors.tipo_documento, true)}
              {field('Número documento', <InputIcon icon={FileText} name="numero_documento" value={data.numero_documento || ''} onChange={e => setData('numero_documento', e.target.value)} placeholder="Número" required />, errors.numero_documento, true)}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 pt-5 border-t border-muted-100">
          {field('Email', <InputIcon icon={Mail} name="email" type="email" value={data.email || ''} onChange={e => setData('email', e.target.value)} placeholder="contacto@empresa.com" />, errors.email)}
          {field('Teléfono', <InputIcon icon={Phone} name="telefono" value={data.telefono || ''} onChange={e => setData('telefono', e.target.value)} placeholder="Ej. +57 (604) 123 4567" />, errors.telefono)}
        </div>
      </div>

      {/* Ubicación */}
      <div className="bg-card rounded-2xl border border-muted-100 shadow-sm p-6 lg:p-8 relative">
        <div className="flex gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-muted-900">Ubicación</h3>
            <p className="text-sm text-muted-500">Información de dirección</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {field('Dirección', <InputIcon icon={MapPin} name="direccion" value={data.direccion || ''} onChange={e => setData('direccion', e.target.value)} placeholder="Ej. Carrera 30 # 45-67" />, errors.direccion)}
          {field('Ciudad', (
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400">
                 <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="ciudad"
                list="ciudades-co"
                value={data.ciudad || ''}
                onChange={e => setData('ciudad', e.target.value)}
                placeholder="Escribe o selecciona una ciudad"
                autoComplete="off"
                className="flex h-10 w-full rounded-xl border border-muted-200 bg-card pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
              <datalist id="ciudades-co">
                <option value="Bogotá" />
                <option value="Medellín" />
                <option value="Cali" />
                <option value="Barranquilla" />
                <option value="Cartagena" />
                <option value="Cúcuta" />
                <option value="Bucaramanga" />
                <option value="Pereira" />
                <option value="Santa Marta" />
                <option value="Ibagué" />
                <option value="Manizales" />
                <option value="Villavicencio" />
                <option value="Armenia" />
                <option value="Neiva" />
                <option value="Pasto" />
                <option value="Montería" />
                <option value="Popayán" />
                <option value="Valledupar" />
                <option value="Sincelejo" />
                <option value="Tunja" />
              </datalist>
            </div>
          ), errors.ciudad)}
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-card rounded-2xl border border-muted-100 shadow-sm p-6 lg:p-8 relative">
        <div className="flex gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <File className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-muted-900">Información adicional</h3>
            <p className="text-sm text-muted-500">Notas y observaciones sobre el cliente</p>
          </div>
        </div>
        {field('Notas', (
          <textarea
            name="notas"
            value={data.notas || ''}
            onChange={e => setData('notas', e.target.value)}
            rows={3}
            placeholder="Información adicional relevante sobre el cliente..."
            className="flex w-full rounded-xl border border-muted-200 bg-card px-3 py-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-y" 
          />
        ), errors.notas)}
      </div>

      {/* Perfil Tributario */}
      <div className="bg-card rounded-2xl border border-muted-100 shadow-sm p-6 lg:p-8 relative">
        <div className="flex gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-muted-900">Perfil Tributario</h3>
            <p className="text-sm text-muted-500">Configuración fiscal para facturación electrónica y retenciones</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {field('Régimen tributario', (
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <select name="regimen_tributario" value={data.regimen_tributario || 'simplificado'} onChange={e => setData('regimen_tributario', e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-muted-200 bg-card pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary">
                  <option value="simplificado">Simplificado</option>
                  <option value="comun">Común</option>
                </select>
              </div>
            ), errors.regimen_tributario)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {field('% Ret. Fuente', <InputIcon icon={Receipt} name="porcentaje_retencion_fuente" type="number" step="0.01" min="0" max="100" value={data.porcentaje_retencion_fuente ?? 0} onChange={e => setData('porcentaje_retencion_fuente', e.target.value)} placeholder="0.00" />, errors.porcentaje_retencion_fuente)}
            {field('% Ret. IVA', <InputIcon icon={Receipt} name="porcentaje_retencion_iva" type="number" step="0.01" min="0" max="100" value={data.porcentaje_retencion_iva ?? 0} onChange={e => setData('porcentaje_retencion_iva', e.target.value)} placeholder="0.00" />, errors.porcentaje_retencion_iva)}
            {field('% Ret. ICA', <InputIcon icon={Receipt} name="porcentaje_retencion_ica" type="number" step="0.01" min="0" max="100" value={data.porcentaje_retencion_ica ?? 0} onChange={e => setData('porcentaje_retencion_ica', e.target.value)} placeholder="0.00" />, errors.porcentaje_retencion_ica)}
          </div>
        </div>
      </div>

      {/* Acceso al Portal */}
      <div className="bg-card rounded-2xl border border-muted-100 shadow-sm p-6 lg:p-8 relative">
        <div className="flex gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-muted-900">Acceso al Portal de Clientes</h3>
            <p className="text-sm text-muted-500">Configuración de credenciales para que el cliente consulte sus documentos</p>
          </div>
        </div>

        <div className="space-y-5">
          <label className="flex items-start gap-3 cursor-pointer group bg-muted-50/50 p-4 rounded-xl border border-muted-100/80">
            <div className="flex items-center h-6">
              <input 
                type="checkbox" 
                checked={data.portal_active || false} 
                onChange={e => setData('portal_active', e.target.checked)}
                className="w-5 h-5 rounded border-muted-300 text-primary focus:ring-primary transition-shadow group-hover:border-primary" 
              />
            </div>
            <div>
              <span className="text-sm font-semibold text-muted-900 block">Habilitar acceso al portal</span>
              <span className="text-xs text-muted-500">Permite al cliente iniciar sesión para ver sus tiques, cotizaciones y facturas.</span>
            </div>
          </label>

          {data.portal_active && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {!isEdit ? (
                field('Contraseña de acceso', 
                  <InputIcon 
                    icon={Key} 
                    type="password" 
                    name="password" 
                    value={data.password || ''} 
                    onChange={e => setData('password', e.target.value)} 
                    placeholder="Ej. Contraseña segura" 
                  />, 
                  errors.password
                )
              ) : (
                <div className="flex flex-col justify-center">
                  <span className="text-sm font-semibold text-muted-700">Contraseña de acceso</span>
                  <p className="text-sm text-muted-500 mt-1">La contraseña está configurada y oculta por seguridad.</p>
                </div>
              )}
              
              {!isEdit && (
                <div className="flex items-center">
                  <p className="text-xs text-muted-500 mt-5">
                    La contraseña se utilizará junto con el correo electrónico del cliente para iniciar sesión.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Checkbox Estado */}
      <div className="bg-muted-50 rounded-2xl border border-muted-100 p-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="flex items-center h-6">
            <input 
              type="checkbox" 
              checked={data.activo} 
              onChange={e => setData('activo', e.target.checked)}
              className="w-5 h-5 rounded border-muted-300 text-primary focus:ring-primary transition-shadow group-hover:border-primary" 
            />
          </div>
          <div>
            <span className="text-sm font-semibold text-muted-900 block">Cliente activo</span>
            <span className="text-xs text-muted-500">El cliente podrá ser seleccionado en documentos y operaciones.</span>
          </div>
        </label>
      </div>

    </div>
  )
}
