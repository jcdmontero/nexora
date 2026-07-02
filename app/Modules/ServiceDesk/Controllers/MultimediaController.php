<?php

namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Producto;
use App\Modules\ServiceDesk\Models\OrdenMultimedia;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use App\Modules\ServiceDesk\Models\Servicio;
use App\Modules\ServiceDesk\Services\MultimediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MultimediaController extends Controller
{
    public function __construct(
        private MultimediaService $multimediaService,
    ) {}

    /**
     * Sube multimedia a una orden de reparación (asociado a una fase específica).
     */
    public function uploadOrden(Request $request, OrdenReparacion $orden): JsonResponse
    {
        $request->validate([
            'archivo' => 'required|file|max:51200', // 50MB max
            'fase' => 'nullable|string|max:30',
            'descripcion' => 'nullable|string|max:200',
        ]);

        $tenantId = auth()->user()->tenant_id;
        $datos = $this->multimediaService->upload($request->file('archivo'), $tenantId, 'ordenes');

        $multimedia = OrdenMultimedia::create([
            'orden_id' => $orden->id,
            'ruta' => $datos['ruta'],
            'tipo' => $datos['tipo'],
            'mime_type' => $datos['mime_type'],
            'tamaño' => $datos['tamaño'],
            'duracion' => $datos['duracion'],
            'nombre_original' => $datos['nombre_original'],
            'fase' => $request->input('fase'),
            'descripcion' => $request->input('descripcion'),
        ]);

        return response()->json([
            'success' => true,
            'multimedia' => $multimedia,
        ]);
    }

    /**
     * Elimina un registro multimedia.
     */
    public function destroy(OrdenMultimedia $multimedia): JsonResponse
    {
        $this->multimediaService->delete($multimedia->ruta);
        $multimedia->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Lista el multimedia de una orden, filtrable por fase.
     */
    public function indexOrden(Request $request, OrdenReparacion $orden): JsonResponse
    {
        $query = $orden->multimedia()->orderByDesc('created_at');

        if ($fase = $request->input('fase')) {
            $query->where('fase', $fase);
        }

        return response()->json([
            'multimedia' => $query->get(),
        ]);
    }

    /**
     * Sube imagen para un producto del inventario.
     */
    public function uploadProducto(Request $request, Producto $producto): JsonResponse
    {
        $request->validate([
            'archivo' => 'required|file|max:10240', // 10MB
        ]);

        $tenantId = auth()->user()->tenant_id;
        $datos = $this->multimediaService->upload($request->file('archivo'), $tenantId, 'productos');

        // Eliminar imagen anterior si existe
        if ($producto->imagen_url) {
            $this->multimediaService->delete($producto->imagen_url);
        }

        $producto->update(['imagen_url' => $datos['ruta']]);

        return response()->json([
            'success' => true,
            'imagen_url' => $datos['ruta'],
        ]);
    }

    /**
     * Elimina imagen de un producto.
     */
    public function destroyProducto(Producto $producto): JsonResponse
    {
        if ($producto->imagen_url) {
            $this->multimediaService->delete($producto->imagen_url);
            $producto->update(['imagen_url' => null]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Sube imagen para un servicio.
     */
    public function uploadServicio(Request $request, Servicio $servicio): JsonResponse
    {
        $request->validate([
            'archivo' => 'required|file|max:10240', // 10MB
        ]);

        $tenantId = auth()->user()->tenant_id;
        $datos = $this->multimediaService->upload($request->file('archivo'), $tenantId, 'servicios');

        if ($servicio->imagen_url) {
            $this->multimediaService->delete($servicio->imagen_url);
        }

        $servicio->update(['imagen_url' => $datos['ruta']]);

        return response()->json([
            'success' => true,
            'imagen_url' => $datos['ruta'],
        ]);
    }

    /**
     * Elimina imagen de un servicio.
     */
    public function destroyServicio(Servicio $servicio): JsonResponse
    {
        if ($servicio->imagen_url) {
            $this->multimediaService->delete($servicio->imagen_url);
            $servicio->update(['imagen_url' => null]);
        }

        return response()->json(['success' => true]);
    }
}
