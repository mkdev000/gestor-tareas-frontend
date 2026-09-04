import { useState } from 'react';

interface Tarea {
  id: number;
  titulo: string;
  estado: string;
  prioridad: string;
  proyecto: string;
  fecha_limite: string | null;
}

interface Props {
  onTareaCreada: () => void;
  onCancelar: () => void;
  tareaEditar?: Tarea;
}

const prioridades = [
  { valor: 'baja', texto: 'Baja', color: 'text-muted' },
  { valor: 'media', texto: 'Media', color: 'text-azul' },
  { valor: 'alta', texto: 'Alta', color: 'text-naranja' },
  { valor: 'urgente', texto: 'Urgente', color: 'text-rosa' },
];

const estados = [
  { valor: 'pendiente', texto: 'Pendiente', color: 'text-ambar' },
  { valor: 'completada', texto: 'Completada', color: 'text-verde' },
];

function FormularioTarea({ onTareaCreada, onCancelar, tareaEditar }: Props) {
  const esEdicion = !!tareaEditar;

  const [titulo, setTitulo] = useState(tareaEditar?.titulo || '');
  const [estado, setEstado] = useState(tareaEditar?.estado || 'pendiente');
  const [prioridad, setPrioridad] = useState(tareaEditar?.prioridad || 'media');
  const [proyecto, setProyecto] = useState(tareaEditar?.proyecto || '');
  const [fechaLimite, setFechaLimite] = useState(tareaEditar?.fecha_limite?.slice(0, 10) || '');
  const [error, setError] = useState('');

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem('token');
    const url = esEdicion
      ? `http://localhost:3000/api/tareas/${tareaEditar!.id}`
      : 'http://localhost:3000/api/tareas';
    const metodo = esEdicion ? 'PUT' : 'POST';

    try {
      const respuesta = await fetch(url, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo,
          descripcion: null,
          estado,
          prioridad,
          proyecto,
          fecha_limite: fechaLimite || null,
          hora_limite: null,
        }),
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json();
        setError(datos.mensaje || 'Error al guardar la tarea');
        return;
      }

      if (!esEdicion) {
        setTitulo('');
        setEstado('pendiente');
        setPrioridad('media');
        setProyecto('');
        setFechaLimite('');
      }

      onTareaCreada();
      onCancelar();

    } catch (err) {
      console.error(err);
      setError('No se pudo conectar con el servidor');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
      onClick={onCancelar}
    >
      <form
        onSubmit={manejarSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-full max-w-md relative"
      >
        <button
          type="button"
          onClick={onCancelar}
          className="absolute top-4 right-4 text-muted hover:text-texto text-lg leading-none cursor-pointer"
        >
          ✕
        </button>

        <p className="text-[10px] uppercase font-bold text-muted mb-2">
          {esEdicion ? 'Editar tarea' : 'Nueva tarea'}
        </p>

        <input
          id="input-nueva-tarea"
          type="text"
          placeholder="¿Qué necesitas hacer?"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          autoFocus
          className="w-full border-none outline-none text-lg font-semibold text-texto placeholder:text-gray-300 mb-4"
        />

        <div className="mb-3">
          <p className="text-[10px] uppercase font-bold text-muted mb-1.5">Prioridad</p>
          <div className="flex bg-fondo rounded-lg p-1 gap-0.5">
            {prioridades.map((p) => (
              <button
                key={p.valor}
                type="button"
                onClick={() => setPrioridad(p.valor)}
                className={`flex-1 rounded-md py-1.5 text-xs font-bold transition cursor-pointer ${
                  prioridad === p.valor
                    ? `bg-white shadow-sm ${p.color}`
                    : 'text-muted/60'
                }`}
              >
                {p.texto}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[10px] uppercase font-bold text-muted mb-1.5">Estado</p>
          <div className="flex bg-fondo rounded-lg p-1 gap-0.5">
            {estados.map((e) => (
              <button
                key={e.valor}
                type="button"
                onClick={() => setEstado(e.valor)}
                className={`flex-1 rounded-md py-1.5 text-xs font-bold transition cursor-pointer ${
                  estado === e.valor
                    ? `bg-white shadow-sm ${e.color}`
                    : 'text-muted/60'
                }`}
              >
                {e.texto}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mb-1">
          <input
            type="text"
            placeholder="Etiqueta"
            value={proyecto}
            onChange={(e) => setProyecto(e.target.value)}
            className="flex-1 bg-fondo text-texto text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-azul"
          />
          <input
            type="date"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
            className="flex-1 bg-fondo text-texto text-xs font-semibold rounded-lg px-3 py-2 outline-none cursor-pointer border-none"
          />
        </div>

        <button
          type="submit"
          className="w-full mt-4 bg-marino text-white text-sm font-bold rounded-full py-3 shadow-lg shadow-marino/30 hover:shadow-xl hover:shadow-azul/40 hover:bg-azul hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
        >
          {esEdicion ? 'Guardar cambios' : 'Crear tarea'}
        </button>

        {error && <p className="text-rosa text-sm text-center mt-3">{error}</p>}
      </form>
    </div>
  );
}

export default FormularioTarea;