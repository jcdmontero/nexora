# Auditoría: CRM

> Actualizado: 2026-07-06 - Juan

---

## module.json

**Ruta:** `app/Modules/Crm/module.json`

```json
{
    "code": "crm",
    "name": "CRM",
    "version": "1.0.0",
    "description": "Gestión de clientes, contactos y oportunidades comerciales.",
    "icon": "Users",
    "core": false,
    "dependencies": [],
    "permissions": [
        "crm:view",
        "crm:create",
        "crm:edit",
        "crm:delete"
    ],
    "menus": [
        {
            "section": "CRM",
            "icon": "Users",
            "items": [
                { "label": "Clientes", "route": "crm.clientes.index", "permission": "crm:view" },
                { "label": "Oportunidades", "route": "crm.oportunidades.index", "permission": "crm:view" }
            ]
        }
    ]
}
```

---

## Providers

### CrmServiceProvider

**Ruta:** `app/Modules/Crm/Providers/CrmServiceProvider.php`

```php
<?php

namespace App\Modules\Crm\Providers;

use Illuminate\Support\ServiceProvider;

class CrmServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Migrations');

        // Las rutas se cargan de forma centralizada en CoreServiceProvider::loadModuleRoutes()
        // (glob de Modules/*/Routes/web.php). No volver a cargarlas aquí: duplicaría las rutas
        // con un prefijo extra (crm/crm/...).
    }
}
```

---

## Routes

**Ruta:** `app/Modules/Crm/Routes/web.php`

```php
<?php

use App\Modules\Crm\Controllers\ClienteController;
use App\Modules\Crm\Controllers\ContactoController;
use App\Modules\Crm\Controllers\OportunidadController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'tenant', 'module:crm'])->group(function () {
    Route::prefix('crm')->name('crm.')->group(function () {
        
        Route::middleware('permission:crm:view')->group(function () {
            Route::get('clientes', [ClienteController::class, 'index'])->name('clientes.index');
            Route::get('clientes/{cliente}', [ClienteController::class, 'show'])->name('clientes.show')->where('cliente', '[0-9]+');
            
            Route::get('oportunidades', [OportunidadController::class, 'index'])->name('oportunidades.index');
        });

        Route::middleware('permission:crm:create')->group(function () {
            Route::get('clientes/crear', [ClienteController::class, 'create'])->name('clientes.create');
            Route::post('clientes', [ClienteController::class, 'store'])->name('clientes.store');
            
            Route::post('clientes/{cliente}/contactos', [ContactoController::class, 'store'])->name('contactos.store')->where('cliente', '[0-9]+');
            
            Route::post('oportunidades', [OportunidadController::class, 'store'])->name('oportunidades.store');
        });

        Route::middleware('permission:crm:edit')->group(function () {
            Route::get('clientes/{cliente}/editar', [ClienteController::class, 'edit'])->name('clientes.edit')->where('cliente', '[0-9]+');
            Route::put('clientes/{cliente}', [ClienteController::class, 'update'])->name('clientes.update')->where('cliente', '[0-9]+');
            
            Route::put('contactos/{contacto}', [ContactoController::class, 'update'])->name('contactos.update');
            
            Route::put('oportunidades/{oportunidad}', [OportunidadController::class, 'update'])->name('oportunidades.update');
            Route::patch('oportunidades/{oportunidad}/etapa', [OportunidadController::class, 'updateEtapa'])->name('oportunidades.updateEtapa');
        });

        Route::middleware('permission:crm:delete')->group(function () {
            Route::delete('clientes/{cliente}', [ClienteController::class, 'destroy'])->name('clientes.destroy')->where('cliente', '[0-9]+');
            Route::delete('contactos/{contacto}', [ContactoController::class, 'destroy'])->name('contactos.destroy');
            Route::delete('oportunidades/{oportunidad}', [OportunidadController::class, 'destroy'])->name('oportunidades.destroy');
        });
        
    });
});
```

---

## Controllers

### ClienteController

**Ruta:** `app/Modules/Crm/Controllers/ClienteController.php`

```php
<?php
namespace App\Modules\Crm\Controllers;

use App\Modules\Crm\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ClienteController extends \App\Http\Controllers\Controller
{
    public function index()
    {
        return Inertia::render('Crm/Clientes/Index', [
            'clientes' => Inertia::defer(fn () => Cliente::withCount('oportunidades')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'tipo' => $c->tipo,
                    'nombre' => $c->nombre_completo,
                    'documento' => $c->documento,
                    'email' => $c->email,
                    'telefono' => $c->telefono,
                    'ciudad' => $c->ciudad,
                    'activo' => $c->activo,
                    'oportunidades_count' => $c->oportunidades_count,
                ])),
        ]);
    }

    public function create()
    {
        return Inertia::render('Crm/Clientes/Create');
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        Cliente::create($data);

        return redirect()->route('crm.clientes.index')
            ->with('success', 'Cliente creado correctamente.');
    }

    public function show(Cliente $cliente)
    {
        $cliente->load(['contactos', 'oportunidades' => function ($query) {
            $query->orderBy('created_at', 'desc');
        }]);

        return Inertia::render('Crm/Clientes/Show', [
            'cliente' => array_merge($cliente->toArray(), [
                'nombre_completo' => $cliente->nombre_completo,
                'documento' => $cliente->documento,
            ]),
        ]);
    }

    public function edit(Cliente $cliente)
    {
        return Inertia::render('Crm/Clientes/Edit', [
            'cliente' => $cliente->only([
                'id', 'tipo', 'tipo_documento', 'numero_documento', 'nombres', 'apellidos',
                'razon_social', 'nit', 'nombre_contacto', 'telefono_contacto', 'cargo_contacto',
                'email', 'telefono', 'direccion', 'ciudad', 'notas', 'activo', 'portal_active',
                'regimen_tributario', 'porcentaje_retencion_fuente', 'porcentaje_retencion_iva',
                'porcentaje_retencion_ica',
            ]),
        ]);
    }

    public function update(Request $request, Cliente $cliente)
    {
        $data = $this->validateData($request);
        if (empty($data['password'])) {
            unset($data['password']);
        }
        $cliente->update($data);

        return redirect()->route('crm.clientes.index')
            ->with('success', 'Cliente actualizado.');
    }

    public function destroy(Cliente $cliente)
    {
        if ($cliente->oportunidades()->count() > 0) {
            return back()->with('error', 'No se puede eliminar el cliente porque tiene oportunidades asociadas.');
        }

        $cliente->delete();

        return redirect()->route('crm.clientes.index')
            ->with('success', 'Cliente eliminado.');
    }

    private function validateData(Request $request): array
    {
        $tenantId = app('current_tenant')->id;
        $clienteId = $request->route('cliente')?->id;

        return $request->validate([
            'tipo' => ['required', 'in:natural,juridico'],
            'regimen_tributario' => ['nullable', 'in:simplificado,comun'],
            'porcentaje_retencion_fuente' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'porcentaje_retencion_iva' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'porcentaje_retencion_ica' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tipo_documento' => ['nullable', 'string', 'max:20'],
            'numero_documento' => [
                'nullable', 'string', 'max:40',
                Rule::unique('crm_clientes', 'numero_documento')
                    ->where('tenant_id', $tenantId)
                    ->ignore($clienteId),
            ],
            'nombres' => ['required_if:tipo,natural', 'nullable', 'string', 'max:120'],
            'apellidos' => ['nullable', 'string', 'max:120'],
            'razon_social' => ['required_if:tipo,juridico', 'nullable', 'string', 'max:200'],
            'nit' => [
                'nullable', 'string', 'max:40',
                Rule::unique('crm_clientes', 'nit')
                    ->where('tenant_id', $tenantId)
                    ->ignore($clienteId),
            ],
            'nombre_contacto' => ['nullable', 'string', 'max:120'],
            'telefono_contacto' => ['nullable', 'string', 'max:30'],
            'cargo_contacto' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'ciudad' => ['nullable', 'string', 'max:120'],
            'notas' => ['nullable', 'string'],
            'activo' => ['boolean'],
            'portal_active' => ['boolean'],
            'password' => ['nullable', 'string', 'min:6'],
        ]);
    }
}
```

### OportunidadController

**Ruta:** `app/Modules/Crm/Controllers/OportunidadController.php`

```php
<?php

namespace App\Modules\Crm\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Crm\Models\Oportunidad;
use App\Modules\Crm\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OportunidadController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $oportunidades = Oportunidad::query()
            ->with('cliente')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('titulo', 'ilike', "%{$search}%")
                      ->orWhereHas('cliente', function($c) use ($search) {
                          $c->where('nombres', 'ilike', "%{$search}%")
                            ->orWhere('apellidos', 'ilike', "%{$search}%")
                            ->orWhere('razon_social', 'ilike', "%{$search}%");
                      });
                });
            })
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Crm/Oportunidades/Index', [
            'oportunidades' => $oportunidades,
            'clientes' => Cliente::select('id', 'nombres', 'apellidos', 'razon_social')->orderBy('id', 'desc')->get(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cliente_id' => [
                'required',
                Rule::exists('crm_clientes', 'id')->where('tenant_id', app('current_tenant')->id),
            ],
            'titulo' => 'required|string|max:150',
            'valor_estimado' => 'required|numeric|min:0',
            'etapa' => 'required|in:prospecto,calificado,propuesta,negociacion,ganado,perdido',
            'fecha_cierre_esperada' => 'nullable|date',
            'probabilidad' => 'required|integer|min:0|max:100',
            'notas' => 'nullable|string',
        ]);

        Oportunidad::create($validated);

        return back()->with('success', 'Oportunidad creada exitosamente.');
    }

    public function update(Request $request, Oportunidad $oportunidad)
    {
        $validated = $request->validate([
            'titulo' => 'required|string|max:150',
            'valor_estimado' => 'required|numeric|min:0',
            'etapa' => 'required|in:prospecto,calificado,propuesta,negociacion,ganado,perdido',
            'fecha_cierre_esperada' => 'nullable|date',
            'probabilidad' => 'required|integer|min:0|max:100',
            'notas' => 'nullable|string',
        ]);

        $oportunidad->update($validated);

        return back()->with('success', 'Oportunidad actualizada.');
    }

    public function updateEtapa(Request $request, Oportunidad $oportunidad)
    {
        $validated = $request->validate([
            'etapa' => 'required|in:prospecto,calificado,propuesta,negociacion,ganado,perdido',
        ]);

        $oportunidad->update($validated);

        return back()->with('success', 'Etapa actualizada.');
    }

    public function destroy(Oportunidad $oportunidad)
    {
        $oportunidad->delete();

        return back()->with('success', 'Oportunidad eliminada.');
    }
}
```

