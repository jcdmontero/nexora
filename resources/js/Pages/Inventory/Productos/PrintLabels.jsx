import { useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Printer, ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react'
import Barcode from 'react-barcode'

export default function PrintLabels({ productos }) {
  // Inicializamos la lista de etiquetas a imprimir. Por defecto 1 por producto.
  const [items, setItems] = useState(
    productos.map(p => ({
      ...p,
      print_quantity: 1
    }))
  )

  const updateQuantity = (index, change) => {
    const newItems = [...items]
    const newVal = newItems[index].print_quantity + change
    if (newVal >= 0) {
      newItems[index].print_quantity = newVal
      setItems(newItems)
    }
  }

  const removeItem = (index) => {
    const newItems = [...items]
    newItems.splice(index, 1)
    setItems(newItems)
  }

  const handlePrint = () => {
    window.print()
  }

  // Generamos el array plano de etiquetas para renderizar
  const labelsToPrint = items.flatMap(item => 
    Array.from({ length: item.print_quantity }).fill(item)
  )

  return (
    <AuthenticatedLayout>
      <Head title="Imprimir Etiquetas Térmicas" />

      {/* UI Controls - Hidden during print */}
      <div className="flex flex-col gap-6 max-w-5xl mx-auto py-8 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={route('inventory.productos.index')}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Impresión de Etiquetas</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ajusta las cantidades y previsualiza las etiquetas para la impresora térmica.
              </p>
            </div>
          </div>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={labelsToPrint.length === 0}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir {labelsToPrint.length} Etiquetas
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Configuración */}
          <Card className="p-4 border-border shadow-sm md:col-span-1 h-fit">
            <h3 className="font-semibold mb-4">Productos Seleccionados</h3>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay productos para imprimir.</p>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="flex flex-col gap-2 p-3 bg-muted/30 rounded-md border">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium line-clamp-1">{item.nombre}</p>
                      <button onClick={() => removeItem(index)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground font-mono">{item.codigo}</span>
                      <div className="flex items-center gap-2 bg-background border rounded-md p-1">
                        <button 
                          onClick={() => updateQuantity(index, -1)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm w-6 text-center font-medium">{item.print_quantity}</span>
                        <button 
                          onClick={() => updateQuantity(index, 1)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Previsualización en Pantalla */}
          <Card className="p-6 border-border shadow-sm md:col-span-2 bg-muted/10">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              Vista Previa 
              <span className="text-xs font-normal text-muted-foreground">(Se adapta al ancho de tu impresora)</span>
            </h3>
            <div className="flex flex-wrap gap-4 justify-center bg-white p-8 rounded-lg border shadow-inner min-h-[400px]">
              {labelsToPrint.length === 0 ? (
                <div className="m-auto text-muted-foreground text-sm">Agrega cantidades para ver las etiquetas</div>
              ) : (
                labelsToPrint.map((label, idx) => (
                  <div key={idx} className="w-[50mm] h-[25mm] border border-dashed border-gray-300 flex flex-col items-center justify-center bg-white p-1 overflow-hidden">
                    <p className="text-[9px] font-bold text-black truncate w-full text-center mb-0.5 leading-tight">{label.nombre}</p>
                    <Barcode 
                      value={label.codigo} 
                      width={1.2} 
                      height={35} 
                      fontSize={10} 
                      margin={0} 
                      displayValue={true} 
                      background="#ffffff" 
                      lineColor="#000000" 
                    />
                    <p className="text-[10px] font-bold text-black mt-0.5">
                      ${new Intl.NumberFormat('es-CO').format(label.precio_venta)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Print Only Styles - This goes directly to the thermal printer */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          @page {
            /* Ajuste estándar para etiquetas térmicas 50x25mm */
            size: 50mm 25mm;
            margin: 0;
          }
          .print-area {
            display: flex !important;
            flex-direction: column;
            width: 50mm;
            height: 25mm;
            justify-content: center;
            align-items: center;
            page-break-after: always;
            padding: 1mm;
            box-sizing: border-box;
            background: white;
          }
        }
      `}} />

      {/* Print Elements - Only visible during printing */}
      <div className="hidden print:block w-full">
        {labelsToPrint.map((label, idx) => (
          <div key={`print-${idx}`} className="print-area">
            <p className="text-[9px] font-bold text-black truncate w-full text-center leading-tight mb-0.5">{label.nombre}</p>
            <Barcode 
              value={label.codigo} 
              width={1.2} 
              height={30} 
              fontSize={10} 
              margin={0} 
              displayValue={true} 
            />
            <p className="text-[10px] font-bold text-black mt-0.5">
              ${new Intl.NumberFormat('es-CO').format(label.precio_venta)}
            </p>
          </div>
        ))}
      </div>
    </AuthenticatedLayout>
  )
}
