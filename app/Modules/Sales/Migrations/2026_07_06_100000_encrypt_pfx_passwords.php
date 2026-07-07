<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypto;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Encriptar contraseñas PFX que estén en texto plano
        $certificados = DB::table('sales_certificados')
            ->where('password', '!=', '')
            ->where('password', 'NOT LIKE', 'eyJ%') // Las que no empiezan con ciphertext de Laravel
            ->get();

        foreach ($certificados as $cert) {
            DB::table('sales_certificados')
                ->where('id', $cert->id)
                ->update(['password' => Crypto::encrypt($cert->password)]);
        }
    }

    public function down(): void
    {
        // No se puede revertir de forma segura sin knowing qué estaba encriptado
        // y qué no. Dejar como está.
    }
};
