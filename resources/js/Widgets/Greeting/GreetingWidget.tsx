import { usePage } from '@inertiajs/react'
import { Sun, Sunset, Moon, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAccent } from '@/lib/accent'
import type { WidgetShellProps } from '../types'

interface GreetingWidgetProps {
  tenantName: string | null
  showLayoutToggle?: boolean
}

function getGreeting(): { text: string; icon: LucideIcon } {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return { text: 'Buenos días', icon: Sun }
  if (hour >= 12 && hour < 18) return { text: 'Buenas tardes', icon: Sunset }
  return { text: 'Buenas noches', icon: Moon }
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function GreetingWidget({ tenantName, showLayoutToggle }: GreetingWidgetProps) {
  const { auth } = usePage().props as { auth: { user: { name: string } } }
  const firstName = auth?.user?.name?.split(' ')[0] ?? ''
  const greeting = getGreeting()
  const formattedDate = getFormattedDate()
  const GreetingIcon = greeting.icon
  const tokens = getAccent('indigo')

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <GreetingIcon className="h-4 w-4" />
          <span className="text-sm font-medium capitalize">{formattedDate}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {greeting.text}{firstName ? `, ${firstName}` : ''}
        </h1>
        {tenantName && (
          <p className="text-sm text-muted-foreground">
            Panel de control de <span className="font-medium text-foreground">{tenantName}</span>
          </p>
        )}
      </div>
    </div>
  )
}
