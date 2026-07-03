import { useState, useCallback } from 'react'
import { usePage } from '@inertiajs/react'
import { routeExistsSafe } from '@/lib/utils'

export interface FavoriteItem {
  route: string
  label: string
  icon: string
  section?: string
}

interface AuthUser {
  id: number
  name: string
  email: string
  is_superadmin: boolean
}

const MAX_FAVORITES = 8
const STORAGE_PREFIX = 'sidebar:favorites:'

function getStorageKey(userId: number): string {
  return `${STORAGE_PREFIX}${userId}`
}

function loadFavorites(userId: number): FavoriteItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as FavoriteItem[]
    return parsed.filter((item) => routeExistsSafe(item.route))
  } catch {
    return []
  }
}

function saveFavorites(userId: number, items: FavoriteItem[]): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(items))
  } catch {}
}

export function useSidebarFavorites() {
  const page = usePage()
  const userId = (page.props.auth as { user: AuthUser | null } | undefined)?.user?.id

  const [favorites, setFavorites] = useState<FavoriteItem[]>(() =>
    userId ? loadFavorites(userId) : []
  )

  const addFavorite = useCallback(
    (item: FavoriteItem) => {
      setFavorites((prev) => {
        if (prev.length >= MAX_FAVORITES) return prev
        if (prev.some((f) => f.route === item.route)) return prev
        const next = [...prev, item]
        if (userId) saveFavorites(userId, next)
        return next
      })
    },
    [userId],
  )

  const removeFavorite = useCallback(
    (routeName: string) => {
      setFavorites((prev) => {
        const next = prev.filter((f) => f.route !== routeName)
        if (userId) saveFavorites(userId, next)
        return next
      })
    },
    [userId],
  )

  const isFavorite = useCallback(
    (routeName: string) => favorites.some((f) => f.route === routeName),
    [favorites],
  )

  const toggleFavorite = useCallback(
    (item: FavoriteItem) => {
      if (isFavorite(item.route)) {
        removeFavorite(item.route)
      } else {
        addFavorite(item)
      }
    },
    [isFavorite, removeFavorite, addFavorite],
  )

  return { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite }
}
