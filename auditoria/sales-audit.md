# Auditoría: Sales (Ventas / POS)

> Actualizado: 2026-07-06
> Modulo: Ventas / POS (sales) v1.0.0
> Stack: Laravel 13 + PHP 8.3 + Inertia + React 19 + Tailwind v4 + Shadcn/ui

---

## module.json

**Ruta:** app/Modules/Sales/module.json

```json
{
    "code": "sales",
    "name": "Ventas / POS",
    "version": "1.0.0",
    "description": "Punto de venta, facturación y gestión de ventas.",
    "icon": "ShoppingCart",
    "core": false,
    "dependencies": ["crm", "cash", "purchasing"],
    "permissions": [
        "sales:view",
        "sales:create",
        "sales:edit",
        "sales:delete",
        "sales:anular",
        "sales:admin"
    ],
    "menus": [
        {
            "section": "VENTAS",
            "icon": "ShoppingCart",
            "items": [
                { "label": "Punto de Venta", "route": "sales.pos.index", "permission": "sales:create" },
                { "label": "Facturas", "route": "sales.facturas.index", "permission": "sales:view" }
            ]
        }
    ]
}
```

---

## Providers

### SalesServiceProvider.php

**Ruta:** app/Modules/Sales/Providers/SalesServiceProvider.php

```php
<?php

namespace App\Modules\Sales\Providers;

use Illuminate\Support\ServiceProvider;
use App\Modules\Sales\Services\ElectronicBilling\SignatureProviderInterface;
use App\Modules\Sales\Services\ElectronicBilling\DianProviderInterface;
use App\Modules\Sales\Services\ElectronicBilling\XmlUBLGenerator;
use App\Modules\Sales\Services\ElectronicBilling\Providers\MockSignatureProvider;
use App\Modules\Sales\Services\ElectronicBilling\Providers\MockDianProvider;
use App\Modules\Sales\Services\ElectronicBilling\Providers\RealDianProvider;
use App\Modules\Sales\Services\ElectronicBilling\XmlSigner;

class SalesServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->registerElectronicBillingBindings();
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Migrations');
    }

    private function registerElectronicBillingBindings(): void
    {
        // Always bind the UBL generator (stateless, no external dependencies)
        $this->app->singleton(XmlUBLGenerator::class);

        // Resolve provider mode from config
        $providerMode = config('dian.provider', 'mock');

        if ($providerMode === 'real') {
            $this->app->bind(DianProviderInterface::class, RealDianProvider::class);
            $this->app->bind(SignatureProviderInterface::class, XmlSigner::class);
        } else {
            $this->app->bind(DianProviderInterface::class, MockDianProvider::class);
            $this->app->bind(SignatureProviderInterface::class, MockSignatureProvider::class);
        }
    }
}
```

---

## Routes

### web.php

**Ruta:** app/Modules/Sales/Routes/web.php

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Sales\Controllers\FacturaController;
use App\Modules\Sales\Controllers\PosController;

Route::middleware(['web', 'auth', 'tenant', 'module:sales'])->group(function () {
    Route::prefix('sales')->name('sales.')->group(function () {
        
        // Punto de Venta (POS)
        Route::get('pos', [PosController::class, 'index'])->name('pos.index')->middleware('permission:sales:create');
        Route::post('pos', [PosController::class, 'store'])->name('pos.store')->middleware('permission:sales:create');
        
        // Facturas
        Route::get('facturas', [FacturaController::class, 'index'])->name('facturas.index')->middleware('permission:sales:view');
        Route::get('facturas/{factura}/pdf', [FacturaController::class, 'pdf'])->name('facturas.pdf')->middleware('permission:sales:view');
        Route::get('facturas/{factura}', [FacturaController::class, 'show'])->name('facturas.show')->middleware('permission:sales:view');
        Route::post('facturas/{factura}/emitir', [FacturaController::class, 'emitir'])->name('facturas.emitir')->middleware('permission:sales:edit');
        Route::post('facturas/{factura}/anular', [FacturaController::class, 'anular'])->name('facturas.anular')->middleware('permission:sales:anular');

        // Configuración
        Route::get('configuracion', function () {
            return inertia('Sales/Configuracion');
        })->name('configuracion')->middleware('permission:sales:admin');

    });
});
```

---

## Controllers

### FacturaController.php

**Ruta:** app/Modules/Sales/Controllers/FacturaController.php

```php
<?php

namespace App\Modules\Sales\Controllers;

use App\Core\Models\Configuracion;
use App\Http\Controllers\Controller;
use App\Modules\Sales\Models\Factura;
use App\Modules\Sales\Services\ElectronicBilling\DianService;
use App\Modules\Sales\Services\FacturaService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FacturaController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        
        $search = $request->input('search');
        $like = \Illuminate\Support\Facades\DB::connection()->getDriverName() === 'sqlite' ? 'like' : 'ilike';

        $facturas = Factura::with(['cliente', 'vendedor'])
            ->where('tenant_id', $tenantId)
            ->when($search, function ($query, $search) use ($like) {
                $query->where('numero', $like, "%{$search}%")
                      ->orWhereHas('cliente', function($q) use ($search, $like) {
                          $q->where('nombres', $like, "%{$search}%")
                            ->orWhere('apellidos', $like, "%{$search}%")
                            ->orWhere('razon_social', $like, "%{$search}%");
                      });
            })
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Sales/Facturas/Index', [
            'facturas' => $facturas,
            'filters' => $request->only(['search']),
        ]);
    }

    public function show(Factura $factura)
    {
        if ($factura->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $factura->load([
            'cliente', 'vendedor', 'items.producto', 'tenant', 'orden',
            'asientos' => fn ($q) => $q->with(['lineas' => fn ($lq) => $lq->with('cuenta')]),
        ]);

        // Desglose para mostrar en el frontend como la prefactura
        $abono = (float) ($factura->orden?->abono_inicial ?? 0);
        $manoDeObraTotal = $factura->items
            ->filter(fn ($i) => str_contains($i->descripcion, 'Mano de Obra'))
            ->sum(fn ($i) => (float) $i->subtotal);
        $serviciosTotal = $factura->items
            ->filter(fn ($i) => !$i->producto_id && !str_contains($i->descripcion, 'Mano de Obra'))
            ->sum(fn ($i) => (float) $i->subtotal);
        $repuestosTotal = $factura->items
            ->filter(fn ($i) => $i->producto_id)
            ->sum(fn ($i) => (float) $i->subtotal);
        $porcentajeIva = (float) ($factura->items->first()?->tasa_impuesto ?? 0);

        return Inertia::render('Sales/Facturas/Show', [
            'factura' => $factura,
            'desglose' => [
                'manoDeObra' => $manoDeObraTotal,
                'servicios' => $serviciosTotal,
                'repuestos' => $repuestosTotal,
                'subtotal' => (float) $factura->subtotal,
                'descuento' => (float) $factura->descuento,
                'abono' => $abono,
                'iva' => (float) $factura->impuestos,
                'porcentajeIva' => $porcentajeIva,
                'total' => (float) $factura->total,
            ],
        ]);
    }

    public function pdf(Request $request, Factura $factura)
    {
        if ($factura->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $factura->load(['cliente', 'vendedor', 'items.producto']);
        $empresa = $this->datosEmpresa($factura->tenant_id);

        // Modo debug: ver el HTML en el navegador
        if ($request->boolean('debug')) {
            return view('sales.factura-pdf', compact('factura', 'empresa'));
        }

        $pdf = Pdf::loadView('sales.factura-pdf', compact('factura', 'empresa'))
            ->setPaper('letter', 'portrait');

        return $pdf->stream("Factura_{$factura->numero}.pdf");
    }

    private function datosEmpresa(int $tenantId): array
    {
        $tenant = \App\Core\Models\Tenant::find($tenantId);

        return [
            'nombre' => Configuracion::get('nombre_empresa', $tenant?->name ?? 'Mi Empresa', $tenantId),
            'nit' => Configuracion::get('nit', '', $tenantId),
            'direccion' => Configuracion::get('direccion', '', $tenantId),
            'telefono' => Configuracion::get('telefono', '', $tenantId),
            'email' => Configuracion::get('email_empresa', $tenant?->email ?? '', $tenantId),
            'logo' => Configuracion::get('logo_url', '', $tenantId),
        ];
    }

    public function emitir(Factura $factura, DianService $dianService)
    {
        if ($factura->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        try {
            $empresa = $this->datosEmpresa($factura->tenant_id);

            // Map empresa data to DIAN expected keys
            $empresaDian = [
                'nit' => $empresa['nit'],
                'razon_social' => $empresa['nombre'],
                'direccion' => $empresa['direccion'],
                'ciudad_codigo' => Configuracion::get('dian_ciudad_codigo', '11001', $factura->tenant_id),
                'pais' => 'CO',
            ];

            $dianService->emitirFactura($factura, $empresaDian);
            return back()->with('success', 'Factura enviada a la DIAN correctamente.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al emitir a DIAN: ' . $e->getMessage());
        }
    }

    public function anular(Request $request, Factura $factura, FacturaService $facturaService)
    {
        if ($factura->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $request->validate([
            'motivo' => 'required|string|min:5|max:500',
        ]);

        try {
            $facturaService->anular($factura, $request->input('motivo'));
            return redirect()->route('sales.facturas.show', $factura)
                ->with('success', "Factura {$factura->numero} anulada correctamente. Stock, caja y contabilidad reversados.");
        } catch (\Exception $e) {
            return back()->with('error', 'Error al anular la factura: ' . $e->getMessage());
        }
    }
}
```

### PosController.php

**Ruta:** app/Modules/Sales/Controllers/PosController.php

```php
<?php

namespace App\Modules\Sales\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Models\CajaSesion;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Sales\Models\Factura;
use App\Modules\Sales\Services\FacturaService;
use App\Modules\ServiceDesk\Models\Servicio;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PosController extends Controller
{
    public function index()
    {
        $tenantId = auth()->user()->tenant_id;

        // Verificar si el usuario tiene una caja abierta
        $sesionActiva = CajaSesion::with('caja')
            ->where('user_id', auth()->id())
            ->where('estado', 'abierta')
            ->first();

        $productos = Producto::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('nombre')
            ->get();

        $clientes = Cliente::where('tenant_id', $tenantId)
            ->where('activo', true)
            ->orderBy('nombres')
            ->get();

        $serviciosCatalogo = Servicio::where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'precio_base']);

        return Inertia::render('Sales/Pos/Index', [
            'productos' => $productos,
            'clientes' => $clientes,
            'sesionActiva' => $sesionActiva,
            'serviciosCatalogo' => $serviciosCatalogo,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cliente_id' => 'nullable|exists:crm_clientes,id',
            'metodo_pago' => 'required|string|in:efectivo,tarjeta,transferencia,credito',
            'pagos_mixtos' => ['nullable', 'array'],
            'pagos_mixtos.*.metodo' => ['required', 'in:efectivo,tarjeta,transferencia'],
            'pagos_mixtos.*.monto' => ['required', 'numeric', 'min:0.01'],
            'items' => 'required|array|min:1',
            'items.*.tipo' => 'required|string|in:producto,servicio',
            'items.*.producto_id' => 'required_if:items.*.tipo,producto|nullable|exists:inventory_productos,id',
            'items.*.descripcion' => 'nullable|string',
            'items.*.servicio_nombre' => 'nullable|string',
            'items.*.cantidad' => 'required|numeric|min:0.01',
            'items.*.precio_unitario' => 'required|numeric|min:0',
        ]);

        try {
            $items = array_map(fn ($item) => [
                'tipo' => $item['tipo'],
                'producto_id' => $item['producto_id'] ?? null,
                'descripcion' => $item['descripcion'] ?? '',
                'servicio_nombre' => $item['servicio_nombre'] ?? '',
                'cantidad' => $item['cantidad'],
                'precio_unitario' => $item['precio_unitario'],
            ], $validated['items']);

            $facturaService = app(FacturaService::class);
            $factura = $facturaService->crearDesdePos([
                'cliente_id' => $validated['cliente_id'] ?? null,
                'metodo_pago' => $validated['metodo_pago'],
                'pagos_mixtos' => $validated['pagos_mixtos'] ?? [],
                'items' => $items,
            ]);

            return redirect()->route('sales.facturas.show', $factura->id)
                ->with('success', 'Venta registrada exitosamente.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al registrar la venta: ' . $e->getMessage());
        }
    }
}
```

---

## Models

### Factura.php

**Ruta:** app/Modules/Sales/Models/Factura.php

```php
<?php

namespace App\Modules\Sales\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Core\Models\Sede;
use App\Core\Models\Tenant;
use App\Models\User;
use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Crm\Models\Cliente;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Factura extends Model
{
    use HasFactory, BelongsToTenant, Auditable;

    protected $table = 'sales_facturas';

    protected $guarded = ['id'];

    protected static function booted()
    {
        static::creating(function ($model) {
            $model->verification_token = (string) \Illuminate\Support\Str::uuid();
        });

        // #13: Sincronizar estado y booleano anulada para evitar desincronización
        static::saving(function ($model) {
            if ($model->isDirty('estado') && $model->estado === 'anulada') {
                $model->anulada = true;
                if (is_null($model->anulada_at)) {
                    $model->anulada_at = now();
                }
            }
            if ($model->isDirty('anulada') && $model->anulada === true && $model->estado !== 'anulada') {
                $model->estado = 'anulada';
                if (is_null($model->anulada_at)) {
                    $model->anulada_at = now();
                }
            }
        });
    }

    protected $fillable = [
        'tenant_id',
        'sede_id',
        'cliente_id',
        'user_id',
        'numero',
        'subtotal',
        'impuestos',
        'descuento',
        'total',
        'estado',
        'metodo_pago',
        'notas',
        // 'fecha_emision' and 'fecha_vencimiento' are not present
        // in the `sales_facturas` table migration and must not
        // be mass-assigned here.
        'cufe',
        'qr_code',
        'tipo_documento',
        'dian_estado',
        'dian_mensaje',
        'dian_fecha_envio',
        'dian_track_id',
        'resolucion_id',
        'factura_origen_id',
        'orden_id',
        'anulada',
        'anulada_at',
        'anulada_por',
        'verification_token',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'impuestos' => 'decimal:2',
        'descuento' => 'decimal:2',
        'total' => 'decimal:2',
        'anulada' => 'boolean',
        'anulada_at' => 'datetime',
    ];

    public function scopeNoAnuladas($query)
    {
        return $query->where('anulada', false);
    }

    public function esAnulable(): bool
    {
        return !$this->anulada;
    }

    public function anulador(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'anulada_por');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function sede(): BelongsTo
    {
        return $this->belongsTo(Sede::class);
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(FacturaItem::class);
    }

    public function orden(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\ServiceDesk\Models\OrdenReparacion::class, 'orden_id');
    }

    public function asientos(): MorphMany
    {
        return $this->morphMany(AsientoContable::class, 'referencia');
    }

    /**
     * Cuenta por cobrar asociada a esta factura (venta a crédito).
     */
    public function cuentaPorCobrar()
    {
        return $this->morphOne(\App\Modules\Accounting\Models\CuentaPorCobrar::class, 'documentoOrigen');
    }
}
```

### FacturaItem.php

**Ruta:** app/Modules/Sales/Models/FacturaItem.php

```php
<?php

namespace App\Modules\Sales\Models;

use App\Modules\Inventory\Models\Producto;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacturaItem extends Model
{
    use HasFactory;

    protected $table = 'sales_factura_items';
    protected $guarded = ['id'];

    protected $casts = [
        'cantidad' => 'decimal:2',
        'precio_unitario' => 'decimal:2',
        'tasa_impuesto' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'impuesto_total' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function factura(): BelongsTo
    {
        return $this->belongsTo(Factura::class);
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }
}
```

### Certificado.php

**Ruta:** app/Modules/Sales/Models/Certificado.php

```php
<?php

namespace App\Modules\Sales\Models;

use App\Core\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypto;

class Certificado extends Model
{
    protected $table = 'sales_certificados';

    protected $fillable = [
        'tenant_id',
        'nombre_archivo',
        'pfx_path',
        'password',
        'fecha_vencimiento',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'pfx_path',
    ];

    protected $casts = [
        'fecha_vencimiento' => 'date',
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Encripta la contraseña al guardar en BD.
     */
    public function setPasswordAttribute(string $value): void
    {
        $this->attributes['password'] = $value === ''
            ? ''
            : Crypto::encrypt($value);
    }

    /**
     * Desencripta la contraseña al leer de BD.
     */
    public function getPasswordAttribute(): string
    {
        $encrypted = $this->attributes['password'] ?? '';

        if ($encrypted === '') {
            return '';
        }

        try {
            return Crypto::decrypt($encrypted);
        } catch (\Throwable) {
            // Si falla la desencriptación, asumir que está en texto plano
            // (datos migrados antes de la encriptación)
            return $encrypted;
        }
    }
}
```

### DianEvento.php

**Ruta:** app/Modules/Sales/Models/DianEvento.php

```php
<?php

namespace App\Modules\Sales\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DianEvento extends Model
{
    protected $table = 'sales_dian_eventos';

    protected $fillable = [
        'factura_id',
        'estado',
        'mensaje',
        'xml_enviado',
        'xml_respuesta',
    ];

    public function factura(): BelongsTo
    {
        return $this->belongsTo(Factura::class);
    }
}
```

### Resolucion.php

**Ruta:** app/Modules/Sales/Models/Resolucion.php

```php
<?php

namespace App\Modules\Sales\Models;

use App\Core\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Resolucion extends Model
{
    protected $table = 'sales_resoluciones';

    protected $fillable = [
        'tenant_id',
        'tipo_documento',
        'numero_resolucion',
        'prefijo',
        'rango_desde',
        'rango_hasta',
        'consecutivo_actual',
        'fecha_desde',
        'fecha_hasta',
        'clave_tecnica',
        'is_active',
    ];

    protected $casts = [
        'fecha_desde' => 'date',
        'fecha_hasta' => 'date',
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
```

---

## Migrations

### 2026_06_20_142001_create_sales_tables.php

**Ruta:** app/Modules/Sales/Migrations/2026_06_20_142001_create_sales_tables.php

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_facturas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sede_id')->nullable()->constrained('core_sedes')->nullOnDelete();
            $table->foreignId('cliente_id')->nullable()->constrained('crm_clientes')->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // Vendedor/Cajero
            $table->string('numero', 50)->unique(); // Ej: POS-0001
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('impuestos', 15, 2)->default(0);
            $table->decimal('descuento', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->string('estado', 20)->default('pagada'); // pagada, pendiente (credito), anulada
            $table->string('metodo_pago', 50)->default('efectivo'); // efectivo, tarjeta, transferencia, credito
            $table->text('notas')->nullable();
            
            // Campos para Facturación Electrónica DIAN
            $table->string('cufe', 255)->nullable();
            $table->text('qr_code')->nullable();
            
            $table->timestamps();
            
            $table->index(['tenant_id', 'estado']);
            $table->index(['tenant_id', 'numero']);
        });

        Schema::create('sales_factura_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('factura_id')->constrained('sales_facturas')->cascadeOnDelete();
            $table->foreignId('producto_id')->nullable()->constrained('inventory_productos')->nullOnDelete();
            $table->string('descripcion', 255);
            $table->decimal('cantidad', 10, 2);
            $table->decimal('precio_unitario', 15, 2);
            $table->decimal('tasa_impuesto', 5, 2)->default(0); // Ej: 19.00
            $table->decimal('subtotal', 15, 2); // cantidad * precio
            $table->decimal('impuesto_total', 15, 2); 
            $table->decimal('total', 15, 2); // subtotal + impuesto
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_factura_items');
        Schema::dropIfExists('sales_facturas');
    }
};
```

### 2026_06_20_142002_add_electronic_invoicing_tables.php

**Ruta:** app/Modules/Sales/Migrations/2026_06_20_142002_add_electronic_invoicing_tables.php

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Certificados Digitales
        Schema::create('sales_certificados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('nombre_archivo', 255);
            $table->text('pfx_path');
            $table->text('password'); // Deberá ir encriptado
            $table->date('fecha_vencimiento')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Resoluciones de Facturación
        Schema::create('sales_resoluciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('tipo_documento', 50)->default('factura'); // factura, nota_credito, nota_debito
            $table->string('numero_resolucion', 100);
            $table->string('prefijo', 10)->nullable();
            $table->unsignedBigInteger('rango_desde');
            $table->unsignedBigInteger('rango_hasta');
            $table->unsignedBigInteger('consecutivo_actual');
            $table->date('fecha_desde');
            $table->date('fecha_hasta');
            $table->string('clave_tecnica', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Modificaciones a facturas
        Schema::table('sales_facturas', function (Blueprint $table) {
            $table->string('tipo_documento', 50)->default('factura')->after('estado'); // factura, nota_credito, nota_debito
            $table->string('dian_estado', 50)->default('borrador')->after('qr_code'); // borrador, pendiente_envio, enviado, aceptado, rechazado
            $table->text('dian_mensaje')->nullable()->after('dian_estado');
            $table->timestamp('dian_fecha_envio')->nullable()->after('dian_mensaje');
            $table->string('dian_track_id', 255)->nullable()->after('dian_fecha_envio');
            $table->foreignId('resolucion_id')->nullable()->after('dian_track_id')->constrained('sales_resoluciones')->nullOnDelete();
            $table->foreignId('factura_origen_id')->nullable()->after('resolucion_id')->constrained('sales_facturas')->nullOnDelete(); // Para notas crédito/débito
            
            $table->index(['tenant_id', 'dian_estado']);
        });

        // Historial de eventos DIAN
        Schema::create('sales_dian_eventos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('factura_id')->constrained('sales_facturas')->cascadeOnDelete();
            $table->string('estado', 50);
            $table->text('mensaje')->nullable();
            $table->text('xml_enviado')->nullable();
            $table->text('xml_respuesta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_dian_eventos');
        
        Schema::table('sales_facturas', function (Blueprint $table) {
            $table->dropForeign(['resolucion_id']);
            $table->dropForeign(['factura_origen_id']);
            $table->dropIndex(['tenant_id', 'dian_estado']);
            $table->dropColumn([
                'tipo_documento',
                'dian_estado',
                'dian_mensaje',
                'dian_fecha_envio',
                'dian_track_id',
                'resolucion_id',
                'factura_origen_id'
            ]);
        });

        Schema::dropIfExists('sales_resoluciones');
        Schema::dropIfExists('sales_certificados');
    }
};
```

### 2026_06_23_120000_add_orden_id_to_sales_facturas.php

**Ruta:** app/Modules/Sales/Migrations/2026_06_23_120000_add_orden_id_to_sales_facturas.php

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_facturas', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_facturas', 'orden_id')) {
                $table->foreignId('orden_id')
                    ->nullable()
                    ->after('cliente_id')
                    ->constrained('sd_ordenes')
                    ->nullOnDelete();
                $table->index(['tenant_id', 'orden_id']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales_facturas', function (Blueprint $table) {
            if (Schema::hasColumn('sales_facturas', 'orden_id')) {
                $table->dropForeign(['orden_id']);
                $table->dropIndex(['tenant_id', 'orden_id']);
                $table->dropColumn('orden_id');
            }
        });
    }
};
```

### 2026_06_26_160000_add_anulacion_to_sales_facturas.php

**Ruta:** app/Modules/Sales/Migrations/2026_06_26_160000_add_anulacion_to_sales_facturas.php

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_facturas', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_facturas', 'anulada')) {
                $table->boolean('anulada')->default(false)->after('estado');
            }
            if (!Schema::hasColumn('sales_facturas', 'anulada_at')) {
                $table->timestamp('anulada_at')->nullable()->after('anulada');
            }
            if (!Schema::hasColumn('sales_facturas', 'anulada_por')) {
                $table->foreignId('anulada_por')->nullable()->constrained('users')->nullOnDelete()->after('anulada_at');
            }
            if (!Schema::hasColumn('sales_facturas', 'motivo_anulacion')) {
                $table->text('motivo_anulacion')->nullable()->after('anulada_por');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales_facturas', function (Blueprint $table) {
            $table->dropColumn(['anulada', 'anulada_at', 'anulada_por', 'motivo_anulacion']);
        });
    }
};
```

### 2026_07_06_000000_fix_sales_facturas_constraints.php

**Ruta:** app/Modules/Sales/Migrations/2026_07_06_000000_fix_sales_facturas_constraints.php

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_facturas', function (Blueprint $table) {
            // #11: user_id cascadeOnDelete → restrictOnDelete
            $table->dropForeign(['user_id']);
            $table->foreign('user_id')->references('id')->on('users')->restrictOnDelete();
        });

        // #1: Fix UNIQUE global → UNIQUE scoped por tenant
        // SQLite usa nombres de índice diferentes, así que usamos SQL directo
        $driver = DB::getDriverName();
        if ($driver === 'sqlite') {
            // Buscar y eliminar el índice unique existente en numero
            $indexes = DB::select("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='sales_facturas' AND sql LIKE '%UNIQUE%numero%'");
            foreach ($indexes as $idx) {
                DB::statement("DROP INDEX IF EXISTS \"{$idx->name}\"");
            }
        } else {
            Schema::table('sales_facturas', function (Blueprint $table) {
                $table->dropIndex(['numero']);
            });
        }

        Schema::table('sales_facturas', function (Blueprint $table) {
            $table->unique(['tenant_id', 'numero']);
        });
    }

    public function down(): void
    {
        Schema::table('sales_facturas', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'numero']);
            $table->unique(['numero']);
            $table->dropForeign(['user_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
```

### 2026_07_06_100000_encrypt_pfx_passwords.php

**Ruta:** app/Modules/Sales/Migrations/2026_07_06_100000_encrypt_pfx_passwords.php

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypto;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Encriptar contraseñas PFX que estén en texto plano
        $certificados = DB::table('sales_certificados')
            ->where('password', '!=', '')
            ->where('password', 'NOT LIKE', 'eyJ%') // Las que no empiezan con ciphertext de Laravel
            ->get();

        foreach ($certificados as $cert) {
            DB::table('sales_certificados')
                ->where('id', $cert->id)
                ->update(['password' => Crypto::encrypt($cert->password)]);
        }
    }

    public function down(): void
    {
        // No se puede revertir de forma segura sin knowing qué estaba encriptado
        // y qué no. Dejar como está.
    }
};
```

---

## Services

### FacturaService.php

**Ruta:** app/Modules/Sales/Services/FacturaService.php

```php
<?php

