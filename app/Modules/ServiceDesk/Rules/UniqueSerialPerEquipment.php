<?php
namespace App\Modules\ServiceDesk\Rules;

use App\Modules\ServiceDesk\Models\OrdenReparacion;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class UniqueSerialPerEquipment implements ValidationRule
{
    protected ?int $ignoreOrderId;
    protected ?int $modeloId;

    public function __construct(?int $modeloId, ?int $ignoreOrderId = null)
    {
        $this->modeloId = $modeloId;
        $this->ignoreOrderId = $ignoreOrderId;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($value)) {
            return;
        }

        // 1. El serial/IMEI debe pertenecer siempre al mismo modelo de equipo.
        if ($this->modeloId !== null) {
            $existsOtherModel = OrdenReparacion::where('numero_serie', $value)
                ->where('modelo_id', '!=', $this->modeloId)
                ->when($this->ignoreOrderId, fn ($q) => $q->where('id', '!=', $this->ignoreOrderId))
                ->exists();

            if ($existsOtherModel) {
                $fail('El IMEI/número de serie ingresado no se puede registrar porque ya está registrado con otro modelo y otro equipo.');
                return;
            }
        }

        // 2. El mismo equipo puede tener múltiples atenciones, pero no debe existir otra orden activa
        //    para el mismo equipo si ya hay una en curso (no entregada ni cancelada).
        $activeOrderExists = OrdenReparacion::where('numero_serie', $value)
            ->when($this->ignoreOrderId, fn ($q) => $q->where('id', '!=', $this->ignoreOrderId))
            ->whereNotIn('estado', ['entregado', 'cancelado'])
            ->exists();

        if ($activeOrderExists) {
            $fail('Ya existe una orden activa para este mismo número de serie/IMEI. Finalice o cancele la orden anterior antes de crear otra atención.');
        }
    }
}
