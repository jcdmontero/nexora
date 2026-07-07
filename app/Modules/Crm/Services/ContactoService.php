<?php

namespace App\Modules\Crm\Services;

use App\Modules\Crm\Models\Cliente;
use App\Modules\Crm\Models\Contacto;
use Illuminate\Support\Facades\DB;

class ContactoService
{
    public function crearContacto(Cliente $cliente, array $data): Contacto
    {
        return DB::transaction(function () use ($cliente, $data) {
            if (!empty($data['is_principal'])) {
                $cliente->contactos()->update(['is_principal' => false]);
            }

            return $cliente->contactos()->create($data);
        });
    }

    public function actualizarContacto(Contacto $contacto, array $data): Contacto
    {
        return DB::transaction(function () use ($contacto, $data) {
            if (!empty($data['is_principal'])) {
                $contacto->cliente->contactos()
                    ->where('id', '!=', $contacto->id)
                    ->update(['is_principal' => false]);
            }

            $contacto->update($data);
            return $contacto;
        });
    }

    public function eliminarContacto(Contacto $contacto): bool
    {
        return DB::transaction(function () use ($contacto) {
            return $contacto->delete();
        });
    }
}
