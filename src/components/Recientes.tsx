import { useState } from 'react';
import { tiempoRelativo } from '../utils/tiempo';
import FormularioTarea from './FormularioTarea';

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

const puntoPorPrioridad: Record<string, string> = {
  urgente: 'bg-rosa',
  alta: 'bg-ambar',
  media: 'bg-azul',
  baja: 'bg-gray-300',
};

function Recientes({ tareas, onCambio }: Props) {
  const [tareaEditando, setTareaEditando] = useState<Tarea | null>(null);
  const token = localStorage.getItem('token');

  const borrarTarea = async (id: number) => {
    try {
      const respuesta = await fetch(`https://backend-consolidado.onrender.com/api/tareas/${id}`, {
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

  return (
    <>
      <div className="relative pl-6">
        <div className="absolute left-[9px] top-1.5 bottom-1.5 w-0.5 bg-gray-200"></div>

        <div className="flex flex-col gap-5">
          {tareas.map((tarea) => {
            const completada = tarea.estado === 'completada';

            return (
              <div key={tarea.id} className="relative">
                <span
                  className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white shadow-[0_0_0_2px_#E7E9F0] ${puntoPorPrioridad[tarea.prioridad] || 'bg-gray-300'}`}
                ></span>

                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold text-texto ${completada ? 'line-through text-muted' : ''}`}>
                      {tarea.titulo}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      <span className="bg-fondo px-1.5 py-0.5 rounded mr-1.5">
                        {tarea.proyecto || 'Sin proyecto'}
                      </span>
                      {tiempoRelativo(tarea.fecha_creacion)}
                    </p>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => setTareaEditando(tarea)}
                      className="text-muted hover:text-azul hover:bg-azul-suave p-1.5 rounded-md transition"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => borrarTarea(tarea.id)}
                      className="text-muted hover:text-rosa hover:bg-rosa-suave p-1.5 rounded-md transition"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6h12z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {tareaEditando && (
        <FormularioTarea
          tareaEditar={tareaEditando}
          onTareaCreada={onCambio}
          onCancelar={() => setTareaEditando(null)}
        />
      )}
    </>
  );
}

export default Recientes;