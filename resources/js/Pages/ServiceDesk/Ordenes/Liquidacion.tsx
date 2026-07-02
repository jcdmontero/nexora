import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Separator } from '@/Components/ui/separator';
import {
  ArrowLeft, Check, Send, Receipt, Trash2, Plus,
  Search, X, Building2, User, Wrench, Hash, CreditCard, Percent,
  PiggyBank, Calculator, Package
} from 'lucide-react';
import { useToast } from '@/Components/toasts/ToastProvider';

// ─── Types ────────────────────────────────────────────

interface ServicioItem {
  servicio_id: number;
  nombre: string;
  cantidad: number;
  /** Internamente SIEMPRE es el precio UNITARIO */
  precio_aplicado: number;
  costo_tecnico_aplicado: number;
}

interface RepuestoItem {
  producto_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

interface ServicioCatalogo {
  id: number;
  nombre: string;
  precio_base: number;
  costo_tecnico_base: number;
}

interface ProductoCatalogo {
  id: number;
  nombre: string;
  codigo: string;
  precio_venta: number;
}

interface Totales {
  totalServicios: number;
  totalRepuestos: number;
  manoDeObra: number;
  subtotal: number;
  abono: number;
  descuento: number;
  totalAPagar: number;
}

interface OrdenData {
  id: number;
  numero_orden: string;
  cliente?: {
    id: number;
    nombre_completo?: string;
    nombre?: string;
    numero_documento?: string;
    tipo_documento?: string;
  };
  tipoEquipo?: { nombre: string };
  tipo_equipo_manual?: string;
  modelo?: { nombre: string; marca?: { nombre: string } };
  numero_serie?: string;
  estado: string;
}

interface PagoMixto {
  id: string;
  metodo: string;
  monto: number;
}

interface Props {
  ordenData: OrdenData;
  serviciosOrden: ServicioItem[];
  repuestosOrden: RepuestoItem[];
  serviciosCatalogo: ServicioCatalogo[];
  productosCatalogo: ProductoCatalogo[];
  totales: Totales;
  cajaAbierta: boolean;
}

// ─── Helpers ──────────────────────────────────────────

function formatoCOP(valor: number): string {
  return '$ ' + new Intl.NumberFormat('es-CO').format(Math.round(valor));
}

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta Débito/Crédito' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'credito', label: 'Crédito' },
];

/**
 * Convierte el precio_aplicado que viene del backend (TOTAL línea)
 * a precio UNITARIO dividiendo por cantidad.
 * Si cantidad es 0 o el precio ya es unitario, lo deja igual.
 */
function fromBackend(s: ServicioItem): ServicioItem {
  return {
    ...s,
    precio_aplicado: s.cantidad > 0 ? s.precio_aplicado / s.cantidad : s.precio_aplicado,
  };
}

// ─── Component ────────────────────────────────────────