namespace App\Modules\Sales\Services;

use App\Core\Models\Configuracion;
use App\Modules\Accounting\Services\ContabilidadConfig;
use App\Modules\Accounting\Services\ContabilidadService;
use App\Modules\Cash\Services\CajaService;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Sales\Models\Factura;
use App\Modules\Sales\Models\FacturaItem;
use App\Modules\Sales\Services\ElectronicBilling\DianService;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FacturaService
{
    public function __construct(
        private CajaService $cajaService,
        private ContabilidadService $contabilidadService,
        private \App\Modules\Accounting\Services\TributaryRuleService $tributaryService,
        private ?DianService $dianService = null,
    ) {}

    public function crearDesdeOrden(OrdenReparacion $orden, array $data): Factura
    {
        $tenantId = auth()->user()->tenant_id;

        // Validar que la orden no tenga ya una factura (evita doble facturación)
        $existeFactura = Factura::where('orden_id', $orden->id)->exists();
        if ($existeFactura) {
            throw new \Exception(
                "La orden {$orden->numero_orden} ya tiene una factura asociada. No se puede facturar dos veces la misma orden."
            );
        }

        $sesion = $this->cajaService->getSesionAbierta(auth()->id());

        if (!$sesion) {
            $baseApertura = $data['base_apertura'] ?? throw new \Exception('Debe abrir la caja ingresando una base inicial.');
            $cajaId = (int) ($data['caja_id'] ?? 0);
            if ($cajaId <= 0) {
                throw new \Exception('Debe seleccionar una caja para abrir el turno.');
            }
            $sesion = $this->cajaService->abrirCaja(auth()->id(), $cajaId, (float) $baseApertura, 'Apertura automática desde facturación');
        }

        $descuento = min(max((float) ($data['descuento'] ?? 0), 0), (float) $orden->total_cliente);

        $incluirIva = (bool) ($data['incluir_iva'] ?? false);
        $porcentajeIva = $incluirIva ? (float) ($data['porcentaje_iva'] ?? 0) : 0;

        // Método de pago real elegido por el cajero y pagos mixtos (si los hay).
        $metodoPago = $data['metodo_pago'] ?? 'efectivo';
        $pagosMixtos = $data['pagos_mixtos'] ?? [];
        $esCredito = $metodoPago === 'credito';

        $factura = null;

        DB::transaction(function () use ($orden, $sesion, $data, $descuento, $porcentajeIva, $tenantId, $metodoPago, $pagosMixtos, $esCredito, &$factura) {
            // Actualizar precio_cliente (mano de obra) desde el payload
            if (isset($data['precio_cliente'])) {
                $orden->precio_cliente = (float) $data['precio_cliente'];
                $orden->save();
            }

            // Sincronizar servicios y repuestos PRIMERO
            $orden->servicios()->detach();
            foreach ($data['servicios'] ?? [] as $s) {
                $orden->servicios()->attach($s['servicio_id'], [
                    'cantidad' => $s['cantidad'] ?? 1,
                    'precio_aplicado' => $s['precio_aplicado'] ?? 0,
                    'costo_tecnico_aplicado' => $s['costo_tecnico_aplicado'] ?? 0,
                ]);
            }

            $orden->repuestos()->detach();
            foreach ($data['repuestos'] ?? [] as $r) {
                $orden->repuestos()->attach($r['producto_id'], [
                    'cantidad' => $r['cantidad'] ?? 1,
                    'precio_unitario' => $r['precio_unitario'] ?? 0,
                ]);
            }

            $orden->load(['servicios', 'repuestos']);

            // Calcular subtotal DESPUÉS de sincronizar
            $subtotal = (float) $orden->total_cliente;
            $descuento = min(max((float) $descuento, 0), $subtotal);
            $baseGravable = max(0, $subtotal - $descuento);
            $iva = round($baseGravable * ($porcentajeIva / 100), 2);
            $total = $baseGravable + $iva;

            $orden->descuento = $descuento;
            $orden->total_final = $total;
            $orden->save();

            $infoNumero = $this->generarNumeroSiguiente($tenantId, 'FAC');

            // Crear factura
            $factura = Factura::create([
                'tenant_id' => $tenantId,
                'cliente_id' => $orden->cliente_id,
                'user_id' => auth()->id(),
                'orden_id' => $orden->id,
                'numero' => $infoNumero['numero'],
                'resolucion_id' => $infoNumero['resolucion_id'],
                'subtotal' => $subtotal,
                'impuestos' => $iva,
                'descuento' => $descuento,
                'total' => $total,
                'estado' => $esCredito ? 'pendiente' : 'pagada',
                'metodo_pago' => $metodoPago,
                'notas' => 'Factura generada desde Orden de Reparación ' . $orden->numero_orden,
                'tipo_documento' => 'factura',
            ]);

            $impLinea = fn (float $base) => round($base * ($porcentajeIva / 100), 2);

            $manoDeObra = (float) ($orden->precio_cliente ?? 0);
            if ($manoDeObra > 0) {
                FacturaItem::create([
                    'factura_id' => $factura->id,
                    'descripcion' => 'Servicio de Diagnóstico / Mano de Obra Base',
                    'cantidad' => 1,
                    'precio_unitario' => $manoDeObra,
                    'tasa_impuesto' => $porcentajeIva,
                    'subtotal' => $manoDeObra,
                    'impuesto_total' => $impLinea($manoDeObra),
                    'total' => $manoDeObra + $impLinea($manoDeObra),
                ]);
            }

            foreach ($orden->servicios as $s) {
                $baseLinea = (float) $s->pivot->precio_aplicado;
                FacturaItem::create([
                    'factura_id' => $factura->id,
                    'descripcion' => $s->nombre,
                    'cantidad' => $s->pivot->cantidad,
                    'precio_unitario' => $s->pivot->cantidad > 0 ? ($baseLinea / $s->pivot->cantidad) : $baseLinea,
                    'tasa_impuesto' => $porcentajeIva,
                    'subtotal' => $baseLinea,
                    'impuesto_total' => $impLinea($baseLinea),
                    'total' => $baseLinea + $impLinea($baseLinea),
                ]);
            }

            $repuestoIds = $orden->repuestos->pluck('id')->filter()->unique()->values()->all();
            $productos = Producto::whereIn('id', $repuestoIds)->lockForUpdate()->get()->keyBy('id');

            foreach ($orden->repuestos as $r) {
                $baseLinea = (float) $r->pivot->cantidad * (float) $r->pivot->precio_unitario;
                $producto = $productos->get($r->id);
                if ($producto) {
                    if ((float) $producto->stock_actual < (float) $r->pivot->cantidad) {
                        throw new \Exception("Stock insuficiente para el repuesto {$producto->nombre}.");
                    }
                    $producto->decrement('stock_actual', $r->pivot->cantidad);
                }

                FacturaItem::create([
                    'factura_id' => $factura->id,
                    'producto_id' => $r->id,
                    'descripcion' => $r->nombre,
                    'cantidad' => $r->pivot->cantidad,
                    'precio_unitario' => $r->pivot->precio_unitario,
                    'tasa_impuesto' => $porcentajeIva,
                    'subtotal' => $baseLinea,
                    'impuesto_total' => $impLinea($baseLinea),
                    'total' => $baseLinea + $impLinea($baseLinea),
                ]);
            }

            // Caja: registrar el pago respetando el método elegido y los pagos mixtos.
            // El crédito no registra movimiento de caja (queda como cuenta por cobrar).
            $saldoPagado = max(0, $total - ($orden->abono_inicial ?? 0));
            if ($saldoPagado > 0 && !$esCredito) {
                if (!empty($pagosMixtos)) {
                    $sumaPagos = array_sum(array_map(fn ($p) => (float) ($p['monto'] ?? 0), $pagosMixtos));
                    if (round($sumaPagos, 2) !== round($saldoPagado, 2)) {
                        throw new \Exception(
                            "La suma de los pagos mixtos (\${$sumaPagos}) no coincide con el saldo a pagar (\${$saldoPagado})."
                        );
                    }
                    // Un movimiento de caja por cada método de pago mixto.
                    foreach ($pagosMixtos as $pago) {
                        $montoPago = (float) ($pago['monto'] ?? 0);
                        if ($montoPago > 0) {
                            $this->cajaService->registrarMovimiento(
                                $sesion,
                                'ingreso',
                                $montoPago,
                                $pago['metodo'] ?? 'efectivo',
                                'Pago mixto orden ' . $orden->numero_orden,
                                $factura
                            );
                        }
                    }
                } else {
                    // Pago único con el método real elegido por el cajero.
                    $this->cajaService->registrarMovimiento(
                        $sesion,
                        'ingreso',
                        $saldoPagado,
                        $metodoPago,
                        'Pago de saldo orden ' . $orden->numero_orden,
                        $factura
                    );
                }
            }

            // Contabilidad
            $this->registrarContabilidad($factura, $tenantId, $pagosMixtos);

            // DIAN
            $this->emitirDian($factura, $tenantId);

            // Cerrar orden
            $orden->estado = \App\Modules\ServiceDesk\Enums\OrdenEstado::Entregado;
            $orden->fecha_entregado = now();
            $orden->save();
        });

        return $factura;
    }

    public function crearDesdePos(array $data): Factura
    {
        $tenantId = auth()->user()->tenant_id;
        $regimen = $this->determinarRegimen($tenantId);

        $sesion = $this->cajaService->getSesionAbierta(auth()->id());
        $esCredito = ($data['metodo_pago'] ?? 'efectivo') === 'credito';

        if (!$sesion && !$esCredito) {
            throw new \Exception('Debes abrir un turno de caja para registrar pagos de contado.');
        }

        $subtotal = 0;
        $impuestos = 0;
        $porcentajeIva = 0;

        if ($regimen === 'comun') {
            $incluirIva = Configuracion::get('incluir_iva', 'false', $tenantId) === 'true';
            $porcentajeIva = $incluirIva ? (float) Configuracion::get('porcentaje_iva', '19', $tenantId) : 0;
        }

        foreach ($data['items'] as $item) {
            $itemSubtotal = $item['cantidad'] * $item['precio_unitario'];
            if ($item['tipo'] === 'producto' && $regimen === 'comun') {
                $itemImpuesto = $itemSubtotal * ($porcentajeIva / 100);
            } else {
                $itemImpuesto = 0;
            }
            $subtotal += $itemSubtotal;
            $impuestos += $itemImpuesto;
        }

        $total = $subtotal + $impuestos;
        $estado = $esCredito ? 'pendiente' : 'pagada';

        $factura = null;

        DB::transaction(function () use ($data, $tenantId, $regimen, $sesion, $esCredito, $subtotal, $impuestos, $total, $estado, &$factura) {
            $productoIds = collect($data['items'] ?? [])->where('tipo', 'producto')->pluck('producto_id')->filter()->unique()->values()->all();
            $productos = Producto::whereIn('id', $productoIds)->lockForUpdate()->get()->keyBy('id');
            $ivaPorcentaje = $regimen === 'comun' ? (float) Configuracion::get('porcentaje_iva', '19', $tenantId) : 0;

            $infoNumero = $this->generarNumeroSiguiente($tenantId, 'POS');

            $factura = Factura::create([
                'tenant_id' => $tenantId,
                'user_id' => auth()->id(),
                'cliente_id' => $data['cliente_id'] ?? null,
                'orden_id' => $data['orden_id'] ?? null,
                'numero' => $infoNumero['numero'],
                'resolucion_id' => $infoNumero['resolucion_id'],
                'subtotal' => $subtotal,
                'impuestos' => $impuestos,
                'descuento' => 0,
                'total' => $total,
                'estado' => $estado,
                'metodo_pago' => $data['metodo_pago'] ?? 'efectivo',
                'tipo_documento' => 'pos',
            ]);

            foreach ($data['items'] as $item) {
                $itemSubtotal = $item['cantidad'] * $item['precio_unitario'];
                $itemImpuesto = $regimen === 'comun' ? $itemSubtotal * ($ivaPorcentaje / 100) : 0;
                $producto = $productos->get($item['producto_id']);

                // Validar antes de insertar para no romper la FK constraint
                if ($item['tipo'] === 'producto') {
                    if (!$producto) {
                        throw new \Exception('Producto no válido para el item de POS.');
                    }
                    if ((float) $producto->stock_actual < (float) $item['cantidad']) {
                        throw new \Exception("Stock insuficiente para el producto {$producto->nombre}.");
                    }
                    $producto->decrement('stock_actual', $item['cantidad']);
                }

                FacturaItem::create([
                    'factura_id' => $factura->id,
                    'producto_id' => $item['tipo'] === 'producto' ? $item['producto_id'] : null,
                    'descripcion' => $item['descripcion'] ?? ($producto?->nombre ?? $item['servicio_nombre'] ?? ''),
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'tasa_impuesto' => $regimen === 'comun' ? $ivaPorcentaje : 0,
                    'subtotal' => $itemSubtotal,
                    'impuesto_total' => $itemImpuesto,
                    'total' => $itemSubtotal + $itemImpuesto,
                ]);
            }

            // Caja
            if ($estado === 'pagada' && $sesion) {
                $pagosMixtos = $data['pagos_mixtos'] ?? [];
                if (!empty($pagosMixtos)) {
                    $sumaPagos = array_sum(array_map(fn ($p) => (float) ($p['monto'] ?? 0), $pagosMixtos));
                    if (round($sumaPagos, 2) !== round($total, 2)) {
                        throw new \Exception(
                            "La suma de los pagos mixtos (\${$sumaPagos}) no coincide con el total de la factura (\${$total})."
                        );
                    }
                    foreach ($pagosMixtos as $pago) {
                        $montoPago = (float) ($pago['monto'] ?? 0);
                        if ($montoPago > 0) {
                            $this->cajaService->registrarMovimiento(
                                $sesion,
                                'ingreso',
                                $montoPago,
                                $pago['metodo'] ?? 'efectivo',
                                "Pago mixto POS Factura: {$factura->numero}",
                                $factura
                            );
                        }
                    }
                } else {
                    $this->cajaService->registrarMovimiento(
                        $sesion,
                        'ingreso',
                        $total,
                        $data['metodo_pago'] ?? 'efectivo',
                        "Venta POS Factura: {$factura->numero}",
                        $factura
                    );
                }
            }

            // Contabilidad
            $this->registrarContabilidad($factura, $tenantId, $data['pagos_mixtos'] ?? []);

            // DIAN si es común
            if ($regimen === 'comun') {
                $this->emitirDian($factura, $tenantId);
            }
        });

        return $factura;
    }

    private function generarNumeroSiguiente(int $tenantId, string $tipoDocumento): array
    {
        // 1. Intentar obtener y bloquear la resolución activa para este tenant que coincida con el tipo de documento
        $dbTipo = match (strtolower($tipoDocumento)) {
            'pos' => 'pos',
            'fac' => 'factura',
            default => strtolower($tipoDocumento),
        };

        $resolucion = \App\Modules\Sales\Models\Resolucion::where('tenant_id', $tenantId)
            ->where('tipo_documento', $dbTipo)
            ->where('is_active', true)
            ->lockForUpdate()
            ->first();

        // Fallback: si no hay resolución específica de tipo, buscar cualquier resolución activa del tenant
        if (!$resolucion) {
            $resolucion = \App\Modules\Sales\Models\Resolucion::where('tenant_id', $tenantId)
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();
        }

        if ($resolucion) {
            $nuevoConsecutivo = $resolucion->consecutivo_actual + 1;

            if ($nuevoConsecutivo > $resolucion->rango_hasta) {
                throw new \Exception("La resolución de facturación {$resolucion->numero_resolucion} ha excedido su rango máximo.");
            }

            // Verificar que la resolución esté vigente (dentro del rango de fechas)
            $ahora = now();
            if ($resolucion->fecha_desde && $ahora->lt($resolucion->fecha_desde)) {
                throw new \Exception("La resolución {$resolucion->numero_resolucion} aún no está vigente (fecha desde: {$resolucion->fecha_desde->format('Y-m-d')}).");
            }
            if ($resolucion->fecha_hasta && $ahora->gt($resolucion->fecha_hasta)) {
                throw new \Exception("La resolución {$resolucion->numero_resolucion} ha expirado (fecha hasta: {$resolucion->fecha_hasta->format('Y-m-d')}).");
            }

            $resolucion->update([
                'consecutivo_actual' => $nuevoConsecutivo
            ]);

            $prefijo = $resolucion->prefijo ?? '';
            $numero = $prefijo . $nuevoConsecutivo;

            return [
                'numero' => $numero,
                'resolucion_id' => $resolucion->id
            ];
        }

        // 2. Fallback de alta precisión con milisegundos y reintentos (sin resolución activa)
        // Para evitar colisiones concurrentes en el fallback, bloqueamos la fila del Tenant
        \App\Core\Models\Tenant::where('id', $tenantId)->lockForUpdate()->first();

        $prefijoFallback = strtoupper($tipoDocumento);
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $numero = sprintf('%s-%s-%s', $prefijoFallback, now()->format('YmdHisv'), random_int(1000, 9999));
            if (!Factura::withoutGlobalScopes()->where('numero', $numero)->exists()) {
                return [
                    'numero' => $numero,
                    'resolucion_id' => null
                ];
            }
            usleep(50000); // 50ms
        }

        throw new \RuntimeException('No se pudo generar un número de factura único. Por favor intente nuevamente.');
    }

    private function determinarRegimen(int $tenantId): string
    {
        return Configuracion::get('regimen_fiscal', 'simplificado', $tenantId);
    }

    private function registrarContabilidad(Factura $factura, int $tenantId, array $pagosMixtos = []): void
    {
        if (!class_exists(ContabilidadService::class)) {
            return;
        }

        // No contabilizar facturas anuladas
        if ($factura->anulada) {
            return;
        }

        // Evitar doble contabilización si ya existe un asiento para esta factura
        if (\App\Modules\Accounting\Models\AsientoContable::where('referencia_type', Factura::class)
            ->where('referencia_id', $factura->id)
            ->where('modulo_origen', 'ventas')
            ->exists()) {
            return;
        }

        $regimen = $this->determinarRegimen($tenantId);

        // Buscar abono de la OT para descontar anticipos
        $abono = 0;
        if ($factura->orden_id) {
            $orden = \App\Modules\ServiceDesk\Models\OrdenReparacion::find($factura->orden_id);
            $abono = (float) ($orden->abono_inicial ?? 0);
        }

        // ─── Calcular impuestos usando el motor de reglas tributarias ───
        $baseImponible = (float) $factura->subtotal - (float) $factura->descuento;
        $cliente = $factura->cliente;

        $desgloseTributario = $this->tributaryService->calculateTaxes(
            $baseImponible,
            'venta',
            $tenantId,
            $cliente,
            $factura->created_at?->toDateString()
        );

        $ivaCalculado = $desgloseTributario['iva'] ?? 0;
        $retenciones = $desgloseTributario['retenciones'] ?? [];
        $totalRetenciones = $desgloseTributario['total_retenciones'] ?? 0;

        $lineas = [];

        // ─── Anticipos de clientes: débito para reversar el anticipo ───
        if ($abono > 0) {
            $cuentaAnticipos = $this->contabilidadService->getCuenta(ContabilidadConfig::anticipos($tenantId));
            if ($cuentaAnticipos) {
                $lineas[] = [
                    'cuenta_contable_id' => $cuentaAnticipos->id,
                    'descripcion' => "Reverso anticipo {$factura->numero}",
                    'debito' => $abono,
                    'credito' => 0,
                ];
            }
        }

        // ─── Débito: una línea por cada cuenta según el método de pago (saldo restante) ───
        $saldoPagado = max(0, (float) $factura->total - $abono - $totalRetenciones);

        if ($factura->metodo_pago === 'credito' || $factura->estado !== 'pagada') {
            // Crédito: todo va a Clientes
            $this->agregarLineaDebito($lineas, ContabilidadConfig::clientes($tenantId), 'Cuenta por cobrar ' . $factura->numero, $saldoPagado);
        } elseif (!empty($pagosMixtos)) {
            // Pagos mixtos: acumular montos por cuenta
            $porCuenta = [];
            foreach ($pagosMixtos as $pago) {
                $codigo = $this->cuentaPorMetodoPago($pago['metodo'] ?? 'efectivo', $regimen);
                $porCuenta[$codigo] = ($porCuenta[$codigo] ?? 0) + (float) ($pago['monto'] ?? 0);
            }
            foreach ($porCuenta as $codigo => $monto) {
                if ($monto > 0) {
                    $this->agregarLineaDebito($lineas, $codigo, 'Pago ' . $factura->numero, $monto);
                }
            }
        } else {
            // Pago único
            $codigo = $this->cuentaPorMetodoPago($factura->metodo_pago ?? 'efectivo', $regimen);
            $this->agregarLineaDebito($lineas, $codigo, 'Pago ' . $factura->numero, $saldoPagado);
        }

        // ─── Crédito: Ingresos (base gravable) ───
        $codigoIngreso = ContabilidadConfig::ingresoVentas($tenantId);
        $cuentaIngreso = $this->contabilidadService->getCuenta($codigoIngreso);
        if ($cuentaIngreso) {
            $lineas[] = [
                'cuenta_contable_id' => $cuentaIngreso->id,
                'descripcion' => "Ingreso {$factura->numero}",
                'debito' => 0,
                'credito' => $baseImponible,
            ];
        }

        // ─── IVA Generado (solo régimen común) ───
        if ($regimen === 'comun' && $ivaCalculado > 0) {
            $cuentaIva = $this->contabilidadService->getCuenta(ContabilidadConfig::ivaGenerado($tenantId));
            if ($cuentaIva) {
                $lineas[] = [
                    'cuenta_contable_id' => $cuentaIva->id,
                    'descripcion' => "IVA Generado {$factura->numero}",
                    'debito' => 0,
                    'credito' => $ivaCalculado,
                    'base_gravable' => $baseImponible,
                    'impuesto_tipo' => 'IVA',
                    'impuesto_tarifa' => $desgloseTributario['regimen'] === 'comun' ? 19.0 : 0,
                ];
            }
        }

        // ─── Retenciones (solo régimen común) ───
        if ($regimen === 'comun' && !empty($retenciones)) {
            foreach ($retenciones as $tipoRet => $ret) {
                $montoRet = $ret['valor'] ?? 0;
                if ($montoRet <= 0) {
                    continue;
                }

                $cuentaRet = match ($tipoRet) {
                    'rete_fuente' => $this->contabilidadService->getCuenta(ContabilidadConfig::retencionFuente($tenantId)),
                    'rete_iva' => $this->contabilidadService->getCuenta(ContabilidadConfig::retencionIva($tenantId)),
                    'rete_ica' => $this->contabilidadService->getCuenta(ContabilidadConfig::retencionIca($tenantId)),
                    default => null,
                };

                if ($cuentaRet) {
                    $labelRet = match ($tipoRet) {
                        'rete_fuente' => 'Retención Fuente',
                        'rete_iva' => 'Retención IVA',
                        'rete_ica' => 'Retención ICA',
                        default => 'Retención',
                    };
                    $lineas[] = [
                        'cuenta_contable_id' => $cuentaRet->id,
                        'descripcion' => "{$labelRet} {$factura->numero}",
                        'debito' => $montoRet,
                        'credito' => 0,
                        'base_gravable' => $ret['base'] ?? $baseImponible,
                        'impuesto_tipo' => strtoupper(str_replace('rete_', '', $tipoRet)),
                        'impuesto_tarifa' => $ret['tarifa'] ?? 0,
                    ];
                }
            }
        }

        if (count($lineas) >= 2) {
            if ($factura->cliente_id) {
                $cli = $factura->cliente;
                foreach ($lineas as &$linea) {
                    if (empty($linea['tercero_numero_documento'])) {
                        $linea['tercero_numero_documento'] = $cli->numero_documento ?? '999999999';
                        $linea['tercero_nombre'] = trim(($cli->nombres ?? '') . ' ' . ($cli->apellidos ?? '')) ?: ($cli->razon_social ?? 'Consumidor Final');
                    }
                }
            }

            $this->contabilidadService->registrarAsiento([
                'fecha' => now()->toDateString(),
                'concepto' => ($factura->tipo_documento === 'pos' ? 'Venta POS' : 'Factura') . " {$factura->numero}",
                'modulo_origen' => 'ventas',
                'documento_tipo' => $factura->tipo_documento === 'pos' ? 'POS' : 'FV',
                'documento_prefijo' => explode('-', $factura->numero)[0] . '-',
                'documento_numero' => $factura->numero,
                'referencia_type' => Factura::class,
                'referencia_id' => $factura->id,
            ], $lineas);
        }

        // COGS
        $this->registrarCostoVentas($factura);

        // Poblar Cuentas por Cobrar si es venta a crédito
        $this->poblarCuentaPorCobrar($factura, $abono);
    }

    /**
     * Crea un registro en Cuentas por Cobrar cuando la factura es a crédito.
     */
    private function poblarCuentaPorCobrar(Factura $factura, float $abono): void
    {
        $esCredito = $factura->metodo_pago === 'credito' || $factura->estado === 'pendiente';
        if (!$esCredito) {
            return;
        }

        if (!class_exists(\App\Modules\Accounting\Models\CuentaPorCobrar::class)) {
            return;
        }

        $saldoPendiente = max(0, (float) $factura->total - $abono);
        if ($saldoPendiente <= 0) {
            return;
        }

        try {
            \App\Modules\Accounting\Models\CuentaPorCobrar::create([
                'tenant_id' => $factura->tenant_id,
                'deudor_id' => $factura->cliente_id,
                'deudor_type' => \App\Modules\Crm\Models\Cliente::class,
                'documento_origen_id' => $factura->id,
                'documento_origen_type' => Factura::class,
                'monto_total' => $saldoPendiente,
                'monto_pagado' => 0,
                'estado' => 'pendiente',
                'fecha_vencimiento' => now()->addDays(30),
                'notas' => "Factura {$factura->numero} — saldo pendiente",
            ]);
        } catch (\Exception $e) {
            Log::warning("No se pudo crear CxC para factura {$factura->numero}: {$e->getMessage()}");
        }
    }

    /**
     * Agrega una línea de débito si la cuenta contable existe en el plan del tenant.
     */
    private function agregarLineaDebito(array &$lineas, string $codigo, string $descripcion, float $monto): void
    {
        if ($monto <= 0) {
            return;
        }
        $cuenta = $this->contabilidadService->getCuenta($codigo);
        if ($cuenta) {
            $lineas[] = [
                'cuenta_contable_id' => $cuenta->id,
                'descripcion' => $descripcion,
                'debito' => $monto,
                'credito' => 0,
            ];
        }
    }

    /**
     * Mapea un método de pago a la cuenta contable PUC Colombia (débito).
     * - efectivo      → 110505 (Caja)
     * - tarjeta       → 111005 (Bancos)
     * - transferencia → 111005 (Bancos)
     * - credito       → 130505 (Clientes)
     */
    private function cuentaPorMetodoPago(string $metodo, string $regimen): string
    {
        return ContabilidadConfig::cuentaPorMetodoPago($metodo, $regimen, $this->getTenantId());
    }

    private function getTenantId(): int
    {
        return app('current_tenant')->id ?? auth()->user()->tenant_id;
    }

    private function registrarCostoVentas(Factura $factura): void
    {
        $productoIds = $factura->items()->whereNotNull('producto_id')->pluck('producto_id')->unique()->values()->all();
        $productos = Producto::whereIn('id', $productoIds)->get()->keyBy('id');

        $costoTotal = 0;
        foreach ($factura->items as $item) {
            if ($item->producto_id) {
                $producto = $productos->get($item->producto_id);
                if ($producto && (float) $producto->costo_promedio > 0) {
                    $costoTotal += (float) $producto->costo_promedio * (float) $item->cantidad;
                }
            }
        }

        if ($costoTotal <= 0) {
            return;
        }

        $cuentaCosto = $this->contabilidadService->getCuenta(ContabilidadConfig::costoVentas($factura->tenant_id));
        $cuentaInventario = $this->contabilidadService->getCuenta(ContabilidadConfig::inventario($factura->tenant_id));

        if (!$cuentaCosto || !$cuentaInventario) {
            return;
        }

        try {
            $this->contabilidadService->registrarAsiento([
                'fecha' => now()->toDateString(),
                'concepto' => "Costo de ventas {$factura->numero}",
                'modulo_origen' => 'ventas',
                'documento_tipo' => $factura->tipo_documento === 'pos' ? 'POS' : 'FV',
                'documento_prefijo' => explode('-', $factura->numero)[0] . '-',
                'documento_numero' => $factura->numero,
                'referencia_type' => Factura::class,
                'referencia_id' => $factura->id,
            ], [
                [
                    'cuenta_contable_id' => $cuentaCosto->id,
                    'descripcion' => "Costo de ventas {$factura->numero}",
                    'debito' => $costoTotal,
                    'credito' => 0,
                ],
                [
                    'cuenta_contable_id' => $cuentaInventario->id,
                    'descripcion' => "Salida inventario {$factura->numero}",
                    'debito' => 0,
                    'credito' => $costoTotal,
                ],
            ]);
        } catch (\Exception $e) {
            Log::warning("No se pudo registrar costo de ventas para {$factura->numero}: {$e->getMessage()}");
        }
    }

    /**
     * Anula una factura: reversa inventario, caja, contabilidad y orden.
     */
    public function anular(Factura $factura, string $motivo): void
    {
        if (!$factura->esAnulable()) {
            throw new \Exception('La factura ya está anulada.');
        }

        $tenantId = $factura->tenant_id;

        DB::transaction(function () use ($factura, $motivo, $tenantId) {
            $factura->load('items');

            // 1. Restaurar stock de productos
            foreach ($factura->items as $item) {
                if ($item->producto_id) {
                    $producto = Producto::where('id', $item->producto_id)->lockForUpdate()->first();
                    if ($producto) {
                        $producto->increment('stock_actual', $item->cantidad);
                    }
                }
            }

            // 2. Reversar movimientos de caja (registrar egreso por cada ingreso original)
            $movimientos = \App\Modules\Cash\Models\MovimientoCaja::where('referencia_type', Factura::class)
                ->where('referencia_id', $factura->id)
                ->where('tipo', 'ingreso')
                ->get();

            foreach ($movimientos as $mov) {
                $sesion = \App\Modules\Cash\Models\CajaSesion::find($mov->sesion_id);
                if ($sesion && $sesion->estado === 'abierta') {
                    $this->cajaService->registrarMovimiento(
                        $sesion,
                        'egreso',
                        (float) $mov->monto,
                        $mov->metodo_pago,
                        "REVERSIÓN ANULACIÓN Factura {$factura->numero}: {$motivo}",
                        $factura
                    );
                } else {
                    Log::warning(
                        "Reversión de caja omitida para factura {$factura->numero}: " .
                        "sesión #{$mov->sesion_id} ya cerrada (movimiento original: \${$mov->monto} {$mov->metodo_pago})."
                    );
                }
            }

            // 3. Reversar asientos contables
            if ($this->contabilidadService) {
                try {
                    $this->contabilidadService->revertirAsiento(
                        'ventas',
                        Factura::class,
                        $factura->id,
                        $motivo
                    );
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning(
                        "No se pudo revertir asiento contable para {$factura->numero}: {$e->getMessage()}"
                    );
                }
            }

            // 4. Restaurar estado de la orden (si proviene de OT)
            if ($factura->orden_id) {
                $orden = \App\Modules\ServiceDesk\Models\OrdenReparacion::find($factura->orden_id);
                if ($orden && $orden->estado === \App\Modules\ServiceDesk\Enums\OrdenEstado::Entregado) {
                    $orden->estado = \App\Modules\ServiceDesk\Enums\OrdenEstado::Listo;
                    $orden->fecha_entregado = null;
                    $orden->save();
                }
            }

            // 5. Marcar factura como anulada
            $factura->update([
                'anulada' => true,
                'anulada_at' => now(),
                'anulada_por' => auth()->id(),
                'motivo_anulacion' => $motivo,
                'estado' => 'anulada',
            ]);
        });
    }

    private function emitirDian(Factura $factura, int $tenantId): void
    {
        $regimen = $this->determinarRegimen($tenantId);

        if ($regimen !== 'comun') {
            return;
        }

        $resolucionActiva = \App\Modules\Sales\Models\Resolucion::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->exists();

        $certificadoActivo = \App\Modules\Sales\Models\Certificado::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->exists();

        if (!$resolucionActiva || !$certificadoActivo) {
            $factura->update(['dian_estado' => 'borrador']);
            return;
        }

        if (!$this->dianService) {
            $factura->update(['dian_estado' => 'borrador']);
            return;
        }

        \App\Jobs\EmitirFacturaDianJob::dispatch($factura->id, $tenantId)
            ->onQueue('dian');
    }
}
```

### DianProviderInterface.php

**Ruta:** app/Modules/Sales/Services/ElectronicBilling/DianProviderInterface.php

```php
<?php

