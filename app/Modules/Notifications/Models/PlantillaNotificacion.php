<?php
namespace App\Modules\Notifications\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class PlantillaNotificacion extends Model
{
    use BelongsToTenant;

    protected $table = 'notif_plantillas';

    protected $fillable = [
        'tenant_id', 'evento', 'nombre', 'asunto', 'contenido', 'canales', 'activo',
    ];

    protected $casts = [
        'canales' => 'array',
        'activo' => 'boolean',
    ];
}