export default function Liquidacion({
  ordenData,
  serviciosOrden = [],
  repuestosOrden = [],
  serviciosCatalogo = [],
  productosCatalogo = [],
  totales,
  cajaAbierta,
}: Props) {
  const { toast: toastFn } = useToast();
  const addToast = (opts: { title: string; description?: string; type?: string }) =>
    toastFn(`${opts.title}${opts.description ? ': ' + opts.description : ''}`, opts.type ?? 'info');

  // ─── Estados ────────────────────────────────────────
  const [pasoCompletado, setPasoCompletado] = useState(false);
  const [buscandoProducto, setBuscandoProducto] = useState('');
  const [showRepuestoForm, setShowRepuestoForm] = useState(false);
  const [showServicioForm, setShowServicioForm] = useState(false);

  // Convertimos precio_aplicado de TOTAL (backend) a UNITARIO (local)
  const [servicios, setServicios] = useState<ServicioItem[]>(
    serviciosOrden.map(fromBackend)
  );
  const [repuestos, setRepuestos] = useState<RepuestoItem[]>(repuestosOrden);

  const [manoDeObra, setManoDeObra] = useState(totales.manoDeObra || 0);

  const [tipoDescuento, setTipoDescuento] = useState<'fijo' | 'porcentaje'>('fijo');
  const [valorDescuento, setValorDescuento] = useState(totales.descuento || 0);

  const [incluirIva, setIncluirIva] = useState(false);
  const [porcentajeIva, setPorcentajeIva] = useState(19);

  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [habilitarPagosMixtos, setHabilitarPagosMixtos] = useState(false);
  const [pagosMixtos, setPagosMixtos] = useState<PagoMixto[]>([]);
  const [numeroCuotas, setNumeroCuotas] = useState(1);

  const [baseApertura, setBaseApertura] = useState(50000);
  const [cajaSeleccionada, setCajaSeleccionada] = useState<number | null>(null);
  const [cajasDisponibles, setCajasDisponibles] = useState<Array<{ id: number; nombre: string }>>([]);
  const [processing, setProcessing] = useState(false);
  const [abriendoCaja, setAbriendoCaja] = useState(false);
  const [cajaAbiertaLocal, setCajaAbiertaLocal] = useState(cajaAbierta);

  // ─── Cálculos (simples, sin useMemo — React recalcula en cada render) ───

  // Total servicios: suma de (precio_unitario × cantidad) para cada línea
  const totalServicios = servicios.reduce(
    (acc, s) => acc + (s.precio_aplicado || 0) * (s.cantidad || 0),
    0
  );

  // Total repuestos: suma de (precio_unitario × cantidad) para cada línea
  const totalRepuestosValor = repuestos.reduce(
    (acc, r) => acc + (r.precio_unitario || 0) * (r.cantidad || 0),
    0
  );

  const abono = Number(totales.abono) || 0;

  // El cobro se compone de Servicios + Repuestos + Mano de Obra
  const subtotal = totalServicios + totalRepuestosValor + (manoDeObra || 0);
  const cantidadServicios = servicios.length;

  // Descuento: capping estricto para que nunca exceda máximos
  const maxDescuento = tipoDescuento === 'porcentaje' ? 100 : subtotal;
  const descuentoValido = Math.min(Math.max(valorDescuento, 0), maxDescuento);
  const descuentoExcedeMax = valorDescuento > maxDescuento;

  let descuentoCalculado = 0;
  if (tipoDescuento === 'porcentaje') {
    descuentoCalculado = subtotal * (descuentoValido / 100);
  } else {
    descuentoCalculado = descuentoValido;
  }

  const subtotalConDescuento = subtotal - descuentoCalculado;
  const iva = incluirIva ? subtotalConDescuento * (porcentajeIva / 100) : 0;
  const total = subtotalConDescuento + iva;
  const saldoPendiente = Math.max(0, total - abono);

  const sumaPagosMixtos = pagosMixtos.reduce((acc, p) => acc + (p.monto || 0), 0);

  // ─── Handlers (funciones planas, sin useCallback) ───

  function addServicio(id: string) {
    const s = serviciosCatalogo.find((x) => x.id === Number(id));
    if (!s || servicios.some((x) => x.servicio_id === s.id)) return;
    setServicios([
      ...servicios,
      {
        servicio_id: s.id,
        nombre: s.nombre,
        cantidad: 1,
        precio_aplicado: Number(s.precio_base || 0),   // ← unitario
        costo_tecnico_aplicado: Number(s.costo_tecnico_base || 0),
      },
    ]);
    setShowServicioForm(false);
  }

  function updServicio(i: number, campo: keyof ServicioItem, val: number) {
    const next = [...servicios];
    next[i] = { ...next[i], [campo]: val };
    setServicios(next);
  }

  function delServicio(i: number) {
    setServicios(servicios.filter((_, idx) => idx !== i));
  }

  function addRepuesto(id: number) {
    const p = productosCatalogo.find((x) => x.id === Number(id));
    if (!p || repuestos.some((x) => x.producto_id === p.id)) return;
    setRepuestos([
      ...repuestos,
      {
        producto_id: p.id,
        nombre: p.nombre,
        cantidad: 1,
        precio_unitario: Number(p.precio_venta || 0),
      },
    ]);
    setShowRepuestoForm(false);
    setBuscandoProducto('');
  }

  function updRepuesto(i: number, campo: keyof RepuestoItem, val: number) {
    const next = [...repuestos];
    next[i] = { ...next[i], [campo]: val };
    setRepuestos(next);
  }

  function delRepuesto(i: number) {
    setRepuestos(repuestos.filter((_, idx) => idx !== i));
  }

  function agregarPagoMixto() {
    setPagosMixtos([...pagosMixtos, { id: crypto.randomUUID(), metodo: 'efectivo', monto: 0 }]);
  }

  function actualizarPagoMixto(id: string, campo: keyof PagoMixto, valor: string | number) {
    setPagosMixtos(pagosMixtos.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)));
  }

  function eliminarPagoMixto(id: string) {
    setPagosMixtos(pagosMixtos.filter((p) => p.id !== id));
  }

  async function abrirCajaAhora() {
    setAbriendoCaja(true);
    try {
      // 1. Obtener cajas disponibles desde el endpoint de estado del módulo Cash.
      const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
      const estadoRes = await fetch(route('cash.caja.estado'), {
        headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf },
      });
      if (!estadoRes.ok) { throw new Error('No se pudo consultar el estado de caja'); }
      const estadoData = await estadoRes.json();
      const cajas = (estadoData.cajasDisponibles ?? []) as Array<{ id: number; nombre: string }>;

      if (cajas.length === 0) {
        addToast({ title: 'Sin cajas disponibles', description: 'No hay cajas activas. Contacta al administrador.', type: 'error' });
        setAbriendoCaja(false);
        return;
      }

      // Preseleccionar la primera caja y mostrar el selector si hay varias.
      setCajasDisponibles(cajas);
      if (cajaSeleccionada === null) {
        setCajaSeleccionada(cajas[0].id);
      }

      const cajaIdAUsar = cajaSeleccionada ?? cajas[0].id;

      // 2. Abrir la caja seleccionada (respuesta 302 = éxito, 409 = error validación)
      const abrirRes = await fetch(route('cash.caja.abrir'), {
        method: 'POST',
        headers: {
          'X-Inertia': 'true', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ caja_id: cajaIdAUsar, saldo_inicial: baseApertura }),
        redirect: 'manual',
      });

      if (abrirRes.status === 409) {
        const errData = await abrirRes.json();
        const msgs = Object.values(errData.errors ?? {}).flat() as string[];
        addToast({ title: 'Error de Caja', description: msgs.join(', ') || 'Error de validación', type: 'error' });
      } else if (abrirRes.status === 302 || abrirRes.status === 303) {
        setCajaAbiertaLocal(true);
        const nombreCaja = cajas.find((c) => c.id === cajaIdAUsar)?.nombre ?? '';
        addToast({ title: 'Caja Abierta', description: `${nombreCaja} — Turno iniciado con $${baseApertura.toLocaleString('es-CO')}`, type: 'success' });
      } else {
        addToast({ title: 'Error de Caja', description: 'Respuesta inesperada del servidor.', type: 'error' });
      }
    } catch {
      addToast({ title: 'Error de Conexión', description: 'No se pudo contactar el servidor. Intenta de nuevo.', type: 'error' });
    }
    setAbriendoCaja(false);
  }

  function submitLiquidacion(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);

    // Al enviar convertimos precio_aplicado de UNITARIO a TOTAL (× cantidad)
    // porque así lo espera el backend en la tabla pivote
    const payload: Record<string, unknown> = {
      precio_cliente: manoDeObra,
      descuento: descuentoCalculado,
      incluir_iva: incluirIva,
      porcentaje_iva: incluirIva ? porcentajeIva : 0,
      metodo_pago: metodoPago,
      servicios: servicios.map((s) => ({
        servicio_id: s.servicio_id,
        cantidad: s.cantidad || 1,
        precio_aplicado: (s.precio_aplicado || 0) * (s.cantidad || 1),  // ← TOTAL
        costo_tecnico_aplicado: s.costo_tecnico_aplicado ?? 0,
      })),
      repuestos: repuestos.map((r) => ({
        producto_id: r.producto_id,
        cantidad: r.cantidad || 1,
        precio_unitario: r.precio_unitario,
      })),
    };

    if (!cajaAbiertaLocal) {
      payload.base_apertura = baseApertura;
      // Enviar la caja seleccionada para que el backend abra el turno en la caja correcta.
      if (cajaSeleccionada !== null) {
        payload.caja_id = cajaSeleccionada;
      }
    }

    if (habilitarPagosMixtos) {
      payload.pagos_mixtos = pagosMixtos;
    }

    if (habilitarPagosMixtos) {
      payload.pagos_mixtos = pagosMixtos;
    }

    router.post(route('service-desk.ordenes.liquidar.update', ordenData.id), payload, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => {
        addToast({
          title: 'Prefactura Completada',
          description: 'Orden cerrada, prefactura generada y cobro registrado exitosamente.',
          type: 'success',
        });
        setPasoCompletado(true);
        setProcessing(false);
      },
      onError: (errors: Record<string, string>) => {
        setProcessing(false);
        if (errors.base_apertura) {
          addToast({ title: 'Error de Caja', description: errors.base_apertura, type: 'error' });
        } else {
          const mensaje = Object.values(errors).join(', ') || 'Error al procesar la prefactura.';
          addToast({ title: 'Error', description: mensaje, type: 'error' });
        }
      },
    });
  }

  function enviarFactura(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const canales: string[] = [];
    if (formData.get('whatsapp')) canales.push('whatsapp');
    if (formData.get('telegram')) canales.push('telegram');
    if (formData.get('email')) canales.push('email');

    if (canales.length === 0) {
      addToast({
        title: 'Seleccione un canal',
        description: 'Debe seleccionar al menos un canal para notificar.',
        type: 'error',
      });
      return;
    }

    router.post(route('service-desk.ordenes.prefactura.notificar', ordenData.id), { canales }, {
      onSuccess: () => {
        addToast({
          title: 'Prefactura Enviada',
          description: 'La prefactura ha sido enviada por los canales seleccionados.',
          type: 'success',
        });
      },
    });
  }

  // ─── Derived data ───────────────────────────────────

  const productosFiltrados = buscandoProducto
    ? productosCatalogo.filter(
        (p) =>
          p.nombre.toLowerCase().includes(buscandoProducto.toLowerCase()) ||
          p.codigo.toLowerCase().includes(buscandoProducto.toLowerCase())
      )
    : productosCatalogo;

  const clienteNombre = ordenData.cliente?.nombre_completo || ordenData.cliente?.nombre || 'N/A';
  const equipoNombre = ordenData.modelo?.nombre || ordenData.tipo_equipo_manual || 'N/A';
  const marcaNombre = ordenData.modelo?.marca?.nombre || '';
  const documentoCliente = ordenData.cliente?.numero_documento
    ? `${ordenData.cliente.tipo_documento || 'CC'} ${ordenData.cliente.numero_documento}`
    : 'N/A';

  // ─── Render ─────────────────────────────────────────

  return (
    <AuthenticatedLayout title={`Prefactura de orden ${ordenData.numero_orden}`}>
      <Head title={`Prefactura de orden ${ordenData.numero_orden}`} />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ─── Header ─── */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Prefactura de orden {ordenData.numero_orden}
            </h1>
            <p className="text-muted-foreground text-sm">
              Revisa servicios, repuestos y completa la prefactura para cerrar la orden.
            </p>
          </div>
        </div>

        {/* ─── Datos del Cliente y Equipo ─── */}
        <Card className="shadow-sm border-0 bg-gradient-to-br from-background to-muted/30">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <User className="h-4 w-4" /> Datos del Cliente
                </h5>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente</span>
                    <span className="font-semibold text-right">{clienteNombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Documento</span>
                    <span className="font-medium">{documentoCliente}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orden</span>
                    <span className="font-semibold">{ordenData.numero_orden}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Wrench className="h-4 w-4" /> Información del Equipo
                </h5>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equipo</span>
                    <span className="font-semibold text-right">{equipoNombre}</span>
                  </div>
                  {marcaNombre && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Marca</span>
                      <span className="font-medium">{marcaNombre}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">N° Serie</span>
                    <span className="font-medium">{ordenData.numero_serie || 'No registrado'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Grid Principal ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ═══ Columna Izquierda: Servicios y Repuestos ═══ */}
          <div className="lg:col-span-2 space-y-6">

            {/* ─── Servicios ─── */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-primary" /> Servicios de Reparación
                  </CardTitle>
                  <CardDescription>Servicios a cobrar en la prefactura</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowServicioForm(!showServicioForm)}
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {showServicioForm && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3 transition-all">
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addServicio(e.target.value);
                            (e.target as HTMLSelectElement).value = '';
                          }
                        }}
                        className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-xs"
                        defaultValue=""
                      >
                        <option value="" disabled>Seleccionar servicio del catálogo…</option>
                        {serviciosCatalogo.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre} (Base: {formatoCOP(s.precio_base)})
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowServicioForm(false)}
                        className="h-9 w-9"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {servicios.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg border-border">
                    No hay servicios registrados en la prefactura.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {servicios.map((s, i) => {
                      const totalLinea = (s.precio_aplicado || 0) * (s.cantidad || 0);
                      return (
                        <div
                          key={i}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-border bg-background p-3 shadow-sm hover:shadow transition-shadow"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{s.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatoCOP(s.precio_aplicado)} c/u
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-muted-foreground mb-0.5">Cant</span>
                              <Input
                                type="number"
                                min={0.01}
                                step="any"
                                value={s.cantidad}
                                onChange={(e) => updServicio(i, 'cantidad', parseFloat(e.target.value) || 0)}
                                className="h-8 w-16 text-center text-xs"
                              />
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-muted-foreground mb-0.5">Precio Unit.</span>
                              <Input
                                type="number"
                                min={0}
                                step="any"
                                value={s.precio_aplicado}
                                onChange={(e) => updServicio(i, 'precio_aplicado', parseFloat(e.target.value) || 0)}
                                className="h-8 w-24 text-right text-xs"
                              />
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-muted-foreground mb-0.5">Total</span>
                              <span className="h-8 flex items-center text-xs font-semibold tabular-nums">
                                {formatoCOP(totalLinea)}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => delServicio(i)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 mt-4"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ─── Repuestos ─── */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" /> Repuestos Utilizados
                  </CardTitle>
                  <CardDescription>Repuestos y consumibles aplicados</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRepuestoForm(!showRepuestoForm)}
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {showRepuestoForm && (
                  <div className="mb-4 space-y-2 rounded-lg border border-border bg-muted/30 p-3 transition-all">
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          type="text"
                          value={buscandoProducto}
                          onChange={(e) => setBuscandoProducto(e.target.value)}
                          placeholder="Buscar repuesto por nombre o código…"
                          className="h-9 pl-8 text-xs bg-background"
                          autoFocus
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => { setShowRepuestoForm(false); setBuscandoProducto(''); }}
                        className="h-9 w-9"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded bg-background p-1">
                      {productosFiltrados.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => addRepuesto(p.id)}
                          className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs text-left transition-colors hover:bg-muted"
                        >
                          <span className="font-medium text-foreground truncate">{p.nombre}</span>
                          <span className="shrink-0 ml-2 tabular-nums text-muted-foreground">
                            {formatoCOP(p.precio_venta)}
                          </span>
                        </button>
                      ))}
                      {productosFiltrados.length === 0 && (
                        <p className="text-xs text-muted-foreground px-2 py-1">Sin resultados.</p>
                      )}
                    </div>
                  </div>
                )}

                {repuestos.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg border-border">
                    No hay repuestos registrados en la prefactura.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {repuestos.map((r, i) => {
                      const totalLinea = (r.precio_unitario || 0) * (r.cantidad || 0);
                      return (
                        <div
                          key={i}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-border bg-background p-3 shadow-sm hover:shadow transition-shadow"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{r.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatoCOP(r.precio_unitario)} c/u
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-muted-foreground mb-0.5">Cant</span>
                              <Input
                                type="number"
                                min={0.01}
                                step="any"
                                value={r.cantidad}
                                onChange={(e) => updRepuesto(i, 'cantidad', parseFloat(e.target.value) || 0)}
                                className="h-8 w-16 text-center text-xs"
                              />
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-muted-foreground mb-0.5">Precio Unit.</span>
                              <Input
                                type="number"
                                min={0}
                                step="any"
                                value={r.precio_unitario}
                                onChange={(e) => updRepuesto(i, 'precio_unitario', parseFloat(e.target.value) || 0)}
                                className="h-8 w-24 text-right text-xs"
                              />
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-muted-foreground mb-0.5">Total</span>
                              <span className="h-8 flex items-center text-xs font-semibold tabular-nums">
                                {formatoCOP(totalLinea)}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => delRepuesto(i)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 mt-4"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            {/* ─── Mano de Obra ─── */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" /> Mano de Obra
                  </CardTitle>
                  <CardDescription>Valor del diagnóstico y reparación</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 rounded-lg border border-border bg-background p-3">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Valor cobrado al cliente</p>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={manoDeObra}
                      onChange={(e) => setManoDeObra(parseFloat(e.target.value) || 0)}
                      className="h-10 text-right text-base font-bold w-full max-w-xs"
                    />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="text-lg font-bold tabular-nums text-foreground">{formatoCOP(manoDeObra)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══ Columna Derecha: Resumen Financiero ═══ */}
          <div className="space-y-6">
            {!pasoCompletado ? (
              <form onSubmit={submitLiquidacion}>
                <Card className="border-primary/50 shadow-md sticky top-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-primary" /> Resumen de Cobro
                    </CardTitle>
                    <CardDescription>Detalle y ajustes finales</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">

                    {/* ─── Detalle de costos ─── */}
                    <div className="space-y-2 text-sm">
                      {cantidadServicios > 1 && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                          <Percent className="h-3.5 w-3.5 shrink-0" />
                          Tienes <strong>{cantidadServicios} servicios</strong>. Si lo deseas, aplica un descuento
                          progresivo más abajo.
                        </div>
                      )}

                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Wrench className="h-3.5 w-3.5" /> Servicios
                        </span>
                        <span className="font-semibold tabular-nums">{formatoCOP(totalServicios)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Package className="h-3.5 w-3.5" /> Repuestos
                        </span>
                        <span className="font-semibold tabular-nums">{formatoCOP(totalRepuestosValor)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Wrench className="h-3.5 w-3.5" /> Mano de Obra
                        </span>
                        <span className="font-semibold tabular-nums">{formatoCOP(manoDeObra)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center py-1.5 font-bold">
                        <span>Subtotal</span>
                        <span className="tabular-nums">{formatoCOP(subtotal)}</span>
                      </div>
                    </div>

                    {/* ─── Descuento ─── */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <Label className="text-xs font-semibold">Descuento</Label>
                      <div className="flex gap-2">
                        <select
                          value={tipoDescuento}
                          onChange={(e) => {
                            setTipoDescuento(e.target.value as 'fijo' | 'porcentaje');
                            setValorDescuento(0);
                          }}
                          className="h-9 w-28 rounded-lg border border-input bg-background px-2 text-xs"
                        >
                          <option value="fijo">$ Fijo</option>
                          <option value="porcentaje">% Porcentaje</option>
                        </select>
                        <div className="relative flex-1">
                          {tipoDescuento === 'porcentaje' && (
                            <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          )}
                          <Input
                            type="number"
                            min={0}
                            max={maxDescuento}
                            step={tipoDescuento === 'porcentaje' ? 1 : 100}
                            value={descuentoValido}
                            onChange={(e) => {
                              const raw = parseFloat(e.target.value);
                              if (isNaN(raw) || raw < 0) { setValorDescuento(0); return; }
                              setValorDescuento(Math.min(raw, maxDescuento));
                            }}
                            className={`h-9 text-right text-xs font-bold ${descuentoExcedeMax ? 'text-red-600 border-red-500' : 'text-green-600'}`}
                          />
                        </div>
                      </div>
                      {descuentoExcedeMax && (
                        <div className="text-xs text-red-600 font-medium flex items-center gap-1">
                          <span>⚠</span>
                          <span>
                            {tipoDescuento === 'porcentaje'
                              ? 'El descuento no puede superar el 100%'
                              : `El descuento fijo no puede superar el subtotal (${formatoCOP(subtotal)})`}
                          </span>
                        </div>
                      )}
                      {descuentoCalculado > 0 && (
                        <div className="flex justify-between text-xs text-green-600 font-medium">
                          <span>Descuento aplicado{descuentoExcedeMax && ` (máx: ${tipoDescuento === 'porcentaje' ? '100%' : formatoCOP(maxDescuento)})`}</span>
                          <span>-{formatoCOP(descuentoCalculado)}</span>
                        </div>
                      )}
                    </div>

                    {/* ─── IVA ─── */}
                    <div className="space-y-2 border-t border-border pt-2">
                      <div className="flex items-center justify-between">
                        <Label
                          className="text-xs font-semibold cursor-pointer flex items-center gap-2"
                          htmlFor="toggle-iva"
                        >
                          <input
                            id="toggle-iva"
                            type="checkbox"
                            checked={incluirIva}
                            onChange={(e) => setIncluirIva(e.target.checked)}
                            className="rounded border-input text-primary h-4 w-4"
                          />
                          Incluir IVA
                        </Label>
                        {incluirIva && (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={porcentajeIva}
                              onChange={(e) => setPorcentajeIva(parseFloat(e.target.value) || 0)}
                              className="h-7 w-14 text-center text-xs"
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        )}
                      </div>
                      {incluirIva && iva > 0 && (
                        <div className="flex justify-between text-xs text-amber-600 font-medium">
                          <span>IVA ({porcentajeIva}%)</span>
                          <span>{formatoCOP(iva)}</span>
                        </div>
                      )}
                    </div>

                    {/* ─── Abono y Saldo ─── */}
                    <div className="space-y-2 border-t border-border pt-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <PiggyBank className="h-3.5 w-3.5" /> Abono inicial
                        </span>
                        <span className="text-red-600 font-medium tabular-nums">
                          -{formatoCOP(abono)}
                        </span>
                      </div>
                    </div>

                    {/* ─── Totales ─── */}
                    <Separator />
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Subtotal con descuento</span>
                        <span className="font-medium tabular-nums">{formatoCOP(subtotalConDescuento)}</span>
                      </div>
                      {incluirIva && (
                        <div className="flex justify-between items-center">
                          <span>IVA ({porcentajeIva}%)</span>
                          <span className="font-medium tabular-nums">{formatoCOP(iva)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center py-2 border-t-2 border-primary">
                      <span className="text-base font-bold">Total</span>
                      <span className="text-xl font-black text-primary tabular-nums">{formatoCOP(total)}</span>
                    </div>
                    {abono > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm font-semibold flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-amber-500" /> Saldo pendiente
                        </span>
                        <span className="text-lg font-bold text-amber-600 tabular-nums">
                          {formatoCOP(saldoPendiente)}
                        </span>
                      </div>
                    )}

                    {/* ─── Método de Pago ─── */}
                    <div className="space-y-3 border-t border-border pt-3">
                      <Label className="text-xs font-semibold">Método de Pago</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {METODOS_PAGO.map((mp) => (
                          <Button
                            key={mp.value}
                            type="button"
                            variant={metodoPago === mp.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setMetodoPago(mp.value)}
                            className="text-xs h-9"
                          >
                            <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                            {mp.label}
                          </Button>
                        ))}
                      </div>

                      {/* Cuotas si es crédito */}
                      {metodoPago === 'credito' && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                          <Label className="text-xs shrink-0">Cuotas:</Label>
                          <Input
                            type="number"
                            min={1}
                            max={36}
                            value={numeroCuotas}
                            onChange={(e) => setNumeroCuotas(parseInt(e.target.value) || 1)}
                            className="h-8 w-16 text-center text-xs"
                          />
                          <span className="text-xs text-muted-foreground">
                            de {formatoCOP(numeroCuotas > 0 ? saldoPendiente / numeroCuotas : 0)} c/u
                          </span>
                        </div>
                      )}

                      {/* Pagos Mixtos */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          id="pagos-mixtos"
                          type="checkbox"
                          checked={habilitarPagosMixtos}
                          onChange={(e) => {
                            setHabilitarPagosMixtos(e.target.checked);
                            if (!e.target.checked) setPagosMixtos([]);
                          }}
                          className="rounded border-input text-primary h-4 w-4"
                        />
                        <Label htmlFor="pagos-mixtos" className="text-xs cursor-pointer">
                          Pagos mixtos (combinar métodos)
                        </Label>
                      </div>

                      {habilitarPagosMixtos && (
                        <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Distribuir pago</span>
                            <span className="text-xs text-muted-foreground">
                              Saldo: {formatoCOP(saldoPendiente)}
                            </span>
                          </div>
                          {pagosMixtos.map((pago) => (
                            <div key={pago.id} className="flex items-center gap-2">
                              <select
                                value={pago.metodo}
                                onChange={(e) => actualizarPagoMixto(pago.id, 'metodo', e.target.value)}
                                className="h-8 flex-1 rounded border border-input bg-background px-2 text-xs"
                              >
                                {METODOS_PAGO.filter((m) => m.value !== 'credito').map((mp) => (
                                  <option key={mp.value} value={mp.value}>
                                    {mp.label}
                                  </option>
                                ))}
                              </select>
                              <Input
                                type="number"
                                min={0}
                                value={pago.monto}
                                onChange={(e) =>
                                  actualizarPagoMixto(pago.id, 'monto', parseFloat(e.target.value) || 0)
                                }
                                className="h-8 w-24 text-right text-xs"
                                placeholder="Monto"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => eliminarPagoMixto(pago.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={agregarPagoMixto}
                            className="w-full text-xs gap-1"
                          >
                            <Plus className="h-3 w-3" /> Agregar forma de pago
                          </Button>
                          {pagosMixtos.length > 0 && (
                            <div className="flex justify-between text-xs pt-1 border-t border-border">
                              <span>Total distribuido</span>
                              <span
                                className={
                                  sumaPagosMixtos > saldoPendiente + 1
                                    ? 'text-destructive font-bold'
                                    : 'font-medium'
                                }
                              >
                                {formatoCOP(sumaPagosMixtos)}
                                {sumaPagosMixtos > saldoPendiente + 1 && ' (excede)'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ─── Apertura de Caja ─── */}
                    {!cajaAbiertaLocal && (
                      <div className="space-y-3 mt-2 p-4 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                        <Label className="text-amber-800 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5">
                          <PiggyBank className="h-3.5 w-3.5" /> Apertura de Caja Requerida
                        </Label>
                        <p className="text-xs text-amber-700 dark:text-amber-500">
                          No tienes un turno de caja abierto. Ábrelo desde aquí sin perder los datos que ya llenaste.
                        </p>

                        {/* Selector de caja (solo si hay varias disponibles) */}
                        {cajasDisponibles.length > 1 && (
                          <div className="space-y-1.5">
                            <Label className="text-xs text-amber-800 dark:text-amber-400">Selecciona la caja</Label>
                            <select
                              value={cajaSeleccionada ?? ''}
                              onChange={(e) => setCajaSeleccionada(Number(e.target.value))}
                              className="h-9 w-full rounded-lg border border-amber-300 bg-background px-2 text-xs focus-visible:ring-amber-500"
                            >
                              {cajasDisponibles.map((c) => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={baseApertura}
                              onChange={(e) => setBaseApertura(parseFloat(e.target.value) || 0)}
                              className="text-right font-medium border-amber-300 focus-visible:ring-amber-500"
                              placeholder="Base inicial"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="default"
                            onClick={abrirCajaAhora}
                            disabled={abriendoCaja || baseApertura <= 0}
                            className="gap-1.5 shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            {abriendoCaja ? (
                              <>Abriendo…</>
                            ) : (
                              <><PiggyBank className="h-4 w-4" /> Abrir Caja</>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {cajaAbiertaLocal && (
                      <div className="flex items-center gap-2 p-2 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200">
                        <Check className="h-3.5 w-3.5" />
                        Turno de caja abierto — puedes procesar el cobro.
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex-col gap-2 pt-0">
                    <Button type="submit" disabled={processing} className="w-full gap-2 text-base h-12">
                      <Check className="h-5 w-5" />
                      {processing ? 'Procesando…' : 'Confirmar y Cerrar Orden'}
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Se generará la prefactura, se cerrará la orden y se registrará el cobro en caja.
                    </p>
                  </CardFooter>
                </Card>
              </form>
            ) : (
              /* ═══ Paso Completado ═══ */
              <Card className="border-green-500 shadow-md bg-green-50/50 dark:bg-green-950/20 sticky top-6">
                <CardHeader>
                  <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
                    <Check className="h-5 w-5" /> ¡Orden Cerrada!
                  </CardTitle>
                  <CardDescription>
                    Total final cobrado: <strong>{formatoCOP(total)}</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-border p-5 bg-card mt-2">
                    <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-primary" /> Emisión de Prefactura
                    </h3>

                    <p className="text-sm text-muted-foreground mb-3">Enviar prefactura al cliente a través de:</p>
                    <form onSubmit={enviarFactura}>
                      <div className="flex flex-col gap-2 mb-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" name="whatsapp" defaultChecked className="rounded border-input text-primary" /> WhatsApp
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" name="telegram" defaultChecked className="rounded border-input text-primary" /> Telegram
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" name="email" defaultChecked className="rounded border-input text-primary" /> Correo Electrónico
                        </label>
                      </div>
                      <Button type="submit" variant="secondary" className="w-full gap-2">
                        <Send className="h-4 w-4" />
                        Enviar Prefactura
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