namespace App\Modules\Sales\Services\ElectronicBilling;

interface DianProviderInterface
{
    /**
     * Envía el XML firmado a los servicios web de la DIAN.
     *
     * @param string $signedXml
     * @return array
     */
    public function send(string $signedXml): array;

    /**
     * Consulta el estado de un documento previamente enviado (usando el TrackID).
     *
     * @param string $trackId
     * @return array
     */
    public function status(string $trackId): array;
}
```

### DianService.php

**Ruta:** app/Modules/Sales/Services/ElectronicBilling/DianService.php

```php
<?php

namespace App\Modules\Sales\Services\ElectronicBilling;

use App\Modules\Sales\Models\Certificado;
use App\Modules\Sales\Models\Factura;
use App\Modules\Sales\Models\DianEvento;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Servicio de facturación electrónica DIAN (Colombia).
 *
 * Orquesta el ciclo completo: generación XML → firma → envío → procesamiento respuesta.
 * Soporta reintentos automáticos y máquina de estados completa.
 *
 * Estados: borrador → pendiente_envio → enviado → aceptado | rechazado | error
 */
readonly class DianService
{
    private SignatureProviderInterface $signatureProvider;
    private DianProviderInterface $dianProvider;
    private XmlUBLGenerator $xmlGenerator;

    /** Estados que impiden un nuevo envío. */
    private const BLOCKED_STATES = ['enviado', 'aceptado'];

    /** Estados que permiten reintento. */
    private const RETRYABLE_STATES = ['rechazado', 'error', 'error_http', 'error_conexion', 'error_request'];

    public function __construct(
        SignatureProviderInterface $signatureProvider,
        DianProviderInterface $dianProvider,
        XmlUBLGenerator $xmlGenerator,
    ) {
        $this->signatureProvider = $signatureProvider;
        $this->dianProvider = $dianProvider;
        $this->xmlGenerator = $xmlGenerator;
    }

    /**
     * Proceso principal para emitir una factura a la DIAN.
     *
     * Flujo completo:
     *  1. Validación de estado
     *  2. Generación XML UBL 2.1
     *  3. Firma digital (XAdES-BES)
     *  4. Envío a DIAN (con reintentos)
     *  5. Procesamiento de respuesta
     *  6. Actualización de estado en BD (transaccional)
     *
     * @throws \RuntimeException Si la factura no puede emitirse
     */
    public function emitirFactura(Factura $factura, array $empresa): void
    {
        // 1. Validate current state
        if (in_array($factura->dian_estado, self::BLOCKED_STATES, true)) {
            throw new \RuntimeException(
                "La factura {$factura->numero} ya se encuentra en estado: {$factura->dian_estado}"
            );
        }

        // Allow retry from retryable states
        $isRetry = in_array($factura->dian_estado, self::RETRYABLE_STATES, true);

        Log::channel('daily')->info('DIAN emitirFactura - Iniciando', [
            'factura_id' => $factura->id,
            'numero' => $factura->numero,
            'estado_actual' => $factura->dian_estado,
            'is_retry' => $isRetry,
        ]);

        // 2. Set pending state
        $factura->update(['dian_estado' => 'pendiente_envio']);
        $this->logEvent($factura, 'pendiente_envio', 'Iniciando generación de XML y firma.');

        // 3. Get certificate
        $certificado = Certificado::where('tenant_id', $factura->tenant_id)
            ->where('is_active', true)
            ->first();

        // 4. Generate UBL 2.1 XML
        $xmlOriginal = $this->xmlGenerator->generar($factura, $empresa);

        $this->logEvent($factura, 'pendiente_envio', 'XML UBL 2.1 generado.', $xmlOriginal);

        // 5. Sign XML
        $xmlFirmado = $this->signatureProvider->sign($xmlOriginal, $certificado);

        $this->logEvent($factura, 'enviado', 'XML firmado correctamente. Enviando a la DIAN.', $xmlFirmado);

        // 6. Send to DIAN with retry logic
        $maxAttempts = (int) config('dian.retry.max_attempts', 3);
        $retryDelay = (int) config('dian.retry.delay_seconds', 5);
        $lastResponse = null;

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            Log::channel('daily')->info("DIAN emitirFactura - Intento {$attempt}/{$maxAttempts}", [
                'factura_id' => $factura->id,
            ]);

            $response = $this->dianProvider->send($xmlFirmado);
            $lastResponse = $response;

            // If success or non-retryable error, break
            if ($response['success'] || !$this->isRetryableError($response)) {
                break;
            }

            // Wait before retrying
            if ($attempt < $maxAttempts) {
                Log::channel('daily')->warning("DIAN emitirFactura - Reintentando en {$retryDelay}s", [
                    'factura_id' => $factura->id,
                    'attempt' => $attempt,
                    'error' => $response['dian_mensaje'] ?? 'Unknown',
                ]);
                sleep($retryDelay);
            }
        }

        // 7. Process response inside transaction
        $this->processResponse($factura, $xmlFirmado, $lastResponse);
    }

    /**
     * Consulta el estado de una factura en la DIAN usando su trackId.
     */
    public function consultarEstado(Factura $factura): array
    {
        if (empty($factura->dian_track_id)) {
            throw new \RuntimeException("La factura {$factura->numero} no tiene track_id de DIAN.");
        }

        $response = $this->dianProvider->status($factura->dian_track_id);

        if ($response['success']) {
            DB::transaction(function () use ($factura, $response) {
                $factura->update([
                    'dian_estado' => $response['dian_estado'],
                    'dian_mensaje' => $response['dian_mensaje'],
                    'cufe' => $response['cufe'] ?? $factura->cufe,
                ]);

                $this->logEvent(
                    $factura,
                    $response['dian_estado'],
                    $response['dian_mensaje'],
                    null,
                    $response['xml_respuesta'] ?? null
                );
            });
        }

        return $response;
    }

    /**
     * Reintentar envío de una factura en estado retryable.
     */
    public function reintentarEnvio(Factura $factura, array $empresa): void
    {
        if (!in_array($factura->dian_estado, self::RETRYABLE_STATES, true)) {
            throw new \RuntimeException(
                "La factura {$factura->numero} no está en un estado reintenable: {$factura->dian_estado}"
            );
        }

        $this->emitirFactura($factura, $empresa);
    }

    // ──────────────────────────────────────────────
    //  Private Methods
    // ──────────────────────────────────────────────

    private function processResponse(Factura $factura, string $xmlFirmado, array $response): void
    {
        DB::transaction(function () use ($factura, $xmlFirmado, $response) {
            if ($response['success']) {
                $factura->update([
                    'dian_estado' => $response['dian_estado'],
                    'dian_mensaje' => $response['dian_mensaje'],
                    'dian_track_id' => $response['dian_track_id'] ?? null,
                    'cufe' => $response['cufe'] ?? null,
                    'dian_fecha_envio' => now(),
                ]);

                $this->logEvent(
                    $factura,
                    $response['dian_estado'],
                    $response['dian_mensaje'],
                    $xmlFirmado,
                    $response['xml_respuesta'] ?? null
                );

                Log::channel('daily')->info('DIAN emitirFactura - Factura aceptada', [
                    'factura_id' => $factura->id,
                    'track_id' => $response['dian_track_id'] ?? null,
                    'cufe' => $response['cufe'] ?? null,
                ]);
            } else {
                $estado = $response['dian_estado'] ?? 'rechazado';
                $factura->update([
                    'dian_estado' => $estado,
                    'dian_mensaje' => $response['dian_mensaje'] ?? 'Rechazado por la DIAN',
                    'dian_fecha_envio' => now(),
                ]);

                $this->logEvent(
                    $factura,
                    $estado,
                    $response['dian_mensaje'] ?? 'Error desconocido.',
                    $xmlFirmado,
                    $response['xml_respuesta'] ?? null
                );

                Log::channel('daily')->warning('DIAN emitirFactura - Factura rechazada/error', [
                    'factura_id' => $factura->id,
                    'estado' => $estado,
                    'mensaje' => $response['dian_mensaje'] ?? null,
                ]);
            }
        });
    }

    private function isRetryableError(array $response): bool
    {
        $retryableStatuses = ['error_http', 'error_conexion', 'error_request', 'error'];

        return in_array($response['dian_estado'] ?? '', $retryableStatuses, true);
    }

    private function logEvent(
        Factura $factura,
        string $estado,
        string $mensaje,
        ?string $xmlEnviado = null,
        ?string $xmlRespuesta = null
    ): void {
        DianEvento::create([
            'factura_id' => $factura->id,
            'estado' => $estado,
            'mensaje' => $mensaje,
            'xml_enviado' => $xmlEnviado,
            'xml_respuesta' => $xmlRespuesta,
        ]);
    }
}
```

### SignatureProviderInterface.php

**Ruta:** app/Modules/Sales/Services/ElectronicBilling/SignatureProviderInterface.php

```php
<?php

