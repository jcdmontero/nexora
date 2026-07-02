<?php
namespace App\Core\Http\Controllers\Core;

use App\Core\Models\AuditLog;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $t = tenant();

        if (!$t && !auth()->user()?->isSuperAdmin()) {
            return redirect()->route('core.login')->with('error', 'Debes iniciar sesión en una empresa');
        }

        $query = AuditLog::with('user:id,name')
            ->when($t, fn ($q) => $q->where('tenant_id', $t->id))
            ->when($request->event, fn ($q, $v) => $q->where('event', $v))
            ->when($request->auditable_type, fn ($q, $v) => $q->where('auditable_type', $v))
            ->when($request->from, fn ($q, $v) => $q->where('created_at', '>=', Carbon::parse($v)))
            ->when($request->to, fn ($q, $v) => $q->where('created_at', '<=', Carbon::parse($v)->endOfDay()))
            ->when($request->user_id, fn ($q, $v) => $q->where('user_id', $v));

        $logs = $query->latest('created_at')
            ->paginate(50)
            ->withQueryString()
            ->through(fn ($log) => [
                'id' => $log->id,
                'event' => $log->event,
                'description' => $log->description,
                'auditable_type' => class_basename($log->auditable_type),
                'auditable_id' => $log->auditable_id,
                'user_name' => $log->user?->name,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->toISOString(),
            ]);

        $eventOptions = AuditLog::distinct('event')->pluck('event');
        $typeOptions = AuditLog::distinct('auditable_type')->pluck('auditable_type')
            ->map(fn ($t) => class_basename($t));

        return Inertia::render('Audit/Index', [
            'logs' => $logs,
            'filters' => $request->only(['event', 'auditable_type', 'from', 'to', 'user_id']),
            'eventOptions' => $eventOptions,
            'typeOptions' => $typeOptions,
        ]);
    }
}
