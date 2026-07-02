import { useState, useCallback } from 'react'
import { router, useForm, Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Pagination } from '@/Components/ui/pagination'
import { PageHeader } from '@/Components/ui/page-header'
import {
  Scale,
  Plus,
  Gavel,
  Save,
  X,
  DollarSign,
  Clock,
  Calculator,
} from 'lucide-react'

// Select nativo con misma apariencia que Input
const selectClass =
  'flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30'

/**
 * Formato moneda COP.
 * @param {number|string|null|undefined} val
 * @returns {string}
 */
const fmt = (val) => {
  if (val == null) return '—'
  const n = typeof val === 'string' ? Number.parseFloat(val) : val
  return '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

/**
 * Página de configuración legal anual (SMMLV, UVT, aportes).
 * @param {{ configuraciones: { data: Array, current_page: number, last_page: number, total: number }, filters: { year?: string } }} props
 */
export default function ConfiguracionLegalIndex({ configuraciones, filters }) {
  // ─── Modal ───
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)

  // ─── Formulario crear/editar ───
  const { data, setData, post, put, processing, errors, reset } = useForm({
    ano_vigencia: '',
    salario_minimo: '',
    auxilio_transporte: '',
    tope_auxilio_transporte_salarios: '2',
    valor_uvt: '',
    horas_semanales: '46',
    aporte_salud_empleado: '4',
    aporte_pension_empleado: '4',
    aporte_salud_patronal: '8.5',
    aporte_pension_patronal: '12',
    caja_compensacion: '4',
    sena: '2',
    icbf: '3',
  })

  // ─── Abrir modal para crear ───
  const openCreate = () => {
    setEditingId(null)
    reset()
    setShowModal(true)
  }

  // ─── Abrir modal para editar ───
  const openEdit = useCallback(
    (config) => {
      setEditingId(config.id)
      setData({
        ano_vigencia: String(config.ano_vigencia),
        salario_minimo: String(config.salario_minimo),
        auxilio_transporte: String(config.auxilio_transporte),
        tope_auxilio_transporte_salarios: String(
          config.tope_auxilio_transporte_salarios ?? '2',
        ),
        valor_uvt: String(config.valor_uvt ?? ''),
        horas_semanales: String(config.horas_semanales ?? '46'),
        aporte_salud_empleado: String(config.aporte_salud_empleado ?? '4'),
        aporte_pension_empleado: String(config.aporte_pension_empleado ?? '4'),
        aporte_salud_patronal: String(config.aporte_salud_patronal ?? '8.5'),
        aporte_pension_patronal: String(config.aporte_pension_patronal ?? '12'),
        caja_compensacion: String(config.caja_compensacion ?? '4'),
        sena: String(config.sena ?? '2'),
        icbf: String(config.icbf ?? '3'),
      })
      setShowModal(true)
    },
    [setData],
  )

  // ─── Cerrar modal ───
  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    reset()
  }

  // ─── Enviar formulario ───
  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingId) {
      put(route('hr.configuracion-legal.update', editingId), {
        onSuccess: closeModal,
        preserveScroll: true,
      })
    } else {
      post(route('hr.configuracion-legal.store'), {
        onSuccess: closeModal,
        preserveScroll: true,
      })
    }
  }

  // ─── Columnas DataTable ───
  const columns = [
    {
      key: 'ano_vigencia',
      header: 'Año',
      className: 'w-20',
      cell: (row) => (
        <span className="font-semibold tabular-nums">{row.ano_vigencia}</span>
      ),
    },
    {
      key: 'salario_minimo',
      header: 'SMMLV',
      cell: (row) => (
        <span className="tabular-nums font-medium">{fmt(row.salario_minimo)}</span>
      ),
    },
    {
      key: 'auxilio_transporte',
      header: 'Aux. Transporte',
      cell: (row) => (
        <span className="tabular-nums">{fmt(row.auxilio_transporte)}</span>
      ),
    },
    {
      key: 'valor_uvt',
      header: 'UVT',
      cell: (row) =>
        row.valor_uvt != null ? (
          <span className="tabular-nums">{fmt(row.valor_uvt)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'horas_semanales',
      header: 'Horas Sem.',
      hideOnMobile: true,
      cell: (row) => (
        <span className="tabular-nums">{row.horas_semanales}h</span>
      ),
    },
    {
      key: 'acciones',
      header: '',
      alignEnd: true,
      className: 'w-16',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openEdit(row)}
          className="text-xs"
        >
          Editar
        </Button>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Configuración Legal" />

      <PageHeader
        title="Configuración Legal"
        description="Parámetros legales anuales: SMMLV, auxilio de transporte, UVT y porcentajes de aportes"
        icon={Scale}
        actions={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Configuración
          </Button>
        }
      />

      {/* Cuadro informativo */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-card p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <Gavel className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">
            Parámetros legales para liquidación de nómina
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Estos valores se usan como base para el cálculo de la nómina y los aportes de seguridad
            social. Deben actualizarse cada año según la legislación colombiana vigente.
          </p>
        </div>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuraciones por Año</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {configuraciones?.data?.length > 0 ? (
            <div>
              <DataTable
                columns={columns}
                data={configuraciones.data}
                rowKey={(r) => r.id}
              />
              <Pagination
                page={configuraciones.current_page}
                totalPages={configuraciones.last_page}
                onPage={(p) =>
                  router.get(
                    route('hr.configuracion-legal.index'),
                    { page: p },
                    { preserveState: true },
                  )
                }
              />
            </div>
          ) : (
            <EmptyState
              icon={Scale}
              title="Sin configuración legal"
              description="No hay configuraciones registradas. Crea la primera para el año vigente."
              action={{
                label: 'Nueva Configuración',
                onClick: openCreate,
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* ─── Modal Crear/Editar ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/20 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl bg-popover p-6 shadow-lg ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  {editingId ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {editingId ? 'Editar Configuración' : 'Nueva Configuración Legal'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {editingId
                      ? `Actualiza los parámetros para el año ${data.ano_vigencia}`
                      : 'Registra los parámetros legales para un año'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Datos básicos del año */}
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  Vigencia
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ano_vigencia">
                      Año de Vigencia <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="ano_vigencia"
                      type="number"
                      min="2000"
                      max="2100"
                      placeholder="2026"
                      value={data.ano_vigencia}
                      onChange={(e) => setData('ano_vigencia', e.target.value)}
                      required
                      disabled={!!editingId}
                    />
                    {errors.ano_vigencia && (
                      <p className="text-xs text-destructive">{errors.ano_vigencia}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="horas_semanales">Horas Semanales</Label>
                    <Input
                      id="horas_semanales"
                      type="number"
                      min="1"
                      max="60"
                      value={data.horas_semanales}
                      onChange={(e) => setData('horas_semanales', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Valores monetarios */}
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  Valores Base
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="salario_minimo">
                      Salario Mínimo <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="salario_minimo"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="1.423.500"
                      value={data.salario_minimo}
                      onChange={(e) => setData('salario_minimo', e.target.value)}
                      required
                    />
                    {errors.salario_minimo && (
                      <p className="text-xs text-destructive">{errors.salario_minimo}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="auxilio_transporte">
                      Auxilio Transporte <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="auxilio_transporte"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="200.000"
                      value={data.auxilio_transporte}
                      onChange={(e) => setData('auxilio_transporte', e.target.value)}
                      required
                    />
                    {errors.auxilio_transporte && (
                      <p className="text-xs text-destructive">{errors.auxilio_transporte}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="valor_uvt">Valor UVT</Label>
                    <Input
                      id="valor_uvt"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="47.065"
                      value={data.valor_uvt}
                      onChange={(e) => setData('valor_uvt', e.target.value)}
                    />
                    {errors.valor_uvt && (
                      <p className="text-xs text-destructive">{errors.valor_uvt}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 sm:w-1/3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tope_auxilio_transporte_salarios">
                      Tope Aux. Transporte (SMMLV)
                    </Label>
                    <Input
                      id="tope_auxilio_transporte_salarios"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="2"
                      value={data.tope_auxilio_transporte_salarios}
                      onChange={(e) =>
                        setData('tope_auxilio_transporte_salarios', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Aportes */}
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Calculator className="h-4 w-4 text-violet-500" />
                  Porcentajes de Aportes (%)
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="aporte_salud_empleado">Salud Empleado (%)</Label>
                    <Input
                      id="aporte_salud_empleado"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.aporte_salud_empleado}
                      onChange={(e) => setData('aporte_salud_empleado', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="aporte_pension_empleado">Pensión Empleado (%)</Label>
                    <Input
                      id="aporte_pension_empleado"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.aporte_pension_empleado}
                      onChange={(e) => setData('aporte_pension_empleado', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="aporte_salud_patronal">Salud Patronal (%)</Label>
                    <Input
                      id="aporte_salud_patronal"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.aporte_salud_patronal}
                      onChange={(e) => setData('aporte_salud_patronal', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="aporte_pension_patronal">Pensión Patronal (%)</Label>
                    <Input
                      id="aporte_pension_patronal"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.aporte_pension_patronal}
                      onChange={(e) => setData('aporte_pension_patronal', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="caja_compensacion">Caja de Compensación (%)</Label>
                    <Input
                      id="caja_compensacion"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.caja_compensacion}
                      onChange={(e) => setData('caja_compensacion', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sena">SENA (%)</Label>
                    <Input
                      id="sena"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.sena}
                      onChange={(e) => setData('sena', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="icbf">ICBF (%)</Label>
                    <Input
                      id="icbf"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.icbf}
                      onChange={(e) => setData('icbf', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={processing} className="gap-2">
                  <Save className="h-4 w-4" />
                  {processing
                    ? 'Guardando…'
                    : editingId
                      ? 'Actualizar'
                      : 'Crear Configuración'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  )
}
