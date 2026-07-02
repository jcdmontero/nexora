<?php
namespace App\Modules\ServiceDesk\Services;

use App\Core\Models\Tenant;
use App\Modules\ServiceDesk\Models\ChecklistItem;
use App\Modules\ServiceDesk\Models\Marca;
use App\Modules\ServiceDesk\Models\Modelo;
use App\Modules\ServiceDesk\Models\TipoEquipo;

/**
 * Siembra los catálogos base del taller (tipos de equipo, marcas, modelos y
 * checklists de recepción) para una empresa. Idempotente (updateOrCreate),
 * de modo que el cliente arranca con una base lista y solo agrega lo que falte.
 *
 * Se ejecuta automáticamente al activar el módulo service-desk (ModuleActivator).
 */
class CatalogoTallerProvisioner
{
    public function provisionForTenant(Tenant $tenant): void
    {
        $tid = $tenant->id;

        $this->seedTipos($tid);
        $this->seedMarcas($tid);
        $this->seedModelos($tid);
        $this->seedChecklists($tid);
    }

    private function seedTipos(int $tid): void
    {
        $tipos = [
            ['nombre' => 'Impresora Láser', 'slug' => 'impresora-laser', 'familia' => 'impresora'],
            ['nombre' => 'Impresora Láser Multifuncional', 'slug' => 'impresora-laser-multifuncional', 'familia' => 'impresora'],
            ['nombre' => 'Impresora Tinta', 'slug' => 'impresora-tinta', 'familia' => 'impresora'],
            ['nombre' => 'Impresora Tinta Multifuncional', 'slug' => 'impresora-tinta-multifuncional', 'familia' => 'impresora'],
            ['nombre' => 'Computador de Mesa', 'slug' => 'computador-mesa', 'familia' => 'computador'],
            ['nombre' => 'Computador Portátil', 'slug' => 'computador-portatil', 'familia' => 'computador'],
            ['nombre' => 'Computador Todo en Uno', 'slug' => 'computador-todo-en-uno', 'familia' => 'computador'],
            ['nombre' => 'Celular', 'slug' => 'celular', 'familia' => 'celular'],
            ['nombre' => 'Tablet', 'slug' => 'tablet', 'familia' => 'tablet'],
            ['nombre' => 'Monitor', 'slug' => 'monitor', 'familia' => 'monitor'],
            ['nombre' => 'Proyector', 'slug' => 'proyector', 'familia' => 'proyector'],
            ['nombre' => 'Consola', 'slug' => 'consola', 'familia' => 'consola'],
            ['nombre' => 'Otro', 'slug' => 'otro', 'familia' => 'otro'],
        ];

        foreach ($tipos as $t) {
            TipoEquipo::updateOrCreate(
                ['tenant_id' => $tid, 'nombre' => $t['nombre']],
                ['tenant_id' => $tid, 'slug' => $t['slug'], 'familia' => $t['familia'], 'activo' => true],
            );
        }
    }

    private function seedMarcas(int $tid): void
    {
        $marcas = [
            'HP', 'Lenovo', 'Dell', 'Asus', 'Acer', 'Apple', 'MSI', 'Epson', 'Brother', 'Canon',
            'Samsung', 'Xiaomi', 'Motorola', 'Huawei', 'Sony', 'Microsoft', 'Nintendo', 'LG', 'BenQ', 'ViewSonic',
        ];
        foreach ($marcas as $nombre) {
            Marca::updateOrCreate(
                ['tenant_id' => $tid, 'nombre' => $nombre],
                ['tenant_id' => $tid, 'activo' => true],
            );
        }
    }

