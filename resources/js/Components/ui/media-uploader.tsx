import React, { useRef, useState, useCallback } from 'react'
import { router } from '@inertiajs/react'
import { Upload, X, Image, Video, Trash2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/Components/toasts/ToastProvider'

interface MediaItem {
  id: number
  ruta: string
  tipo: 'imagen' | 'video'
  mime_type?: string
  tamaño?: number
  duracion?: number
  nombre_original?: string
  fase?: string
  descripcion?: string
  created_at?: string
}

interface MediaUploaderProps {
  /** Endpoint POST para subir archivos */
  uploadUrl: string
  /** Endpoint DELETE para eliminar archivos (se le agrega /{id}) */
  deleteUrl?: string
  /** Elementos multimedia existentes */
  items?: MediaItem[]
  /** Filtro por fase (solo para órdenes) */
  fase?: string
  /** Tamaño máximo en MB */
  maxMb?: number
  /** Tipos MIME aceptados */
  accept?: string
  /** Callback cuando cambia la lista */
  onChange?: (items: MediaItem[]) => void
  /** Si está deshabilitado */
  disabled?: boolean
  /** Clase CSS adicional */
  className?: string
}

export function MediaUploader({
  uploadUrl,
  deleteUrl,
  items = [],
  fase,
  maxMb = 10,
  accept = 'image/*,video/*',
  onChange,
  disabled = false,
  className,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<MediaItem | null>(null)
  const { toast } = useToast()

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxMb * 1024 * 1024) {
      toast(`El archivo excede ${maxMb}MB`, 'error')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('archivo', file)
    if (fase) formData.append('fase', fase)

    try {
      const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrf,
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al subir el archivo')
      }

      const data = await response.json()
      toast('Archivo subido exitosamente', 'success')
      onChange?.([...items, data.multimedia])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al subir'
      toast(msg, 'error')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [uploadUrl, fase, maxMb, items, onChange, toast])

  const handleDelete = useCallback(async (item: MediaItem) => {
    if (!deleteUrl) return

    try {
      const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''
      await fetch(`${deleteUrl}/${item.id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': csrf,
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
      })

      toast('Archivo eliminado', 'success')
      onChange?.(items.filter(i => i.id !== item.id))
    } catch {
      toast('Error al eliminar', 'error')
    }
  }, [deleteUrl, items, onChange, toast])

  const formatSize = (bytes?: number) => {
    if (!bytes) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let i = 0
    let size = bytes
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
    return `${Math.round(size)} ${units[i]}`
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Botón de subida */}
      {!disabled && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium transition-colors',
              'hover:border-primary/50 hover:bg-primary/5',
              uploading && 'opacity-50 cursor-not-allowed',
            )}
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Subiendo…' : 'Subir foto o video'}
          </button>
          <p className="mt-1 text-xs text-muted-foreground">
            Máximo {maxMb}MB. Formatos: JPG, PNG, WebP, MP4, WebM.
          </p>
        </div>
      )}

      {/* Galería */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-lg border border-border bg-background overflow-hidden"
            >
              {item.tipo === 'imagen' ? (
                <img
                  src={item.ruta}
                  alt={item.descripcion || item.nombre_original || 'Imagen'}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="aspect-square flex items-center justify-center bg-muted">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {/* Overlay con acciones */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setPreview(item)}
                  className="rounded-full bg-white/90 p-1.5 text-foreground hover:bg-white"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {!disabled && deleteUrl && (
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="rounded-full bg-white/90 p-1.5 text-red-600 hover:bg-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="text-xs text-muted-foreground truncate">
                  {item.nombre_original || (item.tipo === 'imagen' ? 'Foto' : 'Video')}
                </p>
                {item.tamaño && (
                  <p className="text-[10px] text-muted-foreground/60">
                    {formatSize(item.tamaño)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de preview */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <button
            onClick={() => setPreview(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {preview.tipo === 'imagen' ? (
            <img
              src={preview.ruta}
              alt={preview.descripcion || 'Preview'}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            />
          ) : (
            <video
              src={preview.ruta}
              controls
              className="max-h-[85vh] max-w-[90vw] rounded-lg"
            />
          )}
        </div>
      )}
    </div>
  )
}
