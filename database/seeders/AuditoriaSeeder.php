<?php

namespace Database\Seeders;

use App\Core\Models\Configuracion;
use App\Core\Models\Module;
use App\Core\Models\Sede;
use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Core\Services\ModuleActivator;
use App\Core\Services\ModuleRegistry;
use App\Core\Services\RoleProvisioner;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Hr\Models\Cargo;
use App\Modules\Hr\Models\Departamento;
use App\Modules\Hr\Models\Empleado;
use App\Modules\Inventory\Models\Bodega;
use App\Modules\Inventory\Models\Categoria;
use App\Modules\Inventory\Models\Marca;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Purchasing\Models\Proveedor;
use App\Modules\ServiceDesk\Models\Prestador;
use App\Modules\ServiceDesk\Models\Servicio as SdServicio;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

/**
 * AuditoriaSeeder — Crea DOS empresas completamente nuevas para la auditoría E2E.
 *
 * EMPRESA 1: TallerTech Reparaciones SAS (NO responsable de IVA, sin HR/Nómina)
 *   - Módulos: CRM, Inventory, Purchasing, Sales, Cash, ServiceDesk
 *   - Datos: 30 clientes, 15 proveedores, 200 productos, 10 técnicos
 *
 * EMPRESA 2: Comercializadora Integral SAS (Responsable de IVA, TODOS los módulos)
 *   - Módulos: TODOS
 *   - Datos: 30 clientes, 15 proveedores, 200 productos, 40 empleados, nómina, contabilidad
 *
 * IDEMPOTENTE: usa firstOrCreate. No modifica ni elimina datos existentes.
 * NO ejecutar en producción.
 */
class AuditoriaSeeder extends Seeder
{
    private const CIUDADES = [
        'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
        'Bucaramanga', 'Pereira', 'Manizales', 'Cúcuta', 'Ibagué',
    ];

    private Tenant $e1;
    private Tenant $e2;

    public function run(): void
    {
        $this->command->info('');
        $this->command->info('╔════════════════════════════════════════════╗');
        $this->command->info('║     AuditoriaSeeder — Iniciando            ║');
        $this->command->info('╚════════════════════════════════════════════╝');

        // Asegurar módulos registrados y publicados
        app(ModuleRegistry::class)->scanAndRegister();
        Module::whereIn('code', [
            'core', 'inventory', 'accounting', 'purchasing', 'crm',
            'sales', 'cash', 'service-desk', 'hr', 'payroll', 'notifications',
        ])->update(['estado' => 'publicado']);

        $this->crearEmpresa1();
        $this->crearEmpresa2();

        $this->imprimirResumen();

        $this->command->info('');
        $this->command->info('╔════════════════════════════════════════════╗');
        $this->command->info('║     AuditoriaSeeder — Completado ✓         ║');
        $this->command->info('╚════════════════════════════════════════════╝');
        $this->command->info('');
        $this->command->info('  Empresa 1 → http://nexora.test/login');
        $this->command->info('  Email: admin@tallertech.co | Pass: Audit2026!');
        $this->command->info('');
        $this->command->info('  Empresa 2 → http://nexora.test/login');
        $this->command->info('  Email: admin@comercializadora.co | Pass: Audit2026!');
        $this->command->info('');
    }

    // ════════════════════════════════════════════════════════════════════════
    //  EMPRESA 1 — TallerTech Reparaciones SAS
    //  NO responsable de IVA | Sin HR/Nómina
    // ════════════════════════════════════════════════════════════════════════

    private function crearEmpresa1(): void
    {
        $this->command->info('');
        $this->command->info('── EMPRESA 1: TallerTech Reparaciones SAS ──────────────────────');

        $this->e1 = Tenant::firstOrCreate(
            ['slug' => 'tallertech'],
            [
                'name'  => 'TallerTech Reparaciones SAS',
                'email' => 'admin@tallertech.co',
            ]
        );

        $provisioner = app(RoleProvisioner::class);
        $provisioner->provisionForTenant($this->e1);

        TenantModule::firstOrCreate(
            ['tenant_id' => $this->e1->id, 'module_code' => 'core'],
            ['is_active' => true]
        );

        // Activar módulos (sin HR ni Payroll)
        app(ModuleActivator::class)->syncModules($this->e1, [
            'crm', 'inventory', 'purchasing', 'sales', 'cash', 'service-desk', 'notifications',
        ]);

        $this->e1Admin = $this->crearAdminTenant(
            $this->e1,
            'Administrador TallerTech',
            'admin@tallertech.co',
            'Audit2026!'
        );

        $this->crearUsuariosOperativos($this->e1, 'tallertech');

        $sedeE1 = Sede::firstOrCreate(
            ['tenant_id' => $this->e1->id, 'nombre' => 'Sede Central Taller'],
            [
                'direccion'    => 'Cra 15 # 93-47, Bogotá',
                'es_principal' => true,
                'activo'       => true,
            ]
        );

        Bodega::firstOrCreate(
            ['tenant_id' => $this->e1->id, 'nombre' => 'Bodega Principal'],
            [
                'sede_id'      => $sedeE1->id,
                'direccion'    => 'Cra 15 # 93-47, Bogotá',
                'es_principal' => true,
                'activo'       => true,
            ]
        );

        $this->crearConfiguraciones($this->e1, responsableIva: false);
        $this->crearCatalogosInventario($this->e1);
        $this->crearProductos($this->e1, cantidad: 200);
        $this->crearClientes($this->e1, cantidad: 30);
        $this->crearProveedores($this->e1, cantidad: 15);
        $this->crearPrestadores($this->e1, cantidad: 10);
        $this->crearServiciosTaller($this->e1);

        $this->command->info('   ✓ Empresa 1 creada correctamente');
    }