### ContactoController

**Ruta:** `app/Modules/Crm/Controllers/ContactoController.php`

```php
<?php

namespace App\Modules\Crm\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Crm\Models\Contacto;
use Illuminate\Http\Request;

class ContactoController extends Controller
{
    public function store(Request $request, Cliente $cliente)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:150',
            'cargo' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:150',
            'telefono' => 'nullable|string|max:50',
            'is_principal' => 'boolean',
        ]);

        if (!empty($validated['is_principal'])) {
            // Desmarcar otros contactos como principales
            $cliente->contactos()->update(['is_principal' => false]);
        }

        $cliente->contactos()->create($validated);

        return back()->with('success', 'Contacto agregado exitosamente.');
    }

    public function update(Request $request, Contacto $contacto)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:150',
            'cargo' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:150',
            'telefono' => 'nullable|string|max:50',
            'is_principal' => 'boolean',
        ]);

        if (!empty($validated['is_principal'])) {
            // Desmarcar otros
            $contacto->cliente->contactos()->where('id', '!=', $contacto->id)->update(['is_principal' => false]);
        }

        $contacto->update($validated);

        return back()->with('success', 'Contacto actualizado.');
    }

    public function destroy(Contacto $contacto)
    {
        $contacto->delete();

        return back()->with('success', 'Contacto eliminado.');
    }
}
```

---

## Models

### Cliente

**Ruta:** `app/Modules/Crm/Models/Cliente.php`

```php
<?php
namespace App\Modules\Crm\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cliente extends Authenticatable
{
    use HasFactory, BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'crm_clientes';

    protected $fillable = [
        'tenant_id', 'tipo',
        'regimen_tributario',
        'porcentaje_retencion_fuente',
        'porcentaje_retencion_iva',
        'porcentaje_retencion_ica',
        'tipo_documento', 'numero_documento', 'nombres', 'apellidos',
        'razon_social', 'nit', 'nombre_contacto', 'telefono_contacto', 'cargo_contacto',
        'email', 'telefono', 'direccion', 'ciudad', 'notas', 'activo',
        'password', 'portal_active', 'last_login_at',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'portal_active' => 'boolean',
        'last_login_at' => 'datetime',
        'password' => 'hashed',
        'porcentaje_retencion_fuente' => 'decimal:2',
        'porcentaje_retencion_iva' => 'decimal:2',
        'porcentaje_retencion_ica' => 'decimal:2',
    ];

    public function getNombreCompletoAttribute(): string
    {
        if ($this->tipo === 'juridico') {
            return $this->razon_social ?? '';
        }
        return trim(($this->nombres ?? '') . ' ' . ($this->apellidos ?? ''));
    }

    public function getDocumentoAttribute(): string
    {
        if ($this->tipo === 'juridico' && $this->nit) {
            return "NIT {$this->nit}";
        }
        $tipo = $this->tipo_documento ?? 'CC';
        return $this->numero_documento ? "{$tipo} {$this->numero_documento}" : '';
    }

    public function contactos()
    {
        return $this->hasMany(Contacto::class);
    }

    public function oportunidades()
    {
        return $this->hasMany(Oportunidad::class);
    }

    /**
     * Cuentas por cobrar asociadas a este cliente.
     */
    public function cuentasPorCobrar()
    {
        return $this->morphMany(\App\Modules\Accounting\Models\CuentaPorCobrar::class, 'deudor');
    }
}
```

### Oportunidad

**Ruta:** `app/Modules/Crm/Models/Oportunidad.php`

```php
<?php

namespace App\Modules\Crm\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Oportunidad extends Model
{
    use HasFactory, BelongsToTenant, Auditable, SoftDeletes;

    protected $table = 'crm_oportunidades';

    protected $fillable = [
        'tenant_id',
        'cliente_id',
        'titulo',
        'valor_estimado',
        'etapa',
        'fecha_cierre_esperada',
        'probabilidad',
        'notas',
    ];

    protected $casts = [
        'valor_estimado' => 'decimal:2',
        'fecha_cierre_esperada' => 'date',
        'probabilidad' => 'integer',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }
}
```

### Contacto

**Ruta:** `app/Modules/Crm/Models/Contacto.php`

```php
<?php

namespace App\Modules\Crm\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contacto extends Model
{
    use HasFactory, BelongsToTenant, Auditable, SoftDeletes;

    protected $table = 'crm_contactos';

    protected $fillable = [
        'tenant_id',
        'cliente_id',
        'nombre',
        'cargo',
        'email',
        'telefono',
        'is_principal',
    ];

    protected $casts = [
        'is_principal' => 'boolean',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }
}
```

---

## Migrations

### create_crm_clientes_table

**Ruta:** `app/Modules/Crm/Migrations/2026_06_19_210001_create_crm_clientes_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_clientes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();

            // Tipo de cliente: natural | juridico
            $table->string('tipo', 20)->default('natural');

            // Persona natural
            $table->string('tipo_documento', 20)->nullable(); // CC, CE, PAS...
            $table->string('numero_documento', 40)->nullable();
            $table->string('nombres', 120)->nullable();
            $table->string('apellidos', 120)->nullable();

            // Persona jurídica
            $table->string('razon_social', 200)->nullable();
            $table->string('nit', 40)->nullable();
            $table->string('nombre_contacto', 120)->nullable();
            $table->string('telefono_contacto', 30)->nullable();
            $table->string('cargo_contacto', 100)->nullable();

            // Contacto general
            $table->string('email')->nullable();
            $table->string('telefono', 30)->nullable();
            $table->string('direccion')->nullable();
            $table->string('ciudad', 120)->nullable();
            $table->text('notas')->nullable();

            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Unique por tenant (corrige el defecto de uniques globales del legacy)
            $table->unique(['tenant_id', 'numero_documento']);
            $table->unique(['tenant_id', 'nit']);
            $table->index(['tenant_id', 'tipo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_clientes');
    }
};
```

### create_crm_contactos_y_oportunidades

**Ruta:** `app/Modules/Crm/Migrations/2026_06_20_200000_create_crm_contactos_y_oportunidades.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_contactos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('cliente_id')->constrained('crm_clientes')->cascadeOnDelete();
            
            $table->string('nombre', 150);
            $table->string('cargo', 100)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('telefono', 50)->nullable();
            $table->boolean('is_principal')->default(false);
            
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('crm_oportunidades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('cliente_id')->constrained('crm_clientes')->cascadeOnDelete();
            
            $table->string('titulo', 150);
            $table->decimal('valor_estimado', 15, 2)->default(0);
            
            // Etapas: prospecto, calificado, propuesta, negociacion, ganado, perdido
            $table->string('etapa', 50)->default('prospecto');
            
            $table->date('fecha_cierre_esperada')->nullable();
            $table->integer('probabilidad')->default(10); // 0 a 100
            
            $table->text('notas')->nullable();
            
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'etapa']);
            $table->index('cliente_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_oportunidades');
        Schema::dropIfExists('crm_contactos');
    }
};
```

### add_tax_profile_to_crm_clientes_table

**Ruta:** `app/Modules/Crm/Migrations/2026_06_26_190000_add_tax_profile_to_crm_clientes_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('crm_clientes', function (Blueprint $table) {
            $table->string('regimen_tributario', 30)->default('simplificado')->after('tipo');
            $table->decimal('porcentaje_retencion_fuente', 5, 2)->default(0)->after('regimen_tributario');
            $table->decimal('porcentaje_retencion_iva', 5, 2)->default(0)->after('porcentaje_retencion_fuente');
            $table->decimal('porcentaje_retencion_ica', 5, 2)->default(0)->after('porcentaje_retencion_iva');
            $table->index('regimen_tributario');
        });
    }

    public function down(): void
    {
        Schema::table('crm_clientes', function (Blueprint $table) {
            $table->dropColumn([
                'regimen_tributario',
                'porcentaje_retencion_fuente',
                'porcentaje_retencion_iva',
                'porcentaje_retencion_ica',
            ]);
        });
    }
};
```

### add_softdeletes_to_crm_tables

**Ruta:** `app/Modules/Crm/Migrations/2026_07_05_000001_add_softdeletes_to_crm_tables.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('crm_contactos', function (Blueprint $table) {
            if (!Schema::hasColumn('crm_contactos', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        Schema::table('crm_oportunidades', function (Blueprint $table) {
            if (!Schema::hasColumn('crm_oportunidades', 'deleted_at')) {
                $table->softDeletes();
            }

            $indexes = collect(Schema::getIndexes('crm_oportunidades'))->pluck('name');
            if (!$indexes->contains('crm_oportunidades_tenant_id_etapa_index')) {
                $table->index(['tenant_id', 'etapa']);
            }
            if (!$indexes->contains('crm_oportunidades_cliente_id_index')) {
                $table->index('cliente_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('crm_oportunidades', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'etapa']);
            $table->dropIndex(['cliente_id']);
        });

        Schema::table('crm_contactos', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('crm_oportunidades', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
```

