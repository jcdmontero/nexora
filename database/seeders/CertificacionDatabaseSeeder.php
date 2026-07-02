<?php

namespace Database\Seeders;

use App\Core\Models\Sede;
use App\Core\Models\Tenant;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Inventory\Models\Bodega;
use App\Modules\Inventory\Models\Categoria;
use App\Modules\Inventory\Models\Marca;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Purchasing\Models\Proveedor;
use App\Modules\ServiceDesk\Models\Prestador;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;
use Spatie\Permission\Models\Role;

class CertificacionDatabaseSeeder extends Seeder
{
    private Tenant $tenant;
    private $faker;

    public function run(): void
    {
        $this->command->info('=== CertificacionDatabaseSeeder: Iniciando ===');
        $this->faker = Faker::create('es_CO');

        // Llamar al seeder base para permisos, modulos y roles por defecto
        $this->call(DatabaseSeeder::class);

        // Tomar el primer tenant o crearlo
        $this->tenant = Tenant::first() ?? Tenant::create(['name' => 'Nexora Test', 'slug' => 'nexora', 'domain' => 'nexora.test']);

        $this->seedUsersAndRoles();
        $this->seedInfraestructura();
        $this->seedCatalogosInventory();
        $this->seedClientes();
        $this->seedProveedores();
        $this->seedProductos();
        $this->seedTaller();

        $this->command->info('=== CertificacionDatabaseSeeder: Completo ===');
    }

    private function seedUsersAndRoles(): void
    {
        $this->command->info('→ Creando Roles y Usuarios para Certificación...');
        
        $roles = [
            'admin' => 'ADMIN_EMPRESA',
            'gerente' => 'GERENTE',
            'vendedor' => 'VENDEDOR',
            'cajero' => 'CAJERO',
            'tecnico' => 'TECNICO',
            'contador' => 'CONTADOR',
            'rrhh' => 'RRHH'
        ];

        // Ensure roles exist for the tenant
        setPermissionsTeamId($this->tenant->id);

        foreach ($roles as $key => $roleName) {
            Role::firstOrCreate([
                'name' => $roleName,
                'team_id' => $this->tenant->id,
                'guard_name' => 'web'
            ]);

            $user = User::firstOrCreate(
                ['email' => "{$key}@certificacion.com"],
                [
                    'name' => "User {$roleName}",
                    'password' => Hash::make('password'),
                    'tenant_id' => $this->tenant->id,
                    'is_active' => true,
                ]
            );
            
            if (!$user->hasRole($roleName)) {
                $user->assignRole($roleName);
            }
        }
        
        // Generar 30 empleados adicionales
        for ($i = 0; $i < 30; $i++) {
            User::firstOrCreate(
                ['email' => "empleado{$i}@certificacion.com"],
                [
                    'name' => $this->faker->name,
                    'password' => Hash::make('password'),
                    'tenant_id' => $this->tenant->id,
                    'is_active' => true,
                ]
            );
        }
    }

    private function seedInfraestructura(): void
    {
        $this->command->info('→ Infraestructura (Sedes, Bodegas)...');

        $sede = Sede::firstOrCreate(
            ['tenant_id' => $this->tenant->id, 'nombre' => 'Sede Certificación'],
            ['direccion' => 'Calle Falsa 123', 'es_principal' => true, 'activo' => true]
        );

        Bodega::firstOrCreate(
            ['tenant_id' => $this->tenant->id, 'nombre' => 'Bodega Certificación'],
            ['sede_id' => $sede->id, 'direccion' => 'Calle Falsa 123', 'es_principal' => true, 'activo' => true]
        );
    }

    private function seedCatalogosInventory(): void
    {
        $this->command->info('→ Categorías y Marcas...');
        for ($i = 1; $i <= 10; $i++) {
            Categoria::firstOrCreate(['tenant_id' => $this->tenant->id, 'nombre' => "Categoría Cert $i"]);
            Marca::firstOrCreate(['tenant_id' => $this->tenant->id, 'nombre' => "Marca Cert $i"]);
        }
    }

    private function seedClientes(): void
    {
        $this->command->info('→ Clientes (50)...');
        for ($i = 1; $i <= 50; $i++) {
            Cliente::firstOrCreate(
                ['tenant_id' => $this->tenant->id, 'nit' => "900000{$i}"],
                [
                    'tipo' => 'juridico',
                    'razon_social' => $this->faker->company,
                    'email' => "cliente{$i}@example.com",
                    'telefono' => $this->faker->phoneNumber,
                    'direccion' => $this->faker->address,
                    'ciudad' => $this->faker->city,
                ]
            );
        }
    }

    private function seedProveedores(): void
    {
        $this->command->info('→ Proveedores (20)...');
        for ($i = 1; $i <= 20; $i++) {
            Proveedor::firstOrCreate(
                ['tenant_id' => $this->tenant->id, 'numero_documento' => "800000{$i}"],
                [
                    'tipo_documento' => 'NIT',
                    'razon_social' => $this->faker->company,
                    'email' => "proveedor{$i}@example.com",
                    'telefono' => $this->faker->phoneNumber,
                ]
            );
        }
    }

    private function seedProductos(): void
    {
        $this->command->info('→ Productos (300)...');
        $categorias = Categoria::where('tenant_id', $this->tenant->id)->pluck('id')->toArray();
        $marcas = Marca::where('tenant_id', $this->tenant->id)->pluck('id')->toArray();

        for ($i = 1; $i <= 300; $i++) {
            Producto::firstOrCreate(
                ['tenant_id' => $this->tenant->id, 'codigo' => "PROD-CERT-{$i}"],
                [
                    'nombre' => "Producto Certificación {$i}",
                    'categoria_id' => $this->faker->randomElement($categorias),
                    'marca_id' => $this->faker->randomElement($marcas),
                    'precio_venta' => $this->faker->numberBetween(1000, 100000),
                    'costo_promedio' => $this->faker->numberBetween(500, 50000),
                    'is_active' => true,
                ]
            );
        }
    }

    private function seedTaller(): void
    {
        $this->command->info('→ Técnicos (10)...');
        $users = User::where('tenant_id', $this->tenant->id)->get();
        for ($i = 1; $i <= 10; $i++) {
            $u = $users->random();
            Prestador::firstOrCreate(
                ['tenant_id' => $this->tenant->id, 'user_id' => $u->id],
                [
                    'nombre_completo' => $u->name,
                    'tipo_vinculacion' => 'CONTRATISTA',
                    'activo' => true
                ]
            );
        }
    }
}
