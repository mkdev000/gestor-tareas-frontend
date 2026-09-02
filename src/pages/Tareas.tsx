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

const coloresAvatar = ['#4daeea', '#0a1e2f', '#2FB380', '#F5A524', '#FF6B8A'];

function colorPorNombre(nombre: string) {
  let suma = 0;
  for (let i = 0; i < nombre.length; i++) {
    suma += nombre.charCodeAt(i);
  }
  return coloresAvatar[suma % coloresAvatar.length];
}

function Tareas() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const nombre = localStorage.getItem('nombre') || 'Usuario';
  const inicial = nombre.charAt(0).toUpperCase();
  const colorAvatar = colorPorNombre(nombre);

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

  const completadas = tareas.filter((t) => t.estado === 'completada').length;
  const pendientes = tareas.length - completadas;

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ backgroundColor: colorAvatar }}
          >
            {inicial}
          </div>
          <h1 className="font-bold text-xl text-marino">
            ¡Hola, {nombre}!
          </h1>
        </div>
        <p className="text-azul text-sm font-semibold pl-14 mb-4">
          ¿Qué necesitas organizar hoy?
        </p>

        <div className="flex gap-4 pl-14 mb-6 text-sm">
          <span className="text-ambar font-semibold">{pendientes} pendientes</span>
          <span className="text-verde font-semibold">{completadas} completadas</span>
        </div>

        <FormularioTarea onTareaCreada={obtenerTareas} />

        {error && <p className="text-rosa text-sm mt-4">{error}</p>}

        <div className="mt-6">
          <ListaTareas tareas={tareas} onCambio={obtenerTareas} />
        </div>

      </div>
    </div>
  );
}

export default Tareas;