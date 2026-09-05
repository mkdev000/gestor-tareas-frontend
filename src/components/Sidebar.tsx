import { useNavigate } from 'react-router-dom';
import { colorPorTexto } from '../utils/colores';

interface Props {
  nombre: string;
  vistaActiva: string;
  setVistaActiva: (v: string) => void;
  busqueda: string;
  setBusqueda: (v: string) => void;
  proyectos: string[];
  contadorHoy: number;
  onAddTask: () => void;
  abierto: boolean;
  onCerrar: () => void;
}

function Sidebar({ nombre, vistaActiva, setVistaActiva, busqueda, setBusqueda, proyectos, contadorHoy, onAddTask, abierto, onCerrar }: Props) {
  const inicial = nombre.charAt(0).toUpperCase();
  const colorAvatar = colorPorTexto(nombre);
  const navigate = useNavigate();

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nombre');
    navigate('/login');
  };

  const seleccionar = (vista: string) => {
    setVistaActiva(vista);
    onCerrar();
  };

  const anadirTarea = () => {
    onAddTask();
    onCerrar();
  };

  return (
    <>
      {abierto && (
        <div
          onClick={onCerrar}
          className="md:hidden fixed inset-0 bg-black/40 z-40"
        ></div>
      )}

      <aside
        className={`w-64 bg-gradient-to-b from-marino to-marino-claro px-4 py-5 flex flex-col shrink-0 fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:static md:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={onCerrar}
          className="md:hidden self-end text-white/60 mb-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5 mb-5 px-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ring-2 ring-white/20"
            style={{ backgroundColor: colorAvatar }}
          >
            {inicial}
          </div>
          <span className="font-bold text-sm text-white">¡Hola, {nombre}!</span>
        </div>

        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md mb-6 transition focus-within:bg-white">
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            className="text-white/50 transition-colors flex-shrink-0 peer-focus:text-azul"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Buscador de tareas"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="peer bg-transparent border-none outline-none text-sm text-white placeholder:text-white/50 focus:placeholder:text-muted w-full focus:text-texto"
          />
        </div>

        <nav className="flex flex-col gap-0.5 mb-15">
          <button
            onClick={anadirTarea}
            className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-left w-full text-azul font-bold cursor-pointer hover:bg-white/10 transition mb-3 pb-3 border-b border-white/10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="flex-shrink-0">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            Añadir tarea
          </button>

          <ItemNav
            activo={vistaActiva === 'recientes'}
            onClick={() => seleccionar('recientes')}
            texto="Recientes"
            icono={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>}
          />
          <ItemNav
            activo={vistaActiva === 'hoy'}
            onClick={() => seleccionar('hoy')}
            texto="Hoy"
            badge={contadorHoy > 0 ? contadorHoy : undefined}
            icono={<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>}
          />
          <ItemNav
            activo={vistaActiva === 'proximo'}
            onClick={() => seleccionar('proximo')}
            texto="Próximo"
            icono={<path d="M5 12h14M13 6l6 6-6 6" />}
          />
          <ItemNav
            activo={vistaActiva === 'reportes'}
            onClick={() => seleccionar('reportes')}
            texto="Reportes"
            icono={<path d="M4 19V10M12 19V4M20 19v-6" />}
          />
          <ItemNav
            activo={vistaActiva === 'calendario'}
            onClick={() => seleccionar('calendario')}
            texto="Calendario"
            icono={<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>}
          />
        </nav>

        <div className="text-[11px] uppercase tracking-wide text-white/40 font-bold mb-2 px-1">
          Mis tareas
        </div>
        <div className="flex flex-col gap-0.5">
          {proyectos.length === 0 && (
            <p className="text-xs text-white/40 px-2">Aún no tienes proyectos</p>
          )}
          {proyectos.map((proyecto) => (
            <button
              key={proyecto}
              onClick={() => seleccionar(proyecto)}
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-left cursor-pointer transition ${vistaActiva === proyecto ? 'bg-azul/20 font-semibold text-azul' : 'text-white/70 hover:bg-white/10'}`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: colorPorTexto(proyecto) }}
              ></span>
              {proyecto}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-3 border-t border-white/10">
          <button
            onClick={cerrarSesion}
            className="group flex items-center gap-2.5 w-full px-2 py-2.5 rounded-lg text-sm text-left text-white/60 cursor-pointer transition"
          >
            <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 transition group-hover:bg-rosa/20">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="transition group-hover:text-rosa">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5M21 12H9" />
              </svg>
            </span>
            <span className="transition group-hover:text-rosa">Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}

interface ItemNavProps {
  activo: boolean;
  onClick: () => void;
  texto: string;
  icono: React.ReactNode;
  badge?: number;
}

function ItemNav({ activo, onClick, texto, icono, badge }: ItemNavProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-left w-full cursor-pointer transition ${activo ? 'bg-azul/20 text-azul font-semibold' : 'text-white/70 hover:bg-white/10'}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        {icono}
      </svg>
      {texto}
      {badge !== undefined && (
        <span className="ml-auto bg-ambar text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
          {badge}
        </span>
      )}
    </button>
  );
}

export default Sidebar;