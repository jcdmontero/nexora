import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { PageHeader } from '@/Components/ui/page-header'
import { EmptyState } from '@/Components/ui/empty-state'
import { BookOpen, BookText, Wallet, Receipt, FileSearch } from 'lucide-react'

const ICONOS: Record<string, typeof BookOpen> = {
  diario: BookOpen,
  mayor: BookText,
  caja: Wallet,
  ventas: Receipt,
}

export default function LibrosIndex({ libros }: { libros: Array<{ id: number; codigo: string; nombre: string; tipo: string; descripcion: string; is_sistema: boolean }> }) {
  return (
    <AuthenticatedLayout>
      <Head title="Libros Contables" />

      <PageHeader
        title="Libros Contables"
        description="Consulta los asientos registrados en cada libro del sistema."
        icon={BookOpen}
      />

      {libros.length === 0 ? (
        <div className="py-16">
          <EmptyState
            icon={BookOpen}
            title="Sin libros contables"
            description="Aún no se han creado libros contables. Se crearán automáticamente al activar el módulo de contabilidad."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {libros.map((libro) => {
            const Icon = ICONOS[libro.tipo] || BookOpen
            return (
              <a
                key={libro.id}
                href={route('accounting.libros.show', libro.id)}
                className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-2.5 text-indigo-600 dark:text-indigo-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">{libro.codigo}</Badge>
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {libro.nombre}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{libro.descripcion}</p>
              </a>
            )
          })}
        </div>
      )}
    </AuthenticatedLayout>
  )
}
