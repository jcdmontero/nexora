import { useForm, Link } from '@inertiajs/react'
import { Input } from '@/Components/ui/input'
import { FormSection, Field } from '@/Components/ui/form-section'
import { roleLabel } from '@/lib/permissions'
import {
  User as UserIcon, Mail, ShieldCheck, Building2, KeyRound, Info, Save, X,
} from 'lucide-react'

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

/**
 * Formulario premium reutilizable de usuario (crear/editar).
 * Layout de 2 columnas: formulario + panel lateral contextual.
 */
export default function UserForm({ mode = 'create', user = null, roles = [], sedes = [] }) {
  const isEdit = mode === 'edit'

  const { data, setData, post, put, processing, errors } = useForm({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    password_confirmation: '',
    role: user?.roles?.[0]?.name ?? user?.roles?.[0] ?? '',
    sede_id: user?.sede_id ?? '',
    is_active: isEdit ? Boolean(user?.is_active) : true,
  })

  const submit = (e) => {
    e.preventDefault()
    if (isEdit) put(route('core.users.update', user.id))
    else post(route('core.users.store'))
  }

  const roleName = (r) => (typeof r === 'string' ? r : r.name)

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Columna principal */}
      <div className="space-y-6 lg:col-span-2">
        <FormSection
          title="Información personal"
          description="Datos básicos de identificación del usuario."
          icon={UserIcon}
        >
          <Field label="Nombre completo" htmlFor="name" required error={errors.name} full>
            <Input
              id="name"
              name="name"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              placeholder="Ej. María González"
              required
            />
          </Field>
          <Field label="Correo electrónico" htmlFor="email" required error={errors.email} full>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                placeholder="usuario@empresa.com"
                className="pl-9"
                required
              />
            </div>
          </Field>
        </FormSection>

        <FormSection
          title="Acceso y permisos"
          description="Define el rol y la sede del usuario dentro de la empresa."
          icon={ShieldCheck}
        >
          <Field label="Rol" htmlFor="role" required error={errors.role}
                 hint="Determina los permisos del usuario.">
            <select
              id="role"
              name="role"
              value={data.role}
              onChange={(e) => setData('role', e.target.value)}
              className={selectClass}
              required
            >
              <option value="">Seleccionar rol…</option>
              {roles.map((r) => (
                <option key={roleName(r)} value={roleName(r)}>{roleLabel(roleName(r))}</option>
              ))}
            </select>
          </Field>
          <Field label="Sede" htmlFor="sede_id" error={errors.sede_id}
                 hint="Opcional. Si se omite, accede a todas.">
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
              <select
                id="sede_id"
                name="sede_id"
                value={data.sede_id}
                onChange={(e) => setData('sede_id', e.target.value)}
                className={`${selectClass} pl-9`}
              >
                <option value="">Todas las sedes (Global)</option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </Field>
          {isEdit && (
            <Field label="Estado de la cuenta" full>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3">
                <input
                  type="checkbox"
                  checked={data.is_active}
                  onChange={(e) => setData('is_active', e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-sm">
                  <span className="font-medium text-foreground">Usuario activo</span>
                  <span className="block text-xs text-muted-foreground">
                    Los usuarios inactivos no pueden iniciar sesión.
                  </span>
                </span>
              </label>
            </Field>
          )}
        </FormSection>

        <FormSection
          title={isEdit ? 'Cambiar contraseña' : 'Contraseña'}
          description={isEdit ? 'Déjala en blanco para mantener la actual.' : 'Define una contraseña segura para el acceso.'}
          icon={KeyRound}
        >
          <Field label={isEdit ? 'Nueva contraseña' : 'Contraseña'} htmlFor="password"
                 required={!isEdit} error={errors.password}>
            <Input
              id="password"
              name="password"
              type="password"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              required={!isEdit}
            />
          </Field>
          <Field label="Confirmar contraseña" htmlFor="password_confirmation">
            <Input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              value={data.password_confirmation}
              onChange={(e) => setData('password_confirmation', e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              required={!isEdit && data.password.length > 0}
            />
          </Field>
        </FormSection>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={processing}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {processing ? 'Guardando…' : isEdit ? 'Actualizar usuario' : 'Crear usuario'}
          </button>
          <Link
            href={route('core.users.index')}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Link>
        </div>
      </div>

      {/* Panel lateral contextual */}
      <aside className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Info className="h-4 w-4 text-indigo-500" />
            {isEdit ? 'Resumen del usuario' : 'Antes de empezar'}
          </h3>
          {isEdit ? (
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Nombre</dt>
                <dd className="font-medium text-foreground text-right truncate">{data.name || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Rol</dt>
                <dd className="font-medium text-foreground text-right">{data.role ? roleLabel(data.role) : '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Estado</dt>
                <dd className="font-medium text-right">
                  {data.is_active
                    ? <span className="text-emerald-600">Activo</span>
                    : <span className="text-muted-foreground">Inactivo</span>}
                </dd>
              </div>
            </dl>
          ) : (
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-indigo-500">•</span> El correo será su identificador de acceso.</li>
              <li className="flex gap-2"><span className="text-indigo-500">•</span> El rol define qué módulos y acciones podrá usar.</li>
              <li className="flex gap-2"><span className="text-indigo-500">•</span> Puedes cambiar todos estos datos más adelante.</li>
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5">
          <h3 className="text-sm font-semibold text-foreground">Buenas prácticas</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Asigna el rol con los permisos mínimos necesarios. Evita compartir cuentas entre varias personas
            para mantener una auditoría confiable.
          </p>
        </div>
      </aside>
    </form>
  )
}