    private function seedModelos(int $tid): void
    {
        $modelos = [
            ['nombre' => 'OptiPlex 3080', 'marca' => 'Dell', 'tipo' => 'Computador de Mesa'],
            ['nombre' => 'ProDesk 400', 'marca' => 'HP', 'tipo' => 'Computador de Mesa'],
            ['nombre' => 'ThinkCentre M720', 'marca' => 'Lenovo', 'tipo' => 'Computador de Mesa'],
            ['nombre' => 'Pavilion 15', 'marca' => 'HP', 'tipo' => 'Computador Portátil'],
            ['nombre' => 'EliteBook 840', 'marca' => 'HP', 'tipo' => 'Computador Portátil'],
            ['nombre' => 'ThinkPad T480', 'marca' => 'Lenovo', 'tipo' => 'Computador Portátil'],
            ['nombre' => 'IdeaPad 3', 'marca' => 'Lenovo', 'tipo' => 'Computador Portátil'],
            ['nombre' => 'Latitude 3420', 'marca' => 'Dell', 'tipo' => 'Computador Portátil'],
            ['nombre' => 'MacBook Air M1', 'marca' => 'Apple', 'tipo' => 'Computador Portátil'],
            ['nombre' => 'iMac 24"', 'marca' => 'Apple', 'tipo' => 'Computador Todo en Uno'],
            ['nombre' => 'HP All-in-One 24', 'marca' => 'HP', 'tipo' => 'Computador Todo en Uno'],
            ['nombre' => 'Dell Inspiron 24 AIO', 'marca' => 'Dell', 'tipo' => 'Computador Todo en Uno'],
            ['nombre' => 'Lenovo IdeaCentre AIO', 'marca' => 'Lenovo', 'tipo' => 'Computador Todo en Uno'],
            ['nombre' => 'LaserJet M1132', 'marca' => 'HP', 'tipo' => 'Impresora Láser'],
            ['nombre' => 'HL-L3210CW', 'marca' => 'Brother', 'tipo' => 'Impresora Láser'],
            ['nombre' => 'LaserJet MFP M227fdw', 'marca' => 'HP', 'tipo' => 'Impresora Láser Multifuncional'],
            ['nombre' => 'EcoTank L3110', 'marca' => 'Epson', 'tipo' => 'Impresora Tinta'],
            ['nombre' => 'Smart Tank 515', 'marca' => 'HP', 'tipo' => 'Impresora Tinta'],
            ['nombre' => 'EcoTank L3150', 'marca' => 'Epson', 'tipo' => 'Impresora Tinta Multifuncional'],
            ['nombre' => 'Smart Tank 615', 'marca' => 'HP', 'tipo' => 'Impresora Tinta Multifuncional'],
            ['nombre' => 'Galaxy S24', 'marca' => 'Samsung', 'tipo' => 'Celular'],
            ['nombre' => 'iPhone 15 Pro', 'marca' => 'Apple', 'tipo' => 'Celular'],
            ['nombre' => 'Redmi Note 12', 'marca' => 'Xiaomi', 'tipo' => 'Celular'],
            ['nombre' => 'iPad Air', 'marca' => 'Apple', 'tipo' => 'Tablet'],
            ['nombre' => 'Galaxy Tab S9', 'marca' => 'Samsung', 'tipo' => 'Tablet'],
            ['nombre' => '24MP400', 'marca' => 'LG', 'tipo' => 'Monitor'],
            ['nombre' => 'E2420H', 'marca' => 'Dell', 'tipo' => 'Monitor'],
            ['nombre' => 'PowerLite 1288', 'marca' => 'Epson', 'tipo' => 'Proyector'],
            ['nombre' => 'PlayStation 5', 'marca' => 'Sony', 'tipo' => 'Consola'],
            ['nombre' => 'Xbox Series X', 'marca' => 'Microsoft', 'tipo' => 'Consola'],
        ];

        $marcas = Marca::where('tenant_id', $tid)->pluck('id', 'nombre');
        $tipos = TipoEquipo::where('tenant_id', $tid)->pluck('id', 'nombre');

        foreach ($modelos as $m) {
            $marcaId = $marcas[$m['marca']] ?? null;
            $tipoId = $tipos[$m['tipo']] ?? null;
            if (!$marcaId || !$tipoId) {
                continue;
            }
            Modelo::updateOrCreate(
                ['tenant_id' => $tid, 'nombre' => $m['nombre'], 'marca_id' => $marcaId],
                ['tenant_id' => $tid, 'tipo_equipo_id' => $tipoId, 'activo' => true],
            );
        }
    }

    private function seedChecklists(int $tid): void
    {
        $tipos = TipoEquipo::where('tenant_id', $tid)->whereNotNull('slug')->get()->keyBy('slug');
        $map = $this->checklistData();

        foreach ($map as $slug => $cats) {
            $tipo = $tipos[$slug] ?? null;
            if (!$tipo) {
                continue;
            }
            foreach (['fallas', 'accesorios'] as $cat) {
                foreach ($cats[$cat] ?? [] as $i => $item) {
                    ChecklistItem::updateOrCreate(
                        ['tenant_id' => $tid, 'tipo_equipo_id' => $tipo->id, 'categoria' => $cat, 'nombre' => $item['nombre']],
                        ['tenant_id' => $tid, 'icono' => $item['icono'] ?? null, 'descripcion' => $item['descripcion'] ?? null, 'orden' => $i + 1, 'activo' => true],
                    );
                }
            }
        }
    }

