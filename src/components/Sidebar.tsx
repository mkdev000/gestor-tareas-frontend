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
}

function Sidebar({ nombre, vistaActiva, setVistaActiva, busqueda, setBusqueda, proyectos, contadorHoy, onAddTask }: Props) {
  const inicial = nombre.charAt(0).toUpperCase();
  const colorAvatar = colorPorTexto(nombre);
  const navigate = useNavigate();

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nombre');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-[#F6FBFE] border-r border-gray-200 px-4 py-5 flex flex-col shrink-0">
      <div className="flex items-center gap-2.5 mb-5 px-1">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: colorAvatar }}
        >
          {inicial}
        </div>
        <span className="font-bold text-sm text-marino">¡Hola, {nombre}!</span>
      </div>

      <div className="mb-10 relative">
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Buscador de tareas"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-full pl-9 pr-3 py-2 text-sm text-texto outline-none shadow-sm focus:border-azul focus:ring-2 focus:ring-azul/15 transition"
        />
      </div>

      <nav className="flex flex-col gap-0.5 mb-15">
        <button
          onClick={onAddTask}
          className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-left w-full text-marino font-bold cursor-pointer hover:bg-white transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="flex-shrink-0">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          Añadir tarea
        </button>

        <ItemNav
          activo={vistaActiva === 'bandeja'}
          onClick={() => setVistaActiva('bandeja')}
          texto="Bandeja de entrada"
          icono={<path d="M4 12h4l2 3h4l2-3h4M5 12l1.5-7h11L19 12v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-6z" />}
        />
        <ItemNav
          activo={vistaActiva === 'hoy'}
          onClick={() => setVistaActiva('hoy')}
          texto="Hoy"
          badge={contadorHoy > 0 ? contadorHoy : undefined}
          icono={<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>}
        />
        <ItemNav
          activo={vistaActiva === 'proximo'}
          onClick={() => setVistaActiva('proximo')}
          texto="Próximo"
          icono={<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4M8 14h2M14 14h2M8 17h2" /></>}
        />
        <ItemNav
          activo={vistaActiva === 'reportes'}
          onClick={() => setVistaActiva('reportes')}
          texto="Reportes"
          icono={<path d="M4 19V10M12 19V4M20 19v-6" />}
        />
      </nav>

      <div className="text-[11px] uppercase tracking-wide text-muted font-bold mb-2 px-1">
        Mis proyectos
      </div>
      <div className="flex flex-col gap-0.5">
        {proyectos.length === 0 && (
          <p className="text-xs text-muted px-2">Aún no tienes proyectos</p>
        )}
        {proyectos.map((proyecto) => (
          <button
            key={proyecto}
            onClick={() => setVistaActiva(proyecto)}
            className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-left cursor-pointer transition ${vistaActiva === proyecto ? 'bg-white font-semibold text-marino' : 'text-texto hover:bg-white'}`}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: colorPorTexto(proyecto) }}
            ></span>
            {proyecto}
          </button>
        ))}
      </div>

      <div className="mt-auto pt-3 border-t border-gray-200">
        <button
          onClick={cerrarSesion}
          className="flex items-center gap-2.5 w-full px-2 py-2.5 rounded-lg text-sm text-left text-muted hover:bg-rosa-suave hover:text-rosa cursor-pointer transition"
        >
          <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5M21 12H9" />
            </svg>
          </span>
          Cerrar sesión
        </button>
      </div>
    </aside>
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
      className={`flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-left w-full cursor-pointer transition ${activo ? 'bg-white text-azul font-semibold' : 'text-texto hover:bg-white'}`}
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