import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useDashboardLayout } from '@/Hooks/useDashboardLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import {
  Printer,
  ArrowLeft,
  Calendar,
  User,
  CreditCard,
  Hash,
  AlertCircle,
  CheckCircle2,
  Ban,
  Wallet
} from 'lucide-react';

interface ReciboProps extends PageProps {
  recibo: {
    id: number;
    numero: string;
    fecha: string;
    monto: number;
    metodo_pago: string;
    concepto: string;
    estado: string;
    notas: string | null;
    usuario: string;
    caja: string;
    cliente: {
      nombre: string;
      documento: string;
    } | null;
    referencia: {
      tipo: string;
      numero: string | null;
    } | null;
  };
}

export default function Show({ recibo }: ReciboProps) {
  useDashboardLayout({
    title: `Recibo de Caja: ${recibo.numero}`,
  });

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-4 h-4 mr-1" /> Activo</Badge>;
      case 'anulado':
        return <Badge variant="destructive"><Ban className="w-4 h-4 mr-1" /> Anulado</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="w-4 h-4 mr-1" /> {estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Head title={`Recibo ${recibo.numero}`} />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href={route('cash.movimientos.index')}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Detalle de Recibo</h1>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.open(route('cash.recibos.pdf', recibo.id), '_blank')}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Recibo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground flex items-center"><Hash className="h-4 w-4 mr-2"/> Número</span>
              <span className="font-medium">{recibo.numero}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground flex items-center"><Calendar className="h-4 w-4 mr-2"/> Fecha</span>
              <span>{recibo.fecha}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground flex items-center"><AlertCircle className="h-4 w-4 mr-2"/> Estado</span>
              <span>{getStatusBadge(recibo.estado)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground flex items-center"><User className="h-4 w-4 mr-2"/> Cajero</span>
              <span>{recibo.usuario}</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-muted-foreground flex items-center"><Wallet className="h-4 w-4 mr-2"/> Caja</span>
              <span>{recibo.caja}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles del Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground">Monto</span>
              <span className="text-2xl font-bold text-emerald-600">
                ${Number(recibo.monto).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground flex items-center"><CreditCard className="h-4 w-4 mr-2"/> Método de Pago</span>
              <span className="capitalize">{recibo.metodo_pago}</span>
            </div>
            
            {recibo.cliente && (
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Cliente</span>
                <div className="text-right">
                  <div className="font-medium">{recibo.cliente.nombre}</div>
                  <div className="text-sm text-muted-foreground">{recibo.cliente.documento}</div>
                </div>
              </div>
            )}
            
            {recibo.referencia && (
              <div className="flex justify-between items-center pb-2">
                <span className="text-muted-foreground">Referencia</span>
                <span className="font-medium">
                  {recibo.referencia.tipo} {recibo.referencia.numero ? `#${recibo.referencia.numero}` : ''}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Concepto y Notas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Concepto</h4>
              <p className="p-3 bg-secondary/20 rounded-md border">{recibo.concepto}</p>
            </div>
            {recibo.notas && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Notas</h4>
                <p className="text-sm whitespace-pre-wrap">{recibo.notas}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
