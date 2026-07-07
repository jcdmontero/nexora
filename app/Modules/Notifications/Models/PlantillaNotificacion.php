<?php
namespace App\Modules\Notifications\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class PlantillaNotificacion extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'notif_plantillas';

    protected $fillable = [
        'tenant_id', 'evento', 'nombre', 'asunto', 'contenido', 'canales', 'activo',
    ];

    protected $casts = [
        'canales' => 'array',
        'activo' => 'boolean',
    ];
}
