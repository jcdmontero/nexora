import { useState, useEffect } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Badge } from '@/Components/ui/badge'
import { 
  PackageOpen, Plus, Search, AlertTriangle, Pencil, Printer, Trash2, 
  Eye, X, ChevronLeft, ChevronRight, ImageOff 
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/Components/ui/alert-dialog"
import { Dialog, DialogContent } from '@/Components/ui/dialog'
import { usePermissions } from '@/Hooks/usePermissions'

const ProductThumbnail = ({ images = [], defaultImage, nombre, onClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  
  const allImages = images && images.length > 0 ? images : (defaultImage ? [defaultImage] : [])

  useEffect(() => {
    let interval
    if (isHovered && allImages.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % allImages.length)
      }, 1200)
    } else {
      setCurrentIndex(0)
    }
    return () => clearInterval(interval)
  }, [isHovered, allImages])

  if (allImages.length === 0) {
    return (
      <div 
        onClick={onClick}
        className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground border border-border cursor-pointer hover:bg-muted/80 transition-colors shrink-0"
      >
        <PackageOpen className="h-5 w-5 opacity-40" />
      </div>
    )
  }

  return (
    <div 
      className="relative h-10 w-10 rounded-lg overflow-hidden border border-border bg-card cursor-pointer shrink-0 transition-all duration-200 hover:scale-105 shadow-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <img 
        src={allImages[currentIndex]} 
        alt={nombre} 
        className="h-full w-full object-cover transition-opacity duration-300"
      />
      {allImages.length > 1 && (
        <span className="absolute bottom-0.5 right-0.5 bg-black/65 text-white text-[8px] px-1 rounded font-sans scale-90">
          {currentIndex + 1}/{allImages.length}
        </span>
      )}
    </div>
  )
}

