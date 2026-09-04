import { formatearFecha } from '../utils/fechas';
import { colorPorEstado } from '../utils/estado';

interface Tarea {
    id: number;
    titulo: string;
    descripcion: string;
    estado: string;
    prioridad: string;
    proyecto: string;
    fecha_limite: string | null;
    hora_limite: string | null;
    fecha_creacion: string;
}

interface Props {
    tareas: Tarea[];
    onCambio: () => void;
}

function ListaTareas({ tareas, onCambio }: Props) {
    const token = localStorage.getItem('token');

    const cambiarEstado = async (tarea: Tarea, nuevoEstado: string) => {
        try {
            const respuesta = await fetch(`http://localhost:3000/api/tareas/${tarea.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...tarea,
                    estado: nuevoEstado,
                    fecha_limite: tarea.fecha_limite ? tarea.fecha_limite.slice(0, 10) : null,
                }),
            });

            if (respuesta.ok) {
                onCambio();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const alternarEstado = (tarea: Tarea) => {
        const nuevoEstado = tarea.estado === 'completada' ? 'pendiente' : 'completada';
        cambiarEstado(tarea, nuevoEstado);
    };

    const borrarTarea = async (id: number) => {
        try {
            const respuesta = await fetch(`http://localhost:3000/api/tareas/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (respuesta.ok) {
                onCambio();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const bordePorPrioridad = (prioridad: string) => {
        switch (prioridad) {
            case 'urgente':
                return 'border-l-marino';
            case 'alta':
            case 'media':
                return 'border-l-azul';
            default:
                return 'border-l-gray-200';
        }
    };

    return (
        <div className="flex flex-col gap-2.5">
            {tareas.map((tarea) => {
                const completada = tarea.estado === 'completada';

                return (
                    <div
                        key={tarea.id}
                        className={`flex items-center gap-3 bg-white border border-gray-200 border-l-4 ${bordePorPrioridad(tarea.prioridad)} rounded-lg px-4 py-3`}
                    >
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold text-texto ${completada ? 'line-through text-muted' : ''}`}>
                                {tarea.titulo}
                            </p>
                            <p className="text-xs text-muted mt-0.5">
                                {tarea.proyecto || 'Sin proyecto'}
                                {formatearFecha(tarea.fecha_limite) && ` · ${formatearFecha(tarea.fecha_limite)}`}
                            </p>
                        </div>

                        <button
                            onClick={() => alternarEstado(tarea)}
                            className={`text-xs font-bold rounded-full px-3 py-1.5 cursor-pointer transition ${colorPorEstado(tarea.estado)}`}
                        >
                            {completada ? 'Completada' : 'Pendiente'}
                        </button>

                        <button
                            onClick={() => borrarTarea(tarea.id)}
                            className="text-muted hover:text-rosa hover:bg-rosa-suave p-1.5 rounded-md transition"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6h12z" />
                            </svg>
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

export default ListaTareas;