<?php

namespace App\Modules\ServiceDesk\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MultimediaService
{
    private const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    private const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

    private const ALLOWED_IMAGE_TYPES = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    ];

    private const ALLOWED_VIDEO_TYPES = [
        'video/mp4', 'video/quicktime', 'video/webm',
    ];

    /**
     * Sube un archivo multimedia (foto o video) y retorna los datos para guardar en BD.
     */
    public function upload(UploadedFile $file, int $tenantId, string $directorio = 'ordenes'): array
    {
        $mimeType = $file->getMimeType();
        $esVideo = in_array($mimeType, self::ALLOWED_VIDEO_TYPES);

        // Validar tipo
        $allowedTypes = $esVideo ? self::ALLOWED_VIDEO_TYPES : self::ALLOWED_IMAGE_TYPES;
        if (!in_array($mimeType, $allowedTypes)) {
            throw new \Exception("Tipo de archivo no permitido: {$mimeType}");
        }

        // Validar tamaño
        $maxSize = $esVideo ? self::MAX_VIDEO_SIZE : self::MAX_IMAGE_SIZE;
        if ($file->getSize() > $maxSize) {
            $maxMb = $maxSize / (1024 * 1024);
            throw new \Exception("El archivo excede el tamaño máximo de {$maxMb}MB");
        }

        // Generar nombre único
        $extension = $file->getClientOriginalExtension();
        $nombre = Str::uuid() . '.' . $extension;

        // Ruta: {directorio}/{tenant_id}/{año}/{mes}/
        $ruta = "{$directorio}/{$tenantId}/" . now()->format('Y/m');
        $rutaCompleta = $file->storeAs($ruta, $nombre, 'public');

        // Para videos, programar extracción de duración en background
        if ($esVideo) {
            $rutaFinal = $ruta . '/' . $nombre;
            \App\Jobs\ProcesarMultimediaJob::dispatch($rutaFinal, 'public')
                ->onQueue('media');
        }

        return [
            'ruta' => '/storage/' . $rutaCompleta,
            'tipo' => $esVideo ? 'video' : 'imagen',
            'mime_type' => $mimeType,
            'tamaño' => $file->getSize(),
            'duracion' => null,
            'nombre_original' => $file->getClientOriginalName(),
        ];
    }

    /**
     * Elimina un archivo multimedia del disco.
     */
    public function delete(string $ruta): bool
    {
        // La ruta viene como /storage/... — convertir a storage path
        $storagePath = str_replace('/storage/', '', $ruta);

        if (Storage::disk('public')->exists($storagePath)) {
            return Storage::disk('public')->delete($storagePath);
        }

        return false;
    }
}