function ProductDetailModal({ product, open, onClose }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Reset active image when product changes
  useEffect(() => {
    setActiveImageIndex(0)
  }, [product])

  if (!product) return null

  const images = product.imagenes && product.imagenes.length > 0 ? product.imagenes : (product.imagen_url ? [product.imagen_url] : [])

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)
  const formatNumber = (val) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(val)

  const precio = parseFloat(product.precio_venta) || 0
  const costo = parseFloat(product.costo_promedio) || 0
  const margen = precio > 0 ? ((precio - costo) / precio) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-border rounded-xl shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 h-[80vh] max-h-[600px]">
          {/* Columna Izquierda: Galería de imágenes (6 columnas) */}
          <div className="md:col-span-6 bg-muted/30 flex flex-col justify-between p-6 relative border-r border-border h-full">
            {images.length > 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center relative">
                {/* Imagen principal */}
                <div className="w-full aspect-video md:aspect-square max-h-[350px] relative rounded-lg overflow-hidden group border border-border shadow-sm">
                  <img 
                    src={images[activeImageIndex]} 
                    alt={product.nombre}
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105" 
                  />
                  {images.length > 1 && (
                    <>
                      <button 
                        onClick={() => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => setActiveImageIndex((prev) => (prev + 1) % images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4 overflow-x-auto w-full py-1">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`h-12 w-12 rounded-md overflow-hidden border-2 transition-all ${
                          activeImageIndex === idx ? 'border-primary scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <ImageOff className="h-16 w-16 opacity-30 mb-2" />
                <span className="text-sm font-medium">Sin imágenes de producto</span>
              </div>
            )}
            
            {images.length > 0 && (
              <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-md">
                {activeImageIndex + 1} de {images.length} fotos
              </div>
            )}
          </div>

          {/* Columna Derecha: Información del producto (6 columnas) */}
          <div className="md:col-span-6 p-6 flex flex-col justify-between overflow-y-auto h-full bg-card">
            <div>
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="bg-primary/5 text-primary text-[10px] uppercase font-bold border-primary/20">
                    {product.categoria?.nombre || 'General'}
                  </Badge>
                  {product.marca?.nombre && (
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                      {product.marca.nombre}
                    </Badge>
                  )}
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground leading-tight">{product.nombre}</h2>
              <span className="font-mono text-xs text-muted-foreground block mt-1">SKU: {product.codigo}</span>

              {/* Precios y Margen */}
              <div className="grid grid-cols-2 gap-4 mt-6 p-4 rounded-xl bg-muted/40 border border-border/50">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Precio Venta</span>
                  <span className="text-lg font-bold text-emerald-600 font-mono">{formatCurrency(precio)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Costo Promedio</span>
                  <span className="text-lg font-bold text-foreground/80 font-mono">{formatCurrency(costo)}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-border/40 flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Margen de Utilidad</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded font-mono ${margen > 30 ? 'bg-emerald-500/10 text-emerald-600' : margen > 15 ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'}`}>
                    {margen.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Stock */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground">Estado de Stock</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-foreground text-sm">
                      {formatNumber(product.stock_actual)} {product.unidad_medida}
                    </span>
                    {product.is_critical && (
                      <Badge variant="destructive" className="animate-pulse py-0 px-1.5 text-[9px] uppercase">Bajo</Badge>
                    )}
                  </div>
                </div>

                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      product.is_critical ? 'bg-rose-500' : parseFloat(product.stock_actual) > parseFloat(product.stock_minimo) * 2 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} 
                    style={{ width: `${Math.min((parseFloat(product.stock_actual) / Math.max(parseFloat(product.stock_minimo) * 3, 1)) * 100, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Mínimo requerido: {formatNumber(product.stock_minimo)}</span>
                  <span>{product.is_critical ? 'Reabastecimiento urgente' : 'Nivel seguro'}</span>
                </div>
              </div>

              {/* Descripción */}
              {product.descripcion && (
                <div className="mt-6">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block mb-1">Descripción</span>
                  <p className="text-sm text-foreground/80 leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/30">
                    {product.descripcion}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cerrar
              </Button>
              <Link href={route('inventory.productos.edit', product.id)}>
                <Button size="sm">
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Producto
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ProductosIndex({ productos, filters, criticalCount }) {
  const { can } = usePermissions()
  const [search, setSearch] = useState(filters.search || '')
  const [itemToDelete, setItemToDelete] = useState(null)
  const [viewItem, setViewItem] = useState(null)

  const confirmDelete = () => {
    if (itemToDelete) {
      router.delete(route('inventory.productos.destroy', itemToDelete.id), {
        preserveScroll: true,
        onSuccess: () => setItemToDelete(null),
      })
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    router.get(route('inventory.productos.index'), { search }, { preserveState: true })
  }

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)
  const formatNumber = (val) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(val)

  const columns = [
    {
      header: 'SKU',
      accessorKey: 'codigo',
      cell: (row) => <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{row.codigo}</span>,
    },
    {
      header: 'Producto',
      accessorKey: 'nombre',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <ProductThumbnail 
            images={row.imagenes} 
            defaultImage={row.imagen_url} 
            nombre={row.nombre} 
            onClick={() => setViewItem(row)} 
          />
          <div className="flex flex-col">
            <span 
              className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer transition-colors"
              onClick={() => setViewItem(row)}
            >
              {row.nombre}
            </span>
            <span className="text-xs text-muted-foreground">{row.categoria?.nombre || 'Sin categoría'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Stock Actual',
      accessorKey: 'stock_actual',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono">{formatNumber(row.stock_actual)} {row.unidad_medida}</span>
          {row.is_critical && (
            <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" title="Stock por debajo del mínimo" />
          )}
        </div>
      ),
    },
    {
      header: 'Precio Venta',
      accessorKey: 'precio_venta',
      cell: (row) => <span className="font-mono text-emerald-600 font-medium">{formatCurrency(row.precio_venta)}</span>,
    },
    {
      header: 'Estado',
      accessorKey: 'is_active',
      cell: (row) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'} className={row.is_active ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' : ''}>
          {row.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      header: '',
      id: 'actions',
      alignEnd: true,
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          {can('inventory:edit') && (
            <Link href={route('inventory.productos.edit', row.id)}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          )}
          {can('inventory:delete') && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setItemToDelete(row)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    }
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Catálogo de Productos" />

      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Catálogo de Productos</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona los productos, controla el stock y configura alertas de inventario mínimo.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por código o nombre..."
                className="w-full bg-card pl-9 shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <Link href={route('inventory.productos.etiquetas')}>
              <Button variant="outline" size="sm" className="h-9 shrink-0">
                <Printer className="h-4 w-4 mr-2" />
                Etiquetas
              </Button>
            </Link>
            {can('inventory:create') && (
              <Link href={route('inventory.productos.create')}>
                <Button size="sm" className="h-9 shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
              </Link>
            )}
          </div>
        </div>

        {criticalCount > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3 shadow-sm">
            <div className="bg-rose-100 p-2 rounded-full shrink-0">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-semibold text-rose-800">Atención: Tienes {criticalCount} productos con stock crítico</h3>
              <p className="text-sm text-rose-600 mt-1">
                Estos productos han caído por debajo de su stock mínimo configurado. Considera hacer un pedido a tus proveedores pronto para evitar desabastecimiento.
              </p>
            </div>
          </div>
        )}

        <Card className="border-border shadow-sm overflow-hidden bg-card">
          {productos.data.length > 0 ? (
            <DataTable
              columns={columns}
              data={productos.data}
              rowKey={(row) => row.id}
            />
          ) : (
            <EmptyState
              icon={PackageOpen}
              title={search ? 'No se encontraron productos' : 'El catálogo está vacío'}
              description={
                search 
                  ? 'Intenta buscar con otro SKU o término.'
                  : 'Registra tu primer producto para comenzar a rastrear inventario y ventas.'
              }
              action={
                can('inventory:create') && !search
                  ? { label: 'Crear Producto', href: route('inventory.productos.create') }
                  : undefined
              }
              className="py-20"
            />
          )}
        </Card>
      </div>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el producto y su historial de inventario permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProductDetailModal 
        product={viewItem} 
        open={!!viewItem} 
        onClose={() => setViewItem(null)} 
      />
    </AuthenticatedLayout>
  )
}
