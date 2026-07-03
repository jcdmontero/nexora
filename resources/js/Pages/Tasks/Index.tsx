import { Head, usePage, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { useState } from 'react'

interface Task {
  id: number
  titulo: string
  departamento?: string
  estado?: string
  fecha_limite?: string
}

interface TasksPageProps {
  tasks: Task[]
}

export default function Index() {
  const { props } = usePage().props as TasksPageProps
  const tasks = Array.isArray(props.tasks) ? props.tasks : []

  const [filterDepto, setFilterDepto] = useState('')

  const pending = tasks.filter((t) => t.estado === 'pendiente' && (!filterDepto || t.departamento === filterDepto))
  const inProgress = tasks.filter((t) => t.estado === 'en_progreso' && (!filterDepto || t.departamento === filterDepto))
  const completed = tasks.filter((t) => t.estado === 'completada' && (!filterDepto || t.departamento === filterDepto))

  const moveTask = (task: Task, newState: string) => {
    router.put(route('core.tasks.update', task.id), {
      estado: newState
    }, { preserveScroll: true })
  }

  const deleteTask = (task: Task) => {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      router.delete(route('core.tasks.destroy', task.id), { preserveScroll: true })
    }
  }

  return (
    <AuthenticatedLayout title="Gestión de Tareas">
      <Head title="Mis Tareas" />

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }} className="custom-dash-container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Mis Tareas</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>Gestiona tus pendientes, fechas límite y prioridades.</p>
          </div>
          <div>
            <select 
              value={filterDepto} 
              onChange={e => setFilterDepto(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface-0)', fontSize: '13px', outline: 'none' }}
            >
              <option value="">Todos los departamentos</option>
              <option value="Ventas">Ventas</option>
              <option value="Contabilidad">Contabilidad</option>
              <option value="Inventario">Inventario</option>
              <option value="RRHH">Recursos Humanos</option>
              <option value="Soporte">Soporte</option>
              <option value="General">General</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', alignItems: 'start' }}>
          
          {/* COLUMNA PENDIENTE */}
          <div style={{ backgroundColor: 'var(--surface-1)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--text-warning)' }}></span> Pendientes ({pending.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pending.map((t) => (
                <TaskCard key={t.id} task={t} onMove={(state) => moveTask(t, state)} onDelete={() => deleteTask(t)} />
              ))}
              {pending.length === 0 && <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No hay tareas pendientes</div>}
            </div>
          </div>

          {/* COLUMNA EN PROGRESO */}
          <div style={{ backgroundColor: 'var(--surface-1)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--text-accent)' }}></span> En Progreso ({inProgress.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {inProgress.map((t) => (
                <TaskCard key={t.id} task={t} onMove={(state) => moveTask(t, state)} onDelete={() => deleteTask(t)} />
              ))}
              {inProgress.length === 0 && <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No hay tareas en progreso</div>}
            </div>
          </div>

          {/* COLUMNA COMPLETADAS */}
          <div style={{ backgroundColor: 'var(--surface-1)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--text-success)' }}></span> Completadas ({completed.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {completed.map((t) => (
                <TaskCard key={t.id} task={t} onMove={(state) => moveTask(t, state)} onDelete={() => deleteTask(t)} />
              ))}
              {completed.length === 0 && <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No hay tareas completadas</div>}
            </div>
          </div>

        </div>
      </div>
    </AuthenticatedLayout>
  )
}

function TaskCard({ task, onMove, onDelete }: { task: Task, onMove: (state: string) => void, onDelete: () => void }) {
  const isOverdue = task.fecha_limite && new Date(task.fecha_limite) < new Date() && task.estado !== 'completada'

  return (
    <div style={{ backgroundColor: 'var(--surface-2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative' }}>
      
      <button 
        onClick={onDelete} 
        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        title="Eliminar tarea"
      >
        <i className="ti ti-trash"></i>
      </button>

      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-accent)', fontWeight: 600, marginBottom: '4px' }}>
        {task.departamento || 'General'}
      </div>
      
      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px', textDecoration: task.estado === 'completada' ? 'line-through' : 'none', opacity: task.estado === 'completada' ? 0.6 : 1 }}>
        {task.titulo}
      </div>

      {task.fecha_limite && (
        <div style={{ fontSize: '11px', color: isOverdue ? 'var(--text-danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
          <i className="ti ti-clock"></i> 
          {isOverdue ? 'Vencida el ' : 'Vence el '} 
          {new Date(task.fecha_limite).toLocaleDateString('es-CO')}
        </div>
      )}

      <div style={{ display: 'flex', gap: '4px', marginTop: 'auto' }}>
        {task.estado !== 'pendiente' && (
          <button onClick={() => onMove('pendiente')} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface-0)', cursor: 'pointer', flex: 1 }}>
            A Pendiente
          </button>
        )}
        {task.estado !== 'en_progreso' && (
          <button onClick={() => onMove('en_progreso')} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-accent)', color: 'var(--text-accent)', cursor: 'pointer', flex: 1 }}>
            A En Progreso
          </button>
        )}
        {task.estado !== 'completada' && (
          <button onClick={() => onMove('completada')} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-success)', color: 'var(--text-success)', cursor: 'pointer', flex: 1 }}>
            A Completada
          </button>
        )}
      </div>
    </div>
  )
}
