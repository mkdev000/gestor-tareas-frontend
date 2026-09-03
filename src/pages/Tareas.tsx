import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormularioTarea from '../components/FormularioTarea';
import ListaTareas from '../components/ListaTareas';
import Sidebar from '../components/Sidebar';
import { colorBarraPrioridad } from '../utils/prioridad';
import logo from '../assets/logo.png';

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
  const [vistaActiva, setVistaActiva] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const navigate = useNavigate();

  const nombre = localStorage.getItem('nombre') || 'Usuario';

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

  const hoy = new Date().toISOString().slice(0, 10);

  const tareasDeHoy = tareas.filter(
    (t) => t.fecha_limite && t.fecha_limite.slice(0, 10) === hoy && t.estado !== 'completada'
  );

  const proyectos = Array.from(
    new Set(tareas.map((t) => t.proyecto).filter((p) => p && p.trim() !== ''))
  ) as string[];

  const obtenerTareasFiltradas = (): Tarea[] => {
    if (busqueda.trim() !== '') {
      return tareas.filter((t) => t.titulo.toLowerCase().includes(busqueda.toLowerCase()));
    }
    if (vistaActiva === 'bandeja') {
      return tareas.filter((t) => !t.proyecto || t.proyecto.trim() === '');
    }
    if (vistaActiva === 'hoy') {
      return tareasDeHoy;
    }
    if (vistaActiva === 'proximo') {
      return tareas.filter((t) => t.fecha_limite && t.fecha_limite.slice(0, 10) > hoy);
    }
    if (vistaActiva === 'todas' || vistaActiva === 'reportes') {
      return tareas;
    }
    return tareas.filter((t) => t.proyecto === vistaActiva);
  };

  const completadas = tareas.filter((t) => t.estado === 'completada').length;
  const porcentaje = tareas.length > 0 ? Math.round((completadas / tareas.length) * 100) : 0;

  const prioridades = ['urgente', 'alta', 'media', 'baja'];
  const conteoPorProyecto = proyectos.map((p) => ({
    nombre: p,
    total: tareas.filter((t) => t.proyecto === p).length,
  }));

  const obtenerTitulo = (): string => {
    if (busqueda.trim() !== '') return 'Resultados de búsqueda';
    switch (vistaActiva) {
      case 'todas': return 'Todas tus tareas';
      case 'bandeja': return 'Bandeja de entrada';
      case 'hoy': return 'Hoy';
      case 'proximo': return 'Próximo';
      default: return vistaActiva;
    }
  };

  const obtenerSubtitulo = (): string => {
    if (busqueda.trim() !== '') return `${obtenerTareasFiltradas().length} tareas encontradas`;
    switch (vistaActiva) {
      case 'todas': return 'Todo lo que tienes por hacer, en un solo sitio.';
      case 'bandeja': return 'Tareas que aún no has organizado en ningún proyecto.';
      case 'hoy': return 'Lo que toca resolver antes de que acabe el día.';
      case 'proximo': return 'Lo que se acerca, para que no te pille por sorpresa.';
      default: return `Todo lo relacionado con "${vistaActiva}", en un solo sitio.`;
    }
  };

  const abrirFormulario = () => {
    setMostrarFormulario(true);
  };

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar
        nombre={nombre}
        vistaActiva={vistaActiva}
        setVistaActiva={setVistaActiva}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        proyectos={proyectos}
        contadorHoy={tareasDeHoy.length}
        onAddTask={abrirFormulario}
      />

      <main className="relative flex-1 px-8 py-10 overflow-hidden">
        <img
  src={logo}
  alt=""
  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-150 opacity-[0.05] pointer-events-none select-none"
/>

        <div className="relative z-10 max-w-2xl mx-auto">

          {mostrarFormulario && (
            <FormularioTarea
              onTareaCreada={obtenerTareas}
              onCancelar={() => setMostrarFormulario(false)}
            />
          )}

          {vistaActiva === 'reportes' ? (
            <div>
              <h1 className="font-bold text-xl text-marino mb-1">Reportes</h1>
              <p className="text-sm text-muted mb-6">Un vistazo a cómo llevas tus tareas</p>

              <div className="border border-gray-200 rounded-xl p-5 mb-6">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm font-semibold text-texto">Progreso general</span>
                  <span className="text-sm font-bold text-verde">{porcentaje}%</span>
                </div>
                <div className="w-full h-2 bg-fondo rounded-full overflow-hidden">
                  <div className="h-full bg-verde rounded-full" style={{ width: `${porcentaje}%` }}></div>
                </div>
                <p className="text-xs text-muted mt-2">
                  {completadas} de {tareas.length} tareas completadas
                </p>
              </div>

              <div className="border border-gray-200 rounded-xl p-5 mb-6">
                <span className="text-sm font-semibold text-texto block mb-3">Por prioridad</span>
                <div className="flex flex-col gap-2.5">
                  {prioridades.map((p) => {
                    const total = tareas.filter((t) => t.prioridad === p).length;
                    const ancho = tareas.length > 0 ? (total / tareas.length) * 100 : 0;
                    return (
                      <div key={p}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize text-texto">{p}</span>
                          <span className="text-muted">{total}</span>
                        </div>
                        <div className="w-full h-1.5 bg-fondo rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colorBarraPrioridad(p)}`} style={{ width: `${ancho}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {conteoPorProyecto.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-5">
                  <span className="text-sm font-semibold text-texto block mb-3">Por proyecto</span>
                  <div className="flex flex-col gap-2.5">
                    {conteoPorProyecto.map((p) => {
                      const ancho = tareas.length > 0 ? (p.total / tareas.length) * 100 : 0;
                      return (
                        <div key={p.nombre}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-texto">{p.nombre}</span>
                            <span className="text-muted">{p.total}</span>
                          </div>
                          <div className="w-full h-1.5 bg-fondo rounded-full overflow-hidden">
                            <div className="h-full bg-azul rounded-full" style={{ width: `${ancho}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : tareas.length === 0 ? (
            <div className="text-center mt-20">
              <h1 className="font-bold text-2xl text-marino mb-2">¡Hola, {nombre}!</h1>
              <p className="text-muted mb-6">Aún no tienes ninguna tarea añadida.</p>
              <button
                onClick={abrirFormulario}
                className="bg-marino text-white font-semibold rounded-lg px-6 py-3 hover:opacity-90 transition"
              >
                Crear mi primera tarea
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-bold text-xl text-marino mb-1">{obtenerTitulo()}</h1>
              <p className="text-sm text-muted mb-6">{obtenerSubtitulo()}</p>

              {error && <p className="text-rosa text-sm mb-4">{error}</p>}
              <ListaTareas tareas={obtenerTareasFiltradas()} onCambio={obtenerTareas} />
            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default Tareas;