namespace App\Modules\Sales\Services\ElectronicBilling;

use App\Modules\Sales\Models\Certificado;

interface SignatureProviderInterface
{
    /**
     * Firma un documento XML usando el certificado digital de la empresa.
     *
     * @param string $xmlContent El XML original (UBL 2.1)
     * @param Certificado|null $certificado El certificado digital. En mocks puede ser null.
     * @return string El XML firmado (XAdES)
     */
    public function sign(string $xmlContent, ?Certificado $certificado): string;
}
```

### XmlSigner.php

**Ruta:** app/Modules/Sales/Services/ElectronicBilling/XmlSigner.php

```php
<?php

namespace App\Modules\Sales\Services\ElectronicBilling;

use App\Modules\Sales\Models\Certificado;
use App\Modules\Sales\Services\ElectronicBilling\SignatureProviderInterface;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Firma digital de XML UBL 2.1 usando certificado PFX (XAdES-BES).
 *
 * Extrae la clave privada y el certificado del PFX usando openssl,
 * luego genera una firma XML canonicalizada según las especificaciones
 * de la DIAN (Resolución 000012 de 2021).
 */
readonly class XmlSigner implements SignatureProviderInterface
{
    private string $tempDir;

    public function __construct(?string $tempDir = null)
    {
        $this->tempDir = $tempDir ?? sys_get_temp_dir();
    }

    /**
     * Firma un XML UBL 2.1 con el certificado digital de la empresa.
     *
     * @param string        $xmlContent  XML original (UBL 2.1)
     * @param Certificado|null $certificado Certificado PFX almacenado en BD
     * @return string XML firmado (XAdES-BES)
     * @throws RuntimeException Si el certificado no es válido o la firma falla
     */
    public function sign(string $xmlContent, ?Certificado $certificado): string
    {
        if ($certificado === null) {
            throw new RuntimeException('No se proporcionó certificado digital para firmar.');
        }

        $this->validarCertificado($certificado);

        try {
            $pfxPath = $this->resolvePfxPath($certificado);
            $password = $certificado->password;

            // Extract private key and certificate from PFX
            $privateKey = $this->extractPrivateKey($pfxPath, $password);
            $certificate = $this->extractCertificate($pfxPath, $password);

            // Compute the digest of the XML (envelope hash)
            $xmlDigest = $this->computeXmlDigest($xmlContent);

            // Build the XAdES signature
            $signature = $this->buildXadesSignature($xmlContent, $certificate, $privateKey, $xmlDigest);

            // Insert signature into XML's UBLExtension/ExtensionContent
            $signedXml = $this->insertSignatureIntoXml($xmlContent, $signature);

            Log::channel('daily')->info('XML firmado exitosamente', [
                'certificado_id' => $certificado->id,
                'tenant_id' => $certificado->tenant_id,
            ]);

            return $signedXml;

        } catch (RuntimeException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::channel('daily')->error('Error al firmar XML', [
                'error' => $e->getMessage(),
                'certificado_id' => $certificado->id,
            ]);
            throw new RuntimeException('Error al firmar XML: ' . $e->getMessage(), 0, $e);
        }
    }

    // ──────────────────────────────────────────────
    //  PFX Handling
    // ──────────────────────────────────────────────

    private function resolvePfxPath(Certificado $certificado): string
    {
        // The pfx_path may be a relative path within the storage disk
        $disk = config('dian.certificate.storage_disk', 'local');
        $prefix = config('dian.certificate.storage_prefix', 'dian/certificados');

        // If it's an absolute path, use it directly
        if (File::isAbsolute($certificado->pfx_path) && File::exists($certificado->pfx_path)) {
            return $certificado->pfx_path;
        }

        // Try resolving via storage disk
        $storagePath = storage_path("app/{$prefix}/{$certificado->pfx_path}");
        if (File::exists($storagePath)) {
            return $storagePath;
        }

        // Fallback: treat pfx_path as relative to storage
        $fullPath = storage_path("app/{$certificado->pfx_path}");
        if (File::exists($fullPath)) {
            return $fullPath;
        }

        throw new RuntimeException("Certificado PFX no encontrado: {$certificado->pfx_path}");
    }

    private function extractPrivateKey(string $pfxPath, string $password): string
    {
        $certs = [];
        $result = openssl_pkcs12_read(file_get_contents($pfxPath), $certs, $password);

        if (!$result || empty($certs['pkey'])) {
            throw new RuntimeException('No se pudo extraer la clave privada del certificado PFX.');
        }

        return $certs['pkey'];
    }

    private function extractCertificate(string $pfxPath, string $password): string
    {
        $certs = [];
        $result = openssl_pkcs12_read(file_get_contents($pfxPath), $certs, $password);

        if (!$result || empty($certs['cert'])) {
            throw new RuntimeException('No se pudo extraer el certificado del PFX.');
        }

        return $certs['cert'];
    }

    // ──────────────────────────────────────────────
    //  XML Digest & Signature
    // ──────────────────────────────────────────────

    private function computeXmlDigest(string $xmlContent): string
    {
        // Remove existing UBLExtensions (signature placeholder) before digesting
        // Handle both <ext:ExtensionContent/> (DOMDocument) and <ext:ExtensionContent></ext:ExtensionContent>
        $cleanXml = preg_replace(
            '/<ext:UBLExtensions>.*?<\/ext:UBLExtensions>/s',
            '<ext:UBLExtensions><ext:UBLExtension><ext:ExtensionContent/></ext:UBLExtension></ext:UBLExtensions>',
            $xmlContent
        );

        // Canonicalize using C14N (removes comments, normalizes whitespace)
        $dom = new \DOMDocument();
        $dom->loadXML($cleanXml);
        $canonical = $dom->C14N();

        return base64_encode(hash('sha256', $canonical, true));
    }

    private function buildXadesSignature(
        string $xmlContent,
        string $certificate,
        string $privateKey,
        string $xmlDigest
    ): string {
        $uuid = 'sig-' . strtoupper(bin2hex(random_bytes(16)));
        $timestamp = now()->format('Y-m-d\TH:i:s-05:00');

        // Extract the issuer name and serial number from the certificate
        $certData = openssl_x509_parse($certificate);
        $issuerName = $this->normalizeX509Name($certData['issuer'] ?? []);
        $serialNumber = $certData['serialNumberHex'] ?? strtoupper(bin2hex(random_bytes(8)));

        // Compute signature value — must use the exact same SignedInfo that appears in the XML
        $signatureValue = $this->computeSignatureValue($xmlDigest, $uuid, $timestamp, $certificate, $privateKey, $serialNumber);

        return <<<XML
<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="{$uuid}">
  <ds:SignedInfo>
    <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
    <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
    <ds:Reference URI="">
      <ds:Transforms>
        <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
        <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
      </ds:Transforms>
      <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
      <ds:DigestValue>{$xmlDigest}</ds:DigestValue>
    </ds:Reference>
    <ds:Reference URI="#{$uuid}-SignedProperties">
      <ds:Transforms>
        <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
      </ds:Transforms>
      <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
      <ds:DigestValue>{$this->computeSignedPropertiesDigest($uuid, $timestamp, $certificate, $serialNumber)}</ds:DigestValue>
    </ds:Reference>
  </ds:SignedInfo>
  <ds:SignatureValue>{$signatureValue}</ds:SignatureValue>
  <ds:KeyInfo>
    <ds:X509Data>
      <ds:X509Certificate>{$this->normalizeCertificate($certificate)}</ds:X509Certificate>
    </ds:X509Data>
  </ds:KeyInfo>
  <ds:Object Id="{$uuid}-SignedProperties">
    <xades:SignedProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="{$uuid}-SignedProperties">
      <xades:SignedSignatureProperties>
        <xades:SigningTime>{$timestamp}</xades:SigningTime>
        <xades:SigningCertificate>
          <xades:Cert>
            <xades:CertDigest>
              <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
              <ds:DigestValue>{$this->computeCertificateDigest($certificate)}</ds:DigestValue>
            </xades:CertDigest>
            <xades:IssuerSerial>
              <ds:X509IssuerName>{$issuerName}</ds:X509IssuerName>
              <ds:X509SerialNumber>{$serialNumber}</ds:X509SerialNumber>
            </xades:IssuerSerial>
          </xades:Cert>
        </xades:SigningCertificate>
      </xades:SignedSignatureProperties>
    </xades:SignedProperties>
  </ds:Object>
</ds:Signature>
XML;
    }

    private function computeSignatureValue(
        string $xmlDigest,
        string $uuid,
        string $timestamp,
        string $certificate,
        string $privateKey,
        string $serialNumber
    ): string {
        // Build the SignedInfo canonical form for signing — must match EXACTLY what's in the final XML
        $signedInfoCanonical = <<<XML
<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/><ds:Reference URI=""><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>{$xmlDigest}</ds:DigestValue></ds:Reference><ds:Reference URI="#{$uuid}-SignedProperties"><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>{$this->computeSignedPropertiesDigest($uuid, $timestamp, $certificate, $serialNumber)}</ds:DigestValue></ds:Reference></ds:SignedInfo>
XML;

        $signatureValue = '';
        openssl_sign($signedInfoCanonical, $signatureValue, $privateKey, OPENSSL_ALGO_SHA256);

        return base64_encode($signatureValue);
    }

    private function computeSignedPropertiesDigest(
        string $uuid,
        string $timestamp,
        string $certificate,
        string $serialNumber
    ): string {
        $issuerName = $this->normalizeX509Name(openssl_x509_parse($certificate)['issuer'] ?? []);
        $certDigest = $this->computeCertificateDigest($certificate);

        $signedProperties = <<<XML
<xades:SignedProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="{$uuid}-SignedProperties"><xades:SignedSignatureProperties><xades:SigningTime>{$timestamp}</xades:SigningTime><xades:SigningCertificate><xades:Cert><xades:CertDigest><ds:DigestMethod xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue xmlns:ds="http://www.w3.org/2000/09/xmldsig#">{$certDigest}</ds:DigestValue></xades:CertDigest><xades:IssuerSerial><ds:X509IssuerName xmlns:ds="http://www.w3.org/2000/09/xmldsig#">{$issuerName}</ds:X509IssuerName><ds:X509SerialNumber xmlns:ds="http://www.w3.org/2000/09/xmldsig#">{$serialNumber}</ds:X509SerialNumber></xades:IssuerSerial></xades:Cert></xades:SigningCertificate></xades:SignedSignatureProperties></xades:SignedProperties>
XML;

        return base64_encode(hash('sha256', $signedProperties, true));
    }

    private function computeCertificateDigest(string $certificate): string
    {
        $der = $this->pemToDer($certificate);
        return base64_encode(hash('sha256', $der, true));
    }

    // ──────────────────────────────────────────────
    //  XML Manipulation
    // ──────────────────────────────────────────────

    private function insertSignatureIntoXml(string $xmlContent, string $signature): string
    {
        // Match both <ext:ExtensionContent></ext:ExtensionContent> and self-closing <ext:ExtensionContent/>
        $pattern = '/<ext:ExtensionContent(?:\s*\/?>|\s*>\s*<\/ext:ExtensionContent>)/';
        $replacement = '<ext:ExtensionContent>' . "\n" . $signature . "\n" . '</ext:ExtensionContent>';

        $result = preg_replace($pattern, $replacement, $xmlContent, 1);

        if ($result === null || $result === $xmlContent) {
            throw new RuntimeException('No se pudo insertar la firma en el XML. Verifique la estructura UBL.');
        }

        return $result;
    }

    // ──────────────────────────────────────────────
    //  Utility Methods
    // ──────────────────────────────────────────────

    private function normalizeCertificate(string $pem): string
    {
        return str_replace(["-----BEGIN CERTIFICATE-----", "-----END CERTIFICATE-----", "\n", "\r"], '', $pem);
    }

    private function pemToDer(string $pem): string
    {
        $der = '';
        openssl_x509_export($pem, $der, false);
        // The export gives us PEM, strip headers
        return base64_decode(str_replace(["-----BEGIN CERTIFICATE-----", "-----END CERTIFICATE-----", "\n", "\r"], '', $der));
    }

    private function getSerialNumber(string $certificate): string
    {
        $certData = openssl_x509_parse($certificate);
        return $certData['serialNumberHex'] ?? strtoupper(bin2hex(random_bytes(8)));
    }

    private function normalizeX509Name(array $nameParts): string
    {
        $parts = [];
        foreach ($nameParts as $key => $value) {
            $parts[] = "{$key}={$value}";
        }
        return implode(', ', $parts);
    }

    private function validarCertificado(Certificado $certificado): void
    {
        if (!$certificado->is_active) {
            throw new RuntimeException('El certificado digital no está activo.');
        }

        if ($certificado->fecha_vencimiento && $certificado->fecha_vencimiento->isPast()) {
            throw new RuntimeException('El certificado digital ha expirado.');
        }
    }
}
```

### XmlUBLGenerator.php

**Ruta:** app/Modules/Sales/Services/ElectronicBilling/XmlUBLGenerator.php

```php
<?php

namespace App\Modules\Sales\Services\ElectronicBilling;

use App\Modules\Sales\Models\Factura;
use App\Modules\Sales\Models\FacturaItem;
use App\Modules\Sales\Models\Resolucion;
use Illuminate\Support\Facades\DB;

/**
 * Generador de XML UBL 2.1 para facturación electrónica DIAN (Colombia).
 *
 * Producing valid UBL 2.1 documents that comply with DIAN's technical
 * requirements (Resolución 000012 de 2021 and subsequent updates).
 */
