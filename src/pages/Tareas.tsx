import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormularioTarea from '../components/FormularioTarea';
import ListaTareas from '../components/ListaTareas';

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

function Tareas() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const obtenerTareas = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const respuesta = await fetch('http://localhost:3000/api/tareas', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (respuesta.status === 401 || respuesta.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const datos = await respuesta.json();
      setTareas(datos);

    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las tareas');
    }
  };

  useEffect(() => {
    obtenerTareas();
  }, []);

  return (
    <div>
      <h1>Mis tareas</h1>

      <FormularioTarea onTareaCreada={obtenerTareas} />

      {error && <p>{error}</p>}

      <ListaTareas tareas={tareas} onCambio={obtenerTareas} />
    </div>
  );
}

export default Tareas;