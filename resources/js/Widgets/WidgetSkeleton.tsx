import { Skeleton } from '@/Components/ui/skeleton'
import { cn } from '@/lib/utils'

interface WidgetSkeletonProps {
  className?: string
  lines?: number
}

export function WidgetSkeleton({ className, lines = 3 }: WidgetSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-card ring-1 ring-foreground/5 p-5',
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  )
}

export function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-card ring-1 ring-foreground/5 p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-11 w-11 rounded-xl" />
          </div>
          <div className="mt-4">
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl bg-card ring-1 ring-foreground/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-56 w-full rounded-lg" />
    </div>
  )
}
