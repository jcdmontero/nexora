import { useState, useMemo } from 'react'
import { router, useForm, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Badge } from '@/Components/ui/badge'
import { Label } from '@/Components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { Search, ShoppingCart, Trash2, CreditCard, LockOpen, Wrench } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog'
import { useToast } from '@/Components/toasts/ToastProvider'

export default function PosIndex({ productos, clientes, sesionActiva, serviciosCatalogo = [] }) {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('productos')
  const [cart, setCart] = useState([])
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const { flash } = useToast()

  const { data, setData, post, processing } = useForm({
    cliente_id: '',
    metodo_pago: 'efectivo',
    items: []
  })

  const filteredProducts = useMemo(() => {
    if (tab === 'servicios') return []
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(search.toLowerCase()) || 
      (p.codigo_barras && p.codigo_barras.includes(search))
    )
  }, [productos, search, tab])

  const filteredServicios = useMemo(() => {
    if (tab !== 'servicios') return []
    return serviciosCatalogo.filter(s => 
      s.nombre.toLowerCase().includes(search.toLowerCase())
    )
  }, [serviciosCatalogo, search, tab])

  const addToCart = (item) => {
    setCart(prev => {
        const existing = prev.find(i => i.uniqueId === item.uniqueId)
        if (existing) {
            return prev.map(i => i.uniqueId === item.uniqueId ? { ...i, qty: i.qty + 1 } : i)
        }
        return [...prev, { ...item, qty: 1 }]
    })
  }

  const addProducto = (prod) => {
    addToCart({
      uniqueId: `prod-${prod.id}`,
      id: prod.id,
      tipo: 'producto',
      nombre: prod.nombre,
      precio_venta: Number(prod.precio_venta),
      codigo_barras: prod.codigo_barras,
      stock_actual: prod.stock_actual,
    })
  }

  const addServicio = (serv) => {
    addToCart({
      uniqueId: `serv-${serv.id}`,
      id: serv.id,
      tipo: 'servicio',
      nombre: serv.nombre,
      precio_venta: Number(serv.precio_base),
    })
  }

  const updateQty = (uniqueId, delta) => {
      setCart(prev => prev.map(i => {
          if (i.uniqueId === uniqueId) {
              const newQty = Math.max(1, i.qty + delta)
              return { ...i, qty: newQty }
          }
          return i
      }))
  }

  const removeFromCart = (uniqueId) => {
      setCart(prev => prev.filter(i => i.uniqueId !== uniqueId))
  }

  const total = cart.reduce((acc, item) => acc + (item.precio_venta * item.qty), 0)

  const handleCheckout = () => {
      if (cart.length === 0) return
      
      if (!sesionActiva && data.metodo_pago !== 'credito') {
          alert('Debes abrir un turno de caja primero para realizar cobros de contado.')
          return
      }

      setData('items', cart.map(i => ({
          tipo: i.tipo,
          producto_id: i.tipo === 'producto' ? i.id : null,
          descripcion: i.nombre,
          cantidad: i.qty,
          precio_unitario: i.precio_venta,
      })))
      
      setIsCheckoutOpen(true)
  }

  const processPayment = (e) => {
      e.preventDefault()
      post(route('sales.pos.store'), {
          onSuccess: () => {
              setIsCheckoutOpen(false)
              setCart([])
          }
      })
  }

  return (
    <AuthenticatedLayout>
      <div className="flex h-[calc(100vh-100px)] gap-6">
        
        {/* Panel de Productos */}
        <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">Punto de Venta</h2>
                    {sesionActiva ? (
                        <p className="text-sm text-emerald-600 flex items-center gap-1"><LockOpen className="h-4 w-4"/> Turno Abierto ({sesionActiva.caja.nombre})</p>
                    ) : (
                        <p className="text-sm text-rose-600 flex items-center gap-1"><Badge variant="destructive">Turno Cerrado</Badge> Solo ventas a crédito.</p>
                    )}
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por nombre o código..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 bg-background"
                        autoFocus
                    />
                </div>
            </div>

            {/* Pestañas Productos / Servicios */}
            <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-0.5 w-fit">
              <button
                type="button"
                onClick={() => { setTab('productos'); setSearch('') }}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === 'productos' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <ShoppingCart className="h-4 w-4" /> Productos
              </button>
              <button
                type="button"
                onClick={() => { setTab('servicios'); setSearch('') }}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === 'servicios' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Wrench className="h-4 w-4" /> Servicios
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {tab === 'productos' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                    {filteredProducts.map(p => (
                        <Card 
                            key={p.id} 
                            className="cursor-pointer hover:border-primary transition-colors flex flex-col"
                            onClick={() => addProducto(p)}
                        >
                            <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-t-lg flex items-center justify-center p-4">
                                {p.imagen_url ? (
                                    <img src={p.imagen_url} alt={p.nombre} className="max-h-full object-contain mix-blend-multiply" />
                                ) : (
                                    <ShoppingCart className="h-10 w-10 text-slate-300" />
                                )}
                            </div>
                            <CardContent className="p-3 flex-1 flex flex-col justify-between">
                                <div>
                                    <p className="font-semibold text-sm line-clamp-2">{p.nombre}</p>
                                    <p className="text-xs text-muted-foreground">{p.codigo_barras || 'Sin código'}</p>
                                </div>
                                <div className="mt-2 flex justify-between items-center">
                                    <span className="font-bold text-primary">${Number(p.precio_venta).toLocaleString()}</span>
                                    <span className="text-xs font-medium text-muted-foreground">Stock: {p.stock_actual}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground">
                            No se encontraron productos.
                        </div>
                    )}
                </div>
                ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                    {filteredServicios.map(s => (
                        <Card 
                            key={s.id} 
                            className="cursor-pointer hover:border-indigo-400 transition-colors flex flex-col border-indigo-200/50 dark:border-indigo-500/20"
                            onClick={() => addServicio(s)}
                        >
                            <div className="h-32 bg-indigo-50 dark:bg-indigo-950/30 rounded-t-lg flex items-center justify-center p-4">
                                <Wrench className="h-12 w-12 text-indigo-300 dark:text-indigo-600" />
                            </div>
                            <CardContent className="p-3 flex-1 flex flex-col justify-between">
                                <div>
                                    <p className="font-semibold text-sm line-clamp-2">{s.nombre}</p>
                                    <p className="text-xs text-muted-foreground">Servicio</p>
                                </div>
                                <div className="mt-2 flex justify-between items-center">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">${Number(s.precio_base).toLocaleString()}</span>
                                    <span className="text-xs font-medium text-muted-foreground">Sin stock</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {filteredServicios.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground">
                            No se encontraron servicios.
                        </div>
                    )}
                </div>
                )}
            </div>
        </div>

        {/* Panel del Carrito */}
        <div className="w-[380px] bg-white dark:bg-slate-950 border rounded-xl flex flex-col shadow-sm">
            <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50 rounded-t-xl flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2"><ShoppingCart className="h-5 w-5"/> Ticket Actual</h3>
                <Badge variant="secondary">{cart.length} items</Badge>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3">
                        <ShoppingCart className="h-12 w-12 opacity-20" />
                        <p className="text-sm">El carrito está vacío</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {cart.map(item => (
                            <div key={item.uniqueId} className="flex justify-between items-start p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                                <div className="flex-1 pr-2">
                                    <p className="text-sm font-medium leading-tight">{item.nombre}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.tipo === 'servicio' ? (
                                        <span className="text-indigo-600 dark:text-indigo-400">Servicio</span>
                                      ) : (
                                        <>${Number(item.precio_venta).toLocaleString()} c/u · Stock: {item.stock_actual}</>
                                      )}
                                    </p>
                                    
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center border rounded-md bg-background">
                                            <button onClick={() => updateQty(item.uniqueId, -1)} className="px-2 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-lg leading-none">−</button>
                                            <span className="px-2 text-sm font-medium w-8 text-center">{item.qty}</span>
                                            <button onClick={() => updateQty(item.uniqueId, 1)} className="px-2 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-lg leading-none">+</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="font-bold text-sm">${(item.precio_venta * item.qty).toLocaleString()}</span>
                                    <button onClick={() => removeFromCart(item.uniqueId)} className="text-rose-500 hover:bg-rose-50 p-1 rounded">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 border-t bg-slate-50 dark:bg-slate-900 rounded-b-xl space-y-4">
                <div className="flex justify-between items-end">
                    <span className="text-muted-foreground font-medium">Total a Pagar</span>
                    <span className="text-3xl font-black text-primary">${total.toLocaleString()}</span>
                </div>
                
                <Button 
                    className="w-full py-6 text-lg" 
                    size="lg" 
                    disabled={cart.length === 0}
                    onClick={handleCheckout}
                >
                    <CreditCard className="mr-2 h-5 w-5" /> Cobrar Ticket
                </Button>
            </div>
        </div>
      </div>

      {/* Modal de Pago */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogContent>
              <form onSubmit={processPayment}>
                  <DialogHeader>
                      <DialogTitle className="text-2xl">Resumen de Pago</DialogTitle>
                  </DialogHeader>
                  <div className="py-6 space-y-6">
                      <div className="flex justify-between items-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <span className="text-lg">Total a Pagar:</span>
                          <span className="text-3xl font-black text-primary">${total.toLocaleString()}</span>
                      </div>

                      <div className="space-y-4">
                          <div className="space-y-2">
                              <Label>Cliente (Opcional)</Label>
                              <Select value={data.cliente_id} onValueChange={v => setData('cliente_id', v)}>
                                  <SelectTrigger><SelectValue placeholder="Consumidor Final" /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="">Consumidor Final</SelectItem>
                                      {clientes.map(c => (
                                          <SelectItem key={c.id} value={c.id.toString()}>{c.nombres} {c.apellidos} {c.razon_social}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>

                          <div className="space-y-2">
                              <Label>Método de Pago</Label>
                              <Select value={data.metodo_pago} onValueChange={v => setData('metodo_pago', v)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="efectivo">Efectivo</SelectItem>
                                      <SelectItem value="tarjeta">Tarjeta (Débito/Crédito)</SelectItem>
                                      <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                                      <SelectItem value="credito">Crédito (Fiado - CxC)</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                      </div>
                  </div>
                  <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setIsCheckoutOpen(false)}>Volver al Carrito</Button>
                      <Button type="submit" size="lg" disabled={processing} className="px-8">
                          {processing ? 'Procesando...' : 'Confirmar Pago'}
                      </Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  )
}
