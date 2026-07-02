/**
 * BentoGrid — Sistema de grilla de 12 columnas con soporte drag-and-drop.
 *
 * BentoGridDnD : contenedor raíz con DndContext + SortableContext.
 * BentoCell    : celda estática (sin drag).
 * SPAN_CLASSES : map de span → clases CSS Tailwind.
 * getWidgetSpan: calcula el span correcto según widgets visibles.
 */

import { useState, type ReactNode } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Mapa de spans → clases CSS (strings completos para Tailwind purge) ─

export const SPAN_CLASSES: Record<number, string> = {
  4:  'col-span-12 sm:col-span-6 lg:col-span-4',
  6:  'col-span-12 sm:col-span-6 lg:col-span-6',
  8:  'col-span-12 lg:col-span-8',
  12: 'col-span-12',
}

// Alias descriptivos para legibilidad en getWidgetSpan
const FULL  = 12
const HALF  = 6
const WIDE  = 8
const THIRD = 4

// ── BentoCell estático ─────────────────────────────────────────────────

interface BentoCellProps {
  span?: number
  className?: string
  children: ReactNode
}

export function BentoCell({ span = 12, className, children }: BentoCellProps) {
  return (
    <div className={cn(SPAN_CLASSES[span] ?? 'col-span-12', 'min-w-0', className)}>
      {children}
    </div>
  )
}

// ── Celda sortable (con handle de arrastre) ────────────────────────────

interface SortableCellProps {
  id: string
  span?: number
  children: ReactNode
}

function SortableCell({ id, span = 12, children }: SortableCellProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        zIndex:  isDragging ? 50 : 'auto',
      }}
      className={cn(
        SPAN_CLASSES[span] ?? 'col-span-12',
        'min-w-0 relative group/sortable',
      )}
    >
      {/* Grip handle — visible en hover, posicionado sobre la card */}
      <div
        {...attributes}
        {...listeners}
        title="Arrastrar para reordenar"
        className={cn(
          'absolute left-2 top-2 z-20',
          'flex h-7 w-7 items-center justify-center rounded-md',
          // Visible sólo en hover del contenedor
          'opacity-0 group-hover/sortable:opacity-100',
          'transition-opacity duration-200',
          // Estilo
          'bg-background/90 shadow-sm ring-1 ring-border backdrop-blur-sm',
          'text-muted-foreground/60 hover:text-muted-foreground',
          'cursor-grab active:cursor-grabbing',
          // Mientras se arrastra, mantenemos visible
          isDragging && 'opacity-100',
        )}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {children}
    </div>
  )
}

// ── BentoGridDnD — Grid completo con drag-and-drop ─────────────────────

interface BentoGridDnDProps {
  /** IDs de widgets en el orden actual */
  items: string[]
  /** Llamado cuando el usuario suelta un widget en nueva posición */
  onReorder: (activeId: string, overId: string) => void
  /** Devuelve el span de columnas para cada widget ID */
  getSpan: (id: string) => number
  /** Renderiza el contenido de un widget por su ID */
  renderWidget: (id: string) => ReactNode
  className?: string
}

export function BentoGridDnD({
  items,
  onReorder,
  getSpan,
  renderWidget,
  className,
}: BentoGridDnDProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Requiere 8px de movimiento antes de activar drag
      // Evita que clicks normales activen el arrastre
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <div className={cn('grid grid-cols-12 gap-4 auto-rows-auto', className)}>
          {items.map((id) => {
            const node = renderWidget(id)
            if (!node) return null
            return (
              <SortableCell key={id} id={id} span={getSpan(id)}>
                {node}
              </SortableCell>
            )
          })}
        </div>
      </SortableContext>

      {/* Ghost visual mientras se arrastra */}
      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeId ? (
          <div
            className="rounded-xl opacity-90 shadow-2xl ring-2 ring-primary/20"
            style={{ pointerEvents: 'none' }}
          >
            {renderWidget(activeId)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// ── getWidgetSpan ──────────────────────────────────────────────────────

export interface WidgetSpanContext {
  visibleSet: Set<string>
}

export function getWidgetSpan(widgetId: string, { visibleSet }: WidgetSpanContext): number {
  switch (widgetId) {
    // Gráfico actividad: 8 cols si hay módulos al lado, ancho completo si solo
    case 'activity-chart':
      return visibleSet.has('module-status') ? 8 : 12

    // Módulos: 4 cols si hay gráfico al lado
    case 'module-status':
      return visibleSet.has('activity-chart') ? 4 : 12

    // Actividad reciente + tareas: mitad+mitad
    case 'recent-activity':
    case 'task-panel':
      return visibleSet.has('recent-activity') && visibleSet.has('task-panel') ? 6 : 12

    // Cola de servicio + facturas: mitad+mitad
    case 'service-desk-queue':
    case 'recent-invoices':
      return visibleSet.has('service-desk-queue') && visibleSet.has('recent-invoices') ? 6 : 12

    // Widgets pequeños de sidebar
    case 'cash-status':
    case 'inventory-alerts':
    case 'module-summary':
      return 4

    // Gráfico ingresos: ancho completo
    case 'revenue-chart':
      return 12

    // Centro de alertas: ancho completo
    case 'alerts-dashboard':
      return 12

    default:
      return 12
  }
}
