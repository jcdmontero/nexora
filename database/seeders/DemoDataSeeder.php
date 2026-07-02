<?php

namespace Database\Seeders;

use App\Core\Models\Configuracion;
use App\Core\Models\Sede;
use App\Core\Models\Tenant;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Inventory\Models\Bodega;
use App\Modules\Inventory\Models\Categoria;
use App\Modules\Inventory\Models\Marca;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Purchasing\Models\OrdenCompra;
use App\Modules\Purchasing\Models\Proveedor;
use App\Modules\ServiceDesk\Models\Prestador;
use App\Modules\ServiceDesk\Models\Servicio as SdServicio;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Puebla la BD de desarrollo con datos realistas de un negocio de:
 *  - Soporte técnico / reparación de computadores y celulares
 *  - Mantenimiento y reparación de impresoras
 *  - Venta de repuestos e insumos
 *
 * IDEMPOTENTE: usa firstOrCreate / updateOrCreate y sólo inserta lo que falta.
 * Respeta los catálogos de ServiceDesk (tipos_equipo, marcas, modelos) ya creados.
 *
 * SÓLO entorno de desarrollo. No ejecutar en producción.
 */
class DemoDataSeeder extends Seeder
{
    private const CIUDADES = [
        'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
        'Bucaramanga', 'Pereira', 'Manizales', 'Cúcuta', 'Ibagué',
    ];

    private Tenant $tenant;
    private Sede $sede;
    private Bodega $bodega;
    private User $adminUser;
    private User $vendedorUser;

    public function run(): void
    {
        $this->command->info('=== DemoDataSeeder: iniciando ===');

        $this->tenant = Tenant::firstOrFail();
        $this->adminUser = User::where('tenant_id', $this->tenant->id)->firstOrFail();

        $this->seedInfraestructura();
        $this->seedUsuariosOperativos();
        $this->seedConfiguraciones();
        // $this->seedCatalogosInventory();
        // $this->seedServiciosServiceDesk();
        // $this->seedPrestadores();
        // $this->seedProveedores();
        // $this->seedProductos();
        // $this->seedClientes();
        // $this->seedCompras();

        $this->imprimirResumen();
        $this->command->info('=== DemoDataSeeder: completo ===');
    }