---

## Frontend

### Clientes/Index.jsx

**Ruta:** `resources/js/Pages/Crm/Clientes/Index.jsx`

```jsx
import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Badge } from '@/Components/ui/badge'
import { Avatar, AvatarFallback } from '@/Components/ui/avatar'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { TableSkeleton } from '@/Components/ui/skeleton'
import { PageHeader } from '@/Components/ui/page-header'
import { ListToolbar, FilterSelect } from '@/Components/ui/list-toolbar'
import { Pagination } from '@/Components/ui/pagination'
import { ConfirmDialog } from '@/Components/ui/confirm-dialog'
import { useDataTable } from '@/Hooks/useDataTable'
import { usePermissions } from '@/Hooks/usePermissions'
import {
  Users, Plus, Eye, Pencil, Trash2, Building2, User as UserIcon,
  Phone, Mail, Briefcase, SearchX,
} from 'lucide-react'

export default function ClientesIndex({ clientes }) {
  const loading = clientes == null
  const { can } = usePermissions()

  const data = (clientes || []).map((c) => ({
    ...c,
    tipoLabel: c.tipo === 'juridico' ? 'Empresa' : 'Persona',
    estado: c.activo ? 'activo' : 'inactivo',
  }))

  const table = useDataTable(data, {
    searchAccessor: (c) => `${c.nombre} ${c.documento} ${c.email} ${c.telefono} ${c.ciudad}`,
    pageSize: 10,
  })

  const columns = [
    {
      key: 'nombre',
      header: 'Cliente',
      className: 'font-medium',
      cell: (c) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 text-xs font-semibold">
              {(c.nombre?.[0] || '?').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{c.nombre || 'Sin nombre'}</p>
            <p className="truncate text-xs text-muted-foreground">{c.documento || 'Sin documento'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contacto',
      header: 'Contacto',
      hideOnMobile: true,
      cell: (c) => (
        <div className="flex flex-col gap-1 text-sm">
          <span className="flex items-center gap-1.5 text-foreground">
            <Phone className="h-3.5 w-3.5 text-emerald-500" />
            {c.telefono || '—'}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate max-w-[180px]">{c.email || '—'}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'tipoLabel',
      header: 'Tipo',
      cell: (c) =>
        c.tipo === 'juridico' ? (
          <Badge variant="secondary" className="gap-1">
            <Building2 className="h-3 w-3" /> Empresa
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1">
            <UserIcon className="h-3 w-3" /> Persona
          </Badge>
        ),
    },
    {
      key: 'oportunidades_count',
      header: 'Oportunidades',
      alignEnd: true,
      hideOnMobile: true,
      cell: (c) => (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground">
          <Briefcase className="h-3 w-3 text-muted-foreground" />
          {c.oportunidades_count ?? 0}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (c) => (
        <Badge variant={c.activo ? 'default' : 'outline'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      alignEnd: true,
      cell: (c) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={route('crm.clientes.show', c.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10"
            title="Ver perfil"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {can('crm:edit') && (
            <Link
              href={route('crm.clientes.edit', c.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          )}
          {can('crm:delete') && (
            <ConfirmDialog
              deleteUrl={route('crm.clientes.destroy', c.id)}
              title={`¿Archivar a ${c.nombre}?`}
              description="El cliente dejará de aparecer en los listados. Si tiene oportunidades asociadas no podrá archivarse."
              confirmLabel="Archivar"
              trigger={
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-destructive/10 hover:text-destructive"
                  title="Archivar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              }
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Clientes" />
      <PageHeader
        title="Directorio de clientes"
        description="Administra la información de contacto y los perfiles de tus clientes."
        icon={Users}
        actions={
          can('crm:create') && (
            <Link
              href={route('crm.clientes.create')}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </Link>
          )
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4">
          <ListToolbar
            search={table.search}
            onSearch={table.setSearch}
            placeholder="Buscar por nombre, documento, email o teléfono…"
            total={table.totalResults}
            filters={
              <>
                <FilterSelect
                  value={table.filters.tipo ?? 'all'}
                  onChange={(v) => table.setFilter('tipo', v)}
                  placeholder="Todos los tipos"
                  options={[
                    { value: 'juridico', label: 'Empresas' },
                    { value: 'natural', label: 'Personas' },
                  ]}
                />
                <FilterSelect
                  value={table.filters.estado ?? 'all'}
                  onChange={(v) => table.setFilter('estado', v)}
                  placeholder="Todos los estados"
                  options={[
                    { value: 'activo', label: 'Activos' },
                    { value: 'inactivo', label: 'Inactivos' },
                  ]}
                />
              </>
            }
          />
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : data.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aún no tienes clientes"
            description="Registra tus clientes (personas o empresas) para gestionar su información y operaciones."
            action={can('crm:create') ? { label: 'Crear primer cliente', href: route('crm.clientes.create') } : undefined}
          />
        ) : table.totalResults === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Sin coincidencias"
            description="Ningún cliente coincide con la búsqueda o los filtros aplicados."
          />
        ) : (
          <>
            <div className="border-t border-border">
              <DataTable columns={columns} data={table.rows} rowKey={(c) => c.id} />
            </div>
            <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} />
          </>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
```

### Clientes/Create.jsx

**Ruta:** `resources/js/Pages/Crm/Clientes/Create.jsx`

```jsx
import { useForm, Link } from '@inertiajs/react'
import { useState } from 'react'
import { z } from 'zod'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import ClienteForm from './ClienteForm'
import { Button } from '@/Components/ui/button'
import { ArrowLeft, CheckCircle2, Building2, Lightbulb } from 'lucide-react'

export default function ClienteCreate() {
  const { data, setData, post, processing, errors } = useForm({
    tipo: 'juridico',
    tipo_documento: 'NIT',
    numero_documento: '',
    nombres: '',
    apellidos: '',
    razon_social: '',
    nit: '',
    nombre_contacto: '',
    telefono_contacto: '',
    cargo_contacto: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    notas: '',
    regimen_tributario: 'simplificado',
    porcentaje_retencion_fuente: '0',
    porcentaje_retencion_iva: '0',
    porcentaje_retencion_ica: '0',
    activo: true,
    portal_active: false,
    password: '',
  })

  const [clientErrors, setClientErrors] = useState({})

  const clienteSchema = z.object({
    numero_documento: z.string().min(1, 'El número de documento es obligatorio'),
    email: z.string().email('Ingresa un correo válido').optional().or(z.literal('')),
  }).superRefine((data, ctx) => {
    if (data.tipo === 'juridico' && (!data.razon_social || data.razon_social.length < 2)) {
      ctx.addIssue({ path: ['razon_social'], message: 'La razón social es obligatoria' })
    }
  })

  const submit = (e) => {
    e.preventDefault()
    setClientErrors({})

    const result = clienteSchema.safeParse(data)
    if (!result.success) {
      const fieldErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (!fieldErrors[field]) fieldErrors[field] = issue.message
      }
      setClientErrors(fieldErrors)
      return
    }

    post(route('crm.clientes.store'))
  }

  return (
    <AuthenticatedLayout>
      <form onSubmit={submit} className="pb-12">
        {/* Header Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href={route('crm.clientes.index')} 
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Nuevo cliente</h2>
              <p className="text-sm text-slate-500 mt-1">Registra un nuevo cliente para gestionar tus relaciones comerciales.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={route('crm.clientes.index')}>
              <Button type="button" variant="outline" className="rounded-xl border-slate-200 text-slate-700">
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={processing}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {processing ? 'Creando...' : 'Crear cliente'}
            </Button>
          </div>
        </div>

        {/* Contenido Principal (2 Columnas) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Formulario */}
          <div className="lg:col-span-2 space-y-6">
            <ClienteForm data={data} setData={setData} errors={{ ...errors, ...clientErrors }} />
          </div>

          {/* Columna Derecha: Panel Informativo */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              
              {/* Ilustración Placeholder */}
              <div className="w-full h-40 bg-slate-50 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                 <Building2 className="w-20 h-20 text-blue-200 absolute bottom-4" />
              </div>

              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-[10px] text-slate-500">i</span>
                Información importante
              </h3>
              
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Completa la información del cliente para ofrecerte una mejor experiencia.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  ['Los campos marcados con * son obligatorios', true],
                  ['Puedes editar esta información más tarde', true],
                  ['Los datos de contacto son confidenciales', true],
                  ['Asegúrate de verificar el NIT', true],
                ].map(([text, check], i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100/50">
                <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-1.5">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  Consejo
                </h4>
                <p className="text-xs text-blue-800/80 leading-relaxed">
                  Un cliente bien registrado te ayudará a gestionar mejor tus ventas y ofrecer un servicio más personalizado.
                </p>
              </div>
            </div>
          </div>

        </div>
      </form>
    </AuthenticatedLayout>
  )
}
```

### Clientes/Edit.jsx

**Ruta:** `resources/js/Pages/Crm/Clientes/Edit.jsx`

