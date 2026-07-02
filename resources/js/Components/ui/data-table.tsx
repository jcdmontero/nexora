import type { ReactNode } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/Components/ui/table'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  key: string
  header: string
  cell?: (row: T) => ReactNode
  className?: string
  /** Oculta esta columna en la vista de tarjetas móvil (datos secundarios) */
  hideOnMobile?: boolean
  /** Alinea el valor a la derecha en la tarjeta móvil (ej. acciones) */
  alignEnd?: boolean
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  /**
   * Clave única por fila. Opcional: si no se provee, se usa `row.id` y, en su
   * defecto, el índice. Provéela siempre que las filas tengan un id estable
   * para evitar remontajes innecesarios.
   */
  rowKey?: (row: T, index: number) => string | number
}

/**
 * Tabla empresarial responsive:
 * - Escritorio (md+): tabla tradicional.
 * - Móvil: cada fila se transforma en una tarjeta (label + valor apilados).
 * Cumple el estándar de responsive (nada de scroll horizontal como única solución).
 */
export function DataTable<T>({ columns, data, rowKey }: DataTableProps<T>) {
  const getRowKey = (row: T, index: number): string | number =>
    rowKey
      ? rowKey(row, index)
      : ((row as Record<string, unknown>)?.id as string | number) ?? index

  const renderCell = (col: DataTableColumn<T>, row: T): ReactNode =>
    col.cell ? col.cell(row) : ((row as Record<string, unknown>)[col.key] as ReactNode)

  return (
    <>
      {/* Escritorio */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className={c.className}>{c.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={getRowKey(row, index)}>
                {columns.map((c) => (
                  <TableCell key={c.key} className={c.className}>{renderCell(c, row)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Móvil: tarjetas */}
      <div className="md:hidden divide-y divide-border">
        {data.map((row, index) => (
          <div key={getRowKey(row, index)} className="p-4 space-y-2.5">
            {columns
              .filter((c) => !c.hideOnMobile)
              .map((c) => (
                <div key={c.key} className="flex items-start justify-between gap-4">
                  <span className="text-xs font-medium text-muted-foreground shrink-0 pt-0.5">
                    {c.header}
                  </span>
                  <span className={cn('text-sm min-w-0', c.alignEnd ? 'text-right' : 'text-right')}>
                    {renderCell(c, row)}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  )
}
