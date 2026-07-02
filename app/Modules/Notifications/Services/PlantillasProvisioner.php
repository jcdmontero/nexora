<?php
namespace App\Modules\Notifications\Services;

use App\Core\Models\Tenant;
use App\Modules\Notifications\Models\PlantillaNotificacion;

/**
 * Siembra las plantillas de notificación por defecto al activar el módulo,
 * para que la empresa arranque con mensajes listos y solo los personalice.
 */
class PlantillasProvisioner
{
    public function provisionForTenant(Tenant $tenant): void
    {
        foreach (NotificacionService::DEFAULTS as $evento => $def) {
            PlantillaNotificacion::updateOrCreate(
                ['tenant_id' => $tenant->id, 'evento' => $evento],
                [
                    'tenant_id' => $tenant->id,
                    'nombre' => $def['nombre'],
                    'asunto' => $def['asunto'],
                    'contenido' => $def['contenido'],
                    'canales' => ['email', 'whatsapp'],
                    'activo' => true,
                ],
            );
        }
    }
}
