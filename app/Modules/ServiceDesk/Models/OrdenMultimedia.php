<?php
namespace App\Modules\ServiceDesk\Models;

use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrdenMultimedia extends Model
{
    use SoftDeletes, Auditable;

    protected $table = 'sd_orden_multimedia';

    protected $fillable = [
        'orden_id',
        'ruta',
        'tipo',
        'fase',
        'mime_type',
        'tamaño',
        'duracion',
        'nombre_original',
        'descripcion',
    ];

    protected $casts = [
        'tamaño' => 'integer',
        'duracion' => 'decimal:2',
    ];

    public function orden()
    {
        return $this->belongsTo(OrdenReparacion::class, 'orden_id');
    }

    /**
     * Determina si el archivo es un video.
     */
    public function esVideo(): bool
    {
        return $this->tipo === 'video';
    }

    /**
     * Tamaño formateado legible.
     */
    public function tamañoFormateado(): string
    {
        if (!$this->tamaño) {
            return 'N/A';
        }

        $bytes = $this->tamaño;
        $unidades = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($unidades) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 1) . ' ' . $unidades[$i];
    }
}
