<?php
namespace App\Modules\ServiceDesk\Enums;

enum OrdenEstado: string
{
    case Recibido = 'recibido';
    case Diagnostico = 'diagnosticado';
    case Asignado = 'asignado';
    case Reparacion = 'en_proceso';
    case Pruebas = 'pruebas';
    case Listo = 'completado';
    case Entregado = 'entregado';
    case Cancelado = 'cancelado';

    /** Etiqueta en español para la interfaz. */
    public function label(): string
    {
        return match ($this) {
            self::Recibido => 'Recibido',
            self::Diagnostico => 'Diagnóstico',
            self::Asignado => 'Asignado',
            self::Reparacion => 'En reparación',
            self::Pruebas => 'En pruebas',
            self::Listo => 'Listo para entrega',
            self::Entregado => 'Entregado',
            self::Cancelado => 'Cancelado',
        };
    }

    /** Color para badges en la UI. */
    public function color(): string
    {
        return match ($this) {
            self::Recibido => 'slate',
            self::Diagnostico => 'amber',
            self::Asignado => 'indigo',
            self::Reparacion => 'sky',
            self::Pruebas => 'violet',
            self::Listo => 'emerald',
            self::Entregado => 'green',
            self::Cancelado => 'rose',
        };
    }

    /** Estados que representan una orden en proceso (activa). */
    public static function activos(): array
    {
        return ['recibido', 'diagnosticado', 'asignado', 'en_proceso', 'pruebas', 'completado'];
    }

    /** Lista para selects: [{value, label, color}]. */
    public static function opciones(): array
    {
        return array_map(fn (self $e) => [
            'value' => $e->value,
            'label' => $e->label(),
            'color' => $e->color(),
        ], self::cases());
    }
}
