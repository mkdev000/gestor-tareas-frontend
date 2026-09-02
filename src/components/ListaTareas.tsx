interface Tarea {
    id: number;
    titulo: string;
    descripcion: string;
    estado: string;
    prioridad: string;
    proyecto: string;
    fecha_limite: string | null;
    hora_limite: string | null;
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
                            </p>
                        </div>

                        <select
                            value={tarea.estado}
                            onChange={(e) => cambiarEstado(tarea, e.target.value)}
                            className="text-xs border border-gray-200 rounded-md px-2 py-1.5 text-muted outline-none"
                        >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_progreso">En progreso</option>
                            <option value="en_pausa">En pausa</option>
                            <option value="completada">Completada</option>
                        </select>

                        <button
                            onClick={() => borrarTarea(tarea.id)}
                            className="text-muted hover:text-rosa text-xs font-medium transition"
                        >
                            Borrar
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

export default ListaTareas;