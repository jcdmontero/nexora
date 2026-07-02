import { useState } from 'react'
import { Head, router, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Badge } from '@/Components/ui/badge'
import { EmptyState } from '@/Components/ui/empty-state'
import { PageHeader } from '@/Components/ui/page-header'
import { ConfirmDialog } from '@/Components/ui/confirm-dialog'
import { usePermissions } from '@/Hooks/usePermissions'
import {
  ShieldCheck, Shield, Pencil, Trash2, Check, Plus, Save, X, Lock, KeyRound,
} from 'lucide-react'
import { permissionLabel, groupPermissions, roleLabel } from '@/lib/permissions'

export default function RolesIndex({ roles, allPermissions, availableToAdd = [] }) {
  const { can } = usePermissions()
  const [editingId, setEditingId] = useState(null)
  const [selectedPerms, setSelectedPerms] = useState({})

  const { data, setData, post, processing, reset } = useForm({ name: '', permissions: [] })
  const protectedRoles = ['superadmin', 'ADMIN_EMPRESA']

  const create = (e) => {
    e.preventDefault()
    post(route('core.roles.store'), { onSuccess: () => reset() })
  }

  const startEdit = (role) => {
    setEditingId(role.id)
    setSelectedPerms((prev) => ({ ...prev, [role.id]: [...role.permissions] }))
  }

  const togglePerm = (roleId, perm) => {
    setSelectedPerms((prev) => {
      const current = prev[roleId] || []
      return {
        ...prev,
        [roleId]: current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm],
      }
    })
  }

  const toggleGroup = (roleId, perms) => {
    setSelectedPerms((prev) => {
      const current = prev[roleId] || []
      const allOn = perms.every((p) => current.includes(p))
      return {
        ...prev,
        [roleId]: allOn
          ? current.filter((p) => !perms.includes(p))
          : [...new Set([...current, ...perms])],
      }
    })
  }

  const savePerms = (role) => {
    router.put(
      route('core.roles.update', role.id),
      { name: role.name, permissions: selectedPerms[role.id] || [] },
      { preserveScroll: true, onSuccess: () => setEditingId(null) },
    )
  }

  return (
    <AuthenticatedLayout>
      <Head title="Roles y permisos" />
      <PageHeader
        title="Roles y permisos"
        description="Define perfiles de acceso y controla qué puede hacer cada usuario."
        icon={ShieldCheck}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Panel: agregar rol */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Plus className="h-4 w-4 text-indigo-500" />
                Agregar rol
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Los roles provienen de un catálogo fijo de la empresa.
              </p>
              {!can('roles:create') ? (
                <p className="mt-4 text-sm text-muted-foreground">No tienes permiso para crear roles.</p>
              ) : availableToAdd.length === 0 ? (
                <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Todos los roles del catálogo ya están en uso.
                </div>
              ) : (
                <form onSubmit={create} className="mt-4 space-y-3">
                  <select
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    required
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="" disabled>Selecciona un rol…</option>
                    {availableToAdd.map((name) => (
                      <option key={name} value={name}>{roleLabel(name)}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    {processing ? 'Agregando…' : 'Agregar rol'}
                  </button>
                </form>
              )}
            </div>

            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <KeyRound className="h-4 w-4 text-indigo-500" />
                Sobre los permisos
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Cada permiso habilita una acción concreta. Asigna solo lo necesario. Los roles
                protegidos no pueden eliminarse para garantizar la administración del sistema.
              </p>
            </div>
          </div>
        </aside>

        {/* Lista de roles */}
        <div className="space-y-5 lg:col-span-2">
          {roles.length === 0 ? (
            <div className="rounded-xl border border-border bg-card">
              <EmptyState
                icon={Shield}
                title="No hay roles creados"
                description="Agrega un rol del catálogo para empezar a asignar permisos a los usuarios."
              />
            </div>
          ) : (
            roles.map((role) => {
              const isEditing = editingId === role.id
              const isProtected = protectedRoles.includes(role.name)
              const grouped = groupPermissions(isEditing ? allPermissions : role.permissions)
              return (
                <div key={role.id} className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                        <Shield className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <h3 className="flex items-center gap-2 font-semibold text-foreground">
                          {roleLabel(role.name)}
                          {isProtected && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              <Lock className="h-3 w-3" /> Protegido
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {role.permissions.length} {role.permissions.length === 1 ? 'permiso' : 'permisos'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {can('roles:edit') && !isEditing && (
                        <button
                          onClick={() => startEdit(role)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </button>
                      )}
                      {can('roles:delete') && !isProtected && !isEditing && (
                        <ConfirmDialog
                          deleteUrl={route('core.roles.destroy', role.id)}
                          title={`¿Eliminar el rol ${roleLabel(role.name)}?`}
                          description="Los usuarios con este rol perderán sus permisos asociados."
                          trigger={
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              title="Eliminar rol"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          }
                        />
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    {isEditing ? (
                      <div className="space-y-5">
                        {Object.entries(grouped).map(([group, perms]) => {
                          const sel = selectedPerms[role.id] || []
                          const allOn = perms.every((p) => sel.includes(p))
                          return (
                            <div key={group}>
                              <div className="mb-2 flex items-center justify-between">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</h4>
                                <button
                                  type="button"
                                  onClick={() => toggleGroup(role.id, perms)}
                                  className="text-xs font-medium text-primary hover:underline"
                                >
                                  {allOn ? 'Quitar todos' : 'Seleccionar todos'}
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {perms.map((perm) => {
                                  const isSel = sel.includes(perm)
                                  return (
                                    <button
                                      key={perm}
                                      type="button"
                                      onClick={() => togglePerm(role.id, perm)}
                                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                                        isSel
                                          ? 'border-primary bg-primary/10 text-primary'
                                          : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/50'
                                      }`}
                                    >
                                      {isSel && <Check className="h-3 w-3" />}
                                      {permissionLabel(perm)}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                        <div className="flex gap-2 border-t border-border pt-4">
                          <button
                            onClick={() => savePerms(role)}
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                          >
                            <Save className="h-4 w-4" /> Guardar permisos
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
                          >
                            <X className="h-4 w-4" /> Cancelar
                          </button>
                        </div>
                      </div>
                    ) : role.permissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin permisos asignados.</p>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(grouped).map(([group, perms]) => (
                          <div key={group} className="flex flex-col gap-1.5 sm:flex-row sm:items-start">
                            <span className="w-32 shrink-0 text-xs font-medium text-muted-foreground">{group}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {perms.map((perm) => (
                                <Badge key={perm} variant="secondary" className="text-xs">{permissionLabel(perm)}</Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
