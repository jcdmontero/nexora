import { usePage } from '@inertiajs/react'

interface AuthUser {
  id: number
  name: string
  email: string
  is_superadmin: boolean
  roles: string[]
  permissions: string[]
}

/**
 * Hook de autorización en el frontend.
 * SuperAdmin siempre tiene acceso total (igual que Gate::before en backend).
 */
export function usePermissions() {
  const { auth } = usePage().props as { auth: { user: AuthUser | null } }
  const user = auth?.user

  const can = (permission: string): boolean => {
    if (!user) return false
    if (user.is_superadmin) return true
    return user.permissions?.includes(permission) ?? false
  }

  const canAny = (permissions: string[]): boolean => {
    return permissions.some((p) => can(p))
  }

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) ?? false
  }

  return { can, canAny, hasRole, user }
}
