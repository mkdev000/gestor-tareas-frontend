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

  return (
    <ul>
      {tareas.map((tarea) => (
        <li key={tarea.id}>
          <strong>{tarea.titulo}</strong> — {tarea.prioridad}
          {' '}
          <select
            value={tarea.estado}
            onChange={(e) => cambiarEstado(tarea, e.target.value)}
          >
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En progreso</option>
            <option value="en_pausa">En pausa</option>
            <option value="completada">Completada</option>
          </select>
          {' '}
          <button onClick={() => borrarTarea(tarea.id)}>Borrar</button>
        </li>
      ))}
    </ul>
  );
}

export default ListaTareas;