    // ════════════════════════════════════════════════════════════════════════
    // 1. INFRAESTRUCTURA: sedes + bodega principal
    // ════════════════════════════════════════════════════════════════════════
    private function seedInfraestructura(): void
    {
        $this->command->info('→ Infraestructura (sedes, bodega principal)…');

        $this->sede = Sede::firstOrCreate(
            ['tenant_id' => $this->tenant->id, 'nombre' => 'Sede Principal - Taller'],
            [
                'direccion' => 'Cra 15 # 93-47, Bogotá',
                'es_principal' => true,
                'activo' => true,
            ]
        );

        Sede::firstOrCreate(
            ['tenant_id' => $this->tenant->id, 'nombre' => 'Sede Norte - Punto de Venta'],
            [
                'direccion' => 'Cl 80 # 45-32, Bogotá',
                'es_principal' => false,
                'activo' => true,
            ]
        );

        $this->bodega = Bodega::firstOrCreate(
            ['tenant_id' => $this->tenant->id, 'nombre' => 'Bodega Principal'],
            [
                'sede_id' => $this->sede->id,
                'direccion' => 'Cra 15 # 93-47, Bogotá',
                'es_principal' => true,
                'activo' => true,
            ]
        );

        Bodega::firstOrCreate(
            ['tenant_id' => $this->tenant->id, 'nombre' => 'Bodega Repuestos'],
            [
                'sede_id' => $this->sede->id,
                'direccion' => 'Cra 15 # 93-47, Bogotá',
                'es_principal' => false,
                'activo' => true,
            ]
        );

        // Asignar sede principal al admin si no la tiene
        if (!$this->adminUser->sede_id) {
            $this->adminUser->update(['sede_id' => $this->sede->id]);
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // 2. USUARIOS OPERATIVOS (vendedor, cajero, técnico, contador)
    // ════════════════════════════════════════════════════════════════════════
    private function seedUsuariosOperativos(): void
    {
        $this->command->info('→ Usuarios operativos (vendedor, cajero, técnico, contador)…');

        $registrar = app(\Spatie\Permission\PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($this->tenant->id);

        $plantilla = [
            ['Maria Vendedora', 'vendedor@miempresa.com', 'VENDEDOR'],
            ['Carlos Cajero', 'cajero@miempresa.com', 'CAJERO'],
            ['Andrea Contadora', 'contador@miempresa.com', 'CONTADOR'],
            ['Diego Gerente', 'gerente@miempresa.com', 'GERENTE'],
            ['Claudio Técnico', 'tecnico@miempresa.com', 'TECNICO'],
        ];

        foreach ($plantilla as [$nombre, $email, $rol]) {
            $u = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $nombre,
                    'tenant_id' => $this->tenant->id,
                    'password' => bcrypt('password'),
                    'is_superadmin' => false,
                    'is_active' => true,
                    'sede_id' => $this->sede->id,
                ]
            );
            if (!$u->hasRole($rol)) {
                $u->assignRole($rol);
            }
            if ($rol === 'VENDEDOR') {
                $this->vendedorUser = $u;
            }
        }

        $this->vendedorUser ??= $this->adminUser;
    }

    // ════════════════════════════════════════════════════════════════════════
    // 3. CONFIGURACIONES (impuesto IVA Colombia 19%, moneda, etc.)
    // ════════════════════════════════════════════════════════════════════════
    private function seedConfiguraciones(): void
    {
        $this->command->info('→ Configuraciones (IVA, moneda, etc.)…');

        $pares = [
            ['general', 'moneda', 'COP'],
            ['general', 'tasa_iva_default', '19.00'],
            ['general', 'decimales', '0'],
            ['general', 'pais', 'Colombia'],
            ['general', 'ciudad_default', 'Bogotá'],
            ['facturacion', 'prefijo_factura', 'POS'],
            ['facturacion', 'consecutivo_actual', '1'],
            ['facturacion', 'resolucion_activa', '18764043125968'],
            ['taller', 'dias_garantia_default', '30'],
            ['taller', 'costo_diagnostico_default', '15000'],
            ['taller', 'costo_revision_default', '25000'],
        ];

        foreach ($pares as [$cat, $clave, $valor]) {
            Configuracion::updateOrCreate(
                ['tenant_id' => $this->tenant->id, 'clave' => $clave],
                ['categoria' => $cat, 'valor' => $valor]
            );
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // 4. CATÁLOGOS DE INVENTARIO: marcas y categorías (jerárquicas)
    // ════════════════════════════════════════════════════════════════════════
    private function seedCatalogosInventory(): void
    {
        $this->command->info('→ Catálogos Inventory (marcas, categorías)…');

        $marcas = [
            'HP', 'Epson', 'Canon', 'Brother', 'Lexmark', 'Xerox',
            'Samsung', 'Lenovo', 'Dell', 'ASUS', 'Acer', 'MSI', 'Apple',
            'Intel', 'AMD', 'Kingston', 'Crucial', 'Western Digital', 'Seagate',
            'Logitech', 'TP-Link', 'Ubiquiti', 'Hikvision', 'Dahua', 'Cisco', 'MikroTik',
        ];
        foreach ($marcas as $nombre) {
            Marca::firstOrCreate([
                'tenant_id' => $this->tenant->id,
                'nombre' => $nombre,
            ], ['is_active' => true]);
        }

        // Categorías raíz + subcategorías
        $arbol = [
            'Computadores' => ['Portátiles', 'Equipos de escritorio', 'All In One'],
            'Componentes' => ['Procesadores', 'Memorias RAM', 'Discos SSD', 'Discos HDD', 'Fuentes de poder', 'Tarjetas madre', 'Tarjetas de video'],
            'Impresoras' => ['Inyección de tinta', 'Láser', 'Térmicas', 'Matriciales'],
            'Repuestos de Impresoras' => ['Cabezales', 'Dampers', 'Bombas', 'Motores', 'Encoders', 'Tarjetas lógicas', 'Sensores', 'Rodillos', 'Fusores'],
            'Consumibles' => ['Tintas', 'Tóner', 'Cartuchos', 'Botellas de tinta'],
            'Celulares' => ['Pantallas', 'Baterías', 'Flex', 'Cámaras', 'Conectores de carga'],
            'Redes' => ['Routers', 'Switches', 'Access Points', 'Cables', 'Antenas'],
        ];

        foreach ($arbol as $raiz => $subs) {
            $catRaiz = Categoria::firstOrCreate(
                ['tenant_id' => $this->tenant->id, 'nombre' => $raiz],
                ['descripcion' => $raiz, 'is_active' => true]
            );
            foreach ($subs as $sub) {
                Categoria::firstOrCreate(
                    ['tenant_id' => $this->tenant->id, 'nombre' => $sub],
                    ['descripcion' => "{$raiz} → {$sub}", 'is_active' => true]
                );
            }
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // 5. SERVICIOS DE TALLER (sd_servicios) — vinculados a tipos de equipo
    // ════════════════════════════════════════════════════════════════════════
    private function seedServiciosServiceDesk(): void
    {
        $this->command->info('→ Servicios de taller (sd_servicios)…');

        // Mapa nombre_tipo_equipo => id
        $tipos = DB::table('sd_tipos_equipo')
            ->where('tenant_id', $this->tenant->id)
            ->pluck('id', 'nombre');

        // Por familia: servicios genéricos con su precio y tipo de equipo asociado
        $servicios = [
            // Impresoras (cualquier tipo)
            ['Diagnóstico de impresoras', 'impresora', 15000, 60, false],
            ['Revisión de cabezales', 'impresora', 25000, 45, false],
            ['Destape de cabezales', 'impresora', 45000, 90, true],
            ['Mantenimiento preventivo impresora', 'impresora', 55000, 120, true],
            ['Mantenimiento correctivo impresora', 'impresora', 80000, 180, true],
            ['Reparación de fuente de impresora', 'impresora', 65000, 90, true],
            ['Limpieza de rodillos', 'impresora', 30000, 60, false],
            ['Cambio de fusor', 'impresora', 95000, 90, true],
            // Computadores
            ['Mantenimiento preventivo PC', 'computador', 45000, 90, false],
            ['Mantenimiento correctivo PC', 'computador', 75000, 150, true],
            ['Instalación de SSD', 'computador', 35000, 45, true],
            ['Formateo e instalación de SO', 'computador', 40000, 60, false],
            ['Diagnóstico de PC', 'computador', 20000, 45, false],
            ['Limpieza interna y térmica', 'computador', 30000, 60, false],
            ['Cambio de pantalla portátil', 'computador', 60000, 90, true],
            ['Cambio de teclado portátil', 'computador', 35000, 45, true],
            // Celulares
            ['Diagnóstico de celular', 'celular', 15000, 30, false],
            ['Cambio de pantalla celular', 'celular', 50000, 75, true],
            ['Cambio de batería', 'celular', 25000, 30, true],
            ['Cambio de flex de carga', 'celular', 30000, 45, true],
            ['Cambio de cámara', 'celular', 35000, 45, true],
            ['Reparación de placa celular', 'celular', 90000, 180, true],
            // Redes
            ['Configuración de redes', 'redes', 60000, 120, false],
            ['Instalación de cámaras', 'redes', 45000, 90, true],
            ['Recuperación de equipos', 'computador', 50000, 120, false],
        ];

        $familiaATipo = [
            'impresora' => ['Impresora Láser', 'Impresora Láser Multifuncional', 'Impresora Tinta', 'Impresora Tinta Multifuncional'],
            'computador' => ['Computador de Mesa', 'Computador Portátil', 'Computador Todo en Uno'],
            'celular' => ['Celular'],
            'redes' => ['Otros'],
        ];

        foreach ($servicios as [$nombre, $familia, $precio, $tiempo, $reqRep]) {
            $tipoNombre = $familiaATipo[$familia][array_rand($familiaATipo[$familia])];
            $tipoId = $tipos[$tipoNombre] ?? null;

            SdServicio::firstOrCreate(
                ['tenant_id' => $this->tenant->id, 'nombre' => $nombre],
                [
                    'tipo_equipo_id' => $tipoId,
                    'codigo' => 'SRV-' . strtoupper(Str::slug($nombre, '')),
                    'descripcion' => $nombre,
                    'precio_base' => $precio,
                    'costo_tecnico_base' => round($precio * 0.45, 0),
                    'tipo_comision_tecnico' => 'fijo',
                    'tiempo_estimado' => $tiempo,
                    'requiere_repuestos' => $reqRep,
                    'activo' => true,
                ]
            );
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // 6. PRESTADORES (técnicos del taller)
    // ════════════════════════════════════════════════════════════════════════
    private function seedPrestadores(): void
    {
        $this->command->info('→ Prestadores (técnicos)…');

        $tecnicos = [
            ['Claudio Enrique Delgado', 'CC', '1037628945', 'CONTRATISTA', 45.00],
            ['Julián Andrés Ramírez', 'CC', '1020998877', 'CONTRATISTA', 50.00],
            ['Sandra Milena Rojas', 'CC', '52199456', 'COMISIONISTA', 40.00],
            ['Fabián Stiven Torres', 'CC', '1015544332', 'CONTRATISTA', 48.00],
            ['Nicolás Estrada', 'CC', '1144556677', 'FREELANCE', 35.00],
            ['Óscar Mauricio Loaiza', 'CC', '79888123', 'CONTRATISTA', 50.00],
            ['Valentina Gómez', 'CC', '1199887766', 'COMISIONISTA', 38.00],
        ];

        foreach ($tecnicos as [$nombre, $tdoc, $doc, $tipo, $comision]) {
            $userId = null;
            if ($nombre === 'Claudio Enrique Delgado') {
                $user = User::where('email', 'tecnico@miempresa.com')->first();
                $userId = $user?->id;
            }

            Prestador::updateOrCreate(
                ['tenant_id' => $this->tenant->id, 'numero_documento' => $doc],
                [
                    'tipo_documento' => $tdoc,
                    'nombre_completo' => $nombre,
                    'email' => Str::slug(explode(' ', $nombre)[0], '') . '@taller.com',
                    'telefono' => '3' . $this->fakerDigits(9),
                    'tipo_vinculacion' => $tipo,
                    'porcentaje_comision' => $comision,
                    'es_gratuito' => false,
                    'activo' => true,
                    'user_id' => $userId,
                ]
            );
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // 7. PROVEEDORES (30+)
    // ════════════════════════════════════════════════════════════════════════
    private function seedProveedores(): void
    {
        $this->command->info('→ Proveedores (30+)…');

        $plantilla = [
            ['TechColombia Mayoristas SAS', 'Mayoristas de tecnología'],
            ['Distribuidora Computecnica', 'Distribuidores de impresoras'],
            ['Importaciones Láser Andina', 'Distribuidores de repuestos'],
            ['Celulares del Pacífico', 'Distribuidores de celulares'],
            ['Consumibles y Tintas Ltda.', 'Distribuidores de consumibles'],
            ['Redes e Infraestructura SA', 'Distribuidores de redes'],
            ['Insumos Tecnológicos del Caribe', 'Mayoristas de tecnología'],
            ['Epson Distribuidor Autorizado Bogotá', 'Distribuidores de impresoras'],
            ['HP Premium Partner Colombia', 'Distribuidores de impresoras'],
            ['Brother Authorized Reseller', 'Distribuidores de impresoras'],
            ['Canon Business Partner', 'Distribuidores de impresoras'],
            ['Repuestos Samsung Mobile', 'Distribuidores de celulares'],
            ['Apple Service Provider BOG', 'Distribuidores de celulares'],
            ['Xiaomi Distribuciones LT', 'Distribuidores de celulares'],
            ['Partes HP Originales', 'Distribuidores de repuestos'],
            ['Repuestos Epson EcoTank', 'Distribuidores de repuestos'],
            ['Cabezales y Dampers Colombia', 'Distribuidores de repuestos'],
            ['Tóner y Cartuchos del Valle', 'Distribuidores de consumibles'],
            ['Tintas Comestibles y Técnicas', 'Distribuidores de consumibles'],
            ['Cisco Authorized Distributor', 'Distribuidores de redes'],
            ['MikroTik Colombia Networking', 'Distribuidores de redes'],
            ['Hikvision Vision Segura', 'Distribuidores de redes'],
            ['Dahua Surveillance Colombia', 'Distribuidores de redes'],
            ['Kingston Memory Partner', 'Mayoristas de tecnología'],
            ['Seagate Latin America', 'Mayoristas de tecnología'],
            ['WD Distribution LATAM', 'Mayoristas de tecnología'],
            ['Logitech Peripherals Andina', 'Mayoristas de tecnología'],
            ['Intel Channel Partner', 'Mayoristas de tecnología'],
            ['AMD Reseller Premium', 'Mayoristas de tecnología'],
            ['ASUS y MSI Colombia', 'Mayoristas de tecnología'],
            ['Insumos Otros Proveedores', 'Distribuidores de consumibles'],
            ['TecnoMarket Mayorista', 'Mayoristas de tecnología'],
        ];

        foreach ($plantilla as $i => [$razon, $tipo]) {
            $nit = '900' . str_pad((string)(100000 + $i), 6, '0', STR_PAD_LEFT) . '-' . ($i % 10);
            Proveedor::firstOrCreate(
                ['tenant_id' => $this->tenant->id, 'razon_social' => $razon],
                [
                    'tipo_documento' => 'NIT',
                    'numero_documento' => $nit,
                    'nombre_contacto' => $this->nombreAleatorio(),
                    'email' => 'compras@' . Str::slug($razon, '') . '.co',
                    'telefono' => '6' . $this->fakerDigits(6),
                    'direccion' => 'Av ' . (10 + $i) . ' #' . ($i * 3 + 5) . '-' . ($i + 11),
                    'ciudad' => self::CIUDADES[$i % count(self::CIUDADES)],
                    'notas' => $tipo,
                    'activo' => true,
                ]
            );
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // 8. PRODUCTOS (300+) — repartidos por categoría y marca
    // ════════════════════════════════════════════════════════════════════════
    private function seedProductos(): void
    {
        $this->command->info('→ Productos (300+)…');

        $marcas = Marca::where('tenant_id', $this->tenant->id)->pluck('id', 'nombre');
        $cats = Categoria::where('tenant_id', $this->tenant->id)->pluck('id', 'nombre');

        // Catálogo base: cada tupla = [nombre, marcaNombre, catSubNombre, costoBase]
        $base = [
            // ── Computadores ──
            ['Portátil HP Pavilion 15 i5', 'HP', 'Portátiles', 2350000],
            ['Portátil HP EliteBook 840', 'HP', 'Portátiles', 3450000],
            ['Portátil Lenovo IdeaPad 3', 'Lenovo', 'Portátiles', 1990000],
            ['Portátil Lenovo ThinkPad T480', 'Lenovo', 'Portátiles', 3990000],
            ['Portátil Dell Latitude 3420', 'Dell', 'Portátiles', 3650000],
            ['Portátil ASUS Vivobook 15', 'ASUS', 'Portátiles', 2150000],
            ['Portátil Acer Aspire 5', 'Acer', 'Portátiles', 2050000],
            ['Portátil MSI Modern 15', 'MSI', 'Portátiles', 3250000],
            ['MacBook Air M1', 'Apple', 'Portátiles', 5990000],
            ['MacBook Pro 14 M3', 'Apple', 'Portátiles', 9450000],
            ['Equipo de escritorio HP ProDesk', 'HP', 'Equipos de escritorio', 2350000],
            ['Equipo de escritorio Dell OptiPlex', 'Dell', 'Equipos de escritorio', 2550000],
            ['Equipo de escritorio Lenovo ThinkCentre', 'Lenovo', 'Equipos de escritorio', 2450000],
            ['CPU Gamer ASUS ROG', 'ASUS', 'Equipos de escritorio', 5990000],
            ['CPU Gamer MSI Infinite', 'MSI', 'Equipos de escritorio', 6250000],
            ['All In One HP 24', 'HP', 'All In One', 2650000],
            ['All In One Lenovo IdeaCentre', 'Lenovo', 'All In One', 2750000],
            ['All In One Dell Inspiron 24', 'Dell', 'All In One', 2850000],
            ['iMac 24" M3', 'Apple', 'All In One', 8990000],

            // ── Componentes ──
            ['Procesador Intel Core i5-13400', 'Intel', 'Procesadores', 980000],
            ['Procesador Intel Core i7-13700', 'Intel', 'Procesadores', 1690000],
            ['Procesador Intel Core i9-13900K', 'Intel', 'Procesadores', 2890000],
            ['Procesador AMD Ryzen 5 7600', 'AMD', 'Procesadores', 1050000],
            ['Procesador AMD Ryzen 7 7700X', 'AMD', 'Procesadores', 1590000],
            ['Procesador AMD Ryzen 9 7950X', 'AMD', 'Procesadores', 2850000],
            ['Memoria RAM Kingston 8GB DDR4', 'Kingston', 'Memorias RAM', 95000],
            ['Memoria RAM Kingston 16GB DDR4', 'Kingston', 'Memorias RAM', 185000],
            ['Memoria RAM Kingston 32GB DDR5', 'Kingston', 'Memorias RAM', 395000],
            ['Memoria RAM Crucial 8GB DDR4', 'Crucial', 'Memorias RAM', 92000],
            ['Memoria RAM Crucial 16GB DDR4', 'Crucial', 'Memorias RAM', 178000],
            ['Memoria RAM Crucial 32GB DDR5', 'Crucial', 'Memorias RAM', 389000],
            ['SSD Kingston 480GB SATA', 'Kingston', 'Discos SSD', 145000],
            ['SSD Kingston 1TB NVMe', 'Kingston', 'Discos SSD', 315000],
            ['SSD Crucial 500GB MX', 'Crucial', 'Discos SSD', 165000],
            ['SSD Crucial 1TB P3', 'Crucial', 'Discos SSD', 305000],
            ['SSD WD Black 1TB SN770', 'Western Digital', 'Discos SSD', 345000],
            ['SSD Samsung 870 EVO 1TB', 'Samsung', 'Discos SSD', 365000],
            ['HDD Seagate Barracuda 1TB', 'Seagate', 'Discos HDD', 135000],
            ['HDD Seagate Barracuda 2TB', 'Seagate', 'Discos HDD', 205000],
            ['HDD WD Blue 1TB', 'Western Digital', 'Discos HDD', 135000],
            ['HDD WD Red 4TB NAS', 'Western Digital', 'Discos HDD', 545000],
            ['Fuente de poder Corsair 600W', 'Logitech', 'Fuentes de poder', 195000],
            ['Fuente de poder EVGA 750W', 'Logitech', 'Fuentes de poder', 285000],
            ['Tarjeta madre ASUS Prime B760', 'ASUS', 'Tarjetas madre', 685000],
            ['Tarjeta madre MSI PRO B650', 'MSI', 'Tarjetas madre', 725000],
            ['Tarjeta madre Gigabyte A620', 'MSI', 'Tarjetas madre', 545000],
            ['Tarjeta de video ASUS RTX 4060', 'ASUS', 'Tarjetas de video', 1850000],
            ['Tarjeta de video MSI RTX 4070', 'MSI', 'Tarjetas de video', 2650000],

            // ── Impresoras ──
            ['Impresora HP LaserJet M1132', 'HP', 'Láser', 890000],
            ['Impresora HP LaserJet Pro M404', 'HP', 'Láser', 1090000],
            ['Impresora Brother HL-L3210CW', 'Brother', 'Láser', 1250000],
            ['Impresora Brother MFC color', 'Brother', 'Láser', 1690000],
            ['Impresora Canon imageCLASS', 'Canon', 'Láser', 1290000],
            ['Multifuncional HP LaserJet M227fdw', 'HP', 'Láser', 1390000],
            ['Impresora Epson EcoTank L3110', 'Epson', 'Inyección de tinta', 685000],
            ['Impresora Epson EcoTank L3150', 'Epson', 'Inyección de tinta', 745000],
            ['Impresora Epson EcoTank L4150', 'Epson', 'Inyección de tinta', 895000],
            ['Impresora HP Smart Tank 515', 'HP', 'Inyección de tinta', 815000],
            ['Impresora HP Smart Tank 615', 'HP', 'Inyección de tinta', 945000],
            ['Impresora Canon PIXMA G3310', 'Canon', 'Inyección de tinta', 745000],
            ['Impresora Brother DCP tinta', 'Brother', 'Inyección de tinta', 845000],
            ['Impresora térmica Zebra GC420T', 'Samsung', 'Térmicas', 1290000],
            ['Impresora térmica Epson TM-T20', 'Epson', 'Térmicas', 1150000],
            ['Impresora matricial Epson FX-890', 'Epson', 'Matriciales', 1850000],
            ['Impresora matricial OKI MICROLINE', 'Samsung', 'Matriciales', 1750000],

            // ── Repuestos de Impresoras ──
            ['Cabezal Epson L3110 original', 'Epson', 'Cabezales', 165000],
            ['Cabezal Epson L4150 original', 'Epson', 'Cabezales', 185000],
            ['Cabezal HP Smart Tank 515', 'HP', 'Cabezales', 175000],
            ['Cabezal Brother tinta', 'Brother', 'Cabezales', 195000],
            ['Cabezal Canon MAXIFY', 'Canon', 'Cabezales', 195000],
            ['Damper Epson L3110', 'Epson', 'Dampers', 18500],
            ['Damper Epson L4150', 'Epson', 'Dampers', 19500],
            ['Damper universal EcoTank', 'Epson', 'Dampers', 22500],
            ['Bomba de limpieza Epson', 'Epson', 'Bombas', 28500],
            ['Bomba de limpieza HP Smart Tank', 'HP', 'Bombas', 30500],
            ['Motor de arrastre HP LaserJet', 'HP', 'Motores', 125000],
            ['Motor de papel Brother', 'Brother', 'Motores', 115000],
            ['Encoder Epson L3110', 'Epson', 'Encoders', 22500],
            ['Encoder HP Smart Tank', 'HP', 'Encoders', 23500],
            ['Tarjeta lógica Epson L3110', 'Epson', 'Tarjetas lógicas', 235000],
            ['Tarjeta lógica HP LaserJet', 'HP', 'Tarjetas lógicas', 285000],
            ['Tarjeta lógica Brother HL', 'Brother', 'Tarjetas lógicas', 275000],
            ['Sensor de papel Epson', 'Epson', 'Sensores', 25500],
            ['Sensor óptico HP', 'HP', 'Sensores', 27500],
            ['Rodillo de arrastre Epson', 'Epson', 'Rodillos', 19500],
            ['Rodillo de arrastre HP', 'HP', 'Rodillos', 21500],
            ['Rodillo pickup Brother', 'Brother', 'Rodillos', 23500],
            ['Fusor HP LaserJet M1132', 'HP', 'Fusores', 285000],
            ['Fusor Brother HL-L3210CW', 'Brother', 'Fusores', 325000],
            ['Fusor Canon imageCLASS', 'Canon', 'Fusores', 305000],

            // ── Consumibles ──
            ['Tinta Epson T544 negra 600ml', 'Epson', 'Tintas', 125000],
            ['Tinta Epson T544 cian', 'Epson', 'Tintas', 125000],
            ['Tinta Epson T544 magenta', 'Epson', 'Tintas', 125000],
            ['Tinta Epson T544 amarilla', 'Epson', 'Tintas', 125000],
            ['Tinta Epson 664 negra', 'Epson', 'Tintas', 58000],
            ['Tinta Epson 664 color set', 'Epson', 'Tintas', 215000],
            ['Tinta HP GT52 negra', 'HP', 'Tintas', 78000],
            ['Tinta HP GT53XL negra', 'HP', 'Tintas', 125000],
            ['Tinta HP GT52 color set', 'HP', 'Tintas', 235000],
            ['Tinta Canon GI-20 negra', 'Canon', 'Tintas', 68000],
            ['Tinta Canon GI-20 color set', 'Canon', 'Tintas', 205000],
            ['Tóner HP 83A negro', 'HP', 'Tóner', 285000],
            ['Tóner HP 35A negro', 'HP', 'Tóner', 245000],
            ['Tóner Brother TN-820 negro', 'Brother', 'Tóner', 265000],
            ['Tóner Canon 052 negro', 'Canon', 'Tóner', 275000],
            ['Tóner Samsung MLT-D101', 'Samsung', 'Tóner', 255000],
            ['Cartuchos HP 664', 'HP', 'Cartuchos', 75000],
            ['Cartuchos Canon PG-445', 'Canon', 'Cartuchos', 78000],
            ['Cartuchos Epson T544', 'Epson', 'Cartuchos', 88000],
            ['Botella de tinta Epson 504', 'Epson', 'Botellas de tinta', 58000],
            ['Botella de tinta HP GT53', 'HP', 'Botellas de tinta', 62000],
            ['Botella de tinta Canon GI-20', 'Canon', 'Botellas de tinta', 56000],

            // ── Celulares ──
            ['Pantalla Samsung Galaxy S24', 'Samsung', 'Pantallas', 425000],
            ['Pantalla Samsung Galaxy A52', 'Samsung', 'Pantallas', 235000],
            ['Pantalla iPhone 15 Pro', 'Apple', 'Pantallas', 685000],
            ['Pantalla iPhone 13', 'Apple', 'Pantallas', 445000],
            ['Pantalla Xiaomi Redmi Note 12', 'Samsung', 'Pantallas', 165000],
            ['Pantalla Motorola Moto G', 'Samsung', 'Pantallas', 145000],
            ['Batería Samsung Galaxy S24', 'Samsung', 'Baterías', 125000],
            ['Batería iPhone 15 Pro', 'Apple', 'Baterías', 165000],
            ['Batería iPhone 13', 'Apple', 'Baterías', 125000],
            ['Batería Xiaomi Redmi Note 12', 'Samsung', 'Baterías', 75000],
            ['Flex de carga Samsung Galaxy S24', 'Samsung', 'Flex', 65000],
            ['Flex de carga iPhone 15', 'Apple', 'Flex', 85000],
            ['Flex de carga Xiaomi Redmi', 'Samsung', 'Flex', 35000],
            ['Cámara Samsung Galaxy S24 principal', 'Samsung', 'Cámaras', 185000],
            ['Cámara iPhone 15 Pro principal', 'Apple', 'Cámaras', 345000],
            ['Cámara frontal Xiaomi', 'Samsung', 'Cámaras', 55000],
            ['Conector de carga Samsung tipo C', 'Samsung', 'Conectores de carga', 35000],
            ['Conector de carga iPhone 15', 'Apple', 'Conectores de carga', 55000],
            ['Conector de carga Xiaomi', 'Samsung', 'Conectores de carga', 18000],

            // ── Redes ──
            ['Router TP-Link Archer C80', 'TP-Link', 'Routers', 165000],
            ['Router TP-Link Archer AX55', 'TP-Link', 'Routers', 285000],
            ['Router MikroTik hAP ac2', 'MikroTik', 'Routers', 345000],
            ['Router Cisco RV340', 'Cisco', 'Routers', 985000],
            ['Switch TP-Link TL-SG1008D 8 puertos', 'TP-Link', 'Switches', 125000],
            ['Switch TP-Link TL-SG1024D 24 puertos', 'TP-Link', 'Switches', 345000],
            ['Switch Cisco SG250-24', 'Cisco', 'Switches', 1285000],
            ['Switch MikroTik CRS328-24P', 'MikroTik', 'Switches', 1485000],
            ['Access Point UniFi U6-Lite', 'Ubiquiti', 'Access Points', 385000],
            ['Access Point UniFi U6-Pro', 'Ubiquiti', 'Access Points', 645000],
            ['Access Point TP-Link EAP670', 'TP-Link', 'Access Points', 425000],
            ['Cable UTP Cat6 caja 305m', 'TP-Link', 'Cables', 485000],
            ['Cable UTP Cat6E 100m', 'TP-Link', 'Cables', 185000],
            ['Cable Fibra Óptica OS2 1km', 'Cisco', 'Cables', 985000],
            ['Antena Ubiquiti airMAX NanoStation', 'Ubiquiti', 'Antenas', 285000],
            ['Antena sectorial MikroTik', 'MikroTik', 'Antenas', 425000],
            ['Cámara Hikvision DS-2CE16D0T 2MP', 'Hikvision', 'Antenas', 95000],
            ['Cámara Hikvision DS-2DE4225IW-DE PTZ', 'Hikvision', 'Antenas', 1285000],
            ['Cámara Dahua IPC-HFW1230S 4MP', 'Dahua', 'Antenas', 145000],
            ['DVR Hikvision 8 canales', 'Hikvision', 'Antenas', 485000],
            ['NVR Dahua 16 canales', 'Dahua', 'Antenas', 885000],
        ];

        $creados = 0;
        $contador = 1;
        foreach ($base as [$nombre, $marcaNom, $catNom, $costo]) {
            $marcaId = $marcas[$marcaNom] ?? null;
            $catId = $cats[$catNom] ?? null;
            $sku = 'PRD-' . str_pad((string)$contador, 5, '0', STR_PAD_LEFT);

            Producto::firstOrCreate(
                ['tenant_id' => $this->tenant->id, 'codigo' => $sku],
                [
                    'nombre' => $nombre,
                    'descripcion' => "{$nombre} - {$marcaNom}",
                    'categoria_id' => $catId,
                    'marca_id' => $marcaId,
                    'unidad_medida' => 'unidad',
                    'precio_venta' => (int) round($costo * 1.30), // 30% markup
                    'costo_promedio' => $costo,
                    'stock_actual' => rand(2, 40),
                    'stock_minimo' => rand(2, 8),
                    'is_active' => true,
                ]
            );
            $creados++;
            $contador++;
        }

        // Rellenar hasta 300 con variantes adicionales (series de repuestos y consumibles)
        $nombresBase = ['Cabezal', 'Damper', 'Bomba', 'Rodillo', 'Sensor', 'Flex', 'Pantalla', 'Batería', 'Tinta', 'Tóner'];
        $marcasArr = $marcas->keys()->all();
        $catsArr = ['Cabezales', 'Dampers', 'Bombas', 'Rodillos', 'Sensores', 'Flex', 'Pantallas', 'Baterías', 'Tintas', 'Tóner'];
        while ($creados < 320) {
            $nb = $nombresBase[array_rand($nombresBase)];
            $marcaNom = $marcasArr[array_rand($marcasArr)];
            $catNom = $catsArr[array_rand($catsArr)];
            $nombre = "{$nb} {$marcaNom} modelo MK-" . $creados;
            $costo = rand(15000, 280000);
            $sku = 'PRD-' . str_pad((string)$contador, 5, '0', STR_PAD_LEFT);
            Producto::firstOrCreate(
                ['tenant_id' => $this->tenant->id, 'codigo' => $sku],
                [
                    'nombre' => $nombre,
                    'descripcion' => "{$nombre}",
                    'categoria_id' => $cats[$catNom] ?? null,
                    'marca_id' => $marcas[$marcaNom] ?? null,
                    'unidad_medida' => 'unidad',
                    'precio_venta' => (int) round($costo * 1.28),
                    'costo_promedio' => $costo,
                    'stock_actual' => rand(0, 25),
                    'stock_minimo' => rand(2, 6),
                    'is_active' => true,
                ]
            );
            $creados++;
            $contador++;
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // 9. CLIENTES (100+)
    // ════════════════════════════════════════════════════════════════════════
    private function seedClientes(): void
    {
        $this->command->info('→ Clientes (100+)…');

        $nombresNat = ['Juan', 'María', 'Carlos', 'Andrés', 'Luis', 'Camila', 'Daniela', 'Felipe', 'Santiago', 'Valentina', 'Paola', 'Diego', 'Laura', 'Sebastián', 'Natalia', 'Óscar', 'Patricia', 'Fabián', 'Andrea', 'Julián'];
        $apellidosNat = ['Pérez', 'Gómez', 'Rodríguez', 'García', 'Martínez', 'López', 'Sánchez', 'Ramírez', 'Torres', 'Díaz', 'Rojas', 'Moreno', 'Muñoz', 'Hernández', 'Vargas', 'Castro', 'Jiménez', 'Suárez', 'Ortiz', 'Mendoza'];

        $razonesJur = [
            'Tecnología Avanzada SAS', 'Colegio San Bartolomé', 'Colegio Nuevo Chile', 'Gimnasio Campestre Norte',
            'Oficina Jurídica López y Asoc.', 'Clínica Dental Sonrisas', 'Distribuidora El Sol', 'Inmobiliaria Los Andes',
            'Café Internet La Esquina', 'Ciber Café Master', 'Taller Eléctrico del Centro', 'Papelería Creative',
            'Condominio Reservas Norte', 'Restaurante La fogata', 'Tienda de Zapatos Moda City', 'Salón de Belleza Estilo',
            'Ferromax Ferretería', 'Constructora Horizonte', 'Estudio de Diseño Creativo', 'Transportes Express',
            'Farmacia La Salud', 'Floristería Garden', 'Veterinaria Pet\'s Home', 'Boutique Elite',
            'Hotel Colonial', 'Motel Las Palmeras', 'Discoteca The Wall', 'Gimnasio Muscle Gym',
            'Negocios pequeños varios SAS', 'Consultoría Business Tech', 'Startup devCO', 'Empresa mediana Comercio',
        ];

        // Personas naturales (~60)
        for ($i = 0; $i < 60; $i++) {
            $n = $nombresNat[array_rand($nombresNat)];
            $a = $apellidosNat[array_rand($apellidosNat)];
            $doc = (string) rand(10000000, 1199999999);
            Cliente::firstOrCreate(
                ['tenant_id' => $this->tenant->id, 'numero_documento' => $doc],
                [
                    'tipo' => 'natural',
                    'tipo_documento' => 'CC',
                    'nombres' => $n,
                    'apellidos' => $a,
                    'email' => Str::slug($n . $a, '') . rand(1, 99) . '@gmail.com',
                    'telefono' => '3' . $this->fakerDigits(9),
                    'direccion' => 'Cl ' . rand(1, 200) . ' #' . rand(1, 100) . '-' . rand(1, 99),
                    'ciudad' => self::CIUDADES[array_rand(self::CIUDADES)],
                    'notas' => 'Cliente natural',
                    'activo' => true,
                ]
            );
        }

        // Jurídicas (~40)
        foreach ($razonesJur as $i => $razon) {
            $nit = '900' . str_pad((string)(200000 + $i), 6, '0', STR_PAD_LEFT) . '-' . (($i + 2) % 10);
            Cliente::firstOrCreate(
                ['tenant_id' => $this->tenant->id, 'nit' => $nit],
                [
                    'tipo' => 'juridico',
                    'razon_social' => $razon,
                    'nombre_contacto' => $this->nombreAleatorio(),
                    'telefono_contacto' => '3' . $this->fakerDigits(9),
                    'cargo_contacto' => ['Gerente', 'Coordinador TI', 'Asistente administrativa', 'Rector', 'Director'][array_rand([0, 1, 2, 3, 4])],
                    'email' => 'contacto@' . Str::slug($razon, '') . '.co',
                    'telefono' => '6' . $this->fakerDigits(6),
                    'direccion' => 'Av ' . rand(1, 50) . ' #' . rand(1, 100) . '-' . rand(10, 90),
                    'ciudad' => self::CIUDADES[$i % count(self::CIUDADES)],
                    'notas' => 'Cliente jurídico',
                    'activo' => true,
                ]
            );
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // 10. COMPRAS (a proveedores) + recepciones + kardex
    // ════════════════════════════════════════════════════════════════════════
    private function seedCompras(): void
    {
        $this->command->info('→ Compras + recepciones + kardex…');

        $proveedores = Proveedor::where('tenant_id', $this->tenant->id)->get();
        $productos = Producto::where('tenant_id', $this->tenant->id)->get();
        $user = $this->adminUser;

        for ($i = 1; $i <= 40; $i++) {
            $proveedor = $proveedores->random();
            $fecha = now()->subDays(rand(10, 365));
            $subtotal = 0;
            $items = [];
            $numItems = rand(2, 6);
            $seleccionados = $productos->random($numItems);

            foreach ($seleccionados as $p) {
                $cant = rand(5, 30);
                $precio = (float) $p->costo_promedio;
                $st = $cant * $precio;
                $items[] = [$p, $cant, $precio, $st];
                $subtotal += $st;
            }
            $impuestos = round($subtotal * 0.19, 2);
            $total = $subtotal + $impuestos;
            $numero = 'OC-' . str_pad((string)$i, 5, '0', STR_PAD_LEFT);

            $orden = OrdenCompra::firstOrCreate(
                ['tenant_id' => $this->tenant->id, 'numero' => $numero],
                [
                    'proveedor_id' => $proveedor->id,
                    'estado' => 'recibida',
                    'fecha_emision' => $fecha->toDateString(),
                    'fecha_esperada' => $fecha->copy()->addDays(7)->toDateString(),
                    'subtotal' => $subtotal,
                    'impuestos' => $impuestos,
                    'total' => $total,
                    'notas' => 'Compra histórica de stock inicial',
                ]
            );

            foreach ($items as [$p, $cant, $precio, $st]) {
                DB::table('purchasing_orden_detalles')->updateOrInsert(
                    ['orden_compra_id' => $orden->id, 'producto_id' => $p->id],
                    [
                        'cantidad' => $cant,
                        'precio_unitario' => $precio,
                        'subtotal' => $st,
                        'updated_at' => now(),
                    ]
                );
            }

            // Recepción asociada + movimiento de kardex (entrada inicial)
            $numRec = 'REC-' . str_pad((string)$i, 5, '0', STR_PAD_LEFT);
            $recepcionId = DB::table('inventory_recepciones')->insertGetId([
                'tenant_id' => $this->tenant->id,
                'orden_compra_id' => $orden->id,
                'bodega_id' => $this->bodega->id,
                'numero' => $numRec,
                'fecha' => $fecha->copy()->addDays(2)->toDateString(),
                'notas' => 'Recepción automática de OC ' . $numero,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($items as [$p, $cant, $precio, $st]) {
                DB::table('inventory_recepcion_detalles')->insert([
                    'recepcion_id' => $recepcionId,
                    'producto_id' => $p->id,
                    'cantidad' => $cant,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Stock en bodega principal (PostgreSQL-safe)
                $existing = DB::table('inventory_stocks')
                    ->where('producto_id', $p->id)
                    ->where('bodega_id', $this->bodega->id)
                    ->first();
                if ($existing) {
                    DB::table('inventory_stocks')
                        ->where('id', $existing->id)
                        ->update(['cantidad' => $existing->cantidad + $cant, 'updated_at' => now()]);
                } else {
                    DB::table('inventory_stocks')->insert([
                        'producto_id' => $p->id,
                        'bodega_id' => $this->bodega->id,
                        'cantidad' => $cant,
                        'updated_at' => now(),
                    ]);
                }

                // Kardex entrada
                DB::table('inventory_adjustments')->insert([
                    'tenant_id' => $this->tenant->id,
                    'producto_id' => $p->id,
                    'pack_id' => null,
                    'bodega_id' => $this->bodega->id,
                    'tipo' => 'entrada',
                    'cantidad' => $cant,
                    'factor_conversion' => 1,
                    'cantidad_base' => $cant,
                    'costo_unitario' => $precio,
                    'observaciones' => 'Entrada por recepción ' . $numRec,
                    'referencia_type' => 'recepcion',
                    'referencia_id' => $recepcionId,
                    'created_by' => $user->id,
                    'created_at' => $fecha->copy()->addDays(2),
                    'updated_at' => $fecha->copy()->addDays(2),
                ]);
            }
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // Utilidades
    // ════════════════════════════════════════════════════════════════════════
    private function fakerDigits(int $n): string
    {
        $s = '';
        for ($i = 0; $i < $n; $i++) $s .= (string) rand(0, 9);
        return $s;
    }

    private function nombreAleatorio(): string
    {
        $nombres = ['Carlos', 'María', 'Andrés', 'Laura', 'Felipe', 'Daniela', 'Santiago', 'Camila'];
        $apellidos = ['Pérez', 'Gómez', 'Rodríguez', 'García', 'López', 'Sánchez'];
        return $nombres[array_rand($nombres)] . ' ' . $apellidos[array_rand($apellidos)];
    }

    private function imprimirResumen(): void
    {
        $t = $this->tenant->id;
        $cuentas = [
            'Sedes' => Sede::where('tenant_id', $t)->count(),
            'Bodegas' => Bodega::where('tenant_id', $t)->count(),
            'Configuraciones' => Configuracion::where('tenant_id', $t)->count(),
            'Usuarios (tenant)' => User::where('tenant_id', $t)->count(),
            'Marcas (inv)' => Marca::where('tenant_id', $t)->count(),
            'Categorías (inv)' => Categoria::where('tenant_id', $t)->count(),
            'Productos' => Producto::where('tenant_id', $t)->count(),
            'Servicios taller' => SdServicio::where('tenant_id', $t)->count(),
            'Prestadores' => Prestador::where('tenant_id', $t)->count(),
            'Clientes' => Cliente::where('tenant_id', $t)->count(),
            'Proveedores' => Proveedor::where('tenant_id', $t)->count(),
            'Órdenes de compra' => OrdenCompra::where('tenant_id', $t)->count(),
            'Recepciones' => DB::table('inventory_recepciones')->where('tenant_id', $t)->count(),
            'Kardex (adjustments)' => DB::table('inventory_adjustments')->where('tenant_id', $t)->count(),
        ];
        $this->command->info('───── RESUMEN DE DATOS CREADOS ─────');
        foreach ($cuentas as $k => $v) {
            $this->command->info(sprintf('  %-22s %6d', $k, $v));
        }
    }
}