readonly class XmlUBLGenerator
{
    private const UBL_NS = 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2';
    private const CAC_NS = 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2';
    private const CBC_NS = 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2';
    private const EXT_NS = 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2';

    /**
     * Genera el XML UBL 2.1 completo para una factura.
     *
     * @param Factura $factura Factura con items y cliente cargados
     * @param array   $empresa Datos de la empresa (razon_social, nit, direccion, etc.)
     * @return string XML UBL 2.1 listo para firmar
     *
     * @throws \RuntimeException Si la resolución o datos obligatorios faltan
     */
    public function generar(Factura $factura, array $empresa): string
    {
        $this->validarDatosRequeridos($factura, $empresa);

        $resolucion = Resolucion::where('tenant_id', $factura->tenant_id)
            ->where('tipo_documento', $factura->tipo_documento ?? 'factura')
            ->where('is_active', true)
            ->first();

        $fecha = $factura->created_at->format('Y-m-d');
        $hora = $factura->created_at->format('H:i:s') . '-05:00';

        // Ensure items are loaded
        $items = $factura->items()->with('producto')->get();

        $xml = new \DOMDocument('1.0', 'UTF-8');
        $xml->formatOutput = true;

        $invoice = $xml->createElementNS(self::UBL_NS, 'Invoice');
        $invoice->setAttribute('xmlns:cac', self::CAC_NS);
        $invoice->setAttribute('xmlns:cbc', self::CBC_NS);
        $invoice->setAttribute('xmlns:ext', self::EXT_NS);

        // ── UBL Extensions (placeholder for signature) ──
        $extensions = $this->createElement($xml, 'ext:UBLExtensions');
        $extension = $this->createElement($xml, 'ext:UBLExtension');
        $extensionContent = $this->createElement($xml, 'ext:ExtensionContent');
        $extension->appendChild($extensionContent);
        $extensions->appendChild($extension);
        $invoice->appendChild($extensions);

        // ── Standard UBL Header ──
        $invoice->appendChild($this->createElement($xml, 'cbc:UBLVersionID', 'UBL 2.1'));
        $invoice->appendChild($this->createElement($xml, 'cbc:CustomizationID', 'Documentos electrónicos'));
        $invoice->appendChild($this->createElement($xml, 'cbc:ProfileID', 'DIAN 2.1'));
        $invoice->appendChild($this->createElement($xml, 'cbc:ID', $factura->numero));
        $invoice->appendChild($this->createElement($xml, 'cbc:IssueDate', $fecha));
        $invoice->appendChild($this->createElement($xml, 'cbc:IssueTime', $hora));
        $invoice->appendChild($this->createElement($xml, 'cbc:InvoiceTypeCode', '01'));
        $invoice->appendChild($this->createElement($xml, 'cbc:DocumentCurrencyCode', 'COP'));

        // Note: document-level note
        if ($factura->notas) {
            $invoice->appendChild($this->createElement($xml, 'cbc:Note', $factura->notas));
        }

        // ── Resolution / Authorization ──
        if ($resolucion) {
            $invoice->appendChild($this->createElement($xml, 'cbc:InvoicePeriod', null, [
                $this->createElement($xml, 'cbc:StartDate', $resolucion->fecha_desde->format('Y-m-d')),
                $this->createElement($xml, 'cbc:EndDate', $resolucion->fecha_hasta->format('Y-m-d')),
            ]));

            $invoice->appendChild($this->createElement($xml, 'cbc:DocumentStatusCode', $resolucion->numero_resolucion));
        }

        // ── Supplier (Empresa / Emisor) ──
        $supplier = $this->buildParty($xml, 'cac:AccountingSupplierParty', [
            'id' => $empresa['nit'],
            'id_scheme' => '96',
            'name' => $empresa['razon_social'],
            'address' => $empresa['direccion'] ?? '',
            'city_code' => $empresa['ciudad codigo'] ?? $empresa['ciudad_codigo'] ?? '11001',
            'country_code' => $empresa['pais'] ?? 'CO',
        ]);
        $invoice->appendChild($supplier);

        // ── Customer (Cliente / Adquirente) ──
        $customerData = $this->resolveCustomerData($factura);
        $customer = $this->buildParty($xml, 'cac:AccountingCustomerParty', $customerData);
        $invoice->appendChild($customer);

        // ── Payment Means ──
        $invoice->appendChild($this->buildPaymentMeans($xml, $factura, $empresa));

        // ── Tax Total ──
        $taxTotal = $this->buildTaxTotal($xml, $items, $factura);
        $invoice->appendChild($taxTotal);

        // ── AllowanceCharge (descuento) ──
        if ($factura->descuento > 0) {
            $allowanceCharge = $xml->createElement('cac:AllowanceCharge');
            $allowanceCharge->appendChild($this->createElement($xml, 'cbc:ChargeIndicator', 'false'));
            $allowanceCharge->appendChild($this->createElement($xml, 'cbc:Amount', $this->formatDecimal($factura->descuento))->setAttribute('currencyID', 'COP'));
            $allowanceCharge->appendChild($this->createElement($xml, 'cbc:BaseAmount', $this->formatDecimal($factura->subtotal))->setAttribute('currencyID', 'COP'));
            $invoice->appendChild($allowanceCharge);
        }

        // ── Legal Monetary Total ──
        $monetaryTotal = $this->buildLegalMonetaryTotal($xml, $factura);
        $invoice->appendChild($monetaryTotal);

        // ── Invoice Lines ──
        foreach ($items as $index => $item) {
            $line = $this->buildInvoiceLine($xml, $index + 1, $item);
            $invoice->appendChild($line);
        }

        $xml->appendChild($invoice);

        return $xml->saveXML();
    }

    // ──────────────────────────────────────────────
    //  Party Builders
    // ──────────────────────────────────────────────

    private function buildParty(\DOMDocument $xml, string $elementName, array $data): \DOMElement
    {
        $party = $xml->createElement($elementName);
        $partyNode = $xml->createElement('cac:Party');

        // PartyIdentification (NIT)
        $partyIdentification = $xml->createElement('cac:PartyIdentification');
        $idEl = $this->createElement($xml, 'cbc:ID', $data['id']);
        if (isset($data['id_scheme'])) {
            $idEl->setAttribute('schemeID', $data['id_scheme']);
        }
        $partyIdentification->appendChild($idEl);
        $partyNode->appendChild($partyIdentification);

        // PartyName
        if (!empty($data['name'])) {
            $partyName = $xml->createElement('cac:PartyName');
            $partyName->appendChild($this->createElement($xml, 'cbc:Name', $data['name']));
            $partyNode->appendChild($partyName);
        }

        // PhysicalLocation (Address)
        $location = $xml->createElement('cac:PhysicalLocation');
        $address = $xml->createElement('cac:Address');
        $address->appendChild($this->createElement($xml, 'cbc:StreetName', $data['address'] ?? ''));
        $address->appendChild($this->createElement($xml, 'cbc:CitySubdivisionName', $data['city_subdivision'] ?? ''));

        $city = $xml->createElement('cac:City');
        $city->appendChild($this->createElement($xml, 'cbc:Code', $data['city_code'] ?? '11001'));
        $address->appendChild($city);

        $country = $xml->createElement('cac:Country');
        $country->appendChild($this->createElement($xml, 'cbc:IdentificationCode', $data['country_code'] ?? 'CO'));
        $address->appendChild($country);

        $location->appendChild($address);
        $partyNode->appendChild($location);

        // PartyTaxScheme (NIT para DIAN)
        $taxScheme = $xml->createElement('cac:PartyTaxScheme');
        $taxScheme->appendChild($this->createElement($xml, 'cbc:RegistrationName', $data['name'] ?? ''));
        $taxScheme->appendChild($this->createElement($xml, 'cbc:CompanyID', $data['id'] ?? ''));

        $tax = $xml->createElement('cac:TaxScheme');
        $tax->appendChild($this->createElement($xml, 'cbc:ID', '01'));
        $taxScheme->appendChild($tax);
        $partyNode->appendChild($taxScheme);

        $party->appendChild($partyNode);
        return $party;
    }

    private function resolveCustomerData(Factura $factura): array
    {
        $cliente = $factura->cliente;

        if ($cliente) {
            return [
                'id' => $cliente->nit ?? $cliente->documento ?? '222222222222',
                'id_scheme' => '96',
                'name' => $cliente->nombre_razon_social ?? $cliente->nombre ?? 'CONSUMIDOR FINAL',
                'address' => $cliente->direccion ?? '',
                'city_code' => $cliente->ciudad_codigo ?? '11001',
                'country_code' => 'CO',
            ];
        }

        // Consumer final fallback
        return [
            'id' => '222222222222',
            'id_scheme' => '96',
            'name' => 'CONSUMIDOR FINAL',
            'address' => '',
            'city_code' => '11001',
            'country_code' => 'CO',
        ];
    }

    // ──────────────────────────────────────────────
    //  Payment Means
    // ──────────────────────────────────────────────

    private function buildPaymentMeans(\DOMDocument $xml, Factura $factura, array $empresa): \DOMElement
    {
        $paymentMeans = $xml->createElement('cac:PaymentMeans');

        // DIAN payment means codes: 10=Efectivo, 42=Transferencia, 48=Tarjeta
        $paymentCode = match ($factura->metodo_pago) {
            'efectivo' => '10',
            'transferencia' => '42',
            'tarjeta' => '48',
            'credito' => '10', // Crédito still pays eventually
            default => '10',
        };

        $paymentMeans->appendChild($this->createElement($xml, 'cbc:PaymentMeansCode', $paymentCode));
        $paymentMeans->appendChild($this->createElement($xml, 'cbc:PaymentDueDate', $factura->created_at->format('Y-m-d')));

        // PayeeFinancialAccount (optional but recommended)
        $account = $xml->createElement('cac:PayeeFinancialAccount');
        $account->appendChild($this->createElement($xml, 'cbc:ID', $empresa['cuenta_bancaria'] ?? '000000000'));
        $paymentMeans->appendChild($account);

        return $paymentMeans;
    }

    // ──────────────────────────────────────────────
    //  Tax Total
    // ──────────────────────────────────────────────

    private function buildTaxTotal(\DOMDocument $xml, \Illuminate\Database\Eloquent\Collection $items, Factura $factura): \DOMElement
    {
        $taxTotal = $xml->createElement('cac:TaxTotal');

        // Usar el IVA calculado a nivel de factura (ya incluye descuento) en vez de sumar items
        $totalIva = (float) $factura->impuestos;

        $taxAmount = $this->createElement($xml, 'cbc:TaxAmount', $this->formatDecimal($totalIva));
        $taxAmount->setAttribute('currencyID', 'COP');
        $taxTotal->appendChild($taxAmount);

        // TaxSubtotal for IVA — base gravable = subtotal - descuento
        $taxSubtotal = $xml->createElement('cac:TaxSubtotal');
        $baseGravable = max(0, (float) $factura->subtotal - (float) $factura->descuento);
        $taxableAmount = $this->createElement($xml, 'cbc:TaxableAmount', $this->formatDecimal($baseGravable));
        $taxableAmount->setAttribute('currencyID', 'COP');
        $taxSubtotal->appendChild($taxableAmount);

        $subTaxAmount = $this->createElement($xml, 'cbc:TaxAmount', $this->formatDecimal($totalIva));
        $subTaxAmount->setAttribute('currencyID', 'COP');
        $taxSubtotal->appendChild($subTaxAmount);

        // Determinar tasa de IVA del primer ítem con impuesto
        $ivaRate = $items->firstWhere('tasa_impuesto', '>', 0)?->tasa_impuesto ?? 19.00;

        $taxCategory = $xml->createElement('cac:TaxCategory');
        $taxCategory->appendChild($this->createElement($xml, 'cbc:Percent', $this->formatDecimal($ivaRate)));
        $taxCategory->appendChild($this->createElement($xml, 'cbc:TaxExemptionReasonCode', '01'));

        $taxScheme = $xml->createElement('cac:TaxScheme');
        $taxScheme->appendChild($this->createElement($xml, 'cbc:ID', '01'));
        $taxScheme->appendChild($this->createElement($xml, 'cbc:Name', 'IVA'));
        $taxCategory->appendChild($taxScheme);

        $taxSubtotal->appendChild($taxCategory);
        $taxTotal->appendChild($taxSubtotal);

        return $taxTotal;
    }

    // ──────────────────────────────────────────────
    //  Legal Monetary Total
    // ──────────────────────────────────────────────

    private function buildLegalMonetaryTotal(\DOMDocument $xml, Factura $factura): \DOMElement
    {
        $monetaryTotal = $xml->createElement('cac:LegalMonetaryTotal');

        $lineExtension = $this->createElement($xml, 'cbc:LineExtensionAmount', $this->formatDecimal($factura->subtotal));
        $lineExtension->setAttribute('currencyID', 'COP');
        $monetaryTotal->appendChild($lineExtension);

        $taxExclusive = $this->createElement($xml, 'cbc:TaxExclusiveAmount', $this->formatDecimal($factura->subtotal));
        $taxExclusive->setAttribute('currencyID', 'COP');
        $monetaryTotal->appendChild($taxExclusive);

        $taxInclusive = $this->createElement($xml, 'cbc:TaxInclusiveAmount', $this->formatDecimal($factura->total));
        $taxInclusive->setAttribute('currencyID', 'COP');
        $monetaryTotal->appendChild($taxInclusive);

        $payable = $this->createElement($xml, 'cbc:PayableAmount', $this->formatDecimal($factura->total));
        $payable->setAttribute('currencyID', 'COP');
        $monetaryTotal->appendChild($payable);

        return $monetaryTotal;
    }

    // ──────────────────────────────────────────────
    //  Invoice Line
    // ──────────────────────────────────────────────

    private function buildInvoiceLine(\DOMDocument $xml, int $lineNumber, FacturaItem $item): \DOMElement
    {
        $line = $xml->createElement('cac:InvoiceLine');

        $line->appendChild($this->createElement($xml, 'cbc:ID', (string) $lineNumber));
        $line->appendChild($this->createElement($xml, 'cbc:InvoicedQuantity', $this->formatDecimal($item->cantidad)));
        $line->appendChild($this->createElement($xml, 'cbc:LineExtensionAmount', $this->formatDecimal($item->subtotal)));

        // Item details
        $itemEl = $xml->createElement('cac:Item');
        $itemEl->appendChild($this->createElement($xml, 'cbc:Description', $item->descripcion));

        $productName = $item->producto?->nombre ?? $item->descripcion;
        $itemEl->appendChild($this->createElement($xml, 'cbc:Name', $productName));

        // SellersItemIdentification (if product has code)
        if ($item->producto?->codigo) {
            $sellersItem = $xml->createElement('cac:SellersItemIdentification');
            $sellersItem->appendChild($this->createElement($xml, 'cbc:ID', $item->producto->codigo));
            $itemEl->appendChild($sellersItem);
        }

        // ClassifiedTaxCategory (IVA)
        $taxCategory = $xml->createElement('cac:ClassifiedTaxCategory');
        $taxCategory->appendChild($this->createElement($xml, 'cbc:Percent', $this->formatDecimal($item->tasa_impuesto)));
        $taxCategory->appendChild($this->createElement($xml, 'cbc:TaxExemptionReasonCode', '01'));

        $taxScheme = $xml->createElement('cac:TaxScheme');
        $taxScheme->appendChild($this->createElement($xml, 'cbc:ID', '01'));
        $taxScheme->appendChild($this->createElement($xml, 'cbc:Name', 'IVA'));
        $taxCategory->appendChild($taxScheme);

        $itemEl->appendChild($taxCategory);
        $line->appendChild($itemEl);

        // Price
        $price = $xml->createElement('cac:Price');
        $priceAmount = $this->createElement($xml, 'cbc:PriceAmount', $this->formatDecimal($item->precio_unitario));
        $priceAmount->setAttribute('currencyID', 'COP');
        $price->appendChild($priceAmount);
        $line->appendChild($price);

        return $line;
    }

    // ──────────────────────────────────────────────
    //  Helpers
    // ──────────────────────────────────────────────

    private function createElement(\DOMDocument $xml, string $name, ?string $value = null, array $children = []): \DOMElement
    {
        $el = $xml->createElement($name);

        if ($value !== null) {
            $el->appendChild($xml->createTextNode($value));
        }

        foreach ($children as $child) {
            $el->appendChild($child);
        }

        return $el;
    }

    private function formatDecimal(float $value): string
    {
        return number_format($value, 2, '.', '');
    }

    private function validarDatosRequeridos(Factura $factura, array $empresa): void
    {
        $required = ['nit', 'razon_social'];
        foreach ($required as $field) {
            if (empty($empresa[$field])) {
                throw new \RuntimeException("Dato empresarial requerido faltante: {$field}");
            }
        }

        if (!$factura->numero) {
            throw new \RuntimeException("La factura no tiene número asignado.");
        }
    }
}
```

### MockDianProvider.php

**Ruta:** app/Modules/Sales/Services/ElectronicBilling/Providers/MockDianProvider.php

```php
<?php

namespace App\Modules\Sales\Services\ElectronicBilling\Providers;

use App\Modules\Sales\Services\ElectronicBilling\DianProviderInterface;

class MockDianProvider implements DianProviderInterface
{
    public function send(string $signedXml): array
    {
        // Simulamos un retraso de red
        sleep(1);

        return [
            'success' => true,
            'dian_estado' => 'aceptado',
            'dian_mensaje' => 'Documento procesado correctamente (Simulado).',
            'dian_track_id' => 'MOCK-TRACK-' . strtoupper(uniqid()),
            'cufe' => hash('sha384', uniqid() . $signedXml),
            'xml_respuesta' => '<ApplicationResponse><DocumentResponse><Response><ResponseCode>00</ResponseCode><Description>Procesado Correctamente.</Description></Response></DocumentResponse></ApplicationResponse>'
        ];
    }

    public function status(string $trackId): array
    {
        return [
            'success' => true,
            'dian_estado' => 'aceptado',
            'dian_mensaje' => 'Documento validado exitosamente.',
            'dian_track_id' => $trackId
        ];
    }
}
```

### MockSignatureProvider.php

**Ruta:** app/Modules/Sales/Services/ElectronicBilling/Providers/MockSignatureProvider.php

```php
<?php

namespace App\Modules\Sales\Services\ElectronicBilling\Providers;

use App\Modules\Sales\Models\Certificado;
use App\Modules\Sales\Services\ElectronicBilling\SignatureProviderInterface;

class MockSignatureProvider implements SignatureProviderInterface
{
    public function sign(string $xmlContent, ?Certificado $certificado): string
    {
        // En lugar de una firma criptográfica real, añadimos un tag de firma simulada al XML.
        $signatureTag = "\n<ext:UBLExtensions>\n  <ext:UBLExtension>\n    <ext:ExtensionContent>\n      <!-- FIRMA MOCK -->\n      <ds:Signature Id=\"MockSignature\">\n        <ds:SignatureValue>MOCK_SIGNATURE_DATA_" . uniqid() . "</ds:SignatureValue>\n      </ds:Signature>\n    </ext:ExtensionContent>\n  </ext:UBLExtension>\n</ext:UBLExtensions>";

        // Insertamos la firma antes del primer tag de cierre o al final del archivo.
        return str_replace('</Invoice>', $signatureTag . "\n</Invoice>", $xmlContent);
    }
}
```

### RealDianProvider.php

**Ruta:** app/Modules/Sales/Services/ElectronicBilling/Providers/RealDianProvider.php

```php
<?php

namespace App\Modules\Sales\Services\ElectronicBilling\Providers;

use App\Modules\Sales\Services\ElectronicBilling\DianProviderInterface;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Proveedor real de servicios DIAN para facturación electrónica.
 *
 * Se comunica con la SettleAPI de la DIAN (Colombia) para enviar
 * facturas XML firmadas y consultar su estado.
 *
 * Referencia: https://www.dian.gov.co/auditorias/serviciosweb/SitePages/ServiciosWeb.aspx
 */
