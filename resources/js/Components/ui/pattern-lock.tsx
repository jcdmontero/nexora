import { useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface PatternLockProps {
  /** Secuencia actual como string, ej. "1-2-3-6-9". */
  value?: string
  onChange?: (value: string) => void
  /** Solo lectura: dibuja el patrón sin permitir editar (para el detalle). */
  readOnly?: boolean
  size?: number
}

/**
 * Captura/visualiza el patrón de desbloqueo de un equipo (cuadrícula 3×3).
 * Soporta mouse y touch. La secuencia se serializa como "1-2-5-6-9".
 */
export function PatternLock({ value = '', onChange, readOnly = false, size = 240 }: PatternLockProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [seq, setSeq] = useState<number[]>(
    value ? value.split('-').filter(Boolean).map(Number) : [],
  )
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)

  const pad = size * 0.16
  const step = (size - pad * 2) / 2
  const dots = Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    x: pad + (i % 3) * step,
    y: pad + Math.floor(i / 3) * step,
  }))

  const dotAt = (px: number, py: number) => {
    const r = size * 0.09
    return dots.find((d) => Math.hypot(d.x - px, d.y - py) <= r)?.id ?? null
  }

  const localPoint = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * size,
      y: ((e.clientY - rect.top) / rect.height) * size,
    }
  }

  const commit = useCallback(
    (next: number[]) => {
      setSeq(next)
      onChange?.(next.join('-'))
    },
    [onChange],
  )

  const start = (e: React.PointerEvent) => {
    if (readOnly) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrawing(true)
    const p = localPoint(e)
    setPointer(p)
    const hit = dotAt(p.x, p.y)
    commit(hit ? [hit] : [])
  }

  const move = (e: React.PointerEvent) => {
    if (!drawing || readOnly) return
    const p = localPoint(e)
    setPointer(p)
    const hit = dotAt(p.x, p.y)
    if (hit && !seq.includes(hit)) {
      commit([...seq, hit])
    }
  }

  const end = () => {
    if (readOnly) return
    setDrawing(false)
    setPointer(null)
  }

  const clear = () => commit([])

  const lines = seq.map((id) => dots.find((d) => d.id === id)!).filter(Boolean)

  return (
    <div className="inline-flex flex-col items-center gap-3">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: size, height: size, touchAction: 'none' }}
        className={cn(
          'rounded-2xl border border-border bg-muted/30 select-none',
          !readOnly && 'cursor-pointer',
        )}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      >
        {/* Líneas entre puntos seleccionados */}
        {lines.map((d, i) =>
          i < lines.length - 1 ? (
            <line
              key={`l${i}`}
              x1={d.x} y1={d.y}
              x2={lines[i + 1].x} y2={lines[i + 1].y}
              stroke="#6366f1" strokeWidth={size * 0.018} strokeLinecap="round"
            />
          ) : null,
        )}
        {/* Línea en vivo hacia el puntero */}
        {drawing && pointer && lines.length > 0 && (
          <line
            x1={lines[lines.length - 1].x} y1={lines[lines.length - 1].y}
            x2={pointer.x} y2={pointer.y}
            stroke="#6366f1" strokeWidth={size * 0.018} strokeLinecap="round" opacity={0.5}
          />
        )}
        {/* Puntos */}
        {dots.map((d) => {
          const idx = seq.indexOf(d.id)
          const active = idx !== -1
          return (
            <g key={d.id}>
              <circle cx={d.x} cy={d.y} r={size * 0.09} className="fill-transparent" />
              <circle
                cx={d.x} cy={d.y} r={size * 0.05}
                className={active ? 'fill-indigo-500' : 'fill-muted-foreground/30'}
              />
              {active && (
                <text
                  x={d.x} y={d.y + size * 0.018}
                  textAnchor="middle"
                  className="fill-white font-bold"
                  style={{ fontSize: size * 0.045 }}
                >
                  {idx + 1}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">
          Patrón: <span className="font-mono font-medium text-foreground">{seq.length ? seq.join('-') : '—'}</span>
        </span>
        {!readOnly && seq.length > 0 && (
          <button type="button" onClick={clear} className="text-xs font-medium text-primary hover:underline">
            Borrar
          </button>
        )}
      </div>
    </div>
  )
}

export default PatternLock