    /** Conjuntos base reutilizables y composición por tipo. */
    private function checklistData(): array
    {
        $laserFallas = [
            ['icono' => '🖨️', 'nombre' => 'No enciende', 'descripcion' => 'No muestra luces ni responde'],
            ['icono' => '📄', 'nombre' => 'No imprime', 'descripcion' => 'Envía trabajos pero no imprime'],
            ['icono' => '⚫', 'nombre' => 'Impresión clarita / tóner bajo', 'descripcion' => 'Texto o imágenes muy claros'],
            ['icono' => '🌫️', 'nombre' => 'Fondo gris / sucio', 'descripcion' => 'Toda la hoja con fondo gris'],
            ['icono' => '📄', 'nombre' => 'Rayas verticales u horizontales', 'descripcion' => 'Rayas en toda la hoja'],
            ['icono' => '🌀', 'nombre' => 'Imagen fantasma (ghosting)', 'descripcion' => 'Imagen repetida más clara'],
            ['icono' => '🔥', 'nombre' => 'Problemas de fusor', 'descripcion' => 'El tóner no fija, se borra'],
            ['icono' => '📄', 'nombre' => 'Atasco de papel', 'descripcion' => 'Papel atascado'],
            ['icono' => '💾', 'nombre' => 'No reconoce tóner', 'descripcion' => 'Tóner no compatible'],
            ['icono' => '📡', 'nombre' => 'Problemas de conexión', 'descripcion' => 'No conecta por USB/red/WiFi'],
        ];
        $laserAcc = [
            ['icono' => '🔌', 'nombre' => 'Cable de corriente', 'descripcion' => 'Cable de alimentación'],
            ['icono' => '🔌', 'nombre' => 'Cable USB', 'descripcion' => 'Cable USB tipo A/B'],
            ['icono' => '📦', 'nombre' => 'Tóner adicional', 'descripcion' => 'Tóner de repuesto'],
        ];
        $tintaFallas = [
            ['icono' => '🖨️', 'nombre' => 'No enciende', 'descripcion' => 'No muestra luces ni responde'],
            ['icono' => '📄', 'nombre' => 'No imprime', 'descripcion' => 'Envía trabajos pero no imprime'],
            ['icono' => '⚫', 'nombre' => 'Imprime mal (negro)', 'descripcion' => 'Negro con rayas o manchas'],
            ['icono' => '🌈', 'nombre' => 'Imprime mal (colores)', 'descripcion' => 'Colores ausentes o distorsionados'],
            ['icono' => '⚠️', 'nombre' => 'Caja de mantenimiento', 'descripcion' => 'Requiere mantenimiento'],
            ['icono' => '💾', 'nombre' => 'No reconoce cartucho', 'descripcion' => 'Cartucho no compatible'],
            ['icono' => '💧', 'nombre' => 'Fuga de tinta', 'descripcion' => 'Tinta derramada'],
            ['icono' => '📄', 'nombre' => 'Atasco de papel', 'descripcion' => 'Papel atascado'],
            ['icono' => '📡', 'nombre' => 'Problemas de conexión', 'descripcion' => 'No conecta por USB/red/WiFi'],
        ];
        $multifuncional = [
            ['icono' => '📠', 'nombre' => 'No envía / recibe fax', 'descripcion' => 'Problemas con fax'],
            ['icono' => '📷', 'nombre' => 'Escáner no funciona', 'descripcion' => 'No escanea'],
            ['icono' => '🔄', 'nombre' => 'Atasco en ADF', 'descripcion' => 'Documentos atascados en alimentador'],
        ];
        $pcFallas = [
            ['icono' => '🔌', 'nombre' => 'No enciende', 'descripcion' => 'No responde al botón de encendido'],
            ['icono' => '🖥️', 'nombre' => 'No da video', 'descripcion' => 'Pantalla negra o sin señal'],
            ['icono' => '🐌', 'nombre' => 'Lento / Congelado', 'descripcion' => 'Equipo muy lento o se congela'],
            ['icono' => '💀', 'nombre' => 'Pantalla azul (BSOD)', 'descripcion' => 'Error crítico de Windows'],
            ['icono' => '🔊', 'nombre' => 'Problemas de sonido', 'descripcion' => 'No hay audio o distorsionado'],
            ['icono' => '📡', 'nombre' => 'Problemas de WiFi/Red', 'descripcion' => 'No conecta o se desconecta'],
            ['icono' => '🌡️', 'nombre' => 'Se sobrecalienta', 'descripcion' => 'Se apaga solo o muy caliente'],
            ['icono' => '🐛', 'nombre' => 'Virus/Malware', 'descripcion' => 'Comportamiento sospechoso'],
            ['icono' => '🔌', 'nombre' => 'Puertos USB no funcionan', 'descripcion' => 'No detectan dispositivos'],
        ];
        $pcAcc = [
            ['icono' => '🔌', 'nombre' => 'Cable de poder', 'descripcion' => 'Cable de alimentación'],
            ['icono' => '🖱️', 'nombre' => 'Mouse', 'descripcion' => 'Mouse incluido'],
            ['icono' => '⌨️', 'nombre' => 'Teclado', 'descripcion' => 'Teclado incluido'],
        ];
        $portatilExtra = [
            ['icono' => '🔋', 'nombre' => 'Batería no carga', 'descripcion' => 'No reconoce carga o dura poco'],
            ['icono' => '🖱️', 'nombre' => 'Touchpad no funciona', 'descripcion' => 'Mousepad sin respuesta'],
            ['icono' => '📷', 'nombre' => 'Cámara no funciona', 'descripcion' => 'Webcam no detectada'],
            ['icono' => '🔌', 'nombre' => 'Puerto de carga dañado', 'descripcion' => 'Conector suelto o dañado'],
            ['icono' => '💡', 'nombre' => 'Pantalla rota / manchada', 'descripcion' => 'LCD dañado o manchas'],
        ];
        $celFallas = [
            ['icono' => '🔌', 'nombre' => 'No enciende', 'descripcion' => 'No responde'],
            ['icono' => '📱', 'nombre' => 'Pantalla rota', 'descripcion' => 'Vidrio o LCD dañado'],
            ['icono' => '🔋', 'nombre' => 'Batería se descarga rápido', 'descripcion' => 'Dura muy poco'],
            ['icono' => '⚡', 'nombre' => 'No carga', 'descripcion' => 'No reconoce cargador'],
            ['icono' => '🔊', 'nombre' => 'Altavoz no funciona', 'descripcion' => 'No se escucha'],
            ['icono' => '🎙️', 'nombre' => 'Micrófono no funciona', 'descripcion' => 'No me escuchan'],
            ['icono' => '📡', 'nombre' => 'Sin señal', 'descripcion' => 'No agarra red móvil'],
            ['icono' => '📶', 'nombre' => 'WiFi/Bluetooth no funciona', 'descripcion' => 'No conecta'],
            ['icono' => '🐌', 'nombre' => 'Lento / Se traba', 'descripcion' => 'Rendimiento bajo'],
            ['icono' => '📷', 'nombre' => 'Cámara no funciona', 'descripcion' => 'No toma fotos'],
            ['icono' => '💧', 'nombre' => 'Daño por líquido', 'descripcion' => 'Se mojó'],
        ];
        $celAcc = [
            ['icono' => '🔌', 'nombre' => 'Cargador', 'descripcion' => 'Cargador original o genérico'],
            ['icono' => '🎧', 'nombre' => 'Audífonos', 'descripcion' => 'Audífonos incluidos'],
            ['icono' => '📦', 'nombre' => 'Funda / Case', 'descripcion' => 'Funda protectora'],
        ];

        return [
            'impresora-laser' => ['fallas' => $laserFallas, 'accesorios' => $laserAcc],
            'impresora-laser-multifuncional' => ['fallas' => array_merge($laserFallas, $multifuncional), 'accesorios' => $laserAcc],
            'impresora-tinta' => ['fallas' => $tintaFallas, 'accesorios' => $laserAcc],
            'impresora-tinta-multifuncional' => ['fallas' => array_merge($tintaFallas, $multifuncional), 'accesorios' => $laserAcc],
            'computador-mesa' => ['fallas' => $pcFallas, 'accesorios' => $pcAcc],
            'computador-portatil' => ['fallas' => array_merge($pcFallas, $portatilExtra), 'accesorios' => $pcAcc],
            'computador-todo-en-uno' => ['fallas' => $pcFallas, 'accesorios' => $pcAcc],
            'celular' => ['fallas' => $celFallas, 'accesorios' => $celAcc],
            'tablet' => ['fallas' => $celFallas, 'accesorios' => $celAcc],
        ];
    }
}
