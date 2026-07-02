import { Bell } from 'lucide-react'
import { WidgetShell } from '../WidgetShell'
import { EmptyState } from '@/Components/ui/empty-state'

export function NotificationsWidget() {
  return (
    <WidgetShell
      widgetId="notifications"
      title="Notificaciones"
      icon={Bell}
      accent="rose"
      size="half"
      showMenu={false}
    >
      <EmptyState
        icon={Bell}
        title="Sin notificaciones"
        description="Las notificaciones de módulos aparecerán aquí."
      />
    </WidgetShell>
  )
}
