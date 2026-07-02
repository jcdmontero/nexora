<?php

namespace App\Core\Http\Controllers\Core;

use App\Core\Models\WidgetLayout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class WidgetLayoutController extends Controller
{
    public function show(Request $request, string $viewName = 'default'): JsonResponse
    {
        $user = $request->user();
        $tenantId = tenant()->id;

        $layout = WidgetLayout::getForUser($user->id, $tenantId, $viewName);

        return response()->json([
            'layout' => $layout?->layout ?? $this->defaultLayout(),
            'view_name' => $viewName,
        ]);
    }

    public function update(Request $request, string $viewName = 'default'): JsonResponse
    {
        $user = $request->user();
        $tenantId = tenant()->id;

        $validated = $request->validate([
            'layout' => 'required|array',
            'layout.*.widgetId' => 'required|string',
            'layout.*.visible' => 'required|boolean',
            'layout.*.pinned' => 'required|boolean',
            'layout.*.size' => 'required|string|in:full,half,third,quarter',
        ]);

        $widgetLayout = WidgetLayout::getOrCreateForUser($user->id, $tenantId, $viewName);
        $widgetLayout->update(['layout' => $validated['layout']]);

        return response()->json([
            'success' => true,
            'layout' => $widgetLayout->layout,
        ]);
    }

    public function availableViews(): JsonResponse
    {
        return response()->json([
            'views' => [
                ['id' => 'default', 'label' => 'General'],
                ['id' => 'financiero', 'label' => 'Financiero'],
                ['id' => 'operativo', 'label' => 'Operativo'],
                ['id' => 'rrhh', 'label' => 'RRHH'],
            ],
        ]);
    }

    private function defaultLayout(): array
    {
        return [];
    }
}
