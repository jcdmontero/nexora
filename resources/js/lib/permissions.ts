/*
 * Traducción de permisos técnicos (código "modulo:accion") a español legible.
 * El código interno NO cambia; solo la presentación en la interfaz.
 */

const groupLabels: Record<string, string> = {
  users: 'Usuarios',
  roles: 'Roles',
  modules: 'Módulos',
  audit: 'Auditoría',
  tenant: 'Empresa',
  crm: 'CRM',
  inventory: 'Inventario',
  'service-desk': 'Servicio Técnico',
  sales: 'Ventas',
  cash: 'Tesorería',
  purchasing: 'Compras',
  accounting: 'Contabilidad',
  hr: 'Recursos Humanos',
  payroll: 'Nómina',
  notifications: 'Notificaciones',
}

const actionLabels: Record<string, string> = {
  view: 'Ver',
  create: 'Crear',
  edit: 'Editar',
  delete: 'Eliminar',
  manage: 'Gestionar',
  report: 'Reportes',
  assign: 'Asignar',
  close: 'Cerrar',
  transfer: 'Transferir',
  liquidate: 'Liquidar',
  approve: 'Aprobar',
  pay: 'Pagar',
  anular: 'Anular facturas',
  send: 'Enviar',
  receipts: 'Recibos',
  admin: 'Administrar',
}

const roleLabels: Record<string, string> = {
  superadmin: 'Super Administrador',
  ADMIN_EMPRESA: 'Administrador',
  GERENTE: 'Gerente',
  CONTADOR: 'Contador',
  RRHH: 'Recursos Humanos',
  VENDEDOR: 'Vendedor',
  CAJERO: 'Cajero',
  TECNICO: 'Técnico',
}

/** Nombre del rol en español (ej. "ADMIN_EMPRESA" -> "Administrador"). */
export function roleLabel(code: string): string {
  if (!code) return ''
  return roleLabels[code] ?? code.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Nombre del grupo/módulo en español (ej. "users" -> "Usuarios"). */
export function groupLabel(group: string): string {
  return groupLabels[group] ?? group.charAt(0).toUpperCase() + group.slice(1)
}

/** Etiqueta de la acción en español (ej. "view" -> "Ver"). */
export function actionLabel(action: string): string {
  return actionLabels[action] ?? action.charAt(0).toUpperCase() + action.slice(1)
}

/** Etiqueta completa de un permiso (ej. "users:view" -> "Ver"). */
export function permissionLabel(code: string): string {
  const [, action] = code.split(':')
  return action ? actionLabel(action) : code
}

/** Agrupa una lista de permisos por módulo: { Usuarios: ['users:view', ...], ... } */
export function groupPermissions(permissions: string[]): Record<string, string[]> {
  return permissions.reduce<Record<string, string[]>>((acc, code) => {
    const [group] = code.split(':')
    const label = groupLabel(group)
    ;(acc[label] ||= []).push(code)
    return acc
  }, {})
}
