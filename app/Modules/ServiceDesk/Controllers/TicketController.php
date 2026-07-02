<?php

namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ServiceDesk\Models\Ticket;
use App\Modules\ServiceDesk\Models\TicketMensaje;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TicketController extends Controller
{
    public function ordenesIndex(Request $request)
    {
        return $this->index($request, 'orden_trabajo');
    }

    public function garantiasIndex(Request $request)
    {
        return $this->index($request, 'garantia');
    }

    private function index(Request $request, string $tipo)
    {
        $tenantId = auth()->user()->tenant_id;
        $search = $request->input('search');

        $tickets = Ticket::with(['cliente', 'agente'])
            ->where('tenant_id', $tenantId)
            ->where('tipo', $tipo)
            ->when($search, function ($query, $search) {
                $query->where('id', 'ilike', "%{$search}%")
                      ->orWhere('asunto', 'ilike', "%{$search}%")
                      ->orWhere('equipo_descripcion', 'ilike', "%{$search}%")
                      ->orWhereHas('cliente', function($q) use ($search) {
                          $q->where('nombres', 'ilike', "%{$search}%")
                            ->orWhere('apellidos', 'ilike', "%{$search}%")
                            ->orWhere('razon_social', 'ilike', "%{$search}%");
                      });
            })
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('ServiceDesk/Index', [
            'tickets' => $tickets,
            'tipo' => $tipo,
            'filters' => $request->only(['search']),
        ]);
    }

    public function show(Ticket $ticket)
    {
        if ($ticket->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $ticket->load(['cliente', 'agente', 'user', 'mensajes.user']);

        return Inertia::render('ServiceDesk/Show', [
            'ticket' => $ticket,
            'agentes' => \App\Models\User::where('tenant_id', auth()->user()->tenant_id)->get(['id', 'name']),
        ]);
    }

    public function create(Request $request)
    {
        $tipo = $request->input('tipo') === 'garantia' ? 'garantia' : 'orden_trabajo';
        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('ServiceDesk/Tickets/Create', [
            'tipo' => $tipo,
            'clientes' => \App\Modules\Crm\Models\Cliente::where('tenant_id', $tenantId)
                ->orderBy('nombres')
                ->get(['id', 'nombres', 'apellidos', 'razon_social']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tipo' => 'required|in:orden_trabajo,garantia',
            'cliente_id' => 'required|exists:crm_clientes,id',
            'equipo_descripcion' => 'required|string|max:255',
            'asunto' => 'required|string|max:255',
            'descripcion' => 'required|string',
            'prioridad' => 'required|in:baja,media,alta,critica',
            'agente_id' => 'nullable|exists:users,id',
        ]);

        $data['tenant_id'] = auth()->user()->tenant_id;
        $data['user_id'] = auth()->id();
        $data['estado'] = 'recibido';

        $ticket = Ticket::create($data);

        return redirect()->route('service-desk.tickets.show', $ticket->id)->with('success', 'Ticket creado exitosamente.');
    }

    public function updateStatus(Request $request, Ticket $ticket)
    {
        if ($ticket->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'estado' => 'required|in:recibido,diagnosticando,esperando_repuestos,reparando,finalizado,entregado',
        ]);

        $ticket->update(['estado' => $data['estado']]);

        // Registrar evento
        TicketMensaje::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            'mensaje' => 'Cambio de estado a: ' . strtoupper($data['estado']),
            'es_interno' => true,
        ]);

        return back()->with('success', 'Estado actualizado.');
    }

    public function updateAgent(Request $request, Ticket $ticket)
    {
        if ($ticket->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'agente_id' => 'nullable|exists:users,id',
        ]);

        $ticket->update(['agente_id' => $data['agente_id']]);

        return back()->with('success', 'Agente asignado.');
    }

    public function addMessage(Request $request, Ticket $ticket)
    {
        if ($ticket->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'mensaje' => 'required|string',
            'es_interno' => 'boolean',
        ]);

        TicketMensaje::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            'mensaje' => $data['mensaje'],
            'es_interno' => $data['es_interno'] ?? false,
        ]);

        return back()->with('success', 'Mensaje añadido.');
    }
}
