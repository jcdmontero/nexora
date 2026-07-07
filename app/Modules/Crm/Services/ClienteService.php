<?php

namespace App\Modules\Crm\Services;

use App\Modules\Crm\Models\Cliente;
use Illuminate\Support\Facades\DB;

class ClienteService
{
    public function crearCliente(array $data): Cliente
    {
        return DB::transaction(function () use ($data) {
            return Cliente::create($data);
        });
    }

    public function actualizarCliente(Cliente $cliente, array $data): Cliente
    {
        return DB::transaction(function () use ($cliente, $data) {
            if (empty($data['password'])) {
                unset($data['password']);
            }
            
            $cliente->update($data);
            return $cliente;
        });
    }

    public function eliminarCliente(Cliente $cliente): bool
    {
        // En Laravel SoftDeletes, ->count() ignora los registros con deleted_at != null
        if ($cliente->oportunidades()->count() > 0) {
            throw new \Exception('No se puede eliminar el cliente porque tiene oportunidades asociadas.');
        }

        return DB::transaction(function () use ($cliente) {
            return $cliente->delete();
        });
    }
}
