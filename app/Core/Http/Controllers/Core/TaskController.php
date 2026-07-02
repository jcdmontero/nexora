<?php

namespace App\Core\Http\Controllers\Core;

use App\Http\Controllers\Controller;
use App\Models\Core\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        
        $tasks = Task::where('tenant_id', $tenantId)
            ->with(['asignado', 'creador'])
            ->orderBy('fecha_limite', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'fecha_limite' => 'nullable|date',
            'departamento' => 'nullable|string',
        ]);

        $task = Task::create([
            'tenant_id' => Auth::user()->tenant_id,
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'fecha_limite' => $request->fecha_limite,
            'departamento' => $request->departamento,
            'estado' => 'pendiente',
            'creado_por' => Auth::id(),
            'asignado_a' => Auth::id(),
        ]);

        return back()->with('success', 'Tarea creada exitosamente.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Task $task)
    {
        if ($task->tenant_id !== Auth::user()->tenant_id) {
            abort(403);
        }

        $request->validate([
            'estado' => 'sometimes|in:pendiente,en_progreso,completada,cancelada',
        ]);

        $task->update($request->only('estado'));

        return back()->with('success', 'Tarea actualizada.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Task $task)
    {
        if ($task->tenant_id !== Auth::user()->tenant_id) {
            abort(403);
        }
        
        $task->delete();

        return back()->with('success', 'Tarea eliminada.');
    }
}