readonly class RealDianProvider implements DianProviderInterface
{
    private string $baseUrl;
    private string $sendBillEndpoint;
    private string $getStatusEndpoint;
    private int $timeout;
    private int $connectTimeout;

    public function __construct()
    {
        $environment = config('dian.environment', 'test');
        $urls = config('dian.urls.' . $environment, config('dian.urls.test'));

        $this->baseUrl = $urls['base'];
        $this->sendBillEndpoint = $urls['send_bill'];
        $this->getStatusEndpoint = $urls['get_status'];
        $this->timeout = (int) config('dian.timeout', 30);
        $this->connectTimeout = (int) config('dian.connect_timeout', 10);
    }

    /**
     * Envía un XML firmado a DIAN usando SendBillAsync.
     *
     * @param string $signedXml XML firmado (XAdES-BES)
     * @return array{success: bool, dian_estado: string, dian_mensaje: string, dian_track_id?: string, cufe?: string, xml_respuesta?: string}
     */
    public function send(string $signedXml): array
    {
        $url = $this->baseUrl . $this->sendBillEndpoint;

        Log::channel('daily')->info('DIAN SendBillAsync - Iniciando envío', [
            'url' => $url,
            'xml_size' => strlen($signedXml),
        ]);

        try {
            $response = Http::timeout($this->timeout)
                ->connectTimeout($this->connectTimeout)
                ->withHeaders([
                    'Content-Type' => 'application/xml; charset=utf-8',
                    'Accept' => 'application/xml',
                ])
                ->withBody($signedXml, 'application/xml')
                ->post($url);

            if ($response->failed()) {
                $errorMessage = $this->parseErrorResponse($response);

                Log::channel('daily')->error('DIAN SendBillAsync - Error HTTP', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'error' => $errorMessage,
                ]);

                return [
                    'success' => false,
                    'dian_estado' => 'error_http',
                    'dian_mensaje' => "Error HTTP {$response->status()}: {$errorMessage}",
                    'xml_respuesta' => $response->body(),
                ];
            }

            return $this->parseSendBillResponse($response->body());

        } catch (ConnectionException $e) {
            Log::channel('daily')->error('DIAN SendBillAsync - Error de conexión', [
                'error' => $e->getMessage(),
                'url' => $url,
            ]);

            return [
                'success' => false,
                'dian_estado' => 'error_conexion',
                'dian_mensaje' => 'No se pudo conectar con DIAN: ' . $e->getMessage(),
            ];
        } catch (RequestException $e) {
            Log::channel('daily')->error('DIAN SendBillAsync - Request error', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'dian_estado' => 'error_request',
                'dian_mensaje' => 'Error en la solicitud a DIAN: ' . $e->getMessage(),
            ];
        } catch (\Exception $e) {
            Log::channel('daily')->error('DIAN SendBillAsync - Error inesperado', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'dian_estado' => 'error',
                'dian_mensaje' => 'Error inesperado: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Consulta el estado de un documento previamente enviado usando el TrackID.
     *
     * @param string $trackId ID de seguimiento devuelto por SendBillAsync
     * @return array{success: bool, dian_estado: string, dian_mensaje: string, dian_track_id: string, cufe?: string, xml_respuesta?: string}
     */
    public function status(string $trackId): array
    {
        $url = $this->baseUrl . $this->getStatusEndpoint;

        Log::channel('daily')->info('DIAN GetStatus - Consultando estado', [
            'track_id' => $trackId,
            'url' => $url,
        ]);

        try {
            // Build the status request XML
            $statusXml = $this->buildStatusRequestXml($trackId);

            $response = Http::timeout($this->timeout)
                ->connectTimeout($this->connectTimeout)
                ->withHeaders([
                    'Content-Type' => 'application/xml; charset=utf-8',
                    'Accept' => 'application/xml',
                ])
                ->withBody($statusXml, 'application/xml')
                ->post($url);

            if ($response->failed()) {
                Log::channel('daily')->error('DIAN GetStatus - Error HTTP', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'dian_estado' => 'error_http',
                    'dian_mensaje' => "Error HTTP {$response->status()} al consultar estado",
                    'dian_track_id' => $trackId,
                    'xml_respuesta' => $response->body(),
                ];
            }

            return $this->parseStatusResponse($response->body(), $trackId);

        } catch (\Exception $e) {
            Log::channel('daily')->error('DIAN GetStatus - Error', [
                'track_id' => $trackId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'dian_estado' => 'error',
                'dian_mensaje' => 'Error al consultar estado: ' . $e->getMessage(),
                'dian_track_id' => $trackId,
            ];
        }
    }

    // ──────────────────────────────────────────────
    //  Response Parsers
    // ──────────────────────────────────────────────

    private function parseSendBillResponse(string $body): array
    {
        try {
            $xml = new \SimpleXMLElement($body);
            $xml->registerXPathNamespace('ns', 'http://www.dian.gov.co/web-services/settle');

            // DIAN response structure:
            // <wsOuptut><fileName/><statusCode/><statusMessage/><xmlBase64/><trackId/></wsOuptut>
            $statusCode = (string) ($xml->statusCode ?? '');
            $statusMessage = (string) ($xml->statusMessage ?? '');
            $trackId = (string) ($xml->trackId ?? '');
            $fileName = (string) ($xml->fileName ?? '');
            $xmlBase64 = (string) ($xml->xmlBase64 ?? '');

            // Response code "00" means accepted
            $isAccepted = $statusCode === '00';

            // Decode the response XML if present
            $xmlRespuesta = $xmlBase64 ? base64_decode($xmlBase64) : $body;

            // Extract CUFE from the response XML if accepted
            $cufe = null;
            if ($isAccepted && $xmlRespuesta) {
                $cufe = $this->extractCufeFromResponse($xmlRespuesta);
            }

            $result = [
                'success' => $isAccepted,
                'dian_estado' => $isAccepted ? 'aceptado' : 'rechazado',
                'dian_mensaje' => $statusMessage ?: ($isAccepted ? 'Procesado correctamente' : 'Rechazado por DIAN'),
                'dian_track_id' => $trackId ?: $fileName,
                'xml_respuesta' => $xmlRespuesta,
            ];

            if ($cufe) {
                $result['cufe'] = $cufe;
            }

            Log::channel('daily')->info('DIAN SendBillAsync - Respuesta procesada', [
                'status_code' => $statusCode,
                'track_id' => $trackId,
                'is_accepted' => $isAccepted,
            ]);

            return $result;

        } catch (\Exception $e) {
            Log::channel('daily')->error('DIAN SendBillAsync - Error parsing respuesta', [
                'error' => $e->getMessage(),
                'body' => substr($body, 0, 1000),
            ]);

            return [
                'success' => false,
                'dian_estado' => 'error_parseo',
                'dian_mensaje' => 'Error al procesar respuesta de DIAN: ' . $e->getMessage(),
                'xml_respuesta' => $body,
            ];
        }
    }

    private function parseStatusResponse(string $body, string $trackId): array
    {
        try {
            $xml = new \SimpleXMLElement($body);

            $statusCode = (string) ($xml->statusCode ?? '');
            $statusMessage = (string) ($xml->statusMessage ?? '');
            $xmlBase64 = (string) ($xml->xmlBase64 ?? '');

            $isAccepted = $statusCode === '00';

            $xmlRespuesta = $xmlBase64 ? base64_decode($xmlBase64) : $body;

            $cufe = null;
            if ($isAccepted && $xmlRespuesta) {
                $cufe = $this->extractCufeFromResponse($xmlRespuesta);
            }

            $result = [
                'success' => $isAccepted,
                'dian_estado' => $isAccepted ? 'aceptado' : 'rechazado',
                'dian_mensaje' => $statusMessage,
                'dian_track_id' => $trackId,
                'xml_respuesta' => $xmlRespuesta,
            ];

            if ($cufe) {
                $result['cufe'] = $cufe;
            }

            Log::channel('daily')->info('DIAN GetStatus - Respuesta procesada', [
                'track_id' => $trackId,
                'status_code' => $statusCode,
                'is_accepted' => $isAccepted,
            ]);

            return $result;

        } catch (\Exception $e) {
            Log::channel('daily')->error('DIAN GetStatus - Error parsing', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'dian_estado' => 'error_parseo',
                'dian_mensaje' => 'Error al parsear respuesta de estado: ' . $e->getMessage(),
                'dian_track_id' => $trackId,
            ];
        }
    }

    private function extractCufeFromResponse(string $xmlContent): ?string
    {
        try {
            $xml = new \SimpleXMLElement($xmlContent);
            $xml->registerXPathNamespace('ns', 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2');
            $xml->registerXPathNamespace('cac', 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2');

            // Look for CUFE in ResponseCode or ExtensionContent
            $results = $xml->xpath('//cbc:UUID');
            if (!empty($results)) {
                return (string) $results[0];
            }

            // Alternative: look in ApplicationResponse
            $results = $xml->xpath('//cbc:ResponseCode');
            if (!empty($results) && (string) $results[0] === '00') {
                $descriptions = $xml->xpath('//cbc:Description');
                if (!empty($descriptions)) {
                    // Some DIAN responses put CUFE in the description
                    $desc = (string) $descriptions[0];
                    if (preg_match('/^[a-fA-F0-9]{96}$/', $desc)) {
                        return $desc;
                    }
                }
            }

            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    // ──────────────────────────────────────────────
    //  XML Request Builders
    // ──────────────────────────────────────────────

    private function buildStatusRequestXml(string $trackId): string
    {
        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:ns="http://www.dian.gov.co/web-services/settle">
  <soap:Body>
    <ns:GetStatusZip>
      <ns:trackId>{$trackId}</ns:trackId>
    </ns:GetStatusZip>
  </soap:Body>
</soap:Envelope>
XML;
    }

    private function parseErrorResponse(\Illuminate\Http\Client\Response $response): string
    {
        try {
            $body = $response->body();

            // Try to parse as XML error
            if (str_contains($body, '<?xml')) {
                $xml = new \SimpleXMLElement($body);
                $fault = $xml->xpath('//soap:Fault/faultstring');
                if (!empty($fault)) {
                    return (string) $fault[0];
                }

                $message = $xml->xpath('//ns:message');
                if (!empty($message)) {
                    return (string) $message[0];
                }
            }

            // Try JSON
            $json = json_decode($body, true);
            if (is_array($json)) {
                return $json['message'] ?? $json['error'] ?? json_encode($json);
            }

            return $body ?: 'Respuesta vacía del servidor';
        } catch (\Exception $e) {
            return $response->body() ?: 'Error desconocido';
        }
    }
}
```

---

## Views (React/Inertia)

### Configuracion.jsx

**Ruta:** resources/js/Pages/Sales/Configuracion.jsx

```jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Settings, FileText, KeySquare } from 'lucide-react'
import { EmptyState } from '@/Components/ui/empty-state'

export default function ConfiguracionIndex() {
  return (
    <AuthenticatedLayout>
      <Head title="Configuración de Ventas" />
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6 text-primary" /> Configuración de Ventas y Facturación</h2>
        <p className="text-muted-foreground">Administra resoluciones, certificados y preferencias del módulo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Resoluciones DIAN</CardTitle>
            <CardDescription>Rangos de facturación autorizados por la DIAN.</CardDescription>
          </CardHeader>
          <CardContent>
             <EmptyState
                icon={FileText}
                title="Sin Resoluciones"
                description="Agrega tu primera resolución de facturación para empezar a emitir documentos."
              />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeySquare className="h-5 w-5" /> Certificado Digital</CardTitle>
            <CardDescription>Archivo .pfx necesario para firmar el XML.</CardDescription>
          </CardHeader>
          <CardContent>
             <EmptyState
                icon={KeySquare}
                title="No configurado"
                description="Actualmente estás usando el simulador (Mock Provider) interno."
              />
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  )
}
```

### Facturas/Index.jsx

**Ruta:** resources/js/Pages/Sales/Facturas/Index.jsx

```jsx
import { useState } from 'react'
import { router, Link, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { useToast } from '@/Components/toasts/ToastProvider'
import { usePermissions } from '@/Hooks/usePermissions'
import { Search, FileText, Ban, Eye } from 'lucide-react'

export default function FacturasIndex({ facturas, filters }) {
  const [search, setSearch] = useState(filters.search || '')
  const { can } = usePermissions()
  const { toast: toastFn } = useToast()
  const addToast = (opts) => toastFn(`${opts.title}${opts.description ? ': ' + opts.description : ''}`, opts.type ?? 'info')
  const [anulandoId, setAnulandoId] = useState(null)

  const anularFactura = (factura) => {
    const motivo = window.prompt(`Motivo de anulación para factura ${factura.numero}:`)
    if (!motivo || motivo.trim().length < 5) {
      addToast({ title: 'Motivo requerido', description: 'Debes escribir al menos 5 caracteres.', type: 'error' })
      return
    }
    setAnulandoId(factura.id)
    router.post(route('sales.facturas.anular', factura.id), {
      motivo: motivo.trim(),
    }, {
      preserveState: true,
      onSuccess: () => {
        setAnulandoId(null)
        addToast({ title: 'Factura anulada', description: `Factura ${factura.numero} anulada correctamente.`, type: 'success' })
      },
      onError: (errors) => {
        setAnulandoId(null)
        const msg = Object.values(errors).flat().join(', ')
        addToast({ title: 'Error', description: msg || 'Ocurrió un error al anular.', type: 'error' })
      },
    })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    router.get(route('sales.facturas.index'), { search }, { preserveState: true })
  }

  const columns = [
    { 
        key: 'numero', 
        header: 'Nº Factura', 
        className: 'font-mono font-medium',
        cell: (f) => (
            <Link href={route('sales.facturas.show', f.id)} className="text-primary hover:underline">
                {f.numero}
            </Link>
        )
    },
    { 
        key: 'cliente', 
        header: 'Cliente', 
        cell: (f) => f.cliente ? `${f.cliente.nombres} ${f.cliente.apellidos}` : <span className="text-muted-foreground italic">Consumidor Final</span>
    },
    { key: 'created_at', header: 'Fecha', cell: (f) => new Date(f.created_at).toLocaleDateString() },
    { key: 'total', header: 'Total', cell: (f) => <span className="font-semibold">${Number(f.total).toLocaleString()}</span> },
    { key: 'metodo_pago', header: 'Medio', className: 'capitalize' },
    { 
        key: 'estado', 
        header: 'Estado', 
        cell: (f) => {
            if (f.estado === 'pagada') return <Badge className="bg-emerald-500">Pagada</Badge>
            if (f.estado === 'pendiente') return <Badge variant="outline" className="text-amber-600 border-amber-300">Pendiente (CxC)</Badge>
            return <Badge variant="destructive">Anulada</Badge>
        } 
    },
    {
        key: 'dian_estado',
        header: 'DIAN',
        cell: (f) => {
            if (f.dian_estado === 'aceptado') return <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50">Aceptado DIAN</Badge>
            if (f.dian_estado === 'enviado') return <Badge variant="outline" className="text-amber-600">Enviando...</Badge>
            if (f.dian_estado === 'rechazado' || f.dian_estado === 'error') return <Badge variant="destructive">Rechazado</Badge>
            return <Badge variant="secondary">Borrador</Badge>
        }
    },
    { key: 'vendedor.name', header: 'Vendedor', cell: (f) => f.vendedor?.name || '—' },
    {
        key: 'acciones',
        header: 'Acciones',
        hideOnMobile: false,
        className: 'text-right',
        cell: (f) => {
            const esAnulada = f.anulada === true || f.estado === 'anulada'
            return (
                <div className="flex items-center justify-end gap-1">
                    <Link href={route('sales.facturas.show', f.id)}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    {!esAnulada && can('sales:anular') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => anularFactura(f)}
                            disabled={anulandoId === f.id}
                            title="Anular factura"
                        >
                            <Ban className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )
        }
    },
  ]

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-primary" /> Historial de Facturas</h2>
          <p className="text-muted-foreground">Consulta las ventas realizadas</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar por Nº o Cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-background max-w-[250px]"
          />
          <Button type="submit" variant="secondary" size="icon"><Search className="h-4 w-4" /></Button>
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          {facturas.data.length > 0 ? (
            <DataTable columns={columns} data={facturas.data} />
          ) : (
            <div className="py-12">
              <EmptyState
                icon={FileText}
                title="No se encontraron facturas"
                description="Las facturas generadas en el Punto de Venta aparecerán aquí."
                action={{ label: 'Ir al Punto de Venta', href: route('sales.pos.index') }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  )
}
```

### Facturas/Show.jsx

**Ruta:** resources/js/Pages/Sales/Facturas/Show.jsx

```jsx
import { useState } from 'react'
import { Link, useForm, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Separator } from '@/Components/ui/separator'
import { Modal } from '@/Components/ui/modal'
import { DataTable } from '@/Components/ui/data-table'
import { cn } from '@/lib/utils'
import { useToast } from '@/Components/toasts/ToastProvider'
import {
  ArrowLeft, Printer, FileText, CheckCircle2, Clock, Send,
  ShieldCheck, AlertCircle, Receipt, Download, User, CreditCard,
  Hash, Calendar, Building2, Store, Tag, ChevronRight,
  Ban, TriangleAlert
} from 'lucide-react'

/* ─── Formato moneda COP ─── */
function formatoCOP(n) {
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

/* ─── Badge de estado premium ─── */
function EstadoBadge({ estado }) {
  if (estado === 'pagada') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-400/20 print:px-1.5 print:py-0.5 print:text-[7pt]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse print:hidden-deco" />
        Pagada
      </span>
    )
  }
  if (estado === 'anulada') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-400/20 print:px-1.5 print:py-0.5 print:text-[7pt]">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 print:hidden-deco" />
        Anulada
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-400/20 print:px-1.5 print:py-0.5 print:text-[7pt]">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 print:hidden-deco" />
      Pendiente (CxC)
    </span>
  )
}

/* ─── Ticket térmico (80mm) ─── */

/* ─── Info row para detalles ─── */
function InfoRow({ icon: Icon, label, value, className }) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5 print:hidden-deco">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium print:text-xs">{label}</p>
        <p className="text-sm font-semibold text-foreground break-words print:text-sm">{value || '—'}</p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   VISTA PRINCIPAL DE FACTURA (DISEÑO PREMIUM)
   ════════════════════════════════════════════ */
export default function FacturaShow({ factura, desglose }) {
  const d = desglose || {};
  const isPaid = factura.estado === 'pagada'
  const esAnulada = factura.anulada === true || factura.estado === 'anulada'
  const { post, processing } = useForm()
  const [printingTicket, setPrintingTicket] = useState(false)
  const [showAnularModal, setShowAnularModal] = useState(false)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')
  const [anulando, setAnulando] = useState(false)
  const { toast: toastFn } = useToast()
  const addToast = (opts) => toastFn(`${opts.title}${opts.description ? ': ' + opts.description : ''}`, opts.type ?? 'info')

  const emitirDian = () => post(route('sales.facturas.emitir', factura.id))

  const confirmarAnulacion = () => {
    if (!motivoAnulacion.trim() || motivoAnulacion.trim().length < 5) {
      addToast({ title: 'Motivo requerido', description: 'Escribe un motivo de al menos 5 caracteres.', type: 'error' })
      return
    }
    setAnulando(true)
    router.post(route('sales.facturas.anular', factura.id), {
      motivo: motivoAnulacion.trim(),
    }, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => {
        setShowAnularModal(false)
        setMotivoAnulacion('')
        setAnulando(false)
      },
      onError: (errors) => {
        setAnulando(false)
        const msg = Object.values(errors).flat().join(', ')
        addToast({ title: 'Error al anular', description: msg || 'Ocurrió un error.', type: 'error' })
      },
    })
  }

  const columns = [
    { key: 'descripcion', header: 'Producto / Servicio', className: 'font-medium' },
    {
      key: 'cantidad', header: 'Cant.',
      hideOnMobile: false,
      cell: (i) => <span className="tabular-nums">{Number(i.cantidad)}</span>,
    },
    {
      key: 'precio_unitario', header: 'Precio Unit.',
      hideOnMobile: true,
      cell: (i) => <span className="tabular-nums text-muted-foreground">{formatoCOP(Number(i.precio_unitario))}</span>,
    },
    {
      key: 'impuesto_total', header: 'Impuestos',
      hideOnMobile: true,
      cell: (i) => <span className="tabular-nums text-muted-foreground">{formatoCOP(Number(i.impuesto_total))}</span>,
    },
    {
      key: 'total', header: 'Subtotal', alignEnd: true,
      cell: (i) => <span className="tabular-nums font-semibold">{formatoCOP(Number(i.total))}</span>,
    },
  ]

  /* ─── Abrir ticket térmico en ventana nueva ─── */
  const imprimirTicket = () => {
    setPrintingTicket(true)
    const win = window.open('', '_blank', 'width=380,height=600,menubar=no,toolbar=no,scrollbars=yes')
    if (!win) {
      addToast({ title: 'Error', description: 'Permite ventanas emergentes para imprimir el ticket.', type: 'error' })
      setPrintingTicket(false)
      return
    }

    const items = factura.items ?? []
    const cliente = factura.cliente
    const empresa = factura.tenant?.name ?? 'Nexora'

    win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <title>Ticket #${factura.numero}</title>
      <style>
        @page { margin: 0; size: 80mm 297mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 74mm; margin: 0 auto; padding: 3mm; color: #000; line-height: 1.4; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 3px 0; vertical-align: top; }
        .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
        .total-final { font-size: 14px; font-weight: 700; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 5px 0; margin-top: 5px; }
        .empresa { font-size: 13px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
      </style></head><body>
      <div class="text-center"><h3 class="empresa">${empresa}</h3>
      ${factura.tenant?.email ? `<p style="font-size:11px;margin:2px 0">${factura.tenant.email}</p>` : ''}</div>
      <div class="divider"></div>
      <div style="margin-bottom:10px;font-size:11px">
        <div class="font-bold" style="font-size:12px">FACTURA No: ${factura.numero}</div>
        <div style="margin-top:4px">Fecha: ${new Date(factura.created_at).toLocaleDateString('es-CO')} ${new Date(factura.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
        <div style="margin-top:2px">Cliente: ${cliente ? `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}` : 'Consumidor Final'}${cliente?.razon_social ? ` (${cliente.razon_social})` : ''}</div>
        ${cliente?.documento ? `<div>Doc: ${cliente.documento}</div>` : ''}
        ${cliente?.telefono ? `<div>Tel: ${cliente.telefono}</div>` : ''}
      </div>
      <div class="divider"></div>
      <table><thead><tr style="border-bottom:1px dashed #000">
        <th style="text-align:left;width:15%;font-size:10px">Cant</th>
        <th style="text-align:left;width:50%;font-size:10px">Desc.</th>
        <th style="text-align:right;width:35%;font-size:10px">Total</th>
      </tr></thead><tbody>
      ${items.map((i) => `<tr style="border-bottom:1px dotted #000">
        <td style="padding:2px 0">${Number(i.cantidad)}</td>
        <td style="padding:2px 0;font-size:11px">${(i.descripcion || '').substring(0, 28)}</td>
        <td style="padding:2px 0;text-align:right">${formatoCOP(Number(i.total))}</td>
      </tr>`).join('')}
      </tbody></table>
      <div class="divider"></div>
      <div style="margin-top:8px;font-size:11px">
        <div style="display:flex;justify-content:space-between;padding:2px 0"><span>Subtotal</span><span>${formatoCOP(Number(factura.subtotal))}</span></div>
        ${Number(factura.descuento) > 0 ? `<div style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626"><span>Descuento</span><span>-${formatoCOP(Number(factura.descuento))}</span></div>` : ''}
        ${Number(factura.impuestos) > 0 ? `<div style="display:flex;justify-content:space-between;padding:2px 0"><span>Impuestos</span><span>${formatoCOP(Number(factura.impuestos))}</span></div>` : ''}
      </div>
      <div class="total-final" style="display:flex;justify-content:space-between;margin-top:8px;padding:5px 0">
        <span>TOTAL</span><span>${formatoCOP(Number(factura.total))}</span>
      </div>
      <div style="text-align:center;font-size:10px;margin-top:20px;border-top:1px dashed #000;padding-top:10px">
        <p style="font-weight:700">¡Gracias por su preferencia!</p>
        <p style="margin-top:3px">Este documento es un comprobante de pago.</p>
        <p style="margin-top:8px;font-size:9px;color:#666">Soporte: ${factura.tenant?.email ?? ''}</p>
      </div>
      <script>window.onload = function() { window.print(); window.close(); }</script>
      </body></html>`)
    win.document.close()
    setPrintingTicket(false)
  }

  return (
    <>
      {/* ─── Print Styles (todo en UNA página A4) ─── */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 6mm 8mm; }
          html, body { height: auto !important; overflow: visible !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          aside, header, footer, nav, .no-print, .no-print * { display: none !important; }
          main.flex-1 { width: 100% !important; margin-left: 0 !important; max-width: 100% !important; }

          /* Comprimir Hero */
          .print\\:mb-2 { margin-bottom: 4px !important; }
          .print\\:p-3 { padding: 6px 10px !important; }
          .print\\:text-2xl { font-size: 16pt !important; line-height: 1.2 !important; }
          .print\\:text-lg { font-size: 11pt !important; }
          .print\\:text-sm { font-size: 8pt !important; }
          .print\\:text-xs { font-size: 7pt !important; }
          .print\\:gap-2 { gap: 4px !important; }
          .print\\:grid-cols-2 { grid-template-columns: 1fr 1fr !important; }
          .print\\:hidden-deco { display: none !important; }
          .print\\:border-0 { border: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:bg-transparent { background: transparent !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:m-0 { margin: 0 !important; }
          .print\\:compact-card { padding: 6px 10px !important; }
          .print\\:compact-card-header { padding: 4px 10px 2px !important; }
          .print\\:compact-card-content { padding: 4px 10px 6px !important; }
          .print\\:compact-table { font-size: 7.5pt !important; }
          .print\\:compact-table td, .print\\:compact-table th { padding: 1px 4px !important; }

          /* Forzar que no se partan */
          .print\\:avoid-break { break-inside: avoid; page-break-inside: avoid; }
          .print\\:no-break { break-inside: avoid !important; page-break-inside: avoid !important; }

          /* Ocultar blobs decorativos */
          .blur-3xl, .blur-2xl { display: none !important; }
        }
      `}</style>

      {/* ═══ HEADER PREMIUM ═══ */}
      <AuthenticatedLayout>
        <div className="no-print">
          {/* Top bar */}
          <div className="flex items-center gap-3 mb-8">
            <Link href={route('sales.facturas.index')}>
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex-1 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground tracking-tight">
                    Factura {factura.numero}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {new Date(factura.created_at).toLocaleDateString('es-CO', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })} a las {new Date(factura.created_at).toLocaleTimeString('es-CO', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={imprimirTicket} disabled={printingTicket}>
                  <Receipt className="h-4 w-4" />
                  <span className="hidden sm:inline">{printingTicket ? 'Abriendo…' : 'Ticket'}</span>
                </Button>
                <a
                  href={route('sales.facturas.pdf', factura.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-input bg-background px-3 h-9 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Imprimir / PDF</span>
                </a>
                {!esAnulada && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-xl border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                    onClick={() => setShowAnularModal(true)}
                  >
                    <Ban className="h-4 w-4" />
                    <span className="hidden sm:inline">Anular</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ HERO: Total + Estado ═══ */}
        <div className="print:no-break relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card/95 to-card/90 dark:from-card dark:via-card/95 dark:to-muted/10 p-8 mb-8 print:p-3 print:mb-2 print:bg-transparent print:shadow-none print:border-0">
          {/* Decorative gradient blob */}
          <div className="print:hidden-deco absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <div className="print:hidden-deco absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-primary/[0.03] blur-2xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 print:gap-2">
            <div className="space-y-1 print:space-y-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest print:text-xs">Total de factura</p>
              <p className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground print:text-2xl">
                {formatoCOP(Number(factura.total))}
              </p>
              <div className="flex items-center gap-3 print:gap-2">
                <EstadoBadge estado={factura.estado} />
                {factura.metodo_pago && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground print:text-xs">
                    <CreditCard className="w-3.5 h-3.5 print:hidden-deco" />
                    {factura.metodo_pago}
                  </span>
                )}
              </div>
            </div>

            {factura.notas && (
              <div className="max-w-xs text-right print:text-xs">
                <p className="text-xs text-muted-foreground font-medium mb-1 print:text-xs">Notas</p>
                <p className="text-sm text-muted-foreground/80 italic print:text-sm">{factura.notas}</p>
              </div>
            )}
          </div>
        </div>

        {/* ═══ INFO GRID ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:gap-2 print:mb-2 print:grid-cols-2">
          {/* Cliente */}
          <Card className="print:avoid-break lg:col-span-2 border-border/80 shadow-sm hover:shadow-md transition-shadow duration-200 print:shadow-none print:border-0 print:bg-transparent">
            <CardHeader className="pb-4 print:compact-card-header">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground print:text-xs">
                <Building2 className="h-4 w-4 print:hidden-deco" /> Datos del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="print:compact-card-content">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 print:gap-1 print:text-xs">
                <InfoRow
                  icon={User}
                  label="Cliente"
                  value={
                    factura.cliente ? (
                      <Link href={route('crm.clientes.show', factura.cliente_id)} className="text-primary hover:underline">
                        {factura.cliente.nombres} {factura.cliente.apellidos}
                        {factura.cliente.razon_social && (
                          <span className="text-muted-foreground font-normal"> ({factura.cliente.razon_social})</span>
                        )}
                      </Link>
                    ) : 'Consumidor Final'
                  }
                />
                <InfoRow
                  icon={Hash}
                  label="Documento"
                  value={factura.cliente?.documento || '—'}
                />
                <InfoRow
                  icon={CreditCard}
                  label="Método de Pago"
                  value={factura.metodo_pago ? factura.metodo_pago.charAt(0).toUpperCase() + factura.metodo_pago.slice(1) : '—'}
                />
                <InfoRow
                  icon={User}
                  label="Vendedor / Cajero"
                  value={factura.vendedor?.name || '—'}
                />
                {factura.cliente?.direccion && (
                  <InfoRow
                    icon={Building2}
                    label="Dirección"
                    value={factura.cliente.direccion}
                  />
                )}
                {factura.cliente?.telefono && (
                  <InfoRow
                    icon={Hash}
                    label="Teléfono"
                    value={factura.cliente.telefono}
                  />
                )}
                {factura.cliente?.email && (
                  <InfoRow
                    icon={Hash}
                    label="Email"
                    value={factura.cliente.email}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Estado / DIAN */}
          <div className="space-y-4 print:space-y-1">
            {/* Estado de pago */}
            <Card className={cn(
              'print:avoid-break border shadow-sm print:shadow-none print:border-0 print:bg-transparent',
              isPaid ? 'border-emerald-200 dark:border-emerald-900' : 'border-amber-200 dark:border-amber-900',
            )}>
              <CardContent className="p-5 print:compact-card">
                <div className="flex items-start gap-4 print:gap-2">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 print:hidden-deco',
                    isPaid ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-amber-100 dark:bg-amber-950/40',
                  )}>
                    {isPaid
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      : <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    }
                  </div>
                  <div>
                    <p className={cn(
                      'text-sm font-bold print:text-xs',
                      isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400',
                    )}>
                      {isPaid ? 'Transacción Pagada' : 'Factura a Crédito'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed print:text-xs">
                      {isPaid
                        ? 'El ingreso fue registrado en la caja del turno activo.'
                        : 'Esta venta generó una Cuenta por Cobrar (CxC) asociada al cliente.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DIAN */}
            <Card className={cn(
              'print:avoid-break border shadow-sm print:shadow-none print:border-0 print:bg-transparent',
              factura.dian_estado === 'aceptado' && 'border-blue-200 dark:border-blue-900',
            )}>
              <CardHeader className="pb-3 print:compact-card-header">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground print:text-xs">
                  <ShieldCheck className="h-4 w-4 text-blue-600 print:hidden-deco" /> Facturación Electrónica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 print:compact-card-content print:space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground print:text-xs">Estado DIAN</span>
                  {(!factura.dian_estado || factura.dian_estado === 'borrador') && (
                    <Badge variant="secondary" className="text-[10px] print:text-xs">Borrador Local</Badge>
                  )}
                  {factura.dian_estado === 'aceptado' && (
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-[10px] print:text-xs">Aceptado DIAN</Badge>
                  )}
                  {(factura.dian_estado === 'rechazado' || factura.dian_estado === 'error') && (
                    <Badge variant="destructive" className="text-[10px] print:text-xs">Rechazado DIAN</Badge>
                  )}
                </div>

                {factura.cufe && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1 font-medium print:text-xs">CUFE</p>
                    <p className="font-mono text-[10px] break-all text-muted-foreground bg-muted p-2 rounded-lg border border-border/50 select-all print:text-xs print:p-1">
                      {factura.cufe}
                    </p>
                  </div>
                )}

                {factura.dian_mensaje && factura.dian_estado && factura.dian_estado !== 'borrador' && (
                  <div className={cn(
                    'p-3 rounded-xl text-xs flex gap-2.5 items-start print:p-1 print:text-xs',
                    factura.dian_estado === 'aceptado'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                      : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
                  )}>
                    {factura.dian_estado === 'aceptado'
                      ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 print:hidden-deco" />
                      : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 print:hidden-deco" />
                    }
                    <p>{factura.dian_mensaje}</p>
                  </div>
                )}

                {(!factura.dian_estado || factura.dian_estado === 'borrador') && (
                  <Button onClick={emitirDian} disabled={processing} className="w-full gap-2 rounded-xl h-9 text-xs" size="sm">
                    <Send className="h-3.5 w-3.5" />
                    {processing ? 'Enviando…' : 'Emitir Factura Electrónica'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ═══ LÍNEAS DE FACTURA ═══ */}
        <Card className="print:avoid-break border-border/80 shadow-sm overflow-hidden mb-8 print:shadow-none print:border-0 print:bg-transparent print:mb-1">
          <CardHeader className="pb-0 print:compact-card-header">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground print:text-xs">
              <Tag className="h-4 w-4 print:hidden-deco" /> Líneas de Factura
            </CardTitle>
            <CardDescription className="print:text-xs">
              {factura.items?.length ?? 0} {factura.items?.length === 1 ? 'línea' : 'líneas'} en total
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="print:compact-table">
              <DataTable columns={columns} data={factura.items ?? []} />
            </div>
          </CardContent>
        </Card>

        {/* ═══ TOTALES (desglose como prefactura) ═══ */}
        <div className="flex justify-end mb-8 print:mb-0">
          <div className="w-full sm:w-80 lg:w-96 bg-card border border-border/80 rounded-2xl p-6 shadow-sm print:shadow-none print:border-0 print:bg-transparent print:compact-card">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 print:text-xs print:mb-1">
              Resumen de Factura
            </h3>
            <div className="space-y-3 print:space-y-1">
              <div className="flex justify-between items-center py-0.5 text-sm print:text-xs">
                <span className="text-muted-foreground">Servicios</span>
                <span className="font-semibold tabular-nums">{formatoCOP(Number(d.servicios) || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 text-sm print:text-xs">
                <span className="text-muted-foreground">Repuestos</span>
                <span className="font-semibold tabular-nums">{formatoCOP(Number(d.repuestos) || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 text-sm print:text-xs">
                <span className="text-muted-foreground">Mano de Obra</span>
                <span className="font-semibold tabular-nums">{formatoCOP(Number(d.manoDeObra) || 0)}</span>
              </div>

              <Separator className="my-1 print:hidden-deco" />

              <div className="flex justify-between items-center text-sm print:text-xs">
                <span className="font-semibold text-foreground">Subtotal</span>
                <span className="font-semibold tabular-nums">{formatoCOP(Number(d.subtotal) || Number(factura.subtotal))}</span>
              </div>

              {Number(d.descuento) > 0 && (
                <div className="flex justify-between items-center text-sm print:text-xs">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                    -{formatoCOP(Number(d.descuento))}
                  </span>
                </div>
              )}

              {Number(d.iva) > 0 && (
                <div className="flex justify-between items-center text-sm print:text-xs">
                  <span className="text-muted-foreground">IVA ({Number(d.porcentajeIva) || 0}%)</span>
                  <span className="font-semibold tabular-nums text-amber-600">{formatoCOP(Number(d.iva))}</span>
                </div>
              )}

              {Number(d.abono) > 0 && (
                <div className="flex justify-between items-center text-sm print:text-xs">
                  <span className="text-muted-foreground">Abono inicial</span>
                  <span className="font-semibold tabular-nums text-red-600">
                    -{formatoCOP(Number(d.abono))}
                  </span>
                </div>
              )}

              <Separator className="my-1 print:hidden-deco" />

              <div className="flex justify-between items-center print:pt-0">
                <span className="text-base font-bold text-foreground print:text-sm">Total</span>
                <span className="text-xl font-bold text-primary tabular-nums print:text-sm">
                  {formatoCOP(Number(d.total) || Number(factura.total))}
                </span>
              </div>

              {Number(d.abono) > 0 && (
                <div className="flex justify-between items-center text-sm print:text-xs">
                  <span className="text-muted-foreground font-semibold">Saldo pendiente</span>
                  <span className="font-semibold tabular-nums text-amber-600">
                    {formatoCOP(Math.max(0, (Number(d.total) || Number(factura.total)) - Number(d.abono)))}
                  </span>
                </div>
              )}

              {factura.metodo_pago && (
                <div className="flex justify-between items-center pt-1 text-xs text-muted-foreground border-t border-border/50 pt-2 print:text-xs print:pt-0 print:border-t-0">
                  <span>Método de pago</span>
                  <span className="font-medium capitalize">{factura.metodo_pago}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ ASIENTO CONTABLE ═══ */}
        {factura.asientos?.length > 0 && (
          <div className="mb-8 print:hidden-deco">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-indigo-500" /> Asiento(s) Contable(s)
                </CardTitle>
                <CardDescription>
                  {factura.asientos.length} asiento{factura.asientos.length > 1 ? 's' : ''} generado{factura.asientos.length > 1 ? 's' : ''} automáticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {factura.asientos.map((asiento, i) => {
                  const totalDebe = asiento.lineas.reduce((s, l) => s + Number(l.debito || 0), 0)
                  const totalHaber = asiento.lineas.reduce((s, l) => s + Number(l.credito || 0), 0)
                  return (
                    <div key={asiento.id} className={i > 0 ? 'mt-6 border-t border-border pt-6' : ''}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {asiento.concepto}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            #{asiento.numero} · {asiento.fecha}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {asiento.estado}
                        </Badge>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left font-medium text-muted-foreground pb-2 pr-4">Código</th>
                              <th className="text-left font-medium text-muted-foreground pb-2 pr-4">Cuenta</th>
                              <th className="text-left font-medium text-muted-foreground pb-2 pr-4">Descripción</th>
                              <th className="text-right font-medium text-muted-foreground pb-2 pl-4">Débito</th>
                              <th className="text-right font-medium text-muted-foreground pb-2 pl-4">Crédito</th>
                            </tr>
                          </thead>
                          <tbody>
                            {asiento.lineas.map((linea) => (
                              <tr key={linea.id} className="border-b border-border/50">
                                <td className="py-2 pr-4 font-mono text-muted-foreground">{linea.cuenta?.codigo || '—'}</td>
                                <td className="py-2 pr-4 font-medium text-foreground">{linea.cuenta?.nombre || '—'}</td>
                                <td className="py-2 pr-4 text-muted-foreground">{linea.descripcion || '—'}</td>
                                <td className="py-2 pl-4 text-right tabular-nums">{Number(linea.debito) > 0 ? formatoCOP(linea.debito) : '—'}</td>
                                <td className="py-2 pl-4 text-right tabular-nums">{Number(linea.credito) > 0 ? formatoCOP(linea.credito) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="font-semibold text-foreground">
                              <td colSpan={3} className="pt-2 text-right">Totales</td>
                              <td className="pt-2 pl-4 text-right tabular-nums">{formatoCOP(totalDebe)}</td>
                              <td className="pt-2 pl-4 text-right tabular-nums">{formatoCOP(totalHaber)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        <div className="text-center pb-8 no-print">
          <p className="text-xs text-muted-foreground/60">
            Generado por Nexora · {new Date().toLocaleDateString('es-CO')}
          </p>
        </div>
      </AuthenticatedLayout>

      {/* ═══ MODAL ANULAR FACTURA ═══ */}
      <Modal
        open={showAnularModal}
        onClose={() => { if (!anulando) { setShowAnularModal(false); setMotivoAnulacion('') } }}
        title="Anular Factura"
        description={`Estás a punto de anular la factura ${factura.numero}. Esta acción es irreversible y reversará el stock, caja y contabilidad.`}
        icon={TriangleAlert}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setShowAnularModal(false); setMotivoAnulacion('') }}
              disabled={anulando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmarAnulacion}
              disabled={anulando || motivoAnulacion.trim().length < 5}
              className="gap-2"
            >
              {anulando ? 'Anulando…' : <><Ban className="h-4 w-4" /> Anular Factura</>}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4 text-sm text-red-700 dark:text-red-400">
            <p className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Reversión completa
            </p>
            <ul className="mt-2 list-disc list-inside text-xs space-y-1 text-red-600 dark:text-red-400/80">
              <li>Se restaurará el stock de los repuestos al inventario</li>
              <li>Se registrará un egreso en caja por cada ingreso original</li>
              <li>Se reversarán los asientos contables</li>
              <li>La orden de reparación volverá a estado "Listo"</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo-anulacion" className="text-sm font-semibold">
              Motivo de anulación <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="motivo-anulacion"
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              rows={3}
              placeholder="Ej. El cliente solicitó cancelación del servicio por error en el diagnóstico..."
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 5 caracteres. Este motivo quedará registrado en la auditoría.
            </p>
          </div>
        </div>
      </Modal>
    </>
  )
}
```

### Pos/Index.jsx

**Ruta:** resources/js/Pages/Sales/Pos/Index.jsx

```jsx
import { useState, useMemo } from 'react'
import { router, useForm, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Badge } from '@/Components/ui/badge'
import { Label } from '@/Components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { Search, ShoppingCart, Trash2, CreditCard, LockOpen, Wrench, WifiOff } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog'
import { useToast } from '@/Components/toasts/ToastProvider'
import { enqueue } from '@/lib/sync-queue'

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
              // Validar stock solo para productos (no servicios)
              if (i.tipo === 'producto' && i.stock_actual != null && newQty > i.stock_actual) {
                  flash(`Stock insuficiente para "${i.nombre}". Disponible: ${i.stock_actual}`, 'error')
                  return i
              }
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
          flash('Debes abrir un turno de caja primero para realizar cobros de contado.', 'error')
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

  const processPayment = async (e) => {
      e.preventDefault()
      if (!navigator.onLine) {
          await enqueue({
              type: 'pos.sale',
              endpoint: route('sales.pos.store'),
              method: 'POST',
              data: {
                  ...data,
                  items: cart.map(i => ({
                      tipo: i.tipo,
                      producto_id: i.tipo === 'producto' ? i.id : null,
                      descripcion: i.nombre,
                      cantidad: i.qty,
                      precio_unitario: i.precio_venta,
                  })),
              },
          })
          flash('Venta guardada offline. Se sincronizará cuando vuelva internet.', 'info')
          setIsCheckoutOpen(false)
          setCart([])
          return
      }
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
                              <Select value={data.cliente_id || '__none__'} onValueChange={v => setData('cliente_id', v === '__none__' ? '' : v)}>
                                  <SelectTrigger><SelectValue placeholder="Consumidor Final" /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="__none__">Consumidor Final</SelectItem>
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
```

---

## Tests

### FacturaControllerTest.php

**Ruta:** tests/Feature/Modules/Sales/FacturaControllerTest.php

```php
<?php

namespace Tests\Feature\Modules\Sales;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Sales\Models\Factura;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FacturaControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'sales',
            'name' => 'Ventas / POS',
            'class' => 'Sales',
            'version' => '1.0.0',
        ]);
        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'sales',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    public function test_facturas_index_requires_auth(): void
    {
        auth()->logout();
        $response = $this->get(route('sales.facturas.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_facturas_index_requires_permission(): void
    {
        $userSinPermiso = User::factory()->create(['tenant_id' => $this->tenant->id, 'is_superadmin' => false]);
        $this->actingAs($userSinPermiso);

        $response = $this->get(route('sales.facturas.index'));
        $response->assertStatus(403);
    }

    public function test_facturas_index_muestra_facturas_del_tenant(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'numero' => 'POS-20260101-123',
            'total' => 50000,
        ]);

        $response = $this->get(route('sales.facturas.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('facturas.data.0.numero', 'POS-20260101-123')
        );
    }

    public function test_facturas_index_no_muestra_facturas_de_otro_tenant(): void
    {
        $tenantB = Tenant::factory()->create();
        Factura::factory()->create([
            'tenant_id' => $tenantB->id,
            'numero' => 'POS-B-0001',
        ]);

        $response = $this->get(route('sales.facturas.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('facturas.data', [])
        );
    }

    public function test_facturas_index_filtra_por_numero(): void
    {
        Factura::factory()->create(['tenant_id' => $this->tenant->id, 'user_id' => $this->user->id, 'numero' => 'POS-ABC-001']);
        Factura::factory()->create(['tenant_id' => $this->tenant->id, 'user_id' => $this->user->id, 'numero' => 'POS-XYZ-002']);

        $response = $this->get(route('sales.facturas.index', ['search' => 'ABC']));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('facturas.data.0.numero', 'POS-ABC-001')
            ->where('facturas.data', fn ($data) => count($data) === 1)
        );
    }

    public function test_facturas_index_pagina_correctamente(): void
    {
        for ($i = 0; $i < 20; $i++) {
            Factura::factory()->create([
                'tenant_id' => $this->tenant->id,
                'user_id' => $this->user->id,
                'numero' => "POS-PAGE-{$i}",
            ]);
        }

        $response = $this->get(route('sales.facturas.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('facturas.per_page', 15)
        );
    }

    public function test_facturas_show_bloquea_acceso_de_otro_tenant(): void
    {
        $tenantB = Tenant::factory()->create();
        $facturaB = Factura::factory()->create(['tenant_id' => $tenantB->id]);

        $response = $this->get(route('sales.facturas.show', $facturaB));
        $response->assertStatus(404);
    }

    public function test_facturas_show_carga_factura_con_rels(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
        ]);

        $response = $this->get(route('sales.facturas.show', $factura));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('factura.id', $factura->id)
            ->where('factura.numero', $factura->numero)
        );
    }

    public function test_facturas_pdf_bloquea_acceso_de_otro_tenant(): void
    {
        $tenantB = Tenant::factory()->create();
        $facturaB = Factura::factory()->create(['tenant_id' => $tenantB->id]);

        $response = $this->get(route('sales.facturas.pdf', $facturaB));
        $response->assertStatus(404);
    }

    public function test_facturas_pdf_devuelve_stream(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
        ]);

        $response = $this->get(route('sales.facturas.pdf', $factura));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_facturas_pdf_debug_mode_devuelve_html(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
        ]);

        $response = $this->get(route('sales.facturas.pdf', [$factura, 'debug' => true]));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/html; charset=UTF-8');
    }
}
```

### FacturaAnulacionTest.php

**Ruta:** tests/Feature/Modules/Sales/FacturaAnulacionTest.php

```php
<?php

namespace Tests\Feature\Modules\Sales;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Sales\Models\Factura;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FacturaAnulacionTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'sales', 'name' => 'Ventas', 'class' => 'Sales', 'version' => '1.0.0',
        ]);

        $this->tenant = Tenant::factory()->create();
        TenantModule::create(['tenant_id' => $this->tenant->id, 'module_code' => 'sales', 'is_active' => true]);

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id, 'is_superadmin' => true]);
        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    // ─── Anulación ───────────────────────────────────────────────────────

    public function test_anular_requiere_autenticacion(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $this->user->id,
        ]);

        auth()->logout();
        $this->post(route('sales.facturas.anular', $factura), ['motivo' => 'Prueba'])
            ->assertRedirect(route('core.login'));
    }

    public function test_anular_requiere_motivo(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $this->user->id,
            'estado'    => 'pagada',
        ]);

        $this->post(route('sales.facturas.anular', $factura), ['motivo' => ''])
            ->assertSessionHasErrors('motivo');
    }

    public function test_anular_requiere_motivo_minimo_5_caracteres(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $this->user->id,
            'estado'    => 'pagada',
        ]);

        $this->post(route('sales.facturas.anular', $factura), ['motivo' => 'X'])
            ->assertSessionHasErrors('motivo');
    }

    public function test_anular_bloquea_factura_de_otro_tenant(): void
    {
        $tenantB  = Tenant::factory()->create();
        $userB    = User::factory()->create(['tenant_id' => $tenantB->id]);
        $facturaB = Factura::factory()->create([
            'tenant_id' => $tenantB->id,
            'user_id'   => $userB->id,
        ]);

        // El route model binding filtra por tenant (BelongsToTenant global scope),
        // por lo que la factura ajena devuelve 404 en lugar de 403.
        $this->post(route('sales.facturas.anular', $facturaB), [
            'motivo' => 'Intento de acceso cruzado',
        ])->assertStatus(404);
    }

    public function test_anular_factura_pagada_cambia_estado(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $this->user->id,
            'estado'    => 'pagada',
            'total'     => 100000,
        ]);

        $this->post(route('sales.facturas.anular', $factura), [
            'motivo' => 'Error en los datos del cliente registrado',
        ])->assertSessionMissing('error');

        $this->assertDatabaseHas('sales_facturas', [
            'id'     => $factura->id,
            'anulada' => true,
        ]);
    }

    public function test_anular_ya_anulada_devuelve_error(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $this->user->id,
            'estado'    => 'anulada',
            'anulada'   => true,
        ]);

        $this->post(route('sales.facturas.anular', $factura), [
            'motivo' => 'Intento de doble anulación de factura',
        ])->assertSessionHas('error');
    }

    // ─── Tenant isolation en show/pdf ────────────────────────────────────

    public function test_show_bloquea_factura_de_otro_tenant(): void
    {
        $tenantB  = Tenant::factory()->create();
        $userB    = User::factory()->create(['tenant_id' => $tenantB->id]);
        $facturaB = Factura::factory()->create(['tenant_id' => $tenantB->id, 'user_id' => $userB->id]);

        $this->get(route('sales.facturas.show', $facturaB))->assertStatus(404);
    }

    public function test_index_solo_muestra_facturas_del_tenant(): void
    {
        $tenantB  = Tenant::factory()->create();
        $userB    = User::factory()->create(['tenant_id' => $tenantB->id]);
        Factura::factory()->create(['tenant_id' => $tenantB->id, 'user_id' => $userB->id, 'numero' => 'INTRUSO-001']);

        Factura::factory()->create(['tenant_id' => $this->tenant->id, 'user_id' => $this->user->id, 'numero' => 'MIA-001']);

        $facturas = Factura::all();
        $this->assertTrue($facturas->contains('numero', 'MIA-001'));
        $this->assertFalse($facturas->contains('numero', 'INTRUSO-001'));
    }
}
```

### PosControllerTest.php

**Ruta:** tests/Feature/Modules/Sales/PosControllerTest.php

```php
<?php

namespace Tests\Feature\Modules\Sales;

use App\Core\Models\Configuracion;
use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Cash\Models\Caja;
use App\Modules\Cash\Models\CajaSesion;
use App\Modules\Cash\Services\CajaService;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Sales\Models\Factura;
use App\Modules\Sales\Models\FacturaItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PosControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private Caja $caja;
    private CajaSesion $sesion;
    private Cliente $cliente;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class]);

        $this->tenant = Tenant::factory()->create();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'sales',
            'name' => 'Ventas / POS',
            'class' => 'Sales',
            'version' => '1.0.0',
        ]);
        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'sales',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);

        $this->caja = Caja::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Caja Principal',
            'activa' => true,
        ]);

        $this->sesion = app(CajaService::class)->abrirCaja($this->user->id, $this->caja->id, 100000);

        $this->cliente = Cliente::factory()->create([
            'tenant_id' => $this->tenant->id,
            'tipo' => 'natural',
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
        ]);
    }

    public function test_pos_index_requires_auth(): void
    {
        $this->withMiddleware();
        auth()->logout();
        $response = $this->get(route('sales.pos.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_pos_index_requires_permission(): void
    {
        $this->withMiddleware();
        $userSinPermiso = User::factory()->create(['tenant_id' => $this->tenant->id, 'is_superadmin' => false]);
        $this->actingAs($userSinPermiso);

        $response = $this->get(route('sales.pos.index'));
        $response->assertStatus(403);
    }

    public function test_pos_index_loads_products_clientes_and_sesion(): void
    {
        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Producto Test',
            'precio_venta' => 50000,
            'is_active' => true,
            'stock_actual' => 10,
        ]);

        $response = $this->get(route('sales.pos.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('sesionActiva.id', $this->sesion->id)
            ->where('productos.0.id', $producto->id)
            ->where('clientes.0.id', $this->cliente->id)
        );
    }

    public function test_pos_index_shows_no_sesion_when_caja_cerrada(): void
    {
        app(CajaService::class)->cerrarSesion($this->sesion, 0);

        $response = $this->get(route('sales.pos.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('sesionActiva', null)
        );
    }

    public function test_pos_store_crea_factura_y_decrementa_stock(): void
    {
        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Repuesto A',
            'precio_venta' => 25000,
            'stock_actual' => 20,
            'costo_promedio' => 10000,
            'is_active' => true,
        ]);

        $response = $this->post(route('sales.pos.store'), [
            'cliente_id' => $this->cliente->id,
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 2,
                    'precio_unitario' => 25000,
                ],
            ],
        ]);

        $response->assertRedirectToRoute('sales.facturas.show', Factura::first()->id);
        $response->assertSessionHas('success');

        $producto->refresh();
        $this->assertEquals(18, (float) $producto->stock_actual);

        $factura = Factura::first();
        $this->assertEquals('pagada', $factura->estado);
        $this->assertEquals('efectivo', $factura->metodo_pago);
        $this->assertEquals(50000, (float) $factura->total);
        $this->assertEquals(1, $factura->items()->count());
    }

    public function test_pos_store_crea_factura_de_servicio_sin_stock(): void
    {
        $response = $this->post(route('sales.pos.store'), [
            'cliente_id' => $this->cliente->id,
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'servicio',
                    'producto_id' => null,
                    'descripcion' => 'Diagnóstico',
                    'cantidad' => 1,
                    'precio_unitario' => 30000,
                ],
            ],
        ]);

        $response->assertRedirectToRoute('sales.facturas.show', Factura::first()->id);

        $factura = Factura::first();
        $this->assertEquals(1, $factura->items()->count());
        $this->assertEquals('Diagnóstico', $factura->items()->first()->descripcion);
    }

    public function test_pos_store_credito_no_requiere_caja_abierta(): void
    {
        $user2 = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);
        $this->actingAs($user2);

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 5,
            'is_active' => true,
        ]);

        $response = $this->post(route('sales.pos.store'), [
            'cliente_id' => $this->cliente->id,
            'metodo_pago' => 'credito',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 10000,
                ],
            ],
        ]);

        $response->assertRedirectToRoute('sales.facturas.show', Factura::first()->id);

        $factura = Factura::first();
        $this->assertEquals('pendiente', $factura->estado);
        $this->assertEquals('credito', $factura->metodo_pago);
    }

    public function test_pos_store_falla_si_stock_insuficiente(): void
    {
        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 1,
            'is_active' => true,
        ]);

        $response = $this->post(route('sales.pos.store'), [
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 5,
                    'precio_unitario' => 10000,
                ],
            ],
        ], ['X-Inertia' => 'true']);

        $response->assertStatus(302);
        $this->assertStringContainsString('Stock insuficiente', session('error') ?? '');
    }

    public function test_pos_store_falla_sin_items(): void
    {
        $response = $this->post(route('sales.pos.store'), [
            'metodo_pago' => 'efectivo',
            'items' => [],
        ], ['X-Inertia' => 'true']);

        $response->assertStatus(302);
        $response->assertSessionHasErrors('items');
    }

    public function test_pos_store_con_iva_regimen_comun(): void
    {
        Configuracion::setMany([
            'regimen_fiscal' => 'comun',
            'incluir_iva' => 'true',
            'porcentaje_iva' => '19',
        ], $this->tenant->id);

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'precio_venta' => 100000,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $response = $this->post(route('sales.pos.store'), [
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 100000,
                ],
            ],
        ]);

        $factura = Factura::first();
        $this->assertEquals(100000, (float) $factura->subtotal);
        $this->assertEquals(19000, (float) $factura->impuestos);
        $this->assertEquals(119000, (float) $factura->total);
        $this->assertEquals('borrador', $factura->dian_estado);
    }

    public function test_pos_store_sin_iva_regimen_simplificado(): void
    {
        Configuracion::setMany([
            'regimen_fiscal' => 'simplificado',
        ], $this->tenant->id);

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'precio_venta' => 100000,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $this->post(route('sales.pos.store'), [
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 100000,
                ],
            ],
        ]);

        $factura = Factura::first();
        $this->assertEquals(100000, (float) $factura->subtotal);
        $this->assertEquals(0, (float) $factura->impuestos);
        $this->assertEquals(100000, (float) $factura->total);
    }

    public function test_pos_store_registra_movimiento_en_caja(): void
    {
        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'precio_venta' => 30000,
            'stock_actual' => 5,
            'is_active' => true,
        ]);

        $this->post(route('sales.pos.store'), [
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 30000,
                ],
            ],
        ]);

        $this->sesion->refresh();
        $this->assertEquals(30000, (float) $this->sesion->ingresos_totales);
    }

    public function test_pos_store_pago_mixto(): void
    {
        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'precio_venta' => 100000,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $response = $this->post(route('sales.pos.store'), [
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 100000,
                ],
            ],
            'pagos_mixtos' => [
                ['metodo' => 'efectivo', 'monto' => 60000],
                ['metodo' => 'tarjeta', 'monto' => 40000],
            ],
        ]);

        $response->assertRedirectToRoute('sales.facturas.show', Factura::first()->id);

        $factura = Factura::first();
        $this->assertEquals(100000, (float) $factura->total);
        $this->assertEquals('pagada', $factura->estado);
    }

    public function test_numero_factura_es_unico(): void
    {
        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'precio_venta' => 1000,
            'stock_actual' => 100,
            'is_active' => true,
        ]);

        $this->post(route('sales.pos.store'), [
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 1000,
                ],
            ],
        ]);

        $this->post(route('sales.pos.store'), [
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 1000,
                ],
            ],
        ]);

        $numeros = Factura::pluck('numero')->toArray();
        $this->assertEquals(count($numeros), count(array_unique($numeros)));
    }
}
```

### FacturaServiceTest.php

**Ruta:** tests/Unit/Modules/Sales/FacturaServiceTest.php

```php
<?php

