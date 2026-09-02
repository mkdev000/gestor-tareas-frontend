import { useState } from 'react';

interface Props {
  onTareaCreada: () => void;
}

function FormularioTarea({ onTareaCreada }: Props) {
  const [titulo, setTitulo] = useState('');
  const [estado, setEstado] = useState('pendiente');
  const [prioridad, setPrioridad] = useState('media');
  const [proyecto, setProyecto] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [error, setError] = useState('');

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem('token');

    try {
      const respuesta = await fetch('http://localhost:3000/api/tareas', {
        method: 'POST',
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
        setError(datos.mensaje || 'Error al crear la tarea');
        return;
      }

      setTitulo('');
      setEstado('pendiente');
      setPrioridad('media');
      setProyecto('');
      setFechaLimite('');

      onTareaCreada();

    } catch (err) {
      console.error(err);
      setError('No se pudo conectar con el servidor');
    }
  };

  return (
    <form onSubmit={manejarSubmit} className="border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
      <input
        type="text"
        placeholder="¿Qué necesitas hacer?"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        required
        className="bg-fondo rounded-lg px-4 py-3 text-sm text-texto outline-none focus:ring-1 focus:ring-azul"
      />

      <div className="grid grid-cols-2 gap-3">
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="bg-fondo rounded-lg px-3 py-2 text-sm text-texto outline-none"
        >
          <option value="pendiente">Pendiente</option>
          <option value="en_progreso">En progreso</option>
          <option value="en_pausa">En pausa</option>
          <option value="completada">Completada</option>
        </select>

        <select
          value={prioridad}
          onChange={(e) => setPrioridad(e.target.value)}
          className="bg-fondo rounded-lg px-3 py-2 text-sm text-texto outline-none"
        >
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Proyecto (ej. Casa)"
          value={proyecto}
          onChange={(e) => setProyecto(e.target.value)}
          className="bg-fondo rounded-lg px-3 py-2 text-sm text-texto outline-none focus:ring-1 focus:ring-azul"
        />
        <input
          type="date"
          value={fechaLimite}
          onChange={(e) => setFechaLimite(e.target.value)}
          className="bg-fondo rounded-lg px-3 py-2 text-sm text-texto outline-none focus:ring-1 focus:ring-azul"
        />
      </div>

      <button
        type="submit"
        className="bg-marino text-white font-semibold rounded-lg py-3 mt-1 hover:opacity-90 transition"
      >
        Crear tarea
      </button>

      {error && <p className="text-rosa text-sm text-center">{error}</p>}
    </form>
  );
}

export default FormularioTarea;