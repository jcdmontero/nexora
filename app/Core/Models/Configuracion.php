<?php
namespace App\Core\Models;

use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Configuracion extends Model
{
    use Auditable;

    protected $table = 'core_configuraciones';

    protected $fillable = ['tenant_id', 'categoria', 'clave', 'valor'];

    /** Catálogo de claves con su categoría (define qué se guarda). */
    public const CATEGORIAS = [
        // Empresa
        'nombre_empresa' => 'empresa',
        'nit' => 'empresa',
        'direccion' => 'empresa',
        'telefono' => 'empresa',
        'email_empresa' => 'empresa',
        'ciudad' => 'empresa',
        // Facturación
        'formato_factura' => 'facturacion',
        'resolucion_dian' => 'facturacion',
        'rango_inicio' => 'facturacion',
        'rango_fin' => 'facturacion',
        'siguiente_factura' => 'facturacion',
        'incluir_iva' => 'facturacion',
        'porcentaje_iva' => 'facturacion',
        'regimen_fiscal' => 'facturacion',
        'fecha_cambio_regimen' => 'facturacion',
        // Contabilidad — Cuentas PUC por defecto
        'cta_caja' => 'contabilidad',
        'cta_bancos' => 'contabilidad',
        'cta_clientes' => 'contabilidad',
        'cta_proveedores' => 'contabilidad',
        'cta_iva' => 'contabilidad',
        'cta_anticipos' => 'contabilidad',
        'cta_inventario' => 'contabilidad',
        'cta_costo_ventas' => 'contabilidad',
        'cta_gasto_comisiones' => 'contabilidad',
        // Contabilidad — Cuentas Tributarias
        'cta_iva_generado' => 'contabilidad',
        'cta_iva_descontable' => 'contabilidad',
        'cta_retencion_fuente' => 'contabilidad',
        'cta_retencion_iva' => 'contabilidad',
        'cta_retencion_ica' => 'contabilidad',
        // Sistema
        'moneda' => 'sistema',
        'simbolo_moneda' => 'sistema',
        'zona_horaria' => 'sistema',
        'proximo_numero_orden' => 'sistema',
        // Notificaciones
        'notif_whatsapp_activo' => 'notificaciones',
        'notif_email_activo' => 'notificaciones',
        'notif_telegram_activo' => 'notificaciones',
        'notificar_recibido' => 'notificaciones',
        'notificar_listo' => 'notificaciones',
        'url_acceso' => 'notificaciones',
    ];

    public static function defaults(): array
    {
        return [
            'formato_factura' => 'ticket',
            'regimen_fiscal' => 'simplificado',
            'fecha_cambio_regimen' => null,
            'incluir_iva' => 'false',
            'porcentaje_iva' => '19',
            // Cuentas contables PUC por defecto
            'cta_caja' => '110505',
            'cta_bancos' => '111005',
            'cta_clientes' => '1305',
            'cta_proveedores' => '2205',
            'cta_iva' => '2408',
            'cta_anticipos' => '2815',
            'cta_inventario' => '1405',
            'cta_costo_ventas' => '6135',
            'cta_gasto_comisiones' => '5105',
            // Cuentas tributarias PUC por defecto
            'cta_iva_generado' => '240805',
            'cta_iva_descontable' => '240810',
            'cta_retencion_fuente' => '135515',
            'cta_retencion_iva' => '2365',
            'cta_retencion_ica' => '135518',
            // Sistema
            'siguiente_factura' => '1',
            'moneda' => 'COP',
            'simbolo_moneda' => '$',
            'zona_horaria' => 'America/Bogota',
            'proximo_numero_orden' => '1',
            'notif_whatsapp_activo' => 'true',
            'notif_email_activo' => 'true',
            'notif_telegram_activo' => 'false',
            'notificar_recibido' => 'true',
            'notificar_listo' => 'true',
        ];
    }

    protected static function booted(): void
    {
        $forget = fn ($m) => Cache::forget("config_tenant_{$m->tenant_id}");
        static::saved($forget);
        static::deleted($forget);
    }

    protected static function tenantId(): ?int
    {
        return app()->has('current_tenant') ? app('current_tenant')->id : null;
    }

    /** Todas las configuraciones del tenant actual como [clave => valor]. */
    public static function allForTenant(?int $tenantId = null): array
    {
        $tid = $tenantId ?? static::tenantId();
        if (!$tid) {
            return [];
        }
        return Cache::rememberForever("config_tenant_{$tid}", function () use ($tid) {
            return static::where('tenant_id', $tid)->pluck('valor', 'clave')->toArray();
        });
    }

    public static function get(string $clave, $default = null, ?int $tenantId = null)
    {
        return static::allForTenant($tenantId)[$clave] ?? $default;
    }

    /** Guarda un conjunto de [clave => valor] para el tenant. */
    public static function setMany(array $values, ?int $tenantId = null): void
    {
        $tid = $tenantId ?? static::tenantId();
        if (!$tid) {
            return;
        }
        foreach ($values as $clave => $valor) {
            static::updateOrCreate(
                ['tenant_id' => $tid, 'clave' => $clave],
                ['categoria' => self::CATEGORIAS[$clave] ?? 'general', 'valor' => is_array($valor) ? json_encode($valor) : (string) $valor],
            );
        }
        Cache::forget("config_tenant_{$tid}");
    }
}
