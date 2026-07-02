import { useState, type FormEvent } from 'react'
import { Head, router, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { PageHeader } from '@/Components/ui/page-header'
import { Pagination } from '@/Components/ui/pagination'
import { BookOpen, BookText, Wallet, Receipt, ArrowLeft, Search, FileText } from 'lucide-react'

interface LineaData {
  cuenta_codigo: string | null
  cuenta_nombre: string | null
  debito: number
  credito: number
  descripcion: string | null
}

interface AsientoData {
  id: number
  numero: string | null
  fecha: string
  concepto: string
  modulo_origen: string | null
  documento: string
  registrado_por: string | null
  total_debito: number
  total_credito: number
  lineas: LineaData[]
}

interface LibroData {
  id: number
  codigo: string
  nombre: string
  tipo: string
  descripcion: string
  filtro_cuentas: string | null
  filtro_modulo: string | null
}

const ICONOS: Record<string, typeof BookOpen> = {
  diario: BookOpen,
  mayor: BookText,
  caja: Wallet,
  ventas: Receipt,
}

const MODULO_LABELS: Record<string, string> = {
  'ventas': 'Ventas',
  'service-desk': 'Taller',
  'cash': 'Caja',
}

const money = (n: number | string | null | undefined): string =>
  '$ ' + Number(n || 0).toLocaleString('es-CO')

export default function LibroShow({ libro, asientos, filters }: {
  libro: LibroData
  asientos: { data: AsientoData[]; current_page: number; last_page: number }
  filters: { fecha_desde?: string; fecha_hasta?: string; cuenta_codigo?: string }
}) {
  const Icon = ICONOS[libro.tipo] || BookOpen

  const [fechaDesde, setFechaDesde] = useState(filters.fecha_desde || '')
  const [fechaHasta, setFechaHasta] = useState(filters.fecha_hasta || '')
  const [cuentaCodigo, setCuentaCodigo] = useState(filters.cuenta_codigo || '')

  function handleFilter(e: FormEvent) {
    e.preventDefault()
    router.get(route('accounting.libros.show', libro.id), {
      fecha_desde: fechaDesde || undefined,
      fecha_hasta: fechaHasta || undefined,
      cuenta_codigo: cuentaCodigo || undefined,
    }, { preserveState: true, preserveScroll: true })
  }

  function handlePageChange(page: number) {
    router.get(route('accounting.libros.show', libro.id), {
      ...filters,
      page,
    }, { preserveState: true, preserveScroll: true })
  }

  const columns = [
    {
      key: 'fecha',
      header: 'Fecha',
      cell: (a: AsientoData) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">{a.fecha}</p>
        </div>
      ),
    },
    {
      key: 'numero',
      header: 'No.',
      cell: (a: AsientoData) => (
        <span className="font-mono text-xs text-foreground">{a.numero || a.documento || '—'}</span>
      ),
    },
    {
      key: 'concepto',
      header: 'Concepto',
      cell: (a: AsientoData) => (
        <div className="min-w-0 max-w-[250px]">
          <p className="text-sm font-medium text-foreground truncate">{a.concepto}</p>
          {a.modulo_origen && (
            <span className="text-[10px] text-muted-foreground">
              {MODULO_LABELS[a.modulo_origen] || a.modulo_origen}
              {a.registrado_por ? ` · ${a.registrado_por}` : ''}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'cuentas',
      header: 'Cuentas',
      hideOnMobile: true,
      cell: (a: AsientoData) => (
        <div className="text-xs space-y-0.5 min-w-[160px]">
          {a.lineas.map((l, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="font-mono text-muted-foreground">{l.cuenta_codigo}</span>
              <span className="text-foreground truncate">{l.cuenta_nombre}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'debito',
      header: 'Débito',
      alignEnd: true,
      cell: (a: AsientoData) => (
        <div className="text-xs space-y-0.5 text-right">
          {a.lineas.filter(l => l.debito > 0).map((l, i) => (
            <div key={i} className="font-mono text-emerald-600">{money(l.debito)}</div>
          ))}
          {a.lineas.filter(l => l.debito > 0).length === 0 && <div className="text-muted-foreground">—</div>}
        </div>
      ),
    },
    {
      key: 'credito',
      header: 'Crédito',
      alignEnd: true,
      cell: (a: AsientoData) => (
        <div className="text-xs space-y-0.5 text-right">
          {a.lineas.filter(l => l.credito > 0).map((l, i) => (
            <div key={i} className="font-mono text-rose-600">{money(l.credito)}</div>
          ))}
          {a.lineas.filter(l => l.credito > 0).length === 0 && <div className="text-muted-foreground">—</div>}
        </div>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title={libro.nombre} />

      <PageHeader
        title={libro.nombre}
        description={libro.descripcion}
        icon={Icon}
        actions={
          <Link
            href={route('accounting.libros.index')}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> Todos los libros
          </Link>
        }
      />

      {/* Filtros */}
      <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Fecha desde</p>
          <Input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="h-9 text-sm" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Fecha hasta</p>
          <Input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="h-9 text-sm" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Cuenta (código)</p>
          <Input
            type="text" value={cuentaCodigo} onChange={e => setCuentaCodigo(e.target.value)}
            placeholder="Ej: 1105"
            className="h-9 text-sm w-32"
          />
        </div>
        <Button type="submit" size="sm" className="gap-1.5 h-9">
          <Search className="h-3.5 w-3.5" /> Filtrar
        </Button>
      </form>

      {/* Tabla de asientos */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {asientos.data.length > 0 ? (
          <>
            <div className="border-t border-border/60 first:border-t-0">
              <DataTable columns={columns} data={asientos.data} />
            </div>
            <div className="px-5 py-3 border-t border-border">
              <Pagination
                page={asientos.current_page}
                totalPages={asientos.last_page}
                onPage={handlePageChange}
              />
            </div>
          </>
        ) : (
          <div className="py-16">
            <EmptyState
              icon={FileText}
              title="Sin asientos registrados"
              description="No se encontraron asientos contables para este libro con los filtros actuales."
            />
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