    // ════════════════════════════════════════════════════════════════════════
    //  EMPRESA 2 — Comercializadora Integral SAS
    //  Responsable de IVA | TODOS los módulos
    // ════════════════════════════════════════════════════════════════════════

    private function crearEmpresa2(): void
    {
        $this->command->info('');
        $this->command->info('── EMPRESA 2: Comercializadora Integral SAS ─────────────────────');

        $this->e2 = Tenant::firstOrCreate(
            ['slug' => 'comercializadora'],
            [
                'name'  => 'Comercializadora Integral SAS',
                'email' => 'admin@comercializadora.co',
            ]
        );

        $provisioner = app(RoleProvisioner::class);
        $provisioner->provisionForTenant($this->e2);

        TenantModule::firstOrCreate(
            ['tenant_id' => $this->e2->id, 'module_code' => 'core'],
            ['is_active' => true]
        );

        // Activar TODOS los módulos
        app(ModuleActivator::class)->syncModules($this->e2, [
            'crm', 'inventory', 'purchasing', 'sales', 'cash',
            'service-desk', 'hr', 'payroll', 'accounting', 'notifications',
        ]);

        $this->e2Admin = $this->crearAdminTenant(
            $this->e2,
            'Administrador Comercializadora',
            'admin@comercializadora.co',
            'Audit2026!'
        );

        $this->crearUsuariosOperativos($this->e2, 'comercializadora');

        $sedeE2 = Sede::firstOrCreate(
            ['tenant_id' => $this->e2->id, 'nombre' => 'Sede Principal'],
            [
                'direccion'    => 'Cl 72 # 10-34, Bogotá',
                'es_principal' => true,
                'activo'       => true,
            ]
        );

        Sede::firstOrCreate(
            ['tenant_id' => $this->e2->id, 'nombre' => 'Sede Norte'],
            [
                'direccion'    => 'Cl 116 # 45-12, Bogotá',
                'es_principal' => false,
                'activo'       => true,
            ]
        );

        Sede::firstOrCreate(
            ['tenant_id' => $this->e2->id, 'nombre' => 'Sede Sur'],
            [
                'direccion'    => 'Av Boyacá # 40-28 Sur, Bogotá',
                'es_principal' => false,
                'activo'       => true,
            ]
        );

        Bodega::firstOrCreate(
            ['tenant_id' => $this->e2->id, 'nombre' => 'Bodega Central'],
            [
                'sede_id'      => $sedeE2->id,
                'direccion'    => 'Cl 72 # 10-34, Bogotá',
                'es_principal' => true,
                'activo'       => true,
            ]
        );

        Bodega::firstOrCreate(
            ['tenant_id' => $this->e2->id, 'nombre' => 'Bodega Satélite Norte'],
            [
                'sede_id'      => $sedeE2->id,
                'es_principal' => false,
                'activo'       => true,
            ]
        );

        $this->crearConfiguraciones($this->e2, responsableIva: true);
        $this->crearCatalogosInventario($this->e2);
        $this->crearProductos($this->e2, cantidad: 200);
        $this->crearClientes($this->e2, cantidad: 30);
        $this->crearProveedores($this->e2, cantidad: 15);
        $this->crearPrestadores($this->e2, cantidad: 10);
        $this->crearServiciosTaller($this->e2);
        $this->crearEstructuraHR($this->e2);
        $this->crearEmpleados($this->e2, cantidad: 40);

        $this->command->info('   ✓ Empresa 2 creada correctamente');
    }

    // ════════════════════════════════════════════════════════════════════════
    //  Helpers compartidos
    // ════════════════════════════════════════════════════════════════════════

    private User $e1Admin;
    private User $e2Admin;

