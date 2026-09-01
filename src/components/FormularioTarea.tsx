import { useState } from 'react';

interface Props {
  onTareaCreada: () => void;
}

function FormularioTarea({ onTareaCreada }: Props) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
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
          descripcion,
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
      setDescripcion('');
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
    <form onSubmit={manejarSubmit}>
      <input
        type="text"
        placeholder="Título"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        required
      />
      <textarea
        placeholder="Descripción"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
      />
      <select value={estado} onChange={(e) => setEstado(e.target.value)}>
        <option value="pendiente">Pendiente</option>
        <option value="en_progreso">En progreso</option>
        <option value="en_pausa">En pausa</option>
        <option value="completada">Completada</option>
      </select>
      <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
        <option value="baja">Baja</option>
        <option value="media">Media</option>
        <option value="alta">Alta</option>
        <option value="urgente">Urgente</option>
      </select>
      <input
        type="text"
        placeholder="Proyecto (ej. Casa, Trabajo)"
        value={proyecto}
        onChange={(e) => setProyecto(e.target.value)}
      />
      <input
        type="date"
        value={fechaLimite}
        onChange={(e) => setFechaLimite(e.target.value)}
      />
      <button type="submit">Crear tarea</button>
      {error && <p>{error}</p>}
    </form>
  );
}

export default FormularioTarea;