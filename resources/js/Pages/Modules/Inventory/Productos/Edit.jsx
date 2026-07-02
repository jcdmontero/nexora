import { Head, Link, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Button } from '@/Components/ui/button'
import { Checkbox } from '@/Components/ui/checkbox'
import { ArrowLeft, Save, Plus, Trash2, PackagePlus } from 'lucide-react'
import { useState, useEffect } from 'react'
import CategoriaFormModal from '../Categorias/CategoriaFormModal'
import MarcaFormModal from '../Marcas/MarcaFormModal'
import { CurrencyInput } from '@/Components/ui/currency-input'

export default function ProductoEdit({ producto, categorias, marcas }) {
  const { data, setData, post, processing, errors, transform } = useForm({
    _method: 'PUT',
    codigo: producto.codigo || '',
    nombre: producto.nombre || '',
    descripcion: producto.descripcion || '',
    categoria_id: producto.categoria_id || '',
    marca_id: producto.marca_id || '',
    unidad_medida: producto.unidad_medida || 'unidad',
    precio_venta: producto.precio_venta || 0,
    costo_promedio: producto.costo_promedio || 0,
    stock_actual: producto.stock_actual || 0,
    stock_minimo: producto.stock_minimo || 0,
    is_active: producto.is_active ?? true,
    imagenes: [null, null, null, null],
    imagenes_existentes: producto.imagenes || [],
    packs: producto.packs || [],
  })

  // Initialize previews state with existing product images
  const initialPreviews = [null, null, null, null]
  const existingImages = producto.imagenes || []
  for (let i = 0; i < 4; i++) {
    if (existingImages[i]) {
      initialPreviews[i] = existingImages[i]
    }
  }

  const [previews, setPreviews] = useState(initialPreviews)
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false)
  const [isMarcaModalOpen, setIsMarcaModalOpen] = useState(false)

  // Configure Inertia transform to only send real new file uploads
  useEffect(() => {
    transform((data) => ({
      ...data,
      imagenes: (data.imagenes || []).filter(img => img !== null)
    }))
  }, [data.imagenes, data.imagenes_existentes])

  const handleImageChange = (index, file) => {
    if (!file) return

    // Limit size: 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB.')
      return
    }

    if (previews[index] && previews[index].startsWith('blob:')) {
      URL.revokeObjectURL(previews[index])
    }

    const newPreviews = [...previews]
    newPreviews[index] = URL.createObjectURL(file)
    setPreviews(newPreviews)

    const newImages = [...data.imagenes]
    newImages[index] = file

    setData((prev) => {
      const oldUrl = prev.imagenes_existentes[index]
      const updatedExisting = prev.imagenes_existentes.filter(url => url !== oldUrl)
      return {
        ...prev,
        imagenes: newImages,
        imagenes_existentes: updatedExisting
      }
    })
  }

  const removeImage = (index) => {
    if (previews[index] && previews[index].startsWith('blob:')) {
      URL.revokeObjectURL(previews[index])
    }

    const newPreviews = [...previews]
    const oldVal = newPreviews[index]
    newPreviews[index] = null
    setPreviews(newPreviews)

    const newImages = [...data.imagenes]
    newImages[index] = null

    setData((prev) => {
      const updatedExisting = typeof oldVal === 'string' && !oldVal.startsWith('blob:')
        ? prev.imagenes_existentes.filter(url => url !== oldVal)
        : prev.imagenes_existentes
      return {
        ...prev,
        imagenes: newImages,
        imagenes_existentes: updatedExisting
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    post(route('inventory.productos.update', producto.id))
  }

  const addPack = () => {
    setData('packs', [
      ...data.packs,
      { id: null, nombre: '', unidad_medida: '', factor_conversion: '', codigo_barras: '', precio_venta: '' }
    ])
  }

  const removePack = (index) => {
    const newPacks = [...data.packs]
    newPacks.splice(index, 1)
    setData('packs', newPacks)
  }

  const updatePack = (index, field, value) => {
    const newPacks = [...data.packs]
    newPacks[index][field] = value
    setData('packs', newPacks)
  }

  return (
    <AuthenticatedLayout>
      <Head title={`Editar Producto: ${producto.nombre}`} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={route('inventory.productos.index')}>
              <Button variant="outline" size="icon" type="button">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Editar Producto</h2>
              <p className="text-sm text-muted-foreground mt-1">Actualiza la información de {producto.nombre}.</p>
            </div>
          </div>
          <Button type="submit" disabled={processing}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código / SKU</Label>
                    <Input
                      id="codigo"
                      value={data.codigo}
                      onChange={e => setData('codigo', e.target.value)}
                      placeholder="Ej. REF-001"
                      className={errors.codigo ? 'border-destructive' : ''}
                    />
                    {errors.codigo && <p className="text-xs text-destructive">{errors.codigo}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del Producto</Label>
                    <Input
                      id="nombre"
                      value={data.nombre}
                      onChange={e => setData('nombre', e.target.value)}
                      placeholder="Ej. Taladro Percutor 1/2'' 800W"
                      className={errors.nombre ? 'border-destructive' : ''}
                    />
                    {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
                    <p className="text-xs text-muted-foreground">El nombre comercial con el que aparecerá en ventas.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                  <textarea
                    id="descripcion"
                    value={data.descripcion || ''}
                    onChange={e => setData('descripcion', e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Ej. Taladro de uso profesional, incluye 3 brocas y maletín de transporte."
                  />
                  {errors.descripcion && <p className="text-xs text-destructive">{errors.descripcion}</p>}
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Galería de Imágenes</h3>
                  <p className="text-xs text-muted-foreground mt-1">Sube hasta 4 fotos para tu producto. La primera será la foto principal.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((index) => {
                  const preview = previews[index]
                  const isMain = index === 0
                  return (
                    <div 
                      key={index}
                      className={`relative aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 overflow-hidden transition-all duration-300 ${
                        preview 
                          ? 'border-border bg-card' 
                          : 'border-muted hover:border-primary/50 bg-muted/20 hover:bg-muted/10'
                      }`}
                    >
                      {preview ? (
                        <div className="relative w-full h-full group">
                          <img 
                            src={preview} 
                            className="w-full h-full object-cover rounded-lg" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1.5 shadow-md transition-transform hover:scale-110"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                          <Plus className="h-6 w-6 text-muted-foreground opacity-60" />
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {isMain ? 'Foto Principal' : `Foto ${index + 1}`}
                          </span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageChange(index, e.target.files[0])} 
                          />
                        </label>
                      )}
                      
                      {isMain && (
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Principal
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {errors.imagenes && (
                <p className="text-xs text-destructive mt-2">{errors.imagenes}</p>
              )}
            </Card>

            <Card className="p-6 border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Precios e Inventario</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio_venta">Precio de Venta</Label>
                  <CurrencyInput
                    id="precio_venta"
                    value={data.precio_venta}
                    onValueChange={(val) => setData('precio_venta', val)}
                    placeholder="Ej. 150000"
                  />
                  {errors.precio_venta && <p className="text-xs text-destructive">{errors.precio_venta}</p>}
                  <p className="text-xs text-muted-foreground">Precio final al público.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costo_promedio">Costo Promedio</Label>
                  <CurrencyInput
                    id="costo_promedio"
                    value={data.costo_promedio}
                    onValueChange={(val) => setData('costo_promedio', val)}
                    placeholder="Ej. 95000"
                  />
                  <p className="text-xs text-muted-foreground">Cuánto te cuesta a ti este producto.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_actual" className="text-muted-foreground">Stock Actual (Solo Lectura)</Label>
                  <Input
                    id="stock_actual"
                    type="number"
                    value={data.stock_actual}
                    disabled
                    className="bg-muted cursor-not-allowed text-muted-foreground"
                  />
                  <p className="text-[11px] text-muted-foreground leading-tight mt-1">Para modificar el stock realiza un ajuste o entrada/salida.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_minimo">Alerta de Stock Mínimo</Label>
                  <Input
                    id="stock_minimo"
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.stock_minimo}
                    onChange={e => setData('stock_minimo', e.target.value)}
                    placeholder="Ej. 5"
                  />
                  <p className="text-xs text-muted-foreground">Te avisaremos si el stock baja de este nivel.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Presentaciones / Empaques (Opcional)</h3>
                  <p className="text-xs text-muted-foreground mt-1">Configura si compras o vendes este producto en docenas, cajas, etc.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addPack}>
                  <PackagePlus className="h-4 w-4 mr-2" />
                  Agregar Empaque
                </Button>
              </div>

              {data.packs.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  El inventario se controlará únicamente en la Unidad Base.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.packs.map((pack, index) => (
                    <div key={index} className="flex flex-col gap-3 rounded-md border p-4 bg-muted/20 relative">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-2 top-2 h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removePack(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pr-8">
                        <div className="space-y-1.5 md:col-span-2">
                          <Label className="text-xs">Nombre (Ej. Caja x24)</Label>
                          <Input 
                            value={pack.nombre} 
                            onChange={e => updatePack(index, 'nombre', e.target.value)} 
                            placeholder="Caja Mayorista"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Unidad</Label>
                          <select
                            value={pack.unidad_medida}
                            onChange={e => updatePack(index, 'unidad_medida', e.target.value)}
                            className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <option value="">Selecciona...</option>
                            <option value="docena">Docena</option>
                            <option value="caja">Caja</option>
                            <option value="bulto">Bulto</option>
                            <option value="paquete">Paquete</option>
                            <option value="saco">Saco</option>
                            <option value="galon">Galón</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Factor (Cant. Base)</Label>
                          <Input 
                            type="number"
                            min="0.0001"
                            step="any"
                            value={pack.factor_conversion} 
                            onChange={e => updatePack(index, 'factor_conversion', e.target.value)} 
                            placeholder="Ej. 12"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <Label className="text-xs">Código de Barras (Opcional)</Label>
                          <div className="flex gap-2">
                            <Input 
                              value={pack.codigo_barras || ''} 
                              onChange={e => updatePack(index, 'codigo_barras', e.target.value)} 
                              className="h-8 text-sm"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 shrink-0"
                              onClick={() => {
                                // Generate a random 12-digit string
                                const randomCode = Math.floor(100000000000 + Math.random() * 900000000000).toString()
                                updatePack(index, 'codigo_barras', randomCode)
                              }}
                              title="Autogenerar código aleatorio"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wand-2"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <Label className="text-xs">Precio de Venta Mayorista (Opcional)</Label>
                          <CurrencyInput 
                            value={pack.precio_venta} 
                            onValueChange={(val) => updatePack(index, 'precio_venta', val)} 
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Clasificación</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria_id">Categoría</Label>
                  <div className="flex items-center gap-2">
                    <select
                      id="categoria_id"
                      value={data.categoria_id || ''}
                      onChange={e => setData('categoria_id', e.target.value)}
                      className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Seleccione o cree una...</option>
                      {categorias.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                    <Button type="button" variant="outline" size="icon" onClick={() => setIsCategoriaModalOpen(true)} className="shrink-0 h-9 w-9">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marca_id">Marca</Label>
                  <div className="flex items-center gap-2">
                    <select
                      id="marca_id"
                      value={data.marca_id || ''}
                      onChange={e => setData('marca_id', e.target.value)}
                      className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Seleccione o cree una...</option>
                      {marcas.map(m => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                    <Button type="button" variant="outline" size="icon" onClick={() => setIsMarcaModalOpen(true)} className="shrink-0 h-9 w-9">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unidad_medida">Unidad Base (de Control)</Label>
                  <p className="text-[11px] leading-tight text-muted-foreground mb-2">
                    Elige la unidad más pequeña en la que venderás o controlarás este artículo.
                  </p>
                  <select
                    id="unidad_medida"
                    value={data.unidad_medida}
                    onChange={e => setData('unidad_medida', e.target.value)}
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <optgroup label="Cantidad y Piezas">
                      <option value="unidad">Unidad (Und)</option>
                      <option value="pieza">Pieza (Pz)</option>
                      <option value="docena">Docena (Doc)</option>
                      <option value="ciento">Ciento (Cto)</option>
                      <option value="millar">Millar (Mil)</option>
                    </optgroup>
                    <optgroup label="Empaques Comerciales">
                      <option value="paquete">Paquete (Pq)</option>
                      <option value="caja">Caja (Cj)</option>
                      <option value="bulto">Bulto (Bl)</option>
                      <option value="saco">Saco (Sc)</option>
                      <option value="rollo">Rollo (Rl)</option>
                      <option value="kit">Kit / Combo</option>
                    </optgroup>
                    <optgroup label="Peso y Masa">
                      <option value="kg">Kilogramo (kg)</option>
                      <option value="g">Gramo (g)</option>
                      <option value="ton">Tonelada (t)</option>
                      <option value="lb">Libra (lb)</option>
                      <option value="oz">Onza (oz)</option>
                    </optgroup>
                    <optgroup label="Volumen y Capacidad">
                      <option value="lt">Litro (L)</option>
                      <option value="ml">Mililitro (ml)</option>
                      <option value="gal">Galón (gal)</option>
                      <option value="barril">Barril (bbl)</option>
                    </optgroup>
                    <optgroup label="Longitud y Área">
                      <option value="mt">Metro (m)</option>
                      <option value="cm">Centímetro (cm)</option>
                      <option value="pulgada">Pulgada (in)</option>
                      <option value="m2">Metro Cuadrado (m²)</option>
                    </optgroup>
                    <optgroup label="Servicios y Tiempo">
                      <option value="servicio">Servicio (Srv)</option>
                      <option value="hr">Hora (hr)</option>
                      <option value="dia">Día (dia)</option>
                      <option value="mes">Mes (mes)</option>
                      <option value="proyecto">Proyecto (Proy)</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Ajustes</h3>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="is_active"
                  checked={data.is_active}
                  onCheckedChange={checked => setData('is_active', checked)}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Producto Activo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Si está inactivo, no se podrá comprar ni vender.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
      
      <CategoriaFormModal isOpen={isCategoriaModalOpen} onClose={() => setIsCategoriaModalOpen(false)} />
      <MarcaFormModal isOpen={isMarcaModalOpen} onClose={() => setIsMarcaModalOpen(false)} />
    </AuthenticatedLayout>
  )
}
