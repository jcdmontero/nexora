import { Link } from '@inertiajs/react'
import { Star, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveIcon } from '@/lib/sidebar-icons'
import type { FavoriteItem } from '@/Hooks/useSidebarFavorites'

interface SidebarFavoritesProps {
  collapsed?: boolean
  favorites: FavoriteItem[]
  onRemove: (route: string) => void
}

export function SidebarFavorites({ collapsed, favorites, onRemove }: SidebarFavoritesProps) {
  if (favorites.length === 0) {
    if (collapsed) return null
    return (
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          <Star className="w-3 h-3" />
          Favoritos
        </div>
        <p className="px-3 py-2 text-xs text-muted-foreground/60">
          Usa ★ en el menú para agregar
        </p>
      </div>
    )
  }

  if (collapsed) {
    return (
      <div className="px-2 py-1 space-y-0.5">
        {favorites.map((fav) => {
          const Icon = resolveIcon(fav.icon)
          return (
            <Link
              key={fav.route}
              href={route(fav.route)}
              title={fav.label}
              className="group relative flex items-center justify-center rounded-lg py-2.5 text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
            >
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
              <span className="pointer-events-none absolute left-full ml-3 z-50 hidden whitespace-nowrap rounded-md bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-md ring-1 ring-border group-hover:block">
                {fav.label}
              </span>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
        <Star className="w-3 h-3" />
        Favoritos
      </div>
      <div className="space-y-0.5">
        {favorites.map((fav) => {
          const Icon = resolveIcon(fav.icon)
          return (
            <div key={fav.route} className="group relative flex items-center">
              <Link
                href={route(fav.route)}
                className="flex-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
              >
                <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
                <span className="truncate">{fav.label}</span>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onRemove(fav.route)
                }}
                className="absolute right-1 p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                title="Quitar de favoritos"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