```jsx
import { useForm, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import ClienteForm from './ClienteForm'
import { Button } from '@/Components/ui/button'
import { ArrowLeft, Save, Info, User, Building2, Mail, Phone } from 'lucide-react'

export default function ClienteEdit({ cliente }) {
  const { data, setData, put, processing, errors } = useForm({
    tipo: cliente.tipo,
    tipo_documento: cliente.tipo_documento || '',
    numero_documento: cliente.numero_documento || '',
    nombres: cliente.nombres || '',
    apellidos: cliente.apellidos || '',
    razon_social: cliente.razon_social || '',
    nit: cliente.nit || '',
    nombre_contacto: cliente.nombre_contacto || '',
    telefono_contacto: cliente.telefono_contacto || '',
    cargo_contacto: cliente.cargo_contacto || '',
    email: cliente.email || '',
    telefono: cliente.telefono || '',
    direccion: cliente.direccion || '',
    ciudad: cliente.ciudad || '',
    notas: cliente.notas || '',
    regimen_tributario: cliente.regimen_tributario || 'simplificado',
    porcentaje_retencion_fuente: cliente.porcentaje_retencion_fuente ?? 0,
    porcentaje_retencion_iva: cliente.porcentaje_retencion_iva ?? 0,
    porcentaje_retencion_ica: cliente.porcentaje_retencion_ica ?? 0,
    activo: cliente.activo ?? true,
    portal_active: cliente.portal_active || false,
    password: '',
  })

  const submit = (e) => {
    e.preventDefault()
    put(route('crm.clientes.update', cliente.id))
  }

  const titulo = cliente.razon_social || `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim() || 'Cliente'
  const esEmpresa = data.tipo === 'juridico'

  return (
    <AuthenticatedLayout>
      <form onSubmit={submit} className="pb-12">
        {/* Encabezado con acciones */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Link
              href={route('crm.clientes.index')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Editar cliente</h2>
              <p className="mt-1 text-sm text-muted-foreground">Actualiza la información de {titulo}.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={route('crm.clientes.index')}>
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={processing} className="gap-2">
              <Save className="h-4 w-4" />
              {processing ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Formulario */}
          <div className="space-y-6 lg:col-span-2">
            <ClienteForm data={data} setData={setData} errors={errors} />
          </div>

          {/* Panel lateral: resumen */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    {(titulo[0] || '?').toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{titulo}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      {esEmpresa ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {esEmpresa ? 'Persona jurídica' : 'Persona natural'}
                    </p>
                  </div>
                </div>
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate text-foreground">{data.email || 'Sin correo'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="text-foreground">{data.telefono || 'Sin teléfono'}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-muted-foreground">Estado</span>
                    {data.activo
                      ? <span className="font-medium text-emerald-600">Activo</span>
                      : <span className="font-medium text-muted-foreground">Inactivo</span>}
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Info className="h-4 w-4 text-indigo-500" />
                  Recuerda
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Los cambios se aplican al guardar. Si desactivas el cliente, dejará de aparecer
                  como opción en documentos y operaciones nuevas.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </AuthenticatedLayout>
  )
}
```

### Clientes/Show.jsx

**Ruta:** `resources/js/Pages/Crm/Clientes/Show.jsx`

```jsx
import { useState } from 'react'
import { Link, router, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { DataTable } from '@/Components/ui/data-table'
import { ArrowLeft, UserPlus, Briefcase, Plus, Trash2, Pencil } from 'lucide-react'
import { usePermissions } from '@/Hooks/usePermissions'
import ContactoModal from './ContactoModal'
import OportunidadModal from '../Oportunidades/OportunidadModal'

export default function ClienteShow({ cliente }) {
  const { can } = usePermissions()
  const [isContactoModalOpen, setIsContactoModalOpen] = useState(false)
  const [editingContacto, setEditingContacto] = useState(null)
  
  const [isOportunidadModalOpen, setIsOportunidadModalOpen] = useState(false)
  const [editingOportunidad, setEditingOportunidad] = useState(null)

  const deleteContacto = (id) => {
    if (confirm('¿Eliminar este contacto?')) {
      router.delete(route('crm.contactos.destroy', id), { preserveScroll: true })
    }
  }

  const contactoColumns = [
    { key: 'nombre', header: 'Nombre', className: 'font-medium' },
    { key: 'cargo', header: 'Cargo', cell: (c) => c.cargo || '—' },
    { key: 'email', header: 'Email', cell: (c) => c.email || '—' },
    { key: 'telefono', header: 'Teléfono', cell: (c) => c.telefono || '—' },
    {
      key: 'is_principal',
      header: 'Rol',
      cell: (c) => c.is_principal ? <Badge variant="default">Principal</Badge> : <Badge variant="outline">Adicional</Badge>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      alignEnd: true,
      cell: (c) => (
        <div className="flex gap-2 justify-end">
          {can('crm:edit') && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => { setEditingContacto(c); setIsContactoModalOpen(true); }}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('crm:delete') && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteContacto(c.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const oportunidadColumns = [
    { 
        key: 'titulo', 
        header: 'Oportunidad', 
        className: 'font-medium',
        cell: (o) => (
            <span 
                className="cursor-pointer hover:underline hover:text-primary" 
                onClick={() => {
                    if (can('crm:edit')) {
                        setEditingOportunidad(o); 
                        setIsOportunidadModalOpen(true);
                    }
                }}
            >
                {o.titulo}
            </span>
        )
    },
    { key: 'valor_estimado', header: 'Valor', cell: (o) => `$${Number(o.valor_estimado).toLocaleString()}` },
    { key: 'etapa', header: 'Etapa', cell: (o) => <Badge variant="outline" className="capitalize">{o.etapa}</Badge> },
    { key: 'fecha_cierre_esperada', header: 'Cierre', cell: (o) => o.fecha_cierre_esperada || '—' },
    { key: 'probabilidad', header: 'Prob.', cell: (o) => `${o.probabilidad}%` },
  ]

  return (
    <AuthenticatedLayout>
      <div className="flex items-center gap-4 mb-6">
        <Link href={route('crm.clientes.index')}>
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            {cliente.nombre_completo}
            {cliente.activo ? <Badge>Activo</Badge> : <Badge variant="destructive">Inactivo</Badge>}
          </h2>
          <p className="text-muted-foreground">{cliente.documento}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info lateral */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Tipo</p>
                <p className="font-medium capitalize">{cliente.tipo}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{cliente.email || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Teléfono</p>
                <p className="font-medium">{cliente.telefono || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Dirección</p>
                <p className="font-medium">{cliente.direccion || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ciudad</p>
                <p className="font-medium">{cliente.ciudad || '—'}</p>
              </div>
              {cliente.notas && (
                <div>
                  <p className="text-muted-foreground">Notas</p>
                  <p className="font-medium text-xs mt-1 bg-muted p-2 rounded-md">{cliente.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Listados */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Contactos</CardTitle>
                <CardDescription>Personas asociadas a este cliente</CardDescription>
              </div>
              {can('crm:create') && (
                <Button size="sm" variant="outline" className="gap-2" onClick={() => { setEditingContacto(null); setIsContactoModalOpen(true); }}>
                    <Plus className="h-4 w-4" /> Añadir
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {cliente.contactos?.length > 0 ? (
                <DataTable columns={contactoColumns} data={cliente.contactos} />
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                  No hay contactos registrados.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Oportunidades</CardTitle>
                <CardDescription>Negociaciones activas y pasadas</CardDescription>
              </div>
              <div className="flex gap-2">
                  {can('crm:create') && (
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => { setEditingOportunidad(null); setIsOportunidadModalOpen(true); }}>
                          <Plus className="h-4 w-4" /> Añadir
                      </Button>
                  )}
                  <Link href={route('crm.oportunidades.index')}>
                    <Button size="sm" variant="secondary">Ver pipeline</Button>
                  </Link>
              </div>
            </CardHeader>
            <CardContent>
              {cliente.oportunidades?.length > 0 ? (
                <DataTable columns={oportunidadColumns} data={cliente.oportunidades} />
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                  No hay oportunidades comerciales registradas.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ContactoModal 
        isOpen={isContactoModalOpen}
        onClose={() => setIsContactoModalOpen(false)}
        clienteId={cliente.id}
        contacto={editingContacto}
      />

      <OportunidadModal 
        isOpen={isOportunidadModalOpen}
        onClose={() => setIsOportunidadModalOpen(false)}
        clienteId={cliente.id}
        oportunidad={editingOportunidad}
      />
    </AuthenticatedLayout>
  )
}
```

### Clientes/ClienteForm.jsx

**Ruta:** `resources/js/Pages/Crm/Clientes/ClienteForm.jsx`

```jsx
import { Input } from '@/Components/ui/input'
import { User, Building2, MapPin, FileText, Phone, Mail, File, Key, Receipt } from 'lucide-react'

const InputIcon = ({ icon: Icon, className, ...props }) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
      <Icon className="w-4 h-4" />
    </div>
    <Input 
      className={`pl-9 border-slate-200 focus-visible:ring-blue-500 rounded-xl h-10 ${className}`} 
      {...props} 
    />
  </div>
)

export default function ClienteForm({ data, setData, errors }) {
  const esEmpresa = data.tipo === 'juridico'

  const field = (label, child, error, required = false) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {child}
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Selector de Tipo (Segmented Control) */}
      <div className="flex p-1 bg-slate-100/80 rounded-2xl">
        <button
          type="button"
          onClick={() => setData('tipo', 'natural')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            !esEmpresa 
              ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/50' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4" /> Persona
        </button>
        <button
          type="button"
          onClick={() => setData('tipo', 'juridico')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            esEmpresa 
              ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/50' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" /> Empresa
        </button>
      </div>

      {/* Información General */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8 relative">
        <div className="flex gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Información general</h3>
            <p className="text-sm text-slate-500">Datos básicos de la empresa</p>
          </div>
        </div>

        {esEmpresa ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {field('Razón social', <InputIcon icon={Building2} name="razon_social" value={data.razon_social || ''} onChange={e => setData('razon_social', e.target.value)} placeholder="Ej. Comercializadora del Norte S.A.S." required />, errors.razon_social, true)}
              {field('NIT', <InputIcon icon={FileText} name="nit" value={data.nit || ''} onChange={e => setData('nit', e.target.value)} placeholder="Ej. 900123456-7" required />, errors.nit, true)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {field('Contacto principal', <InputIcon icon={User} name="nombre_contacto" value={data.nombre_contacto || ''} onChange={e => setData('nombre_contacto', e.target.value)} placeholder="Nombre del contacto" />, errors.nombre_contacto)}
              {field('Tel. de contacto', <InputIcon icon={Phone} name="telefono_contacto" value={data.telefono_contacto || ''} onChange={e => setData('telefono_contacto', e.target.value)} placeholder="Ej. +57 300 123 4567" />, errors.telefono_contacto)}
              {field('Cargo', <InputIcon icon={User} name="cargo_contacto" value={data.cargo_contacto || ''} onChange={e => setData('cargo_contacto', e.target.value)} placeholder="Ej. Gerente comercial" />, errors.cargo_contacto)}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {field('Nombres', <InputIcon icon={User} name="nombres" value={data.nombres || ''} onChange={e => setData('nombres', e.target.value)} placeholder="Nombres" required />, errors.nombres, true)}
              {field('Apellidos', <InputIcon icon={User} name="apellidos" value={data.apellidos || ''} onChange={e => setData('apellidos', e.target.value)} placeholder="Apellidos" required />, errors.apellidos, true)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {field('Tipo documento', (
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                     <FileText className="w-4 h-4" />
                  </div>
                  <select name="tipo_documento" value={data.tipo_documento || ''} onChange={e => setData('tipo_documento', e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500">
                    <option value="">—</option>
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </div>
              ), errors.tipo_documento, true)}
              {field('Número documento', <InputIcon icon={FileText} name="numero_documento" value={data.numero_documento || ''} onChange={e => setData('numero_documento', e.target.value)} placeholder="Número" required />, errors.numero_documento, true)}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 pt-5 border-t border-slate-100">
          {field('Email', <InputIcon icon={Mail} name="email" type="email" value={data.email || ''} onChange={e => setData('email', e.target.value)} placeholder="contacto@empresa.com" />, errors.email)}
          {field('Teléfono', <InputIcon icon={Phone} name="telefono" value={data.telefono || ''} onChange={e => setData('telefono', e.target.value)} placeholder="Ej. +57 (604) 123 4567" />, errors.telefono)}
        </div>
      </div>

      {/* Ubicación */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8 relative">
        <div className="flex gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Ubicación</h3>
            <p className="text-sm text-slate-500">Información de dirección</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {field('Dirección', <InputIcon icon={MapPin} name="direccion" value={data.direccion || ''} onChange={e => setData('direccion', e.target.value)} placeholder="Ej. Carrera 30 # 45-67" />, errors.direccion)}
          {field('Ciudad', (
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                 <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="ciudad"
                list="ciudades-co"
                value={data.ciudad || ''}
                onChange={e => setData('ciudad', e.target.value)}
                placeholder="Escribe o selecciona una ciudad"
                autoComplete="off"
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
              />
              <datalist id="ciudades-co">
                <option value="Bogotá" />
                <option value="Medellín" />
                <option value="Cali" />
                <option value="Barranquilla" />
                <option value="Cartagena" />
                <option value="Cúcuta" />
                <option value="Bucaramanga" />
                <option value="Pereira" />
                <option value="Santa Marta" />
                <option value="Ibagué" />
                <option value="Manizales" />
                <option value="Villavicencio" />
                <option value="Armenia" />
                <option value="Neiva" />
                <option value="Pasto" />
                <option value="Montería" />
                <option value="Popayán" />
                <option value="Valledupar" />
                <option value="Sincelejo" />
                <option value="Tunja" />
              </datalist>
            </div>
          ), errors.ciudad)}
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8 relative">
        <div className="flex gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <File className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Información adicional</h3>
            <p className="text-sm text-slate-500">Notas y observaciones sobre el cliente</p>
          </div>
        </div>
        {field('Notas', (
          <textarea
            name="notas"
            value={data.notas || ''}
            onChange={e => setData('notas', e.target.value)}
            rows={3}
            placeholder="Información adicional relevante sobre el cliente..."
            className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 resize-y" 
          />
        ), errors.notas)}
      </div>

      {/* Perfil Tributario */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8 relative">
        <div className="flex gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Perfil Tributario</h3>
            <p className="text-sm text-slate-500">Configuración fiscal para facturación electrónica y retenciones</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {field('Régimen tributario', (
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <select name="regimen_tributario" value={data.regimen_tributario || 'simplificado'} onChange={e => setData('regimen_tributario', e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500">
                  <option value="simplificado">Simplificado</option>
                  <option value="comun">Común</option>
                </select>
              </div>
            ), errors.regimen_tributario)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {field('% Ret. Fuente', <InputIcon icon={Receipt} name="porcentaje_retencion_fuente" type="number" step="0.01" min="0" max="100" value={data.porcentaje_retencion_fuente ?? 0} onChange={e => setData('porcentaje_retencion_fuente', e.target.value)} placeholder="0.00" />, errors.porcentaje_retencion_fuente)}
            {field('% Ret. IVA', <InputIcon icon={Receipt} name="porcentaje_retencion_iva" type="number" step="0.01" min="0" max="100" value={data.porcentaje_retencion_iva ?? 0} onChange={e => setData('porcentaje_retencion_iva', e.target.value)} placeholder="0.00" />, errors.porcentaje_retencion_iva)}
            {field('% Ret. ICA', <InputIcon icon={Receipt} name="porcentaje_retencion_ica" type="number" step="0.01" min="0" max="100" value={data.porcentaje_retencion_ica ?? 0} onChange={e => setData('porcentaje_retencion_ica', e.target.value)} placeholder="0.00" />, errors.porcentaje_retencion_ica)}
          </div>
        </div>
      </div>

      {/* Acceso al Portal */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8 relative">
        <div className="flex gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Acceso al Portal de Clientes</h3>
            <p className="text-sm text-slate-500">Configuración de credenciales para que el cliente consulte sus documentos</p>
          </div>
        </div>

        <div className="space-y-5">
          <label className="flex items-start gap-3 cursor-pointer group bg-slate-50/50 p-4 rounded-xl border border-slate-100/80">
            <div className="flex items-center h-6">
              <input 
                type="checkbox" 
                checked={data.portal_active || false} 
                onChange={e => setData('portal_active', e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-shadow group-hover:border-blue-500" 
              />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-900 block">Habilitar acceso al portal</span>
              <span className="text-xs text-slate-500">Permite al cliente iniciar sesión para ver sus tiques, cotizaciones y facturas.</span>
            </div>
          </label>

          {data.portal_active && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {field('Contraseña de acceso', 
                <InputIcon 
                  icon={Key} 
                  type="password" 
                  name="password" 
                  value={data.password || ''} 
                  onChange={e => setData('password', e.target.value)} 
                  placeholder="Ej. Contraseña segura" 
                />, 
                errors.password
              )}
              <div className="flex items-center">
                <p className="text-xs text-slate-500 mt-5">
                  La contraseña se utilizará junto con el correo electrónico del cliente para iniciar sesión. Si estás editando, deja el campo en blanco si no deseas cambiarla.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkbox Estado */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="flex items-center h-6">
            <input 
              type="checkbox" 
              checked={data.activo} 
              onChange={e => setData('activo', e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-shadow group-hover:border-blue-500" 
            />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-900 block">Cliente activo</span>
            <span className="text-xs text-slate-500">El cliente podrá ser seleccionado en documentos y operaciones.</span>
          </div>
        </label>
      </div>

    </div>
  )
}
```

### Clientes/ContactoModal.jsx

**Ruta:** `resources/js/Pages/Crm/Clientes/ContactoModal.jsx`

```jsx
import { useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Switch } from '@/Components/ui/switch'

export default function ContactoModal({ isOpen, onClose, clienteId, contacto = null }) {
  const isEdit = !!contacto

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    nombre: '',
    cargo: '',
    email: '',
    telefono: '',
    is_principal: false,
  })

  useEffect(() => {
    if (isOpen) {
      if (isEdit && contacto) {
        setData({
          nombre: contacto.nombre || '',
          cargo: contacto.cargo || '',
          email: contacto.email || '',
          telefono: contacto.telefono || '',
          is_principal: contacto.is_principal || false,
        })
      } else {
        reset()
      }
      clearErrors()
    }
  }, [isOpen, contacto])

  const submit = (e) => {
    e.preventDefault()
    if (isEdit) {
      put(route('crm.contactos.update', contacto.id), {
        onSuccess: () => onClose(),
        preserveScroll: true,
      })
    } else {
      post(route('crm.contactos.store', clienteId), {
        onSuccess: () => onClose(),
        preserveScroll: true,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar Contacto' : 'Nuevo Contacto'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre completo <span className="text-destructive">*</span></Label>
              <Input
                id="nombre"
                value={data.nombre}
                onChange={(e) => setData('nombre', e.target.value)}
                placeholder="Ej. Juan Pérez"
              />
              {errors.nombre && <p className="text-sm text-destructive">{errors.nombre}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  value={data.cargo}
                  onChange={(e) => setData('cargo', e.target.value)}
                  placeholder="Gerente, Asesor..."
                />
                {errors.cargo && <p className="text-sm text-destructive">{errors.cargo}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={data.telefono}
                  onChange={(e) => setData('telefono', e.target.value)}
                  placeholder="12345678"
                />
                {errors.telefono && <p className="text-sm text-destructive">{errors.telefono}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                placeholder="correo@ejemplo.com"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <Switch 
                id="is_principal" 
                checked={data.is_principal}
                onCheckedChange={(checked) => setData('is_principal', checked)}
              />
              <Label htmlFor="is_principal">Marcar como contacto principal</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={processing}>
              {processing ? 'Guardando...' : 'Guardar Contacto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Oportunidades/Index.jsx

**Ruta:** `resources/js/Pages/Crm/Oportunidades/Index.jsx`

```jsx
import { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Briefcase, Plus, Search, Trash2, Calendar, DollarSign, GripVertical } from 'lucide-react'
import { usePermissions } from '@/Hooks/usePermissions'
import OportunidadModal from './OportunidadModal'

export default function OportunidadesIndex({ oportunidades, clientes, filters }) {
  const [search, setSearch] = useState(filters.search || '')
  const { can } = usePermissions()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOportunidad, setEditingOportunidad] = useState(null)

  const handleSearch = (e) => {
    e.preventDefault()
    router.get(route('crm.oportunidades.index'), { search }, { preserveState: true })
  }

  const deleteOportunidad = (e, id) => {
    e.stopPropagation(); // Evitar abrir el modal
    if (confirm('¿Eliminar esta oportunidad de negocio?')) {
      router.delete(route('crm.oportunidades.destroy', id), { preserveScroll: true })
    }
  }

  const openEdit = (oportunidad) => {
      if (can('crm:edit')) {
          setEditingOportunidad(oportunidad)
          setIsModalOpen(true)
      }
  }

  const openCreate = () => {
      setEditingOportunidad(null)
      setIsModalOpen(true)
  }

  const etapas = [
    { value: 'prospecto', label: 'Prospecto', color: 'border-slate-200 bg-slate-50' },
    { value: 'calificado', label: 'Calificado', color: 'border-indigo-200 bg-indigo-50' },
    { value: 'propuesta', label: 'Propuesta', color: 'border-amber-200 bg-amber-50' },
    { value: 'negociacion', label: 'Negociación', color: 'border-blue-200 bg-blue-50' },
    { value: 'ganado', label: 'Ganado', color: 'border-emerald-200 bg-emerald-50' },
    { value: 'perdido', label: 'Perdido', color: 'border-red-200 bg-red-50' },
  ]

  // Agrupar oportunidades por etapa
  const agruparOportunidades = () => {
      const grupos = {
          prospecto: [], calificado: [], propuesta: [], negociacion: [], ganado: [], perdido: []
      };
      
      if (oportunidades?.data) {
          oportunidades.data.forEach(op => {
              if (grupos[op.etapa]) {
                  grupos[op.etapa].push(op);
              }
          });
      }
      return grupos;
  }

  const columnas = agruparOportunidades();

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="h-6 w-6 text-primary" /> Pipeline de Ventas</h2>
          <p className="text-muted-foreground">Gestiona tus negociaciones y oportunidades en un tablero visual</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <Input
                placeholder="Buscar oportunidad..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-background max-w-[250px]"
            />
            <Button type="submit" variant="secondary" size="icon"><Search className="h-4 w-4" /></Button>
            </form>

            {can('crm:create') && (
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" /> Nueva Oportunidad
                </Button>
            )}
        </div>
      </div>

      {/* Tablero Kanban */}
      <div className="flex overflow-x-auto pb-6 gap-4 min-h-[60vh] snap-x">
          {etapas.map(etapa => (
              <div key={etapa.value} className={`flex-shrink-0 w-80 rounded-xl border ${etapa.color} flex flex-col h-full snap-start`}>
                  <div className="p-3 border-b border-inherit bg-white/50 flex justify-between items-center rounded-t-xl">
                      <h3 className="font-semibold text-gray-800">{etapa.label}</h3>
                      <Badge variant="secondary" className="bg-white">{columnas[etapa.value].length}</Badge>
                  </div>
                  
                  <div className="p-3 flex-1 overflow-y-auto space-y-3">
                      {columnas[etapa.value].map(op => (
                          <Card 
                            key={op.id} 
                            className="shadow-sm cursor-pointer hover:shadow-md hover:border-primary transition-all group"
                            onClick={() => openEdit(op)}
                          >
                              <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="font-semibold text-sm leading-tight text-gray-900 line-clamp-2">
                                          {op.titulo}
                                      </div>
                                      {can('crm:delete') && (
                                        <button 
                                            onClick={(e) => deleteOportunidad(e, op.id)} 
                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                      )}
                                  </div>
                                  
                                  <Link 
                                    href={route('crm.clientes.show', op.cliente_id)} 
                                    className="text-xs text-muted-foreground hover:underline hover:text-primary block mb-3"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {op.cliente?.nombres} {op.cliente?.apellidos} {op.cliente?.razon_social}
                                  </Link>

                                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 w-fit px-2 py-1 rounded mb-3">
                                      <DollarSign className="h-3 w-3" />
                                      {Number(op.valor_estimado).toLocaleString()}
                                  </div>

                                  <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2 mt-2">
                                      <div className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {op.fecha_cierre_esperada ? op.fecha_cierre_esperada.split('T')[0] : 'Sin fecha'}
                                      </div>
                                      <div className="flex items-center gap-1">
                                          <span className="font-semibold text-gray-700">{op.probabilidad}%</span> prob.
                                      </div>
                                  </div>
                              </CardContent>
                          </Card>
                      ))}

                      {columnas[etapa.value].length === 0 && (
                          <div className="h-24 border-2 border-dashed border-gray-200/60 rounded-lg flex items-center justify-center text-xs text-gray-400 font-medium">
                              Sin oportunidades
                          </div>
                      )}
                  </div>
              </div>
          ))}
      </div>

      <OportunidadModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientes={clientes}
        oportunidad={editingOportunidad}
      />
    </AuthenticatedLayout>
  )
}
```

### Oportunidades/OportunidadModal.jsx

**Ruta:** `resources/js/Pages/Crm/Oportunidades/OportunidadModal.jsx`

```jsx
import { useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Textarea } from '@/Components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'

export default function OportunidadModal({ isOpen, onClose, clienteId = null, clientes = [], oportunidad = null }) {
  const isEdit = !!oportunidad

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    cliente_id: clienteId || '',
    titulo: '',
    valor_estimado: '',
    etapa: 'prospecto',
    fecha_cierre_esperada: '',
    probabilidad: '10',
    notas: '',
  })

  useEffect(() => {
    if (isOpen) {
      if (isEdit && oportunidad) {
        setData({
          cliente_id: oportunidad.cliente_id || clienteId || '',
          titulo: oportunidad.titulo || '',
          valor_estimado: oportunidad.valor_estimado || '',
          etapa: oportunidad.etapa || 'prospecto',
          fecha_cierre_esperada: oportunidad.fecha_cierre_esperada || '',
          probabilidad: oportunidad.probabilidad || '10',
          notas: oportunidad.notas || '',
        })
      } else {
        reset()
        // Override reset value if clienteId was passed
        if (clienteId) {
            setData('cliente_id', clienteId);
        }
      }
      clearErrors()
    }
  }, [isOpen, oportunidad, clienteId])

  const submit = (e) => {
    e.preventDefault()
    if (isEdit) {
      put(route('crm.oportunidades.update', oportunidad.id), {
        onSuccess: () => onClose(),
        preserveScroll: true,
      })
    } else {
      post(route('crm.oportunidades.store'), {
        onSuccess: () => onClose(),
        preserveScroll: true,
      })
    }
  }

  const etapas = [
    { value: 'prospecto', label: 'Prospecto' },
    { value: 'calificado', label: 'Calificado' },
    { value: 'propuesta', label: 'Propuesta' },
    { value: 'negociacion', label: 'Negociación' },
    { value: 'ganado', label: 'Ganado' },
    { value: 'perdido', label: 'Perdido' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar Oportunidad' : 'Nueva Oportunidad Comercial'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {!clienteId && (
                <div className="grid gap-2">
                    <Label htmlFor="cliente_id">Cliente <span className="text-destructive">*</span></Label>
                    <Select 
                        value={data.cliente_id ? data.cliente_id.toString() : ''} 
                        onValueChange={(val) => setData('cliente_id', val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            {clientes.map(c => (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                    {c.nombres} {c.apellidos} {c.razon_social}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.cliente_id && <p className="text-sm text-destructive">{errors.cliente_id}</p>}
                </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="titulo">Título del Negocio <span className="text-destructive">*</span></Label>
              <Input
                id="titulo"
                value={data.titulo}
                onChange={(e) => setData('titulo', e.target.value)}
                placeholder="Ej. Implementación ERP 50 Usuarios"
              />
              {errors.titulo && <p className="text-sm text-destructive">{errors.titulo}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="valor_estimado">Valor Estimado ($) <span className="text-destructive">*</span></Label>
                <Input
                  id="valor_estimado"
                  type="number"
                  step="0.01"
                  min="0"
                  value={data.valor_estimado}
                  onChange={(e) => setData('valor_estimado', e.target.value)}
                  placeholder="0.00"
                />
                {errors.valor_estimado && <p className="text-sm text-destructive">{errors.valor_estimado}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="etapa">Etapa <span className="text-destructive">*</span></Label>
                <Select value={data.etapa} onValueChange={(val) => setData('etapa', val)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {etapas.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                {errors.etapa && <p className="text-sm text-destructive">{errors.etapa}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fecha_cierre_esperada">Fecha de Cierre (Aprox)</Label>
                <Input
                  id="fecha_cierre_esperada"
                  type="date"
                  value={data.fecha_cierre_esperada}
                  onChange={(e) => setData('fecha_cierre_esperada', e.target.value)}
                />
                {errors.fecha_cierre_esperada && <p className="text-sm text-destructive">{errors.fecha_cierre_esperada}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="probabilidad">Probabilidad de Éxito (%)</Label>
                <Input
                  id="probabilidad"
                  type="number"
                  min="0"
                  max="100"
                  value={data.probabilidad}
                  onChange={(e) => setData('probabilidad', e.target.value)}
                  placeholder="0 - 100"
                />
                {errors.probabilidad && <p className="text-sm text-destructive">{errors.probabilidad}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notas">Notas Adicionales</Label>
              <Textarea
                id="notas"
                value={data.notas}
                onChange={(e) => setData('notas', e.target.value)}
                rows={3}
                placeholder="Detalles sobre la oportunidad, próximos pasos..."
              />
              {errors.notas && <p className="text-sm text-destructive">{errors.notas}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={processing}>
              {processing ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear Oportunidad')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Tests

### ClienteTest

**Ruta:** `tests/Feature/Modules/Crm/ClienteTest.php`

```php
<?php

namespace Tests\Feature\Modules\Crm;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClienteTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure the 'crm' module exists in the modules catalog
        \DB::table('modules')->insertOrIgnore([
            'code' => 'crm',
            'name' => 'CRM',
            'class' => 'Crm',
            'version' => '1.0.0',
        ]);

        $this->tenant = Tenant::factory()->create();

        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'crm',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    public function test_cliente_index_requires_auth(): void
    {
        auth()->logout();
        $response = $this->get(route('crm.clientes.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_cliente_store_creates_cliente(): void
    {
        $response = $this->post(route('crm.clientes.store'), [
            'tipo' => 'natural',
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'tipo_documento' => 'CC',
            'numero_documento' => '1234567890',
            'email' => 'juan@ejemplo.com',
            'telefono' => '3001234567',
            'ciudad' => 'Bogotá',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('crm_clientes', [
            'tenant_id' => $this->tenant->id,
            'tipo' => 'natural',
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'numero_documento' => '1234567890',
            'activo' => true,
        ]);
    }

    public function test_cliente_update_modifies_fields(): void
    {
        $cliente = Cliente::create([
            'tenant_id' => $this->tenant->id,
            'tipo' => 'natural',
            'nombres' => 'María',
            'apellidos' => 'García',
            'ciudad' => 'Medellín',
        ]);

        $response = $this->put(route('crm.clientes.update', $cliente), [
            'tipo' => 'natural',
            'nombres' => 'María',
            'apellidos' => 'López',
            'ciudad' => 'Cali',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('crm_clientes', [
            'id' => $cliente->id,
            'apellidos' => 'López',
            'ciudad' => 'Cali',
        ]);
    }

    public function test_cliente_store_with_password_hashes_it(): void
    {
        $response = $this->post(route('crm.clientes.store'), [
            'tipo' => 'natural',
            'nombres' => 'Portal',
            'apellidos' => 'User',
            'password' => 'secret123',
            'portal_active' => true,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('crm_clientes', [
            'tenant_id' => $this->tenant->id,
            'nombres' => 'Portal',
        ]);

        $cliente = Cliente::where('nombres', 'Portal')->first();
        $this->assertNotEquals('secret123', $cliente->password);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('secret123', $cliente->password));
    }

    public function test_cliente_unique_numero_documento_within_tenant(): void
    {
        Cliente::create([
            'tenant_id' => $this->tenant->id,
            'tipo' => 'natural',
            'nombres' => 'First',
            'numero_documento' => '111111',
        ]);

        // Mismo documento en mismo tenant → debe fallar
        $response = $this->post(route('crm.clientes.store'), [
            'tipo' => 'natural',
            'nombres' => 'Second',
            'numero_documento' => '111111',
        ]);
        $response->assertSessionHasErrors('numero_documento');
    }

    public function test_cliente_allows_same_document_in_different_tenants(): void
    {
        Cliente::create([
            'tenant_id' => $this->tenant->id,
            'tipo' => 'natural',
            'nombres' => 'TenantA',
            'numero_documento' => '999999',
        ]);

        // Otro tenant con mismo documento → debe permitir
        $tenantB = Tenant::factory()->create();
        TenantModule::create([
            'tenant_id' => $tenantB->id,
            'module_code' => 'crm',
            'is_active' => true,
        ]);
        $userB = User::factory()->create([
            'tenant_id' => $tenantB->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($userB);
        app()->instance('current_tenant', $tenantB);

        $response = $this->post(route('crm.clientes.store'), [
            'tipo' => 'natural',
            'nombres' => 'TenantB',
            'numero_documento' => '999999',
        ]);
        $response->assertRedirect();
    }

    public function test_cliente_tenant_isolation(): void
    {
        // Create a client for tenant A (the current tenant)
        $clienteA = Cliente::create([
            'tenant_id' => $this->tenant->id,
            'tipo' => 'natural',
            'nombres' => 'Cliente',
            'apellidos' => 'Tenant A',
        ]);

        // Create tenant B with its own module active and user
        $tenantB = Tenant::factory()->create();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'crm',
            'name' => 'CRM',
            'class' => 'Crm',
            'version' => '1.0.0',
        ]);

        TenantModule::create([
            'tenant_id' => $tenantB->id,
            'module_code' => 'crm',
            'is_active' => true,
        ]);

        $userB = User::factory()->create([
            'tenant_id' => $tenantB->id,
            'is_superadmin' => true,
        ]);

        // Create a client for tenant B
        $clienteB = Cliente::create([
            'tenant_id' => $tenantB->id,
            'tipo' => 'natural',
            'nombres' => 'Cliente',
            'apellidos' => 'Tenant B',
        ]);

        // Switch to tenant B's user
        $this->actingAs($userB);
        app()->instance('current_tenant', $tenantB);

        // Request the CRM index as tenant B
        $response = $this->get(route('crm.clientes.index'));
        $response->assertStatus(200);

        // Verify that querying as tenant B does NOT return tenant A's client
        // The BelongsToTenant global scope filters by the current tenant
        $clientesVisible = Cliente::all();
        $this->assertTrue($clientesVisible->contains('id', $clienteB->id));
        $this->assertFalse($clientesVisible->contains('id', $clienteA->id));
    }
}
```

### ContactoOportunidadTest

**Ruta:** `tests/Feature/Modules/Crm/ContactoOportunidadTest.php`

```php
<?php

namespace Tests\Feature\Modules\Crm;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Crm\Models\Contacto;
use App\Modules\Crm\Models\Oportunidad;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactoOportunidadTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private Cliente $cliente;

    protected function setUp(): void
    {
        parent::setUp();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'crm', 'name' => 'CRM', 'class' => 'Crm', 'version' => '1.0.0',
        ]);

        $this->tenant = Tenant::factory()->create();
        TenantModule::create(['tenant_id' => $this->tenant->id, 'module_code' => 'crm', 'is_active' => true]);

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id, 'is_superadmin' => true]);
        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);

        $this->cliente = Cliente::create([
            'tenant_id'       => $this->tenant->id,
            'tipo'            => 'natural',
            'nombres'         => 'Pedro',
            'apellidos'       => 'Ramírez',
            'numero_documento' => '99887766',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    //  CONTACTOS
    // ═══════════════════════════════════════════════════════════════

    public function test_contacto_store_crea_contacto_para_cliente(): void
    {
        $response = $this->post(route('crm.contactos.store', ['cliente' => $this->cliente->id]), [
            'nombre'   => 'Ana Martínez',
            'cargo'    => 'Gerente',
            'email'    => 'ana@empresa.com',
            'telefono' => '3100001111',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('crm_contactos', [
            'tenant_id'  => $this->tenant->id,
            'cliente_id' => $this->cliente->id,
            'nombre'     => 'Ana Martínez',
            'email'      => 'ana@empresa.com',
        ]);
    }

    public function test_contacto_store_falla_sin_nombre(): void
    {
        $this->post(route('crm.contactos.store', ['cliente' => $this->cliente->id]), [
            'email' => 'x@x.com',
        ])->assertSessionHasErrors('nombre');
    }

    public function test_contacto_update_modifica_campos(): void
    {
        $contacto = Contacto::create([
            'tenant_id'  => $this->tenant->id,
            'cliente_id' => $this->cliente->id,
            'nombre'     => 'Original',
        ]);

        $this->put(route('crm.contactos.update', $contacto), [
            'nombre' => 'Actualizado',
            'cargo'  => 'Director',
        ])->assertRedirect();

        $this->assertDatabaseHas('crm_contactos', [
            'id'     => $contacto->id,
            'nombre' => 'Actualizado',
            'cargo'  => 'Director',
        ]);
    }

    public function test_contacto_destroy_elimina_correctamente(): void
    {
        $contacto = Contacto::create([
            'tenant_id'  => $this->tenant->id,
            'cliente_id' => $this->cliente->id,
            'nombre'     => 'A Eliminar',
        ]);

        $this->delete(route('crm.contactos.destroy', $contacto))->assertRedirect();

        $this->assertSoftDeleted('crm_contactos', ['id' => $contacto->id]);
    }

    public function test_contacto_aislamiento_entre_tenants(): void
    {
        $tenantB  = Tenant::factory()->create();
        $clienteB = Cliente::create([
            'tenant_id' => $tenantB->id,
            'tipo'      => 'natural',
            'nombres'   => 'B',
        ]);
        $contactoB = Contacto::create([
            'tenant_id'  => $tenantB->id,
            'cliente_id' => $clienteB->id,
            'nombre'     => 'Tenant B Contacto',
        ]);

        // Intentar actualizar un contacto de otro tenant → 404 o 403
        $this->put(route('crm.contactos.update', $contactoB), ['nombre' => 'Hack'])
            ->assertStatus(404);
    }

    // ═══════════════════════════════════════════════════════════════
    //  OPORTUNIDADES
    // ═══════════════════════════════════════════════════════════════

    public function test_oportunidades_index_devuelve_pagina(): void
    {
        $this->get(route('crm.oportunidades.index'))->assertStatus(200);
    }

    public function test_oportunidad_store_crea_oportunidad(): void
    {
        $response = $this->post(route('crm.oportunidades.store'), [
            'cliente_id'           => $this->cliente->id,
            'titulo'               => 'Venta de equipos',
            'valor_estimado'       => 5000000,
            'etapa'                => 'prospecto',
            'probabilidad'         => 30,
            'fecha_cierre_esperada' => now()->addMonths(2)->toDateString(),
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('crm_oportunidades', [
            'tenant_id'      => $this->tenant->id,
            'titulo'         => 'Venta de equipos',
            'valor_estimado' => 5000000,
            'etapa'          => 'prospecto',
        ]);
    }

    public function test_oportunidad_store_falla_sin_titulo(): void
    {
        $this->post(route('crm.oportunidades.store'), [
            'cliente_id'     => $this->cliente->id,
            'valor_estimado' => 100000,
            'etapa'          => 'prospecto',
        ])->assertSessionHasErrors('titulo');
    }

    public function test_oportunidad_update_modifica_etapa_y_probabilidad(): void
    {
        $op = Oportunidad::create([
            'tenant_id'      => $this->tenant->id,
            'cliente_id'     => $this->cliente->id,
            'titulo'         => 'Op Original',
            'valor_estimado' => 1000,
            'etapa'          => 'prospecto',
            'probabilidad'   => 10,
        ]);

        $this->put(route('crm.oportunidades.update', $op), [
            'titulo'         => 'Op Original',
            'valor_estimado' => 2000,
            'etapa'          => 'propuesta',
            'probabilidad'   => 60,
        ])->assertRedirect();

        $this->assertDatabaseHas('crm_oportunidades', [
            'id'           => $op->id,
            'etapa'        => 'propuesta',
            'probabilidad' => 60,
        ]);
    }

    public function test_oportunidad_update_etapa_solo_cambia_etapa(): void
    {
        $op = Oportunidad::create([
            'tenant_id'      => $this->tenant->id,
            'cliente_id'     => $this->cliente->id,
            'titulo'         => 'Op Etapa',
            'valor_estimado' => 500,
            'etapa'          => 'prospecto',
            'probabilidad'   => 10,
        ]);

        $this->patch(route('crm.oportunidades.updateEtapa', $op), [
            'etapa' => 'ganado',
        ])->assertRedirect();

        $this->assertDatabaseHas('crm_oportunidades', ['id' => $op->id, 'etapa' => 'ganado']);
    }

    public function test_oportunidad_destroy_elimina(): void
    {
        $op = Oportunidad::create([
            'tenant_id'      => $this->tenant->id,
            'cliente_id'     => $this->cliente->id,
            'titulo'         => 'A Eliminar',
            'valor_estimado' => 0,
            'etapa'          => 'perdido',
        ]);

        $this->delete(route('crm.oportunidades.destroy', $op))->assertRedirect();

        $this->assertSoftDeleted('crm_oportunidades', ['id' => $op->id]);
    }

    public function test_oportunidad_store_rejects_cross_tenant_cliente(): void
    {
        $tenantB = Tenant::factory()->create();
        $clienteB = Cliente::create([
            'tenant_id' => $tenantB->id,
            'tipo' => 'natural', 'nombres' => 'Cliente Ajeno',
        ]);

        $response = $this->post(route('crm.oportunidades.store'), [
            'cliente_id' => $clienteB->id,
            'titulo' => 'Oportunidad con cliente de otro tenant',
            'valor_estimado' => 1000,
            'etapa' => 'prospecto',
        ]);

        $response->assertSessionHasErrors('cliente_id');
    }

    public function test_oportunidad_aislamiento_entre_tenants(): void
    {
        $tenantB  = Tenant::factory()->create();
        $clienteB = Cliente::create(['tenant_id' => $tenantB->id, 'tipo' => 'natural', 'nombres' => 'B']);
        $opB      = Oportunidad::create([
            'tenant_id'      => $tenantB->id,
            'cliente_id'     => $clienteB->id,
            'titulo'         => 'Op Tenant B',
            'valor_estimado' => 100,
            'etapa'          => 'prospecto',
        ]);

        // No debe ser visible en el índice del tenant A
        $oportunidades = Oportunidad::all();
        $this->assertFalse($oportunidades->contains('id', $opB->id));
    }
}
```

---

## Correcciones

### CRÍTICAS

1. **Columnas faltantes en la migración `crm_clientes`** — El modelo `Cliente` declara `password`, `portal_active` y `last_login_at` en `$fillable` y `$casts`, pero **ninguna migración crea estas columnas**. El `ClienteController` valida `portal_active` y `password`. El frontend (Create/Edit/ClienteForm) renderiza campos de portal y contraseña. Esto producirá errores SQL en la BD real. Se requiere agregar una migración:

   ```php
   $table->string('password')->nullable()->after('activo');
   $table->boolean('portal_active')->default(false)->after('password');
   $table->timestamp('last_login_at')->nullable()->after('portal_active');
   ```

2. **`Cliente` extiende `Authenticatable` en vez de `Model`** — La tabla `crm_clientes` NO es la tabla `users`. Usar `Authenticatable` es conceptualmente incorrecto y trae consigo `AuthenticatableContract`, `CanResetPassword`, el trait `Authorizable`, y un campo `remember_token` innecesario. Debería extender `Illuminate\Database\Eloquent\Model` como los otros modelos del módulo.

### ALTO

3. **`Cliente` extiende `Authenticatable` pero no implementa autenticación real** — La tabla `crm_clientes` tiene campo `password` y el modelo lo hashea, pero no hay controlador de login para clientes ni middleware de autenticación de portal. El sistema de portal está a medias.

4. **Validación de `numero_documento` no excluye `nullable`** — En `ClienteController::validateData`, el campo `numero_documento` tiene `nullable` pero el `unique` con `ignore(null)` puede producir un escape SQL inesperado cuando `$clienteId` es `null` (store). Verificar que `Rule::unique(...)->ignore(null)` se resuelva como sin ignore.

5. **Frontend `Create.jsx` usa `zod` para validación client-side pero el schema solo valida `numero_documento` y `email`** — No valida campos condicionales como `nombres`/`apellidos` para tipo natural ni `razon_social` para tipo jurídico, a pesar de que el `.superRefine` solo cubre jurídico. El campo `nombres` se marca como `required` en el form pero zod no lo valida para natural.

6. **Estilos inconsistencia en `Create.jsx` vs `Edit.jsx`** — `Create.jsx` usa clases hardcodeadas `slate-200`, `blue-600`, `bg-white` (sin `bg-card`), inconsistente con el design system Tailwind v4 del proyecto. `Edit.jsx` sí usa `text-foreground`, `text-muted-foreground`, `border-border`.

### MEDIO

7. **No hay `Services/` en el módulo CRM** — Toda la lógica de negocio vive en los controllers. Para operaciones futuras como cálculo automático de probabilidad, scoring de oportunidades, o validaciones cruzadas, se debería crear un `CrmService`.

8. **`OportunidadController::index` usa `ilike` (PostgreSQL)** — Correcto para su stack, pero el `search` no sanitiza caracteres especiales LIKE (`%`, `_`). Un usuario podría manipular la búsqueda.

9. **`ContactoController` no valida `tenant_id` explícitamente** — Depende de `BelongsToTenant` para el aislamiento. El `update` y `destroy` reciben el modelo via route model binding, lo que es correcto porque `BelongsToTenant` filtra en scope. Sin embargo, si un contacto de otro tenant llega al controller (ej. URL directa), el route model binding lo descarta con 404, lo cual es la protección correcta.

10. **Falta `SearchX` icon import en `Index.jsx`** — El archivo `Clientes/Index.jsx` importa `SearchX` de lucide-react para el estado vacío de búsqueda, pero `Oportunidades/Index.jsx` no tiene estados vacíos equivalentes.

### BAJO

11. **`Oportunidades/Index.jsx` usa clases hardcodeadas `gray-800`, `gray-500`** — Inconsistente con el design system que usa `text-foreground`, `text-muted-foreground`.

12. **`ClienteForm.jsx` usa clases `blue-600`, `slate-*`** — No usa las variables de color del design system (ej. `bg-primary`, `text-primary-foreground`). Todos los componentes del form están en hardcoded Tailwind colors.

13. **`ContactoModal` y `OportunidadModal` usan `Dialog` de Shadcn/ui** — Correcto y consistente con el design system. No hay problemas aquí.

14. **Tests cubren aislamiento multi-tenant** — Excelente cobertura: `test_contacto_aislamiento_entre_tenants`, `test_oportunidad_store_rejects_cross_tenant_cliente`, `test_oportunidad_aislamiento_entre_tenants`, `test_cliente_tenant_isolation`. Los tests verifican que `BelongsToTenant` filtra correctamente.

15. **`add_softdeletes_to_crm_tables` usa `Schema::hasColumn` guard** — Correcto para migraciones incrementales. El `down()` no tiene guards equivalentes, lo que puede fallar si se ejecuta en un estado parcial.