    private function crearAdminTenant(Tenant $tenant, string $nombre, string $email, string $password): User
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($tenant->id);

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name'          => $nombre,
                'tenant_id'     => $tenant->id,
                'password'      => bcrypt($password),
                'is_superadmin' => false,
                'is_active'     => true,
            ]
        );

        if (! $user->hasRole('ADMIN_EMPRESA')) {
            $user->assignRole('ADMIN_EMPRESA');
        }

        return $user;
    }

    private function crearUsuariosOperativos(Tenant $tenant, string $sufijo): void
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($tenant->id);

        $plantilla = [
            ['Vendedor Auditoría',  "vendedor@{$sufijo}.co",  'VENDEDOR'],
            ['Cajero Auditoría',    "cajero@{$sufijo}.co",    'CAJERO'],
            ['Contador Auditoría',  "contador@{$sufijo}.co",  'CONTADOR'],
            ['Gerente Auditoría',   "gerente@{$sufijo}.co",   'GERENTE'],
            ['Técnico Auditoría',   "tecnico@{$sufijo}.co",   'TECNICO'],
        ];

        foreach ($plantilla as [$nombre, $email, $rol]) {
            $u = User::firstOrCreate(
                ['email' => $email],
                [
                    'name'          => $nombre,
                    'tenant_id'     => $tenant->id,
                    'password'      => bcrypt('Audit2026!'),
                    'is_superadmin' => false,
                    'is_active'     => true,
                ]
            );
            if (! $u->hasRole($rol)) {
                $u->assignRole($rol);
            }
        }
    }

    private function crearConfiguraciones(Tenant $tenant, bool $responsableIva): void
    {
        $this->command->info('   → Configuraciones…');

        $pares = [
            ['general', 'moneda', 'COP'],
            ['general', 'tasa_iva_default', $responsableIva ? '19.00' : '0.00'],
            ['general', 'responsable_iva', $responsableIva ? '1' : '0'],
            ['general', 'decimales', '0'],
            ['general', 'pais', 'Colombia'],
            ['general', 'ciudad_default', 'Bogotá'],
            ['facturacion', 'prefijo_factura', 'AUD'],
            ['facturacion', 'consecutivo_actual', '1'],
            ['taller', 'dias_garantia_default', '30'],
            ['taller', 'costo_diagnostico_default', '15000'],
        ];

        foreach ($pares as [$cat, $clave, $valor]) {
            Configuracion::updateOrCreate(
                ['tenant_id' => $tenant->id, 'clave' => $clave],
                ['categoria' => $cat, 'valor' => $valor]
            );
        }
    }

    private function crearCatalogosInventario(Tenant $tenant): void
    {
        $this->command->info('   → Catálogos de inventario…');

        $marcas = [
            'HP', 'Epson', 'Canon', 'Brother', 'Lexmark',
            'Samsung', 'Lenovo', 'Dell', 'ASUS', 'Acer',
            'Intel', 'AMD', 'Kingston', 'Crucial', 'Western Digital',
            'Seagate', 'Logitech', 'TP-Link', 'Ubiquiti', 'Apple',
        ];

        foreach ($marcas as $nombre) {
            Marca::firstOrCreate(
                ['tenant_id' => $tenant->id, 'nombre' => $nombre],
                ['is_active' => true]
            );
        }

        $arbol = [
            'Computadores'         => ['Portátiles', 'Equipos de escritorio', 'All In One'],
            'Componentes'          => ['Procesadores', 'Memorias RAM', 'Discos SSD', 'Discos HDD', 'Tarjetas madre'],
            'Impresoras'           => ['Inyección de tinta', 'Láser', 'Térmicas'],
            'Repuestos Impresoras' => ['Cabezales', 'Dampers', 'Rodillos', 'Fusores', 'Tarjetas lógicas'],
            'Consumibles'          => ['Tintas', 'Tóner', 'Cartuchos'],
            'Celulares'            => ['Pantallas', 'Baterías', 'Flex', 'Conectores de carga'],
            'Redes'                => ['Routers', 'Switches', 'Access Points', 'Cables'],
        ];

        foreach ($arbol as $raiz => $subs) {
            $catRaiz = Categoria::firstOrCreate(
                ['tenant_id' => $tenant->id, 'nombre' => $raiz],
                ['descripcion' => $raiz, 'is_active' => true]
            );
            foreach ($subs as $sub) {
                Categoria::firstOrCreate(
                    ['tenant_id' => $tenant->id, 'nombre' => $sub],
                    ['descripcion' => "{$raiz} → {$sub}", 'is_active' => true]
                );
            }
        }
    }

    private function crearProductos(Tenant $tenant, int $cantidad): void
    {
        $this->command->info("   → Productos ({$cantidad}+)…");

        $marcas = Marca::where('tenant_id', $tenant->id)->pluck('id', 'nombre');
        $cats   = Categoria::where('tenant_id', $tenant->id)->pluck('id', 'nombre');

        $catalogo = [
            ['Portátil HP Pavilion 15 i5',        'HP',             'Portátiles',       2350000],
            ['Portátil Lenovo IdeaPad 3',          'Lenovo',         'Portátiles',       1990000],
            ['Portátil Dell Latitude 3420',        'Dell',           'Portátiles',       3650000],
            ['Portátil ASUS Vivobook 15',          'ASUS',          'Portátiles',       2150000],
            ['Portátil Acer Aspire 5',             'Acer',           'Portátiles',       2050000],
            ['MacBook Air M1',                     'Apple',          'Portátiles',       5990000],
            ['Equipo de escritorio HP ProDesk',   'HP',             'Equipos de escritorio', 2350000],
            ['Equipo de escritorio Dell OptiPlex','Dell',           'Equipos de escritorio', 2550000],
            ['Equipo de escritorio Lenovo ThinkCentre','Lenovo',    'Equipos de escritorio', 2450000],
            ['All In One HP 24',                   'HP',             'All In One',       2650000],
            ['All In One Lenovo IdeaCentre',       'Lenovo',         'All In One',       2750000],
            ['Procesador Intel Core i5-13400',     'Intel',          'Procesadores',      980000],
            ['Procesador Intel Core i7-13700',     'Intel',          'Procesadores',     1690000],
            ['Procesador AMD Ryzen 5 7600',        'AMD',            'Procesadores',     1050000],
            ['Procesador AMD Ryzen 7 7700X',       'AMD',            'Procesadores',     1590000],
            ['Memoria RAM Kingston 8GB DDR4',      'Kingston',       'Memorias RAM',      95000],
            ['Memoria RAM Kingston 16GB DDR4',     'Kingston',       'Memorias RAM',     185000],
            ['Memoria RAM Kingston 32GB DDR5',     'Kingston',       'Memorias RAM',     395000],
            ['Memoria RAM Crucial 16GB DDR4',      'Crucial',        'Memorias RAM',     178000],
            ['SSD Kingston 480GB SATA',            'Kingston',       'Discos SSD',       145000],
            ['SSD Kingston 1TB NVMe',              'Kingston',       'Discos SSD',       315000],
            ['SSD Crucial 1TB P3',                 'Crucial',        'Discos SSD',       305000],
            ['SSD Western Digital Blue 1TB',       'Western Digital','Discos SSD',       345000],
            ['HDD Seagate Barracuda 1TB',          'Seagate',        'Discos HDD',       135000],
            ['HDD Seagate Barracuda 2TB',          'Seagate',        'Discos HDD',       205000],
            ['HDD WD Blue 1TB',                    'Western Digital','Discos HDD',       135000],
            ['Tarjeta madre ASUS Prime B760',      'ASUS',          'Tarjetas madre',    685000],
            ['Tarjeta madre Dell Latitude MB',     'Dell',           'Tarjetas madre',    545000],
            ['Impresora HP LaserJet M1132',        'HP',             'Láser',             890000],
            ['Impresora HP LaserJet Pro M404',     'HP',             'Láser',            1090000],
            ['Impresora Brother HL-L3210CW',       'Brother',        'Láser',            1250000],
            ['Impresora Epson EcoTank L3110',      'Epson',          'Inyección de tinta', 685000],
            ['Impresora Epson EcoTank L3150',      'Epson',          'Inyección de tinta', 745000],
            ['Impresora Epson EcoTank L4150',      'Epson',          'Inyección de tinta', 895000],
            ['Impresora HP Smart Tank 515',        'HP',             'Inyección de tinta', 815000],
            ['Impresora Canon PIXMA G3310',        'Canon',          'Inyección de tinta', 745000],
            ['Impresora térmica Epson TM-T20',     'Epson',          'Térmicas',         1150000],
            ['Cabezal Epson L3110 original',       'Epson',          'Cabezales',         165000],
            ['Cabezal Epson L4150 original',       'Epson',          'Cabezales',         185000],
            ['Cabezal HP Smart Tank 515',          'HP',             'Cabezales',         175000],
            ['Cabezal Brother tinta',              'Brother',        'Cabezales',         195000],
            ['Damper Epson L3110',                 'Epson',          'Dampers',            18500],
            ['Damper Epson L4150',                 'Epson',          'Dampers',            19500],
            ['Rodillo de arrastre Epson',          'Epson',          'Rodillos',           19500],
            ['Rodillo de arrastre HP',             'HP',             'Rodillos',           21500],
            ['Fusor HP LaserJet M1132',            'HP',             'Fusores',           285000],
            ['Fusor Brother HL-L3210CW',           'Brother',        'Fusores',           325000],
            ['Tarjeta lógica Epson L3110',         'Epson',          'Tarjetas lógicas',  235000],
            ['Tarjeta lógica HP LaserJet',         'HP',             'Tarjetas lógicas',  285000],
            ['Tinta Epson T544 negra 600ml',       'Epson',          'Tintas',            125000],
            ['Tinta Epson T544 cian',              'Epson',          'Tintas',            125000],
            ['Tinta HP GT52 negra',                'HP',             'Tintas',             78000],
            ['Tinta HP GT53XL negra',              'HP',             'Tintas',            125000],
            ['Tinta Canon GI-20 negra',            'Canon',          'Tintas',             68000],
            ['Tóner HP 83A negro',                 'HP',             'Tóner',             285000],
            ['Tóner HP 35A negro',                 'HP',             'Tóner',             245000],
            ['Tóner Brother TN-820 negro',         'Brother',        'Tóner',             265000],
            ['Cartuchos HP 664',                   'HP',             'Cartuchos',          75000],
            ['Cartuchos Canon PG-445',             'Canon',          'Cartuchos',          78000],
            ['Pantalla Samsung Galaxy S24',        'Samsung',        'Pantallas',         425000],
            ['Pantalla iPhone 13',                 'Apple',          'Pantallas',         445000],
            ['Batería Samsung Galaxy S24',         'Samsung',        'Baterías',          125000],
            ['Batería iPhone 13',                  'Apple',          'Baterías',          125000],
            ['Flex de carga Samsung Galaxy S24',   'Samsung',        'Flex',               65000],
            ['Flex de carga iPhone 15',            'Apple',          'Flex',               85000],
            ['Conector USB-C Samsung',             'Samsung',        'Conectores de carga', 35000],
            ['Router TP-Link Archer C80',          'TP-Link',        'Routers',           165000],
            ['Router TP-Link Archer AX55',         'TP-Link',        'Routers',           285000],
            ['Switch TP-Link TL-SG1008D 8 puertos','TP-Link',       'Switches',          125000],
            ['Switch TP-Link TL-SG1024D 24 puertos','TP-Link',      'Switches',          345000],
            ['Access Point UniFi U6-Lite',         'Ubiquiti',       'Access Points',     385000],
            ['Access Point TP-Link EAP670',        'TP-Link',        'Access Points',     425000],
            ['Cable UTP Cat6 caja 305m',           'TP-Link',        'Cables',            485000],
            ['Cable UTP Cat6E 100m',               'TP-Link',        'Cables',            185000],
        ];

        $creados  = 0;
        $contador = 1;

        foreach ($catalogo as [$nombre, $marcaNom, $catNom, $costo]) {
            $sku = 'AUD' . Str::upper(substr($this->e1 === $tenant ? 'E1' : 'E2', 0, 2)) . '-' . str_pad((string) $contador, 5, '0', STR_PAD_LEFT);
            Producto::firstOrCreate(
                ['tenant_id' => $tenant->id, 'codigo' => $sku],
                [
                    'nombre'         => $nombre,
                    'descripcion'    => "{$nombre} — {$marcaNom}",
                    'categoria_id'   => $cats[$catNom] ?? null,
                    'marca_id'       => $marcas[$marcaNom] ?? null,
                    'unidad_medida'  => 'unidad',
                    'precio_venta'   => (int) round($costo * 1.30),
                    'costo_promedio' => $costo,
                    'stock_actual'   => rand(5, 50),
                    'stock_minimo'   => rand(2, 8),
                    'is_active'      => true,
                ]
            );
            $creados++;
            $contador++;
        }

        // Rellenar hasta $cantidad con variantes
        $nombresBase = ['Cabezal', 'Damper', 'Rodillo', 'Flex', 'Pantalla', 'Batería', 'Tinta', 'Tóner', 'Cable', 'Sensor'];
        $marcasArr   = Marca::where('tenant_id', $tenant->id)->pluck('nombre')->all();
        $catsArr     = ['Cabezales', 'Dampers', 'Rodillos', 'Flex', 'Pantallas', 'Baterías', 'Tintas', 'Tóner', 'Cables', 'Conectores de carga'];

        while ($creados < $cantidad) {
            $nb      = $nombresBase[array_rand($nombresBase)];
            $mNom    = $marcasArr[array_rand($marcasArr)];
            $cNom    = $catsArr[array_rand($catsArr)];
            $nombre2 = "{$nb} {$mNom} Ref-" . str_pad((string) $contador, 3, '0', STR_PAD_LEFT);
            $costo2  = rand(15000, 280000);
            $sku2    = 'AUD' . Str::upper(substr($this->e1 === $tenant ? 'E1' : 'E2', 0, 2)) . '-' . str_pad((string) $contador, 5, '0', STR_PAD_LEFT);

            Producto::firstOrCreate(
                ['tenant_id' => $tenant->id, 'codigo' => $sku2],
                [
                    'nombre'         => $nombre2,
                    'descripcion'    => $nombre2,
                    'categoria_id'   => $cats[$cNom] ?? null,
                    'marca_id'       => $marcas[$mNom] ?? null,
                    'unidad_medida'  => 'unidad',
                    'precio_venta'   => (int) round($costo2 * 1.28),
                    'costo_promedio' => $costo2,
                    'stock_actual'   => rand(0, 25),
                    'stock_minimo'   => rand(2, 6),
                    'is_active'      => true,
                ]
            );
            $creados++;
            $contador++;
        }

        $this->command->info("      ✓ {$creados} productos creados");
    }

    private function crearClientes(Tenant $tenant, int $cantidad): void
    {
        $this->command->info("   → Clientes ({$cantidad})…");

        $nombres  = ['Juan', 'María', 'Carlos', 'Andrés', 'Luis', 'Camila', 'Daniela', 'Felipe', 'Santiago', 'Valentina', 'Paola', 'Diego', 'Laura', 'Sebastián', 'Natalia', 'Óscar', 'Patricia', 'Fabián', 'Andrea', 'Julián'];
        $apellidos = ['Pérez', 'Gómez', 'Rodríguez', 'García', 'Martínez', 'López', 'Sánchez', 'Ramírez', 'Torres', 'Díaz', 'Rojas', 'Moreno', 'Muñoz', 'Hernández', 'Vargas', 'Castro', 'Jiménez', 'Suárez', 'Ortiz', 'Mendoza'];
        $empresas  = [
            'Tecnología Avanzada SAS', 'Colegio San Bartolomé', 'Clínica Dental Sonrisas',
            'Distribuidora El Sol', 'Inmobiliaria Los Andes', 'Café Internet La Esquina',
            'Constructora Horizonte', 'Farmacia La Salud', 'Hotel Colonial',
            'Restaurante La Fogata', 'Ferromax Ferretería', 'Boutique Elite',
        ];

        $mitad = intdiv($cantidad, 2);

        // Personas naturales
        for ($i = 0; $i < $mitad; $i++) {
            $n   = $nombres[array_rand($nombres)];
            $a   = $apellidos[array_rand($apellidos)];
            $doc = (string) (10000000 + ($tenant->id * 10000) + $i);
            Cliente::firstOrCreate(
                ['tenant_id' => $tenant->id, 'numero_documento' => $doc],
                [
                    'tipo'             => 'natural',
                    'tipo_documento'   => 'CC',
                    'nombres'          => $n,
                    'apellidos'        => $a,
                    'email'            => Str::slug($n . $a, '') . "{$i}@test.co",
                    'telefono'         => '3' . $this->digits(9),
                    'direccion'        => 'Cl ' . rand(1, 200) . ' #' . rand(1, 100) . '-' . rand(1, 99),
                    'ciudad'           => self::CIUDADES[array_rand(self::CIUDADES)],
                    'activo'           => true,
                ]
            );
        }

        // Personas jurídicas
        for ($i = 0; $i < ($cantidad - $mitad); $i++) {
            $razon = $empresas[$i % count($empresas)] . ' Aud' . $i;
            $nit   = '9' . str_pad((string) (($tenant->id * 1000) + $i), 8, '0', STR_PAD_LEFT) . '-' . ($i % 9);
            Cliente::firstOrCreate(
                ['tenant_id' => $tenant->id, 'nit' => $nit],
                [
                    'tipo'              => 'juridico',
                    'razon_social'      => $razon,
                    'nombre_contacto'   => $nombres[array_rand($nombres)] . ' ' . $apellidos[array_rand($apellidos)],
                    'email'             => 'contacto@' . Str::slug($razon, '') . '.co',
                    'telefono'          => '6' . $this->digits(6),
                    'direccion'         => 'Av ' . rand(1, 50) . ' #' . rand(1, 100) . '-' . rand(10, 90),
                    'ciudad'            => self::CIUDADES[$i % count(self::CIUDADES)],
                    'activo'            => true,
                ]
            );
        }

        $this->command->info("      ✓ {$cantidad} clientes creados");
    }

    private function crearProveedores(Tenant $tenant, int $cantidad): void
    {
        $this->command->info("   → Proveedores ({$cantidad})…");

        $plantilla = [
            'TechColombia Mayoristas SAS',
            'Distribuidora Computecnica',
            'Importaciones Láser Andina',
            'Celulares del Pacífico',
            'Consumibles y Tintas Ltda.',
            'Redes e Infraestructura SA',
            'Epson Distribuidor Autorizado',
            'HP Premium Partner Colombia',
            'Brother Authorized Reseller',
            'Canon Business Partner',
            'Partes Samsung Mobile',
            'Repuestos Epson EcoTank',
            'Cabezales y Dampers Col.',
            'Tóner y Cartuchos del Valle',
            'Tintas Comestibles Técnicas',
        ];

        foreach (array_slice($plantilla, 0, $cantidad) as $i => $razon) {
            $nit = '800' . str_pad((string) (($tenant->id * 1000) + $i), 6, '0', STR_PAD_LEFT) . '-' . ($i % 9);
            Proveedor::firstOrCreate(
                ['tenant_id' => $tenant->id, 'razon_social' => $razon . " ({$tenant->slug})"],
                [
                    'tipo_documento'  => 'NIT',
                    'numero_documento' => $nit,
                    'nombre_contacto' => 'Contacto ' . ($i + 1),
                    'email'           => 'ventas@' . Str::slug($razon, '') . '.co',
                    'telefono'        => '6' . $this->digits(6),
                    'direccion'       => 'Cra ' . (10 + $i) . ' #' . ($i * 3 + 5) . '-' . ($i + 11),
                    'ciudad'          => self::CIUDADES[$i % count(self::CIUDADES)],
                    'activo'          => true,
                ]
            );
        }

        $this->command->info("      ✓ {$cantidad} proveedores creados");
    }

    private function crearPrestadores(Tenant $tenant, int $cantidad): void
    {
        $this->command->info("   → Prestadores/Técnicos ({$cantidad})…");

        $nombres = [
            'Claudio Delgado', 'Julián Ramírez', 'Sandra Rojas', 'Fabián Torres',
            'Nicolás Estrada', 'Óscar Loaiza', 'Valentina Gómez', 'Andrés Castillo',
            'Patricia Mora', 'Fernando Díaz',
        ];

        foreach (array_slice($nombres, 0, $cantidad) as $i => $nombre) {
            $doc = (string) (10000000 + ($tenant->id * 100) + $i);
            Prestador::firstOrCreate(
                ['tenant_id' => $tenant->id, 'numero_documento' => $doc],
                [
                    'tipo_documento'     => 'CC',
                    'nombre_completo'    => $nombre . " ({$tenant->slug})",
                    'email'              => Str::slug(explode(' ', $nombre)[0], '') . "{$i}@tecnico.co",
                    'telefono'           => '3' . $this->digits(9),
                    'tipo_vinculacion'   => ['CONTRATISTA', 'COMISIONISTA', 'FREELANCE'][$i % 3],
                    'porcentaje_comision' => 40 + ($i * 2),
                    'es_gratuito'        => false,
                    'activo'             => true,
                ]
            );
        }

        $this->command->info("      ✓ {$cantidad} prestadores creados");
    }

    private function crearServiciosTaller(Tenant $tenant): void
    {
        $this->command->info('   → Servicios de taller…');

        $servicios = [
            ['Diagnóstico de equipo',            15000, 30],
            ['Mantenimiento preventivo PC',       45000, 90],
            ['Mantenimiento correctivo PC',       75000, 150],
            ['Formateo e instalación de SO',      40000, 60],
            ['Limpieza interna y térmica',        30000, 60],
            ['Cambio de pantalla portátil',       60000, 90],
            ['Diagnóstico de impresora',          15000, 60],
            ['Mantenimiento preventivo impresora',55000, 120],
            ['Destape de cabezales',              45000, 90],
            ['Cambio de fusor',                   95000, 90],
            ['Diagnóstico de celular',            15000, 30],
            ['Cambio de pantalla celular',        50000, 75],
            ['Cambio de batería',                 25000, 30],
            ['Instalación de SSD',                35000, 45],
            ['Configuración de redes',            60000, 120],
        ];

        foreach ($servicios as [$nombre, $precio, $tiempo]) {
            SdServicio::firstOrCreate(
                ['tenant_id' => $tenant->id, 'nombre' => $nombre],
                [
                    'codigo'               => 'SRV-' . Str::upper(Str::slug($nombre, '')),
                    'descripcion'          => $nombre,
                    'precio_base'          => $precio,
                    'costo_tecnico_base'   => round($precio * 0.45, 0),
                    'tipo_comision_tecnico' => 'porcentaje',
                    'tiempo_estimado'      => $tiempo,
                    'requiere_repuestos'   => false,
                    'activo'               => true,
                ]
            );
        }

        $this->command->info('      ✓ 15 servicios creados');
    }

    private function crearEstructuraHR(Tenant $tenant): void
    {
        $this->command->info('   → Estructura organizacional HR…');

        $departamentos = [
            'Gerencia General', 'Ventas y Comercial', 'Operaciones y Logística',
            'Contabilidad y Finanzas', 'Recursos Humanos', 'Tecnología e Innovación',
            'Servicio al Cliente', 'Compras y Suministros',
        ];

        foreach ($departamentos as $nombre) {
            Departamento::firstOrCreate(
                ['tenant_id' => $tenant->id, 'nombre' => $nombre],
                ['descripcion' => $nombre, 'activo' => true]
            );
        }

        $cargos = [
            ['Gerente General',       'Gerencia General',         8000000, 12000000],
            ['Director de Ventas',    'Ventas y Comercial',       5000000, 7000000],
            ['Asesor Comercial',      'Ventas y Comercial',       2000000, 3000000],
            ['Jefe de Operaciones',   'Operaciones y Logística',  4500000, 6000000],
            ['Operario',              'Operaciones y Logística',  1300000, 2000000],
            ['Contador',              'Contabilidad y Finanzas',  3500000, 5000000],
            ['Auxiliar Contable',     'Contabilidad y Finanzas',  1500000, 2500000],
            ['Jefe de RRHH',          'Recursos Humanos',         4000000, 5500000],
            ['Auxiliar de RRHH',      'Recursos Humanos',         1500000, 2000000],
            ['Desarrollador Senior',  'Tecnología e Innovación',  5000000, 8000000],
            ['Soporte TI',            'Tecnología e Innovación',  2500000, 4000000],
            ['Agente de Servicio',    'Servicio al Cliente',      1600000, 2200000],
            ['Comprador',             'Compras y Suministros',    2500000, 3500000],
            ['Auxiliar de Bodega',    'Operaciones y Logística',  1300000, 1800000],
        ];

        foreach ($cargos as [$nombre, $depto, $sMin, $sMax]) {
            $dpto = Departamento::where('tenant_id', $tenant->id)->where('nombre', $depto)->first();
            Cargo::firstOrCreate(
                ['tenant_id' => $tenant->id, 'nombre' => $nombre],
                [
                    'departamento_id'       => $dpto?->id,
                    'salario_base_sugerido' => $sMin,
                    'activo'                => true,
                ]
            );
        }

        $this->command->info('      ✓ ' . count($departamentos) . ' departamentos y ' . count($cargos) . ' cargos creados');
    }

    private function crearEmpleados(Tenant $tenant, int $cantidad): void
    {
        $this->command->info("   → Empleados ({$cantidad})…");

        $nombres   = ['Juan', 'María', 'Carlos', 'Andrés', 'Luis', 'Camila', 'Daniela', 'Felipe', 'Santiago', 'Valentina', 'Paola', 'Diego', 'Laura', 'Sebastián', 'Natalia', 'Óscar', 'Patricia', 'Fabián', 'Andrea', 'Julián'];
        $apellidos = ['Pérez', 'Gómez', 'Rodríguez', 'García', 'Martínez', 'López', 'Sánchez', 'Ramírez', 'Torres', 'Díaz'];

        $sedeId = Sede::where('tenant_id', $tenant->id)->value('id');

        for ($i = 0; $i < $cantidad; $i++) {
            $n   = $nombres[$i % count($nombres)];
            $a   = $apellidos[$i % count($apellidos)];
            $doc = (string) (10000000 + ($tenant->id * 1000) + $i);

            Empleado::firstOrCreate(
                ['tenant_id' => $tenant->id, 'documento' => $doc],
                [
                    'sede_id'   => $sedeId,
                    'nombres'   => $n,
                    'apellidos' => "{$a} Aud",
                    'email'     => Str::slug("{$n}{$a}{$i}", '') . '@comercializadora.co',
                    'telefono'  => '3' . $this->digits(9),
                    'estado'    => true,
                ]
            );
        }

        $this->command->info("      ✓ {$cantidad} empleados creados");
    }

    private function imprimirResumen(): void
    {
        $this->command->info('');
        $this->command->info('── RESUMEN FINAL ─────────────────────────────────────────────────');

        foreach ([['E1 — TallerTech', $this->e1], ['E2 — Comercializadora', $this->e2]] as [$label, $t]) {
            $tid = $t->id;
            $this->command->info("   {$label} (tenant_id={$tid}):");
            $this->command->info('      Clientes:    ' . Cliente::where('tenant_id', $tid)->count());
            $this->command->info('      Proveedores: ' . Proveedor::where('tenant_id', $tid)->count());
            $this->command->info('      Productos:   ' . Producto::where('tenant_id', $tid)->count());
            $this->command->info('      Técnicos:    ' . Prestador::where('tenant_id', $tid)->count());
            $this->command->info('      Servicios:   ' . SdServicio::where('tenant_id', $tid)->count());
            if ($t === $this->e2) {
                $this->command->info('      Departamentos: ' . Departamento::where('tenant_id', $tid)->count());
                $this->command->info('      Cargos:        ' . Cargo::where('tenant_id', $tid)->count());
                $this->command->info('      Empleados:     ' . \Illuminate\Support\Facades\DB::table('hr_empleados')->where('tenant_id', $tid)->count());
            }
        }
    }

    private function digits(int $n): string
    {
        $s = '';
        for ($i = 0; $i < $n; $i++) {
            $s .= (string) rand(0, 9);
        }
        return $s;
    }
}