namespace Tests\Unit\Modules\Sales;

use App\Core\Models\Configuracion;
use App\Core\Models\Tenant;
use App\Models\User;
use App\Modules\Cash\Models\Caja;
use App\Modules\Cash\Services\CajaService;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Sales\Models\Factura;
use App\Modules\Sales\Models\FacturaItem;
use App\Modules\Sales\Services\FacturaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FacturaServiceTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private FacturaService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);

        $this->service = app(FacturaService::class);
    }

    private function abrirCaja(): void
    {
        $caja = Caja::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Caja Test',
            'activa' => true,
        ]);
        app(CajaService::class)->abrirCaja($this->user->id, $caja->id, 0);
    }

    // ─── crearDesdePos ───────────────────────────────────────────────────────

    public function test_crear_desde_pos_genera_numero_unico(): void
    {
        $this->abrirCaja();

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $factura = $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 10000,
                ],
            ],
        ]);

        $this->assertNotNull($factura->numero);
        $this->assertStringStartsWith('POS-', $factura->numero);
        $this->assertEquals(10000, (float) $factura->total);
        $this->assertEquals('pagada', $factura->estado);
    }

    public function test_crear_desde_pos_decrementa_stock(): void
    {
        $this->abrirCaja();

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 20,
            'is_active' => true,
        ]);

        $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 3,
                    'precio_unitario' => 15000,
                ],
            ],
        ]);

        $producto->refresh();
        $this->assertEquals(17, (float) $producto->stock_actual);
    }

    public function test_crear_desde_pos_no_decrementa_stock_de_servicios(): void
    {
        $this->abrirCaja();

        $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'servicio',
                    'producto_id' => null,
                    'descripcion' => 'Reparación',
                    'cantidad' => 1,
                    'precio_unitario' => 50000,
                ],
            ],
        ]);

        $this->assertEquals(1, Factura::count());
    }

    public function test_crear_desde_pos_credito_no_registra_en_caja(): void
    {
        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $factura = $this->service->crearDesdePos([
            'metodo_pago' => 'credito',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 20000,
                ],
            ],
        ]);

        $this->assertEquals('pendiente', $factura->estado);
    }

    public function test_crear_desde_pos_con_iva_regimen_comun(): void
    {
        $this->abrirCaja();
        Configuracion::setMany([
            'regimen_fiscal' => 'comun',
            'incluir_iva' => 'true',
            'porcentaje_iva' => '19',
        ], $this->tenant->id);

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $factura = $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 2,
                    'precio_unitario' => 100000,
                ],
            ],
        ]);

        $this->assertEquals(200000, (float) $factura->subtotal);
        $this->assertEquals(38000, (float) $factura->impuestos);
        $this->assertEquals(238000, (float) $factura->total);
    }

    public function test_crear_desde_pos_regimen_simplificado_sin_iva(): void
    {
        $this->abrirCaja();
        Configuracion::setMany([
            'regimen_fiscal' => 'simplificado',
        ], $this->tenant->id);

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $factura = $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 50000,
                ],
            ],
        ]);

        $this->assertEquals(50000, (float) $factura->subtotal);
        $this->assertEquals(0, (float) $factura->impuestos);
        $this->assertEquals(50000, (float) $factura->total);
    }

    public function test_crear_desde_pos_lanza_excepcion_si_stock_insuficiente(): void
    {
        $this->abrirCaja();

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 2,
            'is_active' => true,
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Stock insuficiente');

        $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 10,
                    'precio_unitario' => 10000,
                ],
            ],
        ]);
    }

    public function test_crear_desde_pos_lanza_excepcion_si_caja_cerrada_en_contado(): void
    {
        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('caja');

        $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 10000,
                ],
            ],
        ]);
    }

    public function test_crear_desde_pos_multiple_items(): void
    {
        $this->abrirCaja();

        $prodA = Producto::factory()->create(['tenant_id' => $this->tenant->id, 'stock_actual' => 10, 'is_active' => true]);
        $prodB = Producto::factory()->create(['tenant_id' => $this->tenant->id, 'stock_actual' => 5, 'is_active' => true]);

        $factura = $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                ['tipo' => 'producto', 'producto_id' => $prodA->id, 'cantidad' => 2, 'precio_unitario' => 10000],
                ['tipo' => 'servicio', 'producto_id' => null, 'descripcion' => 'Instalación', 'cantidad' => 1, 'precio_unitario' => 5000],
                ['tipo' => 'producto', 'producto_id' => $prodB->id, 'cantidad' => 1, 'precio_unitario' => 20000],
            ],
        ]);

        $this->assertEquals(3, $factura->items()->count());
        $this->assertEquals(45000, (float) $factura->total);

        $prodA->refresh();
        $prodB->refresh();
        $this->assertEquals(8, (float) $prodA->stock_actual);
        $this->assertEquals(4, (float) $prodB->stock_actual);
    }

    public function test_crear_desde_pos_con_cliente(): void
    {
        $this->abrirCaja();

        $cliente = Cliente::factory()->create(['tenant_id' => $this->tenant->id]);
        $producto = Producto::factory()->create(['tenant_id' => $this->tenant->id, 'stock_actual' => 10, 'is_active' => true]);

        $factura = $this->service->crearDesdePos([
            'cliente_id' => $cliente->id,
            'metodo_pago' => 'efectivo',
            'items' => [
                ['tipo' => 'producto', 'producto_id' => $producto->id, 'cantidad' => 1, 'precio_unitario' => 10000],
            ],
        ]);

        $this->assertEquals($cliente->id, $factura->cliente_id);
    }

    public function test_crear_desde_pos_pago_mixto_registra_varios_movimientos(): void
    {
        $this->abrirCaja();

        $producto = Producto::factory()->create(['tenant_id' => $this->tenant->id, 'stock_actual' => 10, 'is_active' => true]);

        $factura = $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                ['tipo' => 'producto', 'producto_id' => $producto->id, 'cantidad' => 1, 'precio_unitario' => 100000],
            ],
            'pagos_mixtos' => [
                ['metodo' => 'efectivo', 'monto' => 60000],
                ['metodo' => 'tarjeta', 'monto' => 40000],
            ],
        ]);

        $this->assertEquals(100000, (float) $factura->total);
        $this->assertEquals('pagada', $factura->estado);
    }

    // ─── FacturaItem ─────────────────────────────────────────────────────────

    public function test_factura_item_calcula_totales_correctamente(): void
    {
        $this->abrirCaja();

        $producto = Producto::factory()->create(['tenant_id' => $this->tenant->id, 'stock_actual' => 10, 'is_active' => true]);

        $factura = $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 3,
                    'precio_unitario' => 25000,
                ],
            ],
        ]);

        $item = $factura->items()->first();
        $this->assertEquals(3, (float) $item->cantidad);
        $this->assertEquals(25000, (float) $item->precio_unitario);
        $this->assertEquals(75000, (float) $item->subtotal);
        $this->assertEquals(75000, (float) $item->total);
    }

    // ─── Aislamiento multi-tenant ────────────────────────────────────────────

    public function test_aislamiento_entre_tenants(): void
    {
        $tenantB = Tenant::factory()->create();
        $userB = User::factory()->create(['tenant_id' => $tenantB->id]);
        $this->actingAs($userB);
        app()->instance('current_tenant', $tenantB);

        $cajaB = Caja::create(['tenant_id' => $tenantB->id, 'nombre' => 'Caja B', 'activa' => true]);
        app(CajaService::class)->abrirCaja($userB->id, $cajaB->id, 0);

        $prodB = Producto::factory()->create(['tenant_id' => $tenantB->id, 'stock_actual' => 10, 'is_active' => true]);

        $facturaB = $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                ['tipo' => 'producto', 'producto_id' => $prodB->id, 'cantidad' => 1, 'precio_unitario' => 5000],
            ],
        ]);

        $this->assertEquals($tenantB->id, $facturaB->tenant_id);
        $this->assertEquals(0, Factura::withoutGlobalScopes()->where('tenant_id', $this->tenant->id)->count());
        $this->assertEquals(1, Factura::withoutGlobalScopes()->where('tenant_id', $tenantB->id)->count());
    }

    // ─── Excepciones ─────────────────────────────────────────────────────────

    public function test_crear_desde_pos_explota_con_producto_invalido(): void
    {
        $this->abrirCaja();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Producto no válido para el item de POS');

        $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => 9999,
                    'cantidad' => 1,
                    'precio_unitario' => 1000,
                ],
            ],
        ]);
    }

    // ─── #25: Validación de pagos mixtos vs total ─────────────────────────

    public function test_pago_mixto_suma_no_cuadra_lanza_excepcion(): void
    {
        $this->abrirCaja();

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('no coincide con el total');

        $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'pagos_mixtos' => [
                ['metodo' => 'efectivo', 'monto' => 5000],
                ['metodo' => 'tarjeta', 'monto' => 3000],
            ],
            'items' => [
                ['tipo' => 'producto', 'producto_id' => $producto->id, 'cantidad' => 1, 'precio_unitario' => 10000],
            ],
        ]);
    }

    public function test_pago_mixto_suma_correcta_si_cuadra(): void
    {
        $this->abrirCaja();

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $factura = $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'pagos_mixtos' => [
                ['metodo' => 'efectivo', 'monto' => 5000],
                ['metodo' => 'tarjeta', 'monto' => 5000],
            ],
            'items' => [
                ['tipo' => 'producto', 'producto_id' => $producto->id, 'cantidad' => 1, 'precio_unitario' => 10000],
            ],
        ]);

        $this->assertEquals(10000, (float) $factura->total);
        $this->assertEquals('pagada', $factura->estado);
    }

    // ─── #27: IVA en factura ─────────────────────────────────────────────

    public function test_crear_desde_pos_con_ivaCalculado(): void
    {
        $this->abrirCaja();

        // Régimen simplificado: sin IVA
        $factura = $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                ['tipo' => 'servicio', 'producto_id' => null, 'descripcion' => 'Servicio', 'cantidad' => 1, 'precio_unitario' => 100000],
            ],
        ]);

        $this->assertEquals(100000, (float) $factura->subtotal);
        $this->assertEquals(0, (float) $factura->impuestos);
        $this->assertEquals(100000, (float) $factura->total);
    }

    // ─── #28: XmlUBLGenerator genera XML válido ───────────────────────────

    public function test_xml_ubl_generator_contiene_estructura_basica(): void
    {
        $this->abrirCaja();

        $factura = $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                ['tipo' => 'servicio', 'producto_id' => null, 'descripcion' => 'Servicio de prueba', 'cantidad' => 1, 'precio_unitario' => 50000],
            ],
        ]);

        $factura->load('items');

        $empresa = [
            'nit' => '900123456',
            'razon_social' => 'Empresa Test SAS',
            'direccion' => 'Calle 123',
        ];

        $generator = new \App\Modules\Sales\Services\ElectronicBilling\XmlUBLGenerator();
        $xml = $generator->generar($factura, $empresa);

        $this->assertStringContainsString('<?xml version="1.0" encoding="UTF-8"?>', $xml);
        $this->assertStringContainsString('<Invoice', $xml);
        $this->assertStringContainsString('<cbc:ID>' . $factura->numero . '</cbc:ID>', $xml);
        $this->assertStringContainsString('UBL 2.1', $xml);
        $this->assertStringContainsString('DIAN 2.1', $xml);
        $this->assertStringContainsString('<cac:AccountingSupplierParty>', $xml);
        $this->assertStringContainsString('<cac:AccountingCustomerParty>', $xml);
        $this->assertStringContainsString('<cac:TaxTotal>', $xml);
        $this->assertStringContainsString('<cac:LegalMonetaryTotal>', $xml);
        $this->assertStringContainsString('<cac:InvoiceLine>', $xml);

        // Verificar que el XML es válido
        $dom = new \DOMDocument();
        $this->assertTrue($dom->loadXML($xml));
    }

    public function test_xml_ubl_generator_incluye_allowance_charge_con_descuento(): void
    {
        // Crear factura con descuento manual (sin factory)
        $factura = Factura::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'subtotal' => 100000,
            'descuento' => 10000,
            'impuestos' => 17100,
            'total' => 107100,
            'numero' => 'FAC-TEST-DESC',
            'tipo_documento' => 'factura',
            'estado' => 'pagada',
            'metodo_pago' => 'efectivo',
        ]);

        \App\Modules\Sales\Models\FacturaItem::create([
            'factura_id' => $factura->id,
            'descripcion' => 'Producto con descuento',
            'cantidad' => 1,
            'precio_unitario' => 100000,
            'tasa_impuesto' => 19,
            'subtotal' => 100000,
            'impuesto_total' => 17100,
            'total' => 117100,
        ]);

        $empresa = ['nit' => '900123456', 'razon_social' => 'Test'];
        $generator = new \App\Modules\Sales\Services\ElectronicBilling\XmlUBLGenerator();
        $xml = $generator->generar($factura, $empresa);

        $this->assertStringContainsString('AllowanceCharge', $xml);
        $this->assertStringContainsString('ChargeIndicator', $xml);
        $this->assertStringContainsString('TaxableAmount', $xml);
    }

    public function test_factura_anulada_sincroniza_estado(): void
    {
        // #13: Verificar que el guard de sincronización funciona
        $factura = Factura::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'subtotal' => 50000,
            'total' => 50000,
            'numero' => 'FAC-SYNC-TEST',
            'tipo_documento' => 'factura',
            'estado' => 'pagada',
            'metodo_pago' => 'efectivo',
        ]);

        // Cambiar estado a anulada → debe sincronizar booleano
        $factura->update(['estado' => 'anulada']);
        $factura->refresh();

        $this->assertTrue($factura->anulada);
        $this->assertNotNull($factura->anulada_at);

        // Crear otra factura y sincronizar desde el booleano
        $factura2 = Factura::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'subtotal' => 30000,
            'total' => 30000,
            'numero' => 'FAC-SYNC-TEST2',
            'tipo_documento' => 'factura',
            'estado' => 'pagada',
            'metodo_pago' => 'efectivo',
        ]);

        $factura2->update(['anulada' => true]);
        $factura2->refresh();

        $this->assertEquals('anulada', $factura2->estado);
    }
}
```

---

## Correcciones aplicadas

| # | Archivo | Corrección |
|---|---------|-----------|
| 1 | Factura.php | Agregado evento `saving` para sincronizar `estado` ↔ `anulada` (fix #13) |
| 2 | Certificado.php | Agregados accessors `setPasswordAttribute` y `getPasswordAttribute` con encriptación vía `Crypto::encrypt/decrypt` |
| 3 | FacturaService.php | `registrarContabilidad()` ahora salt a facturas anuladas (`if ($factura->anulada) return`) |
| 4 | FacturaService.php | Validación de pagos mixtos: `sumaPagos !== saldoPagado` en `crearDesdeOrden()` |
| 5 | FacturaService.php | `anular()`: logging de reversión de caja omitida cuando la sesión ya está cerrada |
| 6 | FacturaService.php | `generarNumeroSiguiente()`: validación de vigencia de resolución (fecha_desde/fecha_hasta) |
| 7 | XmlUBLGenerator.php | `generar()`: resolución ahora usa `$factura->tipo_documento ?? 'factura'` en vez de hardcoded `'factura'` |
| 8 | XmlUBLGenerator.php | `generar()`: agregada sección `AllowanceCharge` (descuento) para cumplimiento DIAN |
| 9 | XmlUBLGenerator.php | `buildTaxTotal()`: recibe `Factura $factura` como parámetro, usa `$factura->impuestos` directamente |
| 10 | XmlUBLGenerator.php | `generar()`: agregado `TaxableAmount` con base gravable (subtotal - descuento) |
| 11 | XmlSigner.php | `computeSignatureValue()`: ahora recibe `$serialNumber` como parámetro explícito |
| 12 | XmlSigner.php | `computeXmlDigest()`: regex mejorado para manejar `<ext:ExtensionContent/>` (DOMDocument) |
| 13 | XmlSigner.php | `insertSignatureIntoXml()`: regex mejorado para manejar tanto self-closing como open/close tags |
| 14 | Migración | `2026_07_06_000000`: UNIQUE `numero` → UNIQUE `(tenant_id, numero)` + `user_id` cascade→restrict |
| 15 | Migración | `2026_07_06_100000`: encriptación de contraseñas PFX existentes en texto plano |
