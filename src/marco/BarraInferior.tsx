// marco/BarraInferior.tsx
// La barra de abajo del móvil (Fase 4, paso 4.6), igual que en el prototipo móvil:
// Menú · Hoy · el rombo + (nueva tarea) · Tareas · Calendario.
//  - el apartado elegido lleva una pastilla de color que se desvanece hacia abajo (opción A)
//  - Tareas lleva el mini anillo de hoy (el número = pendientes; se llena con las hechas hoy)
// Flota sobre la página (position: fixed) y solo sale en pantallas estrechas (lg:hidden en MarcoApp).
import { NavLink, useLocation } from 'react-router-dom';
import { Icono } from './iconos';

const PERIMETRO = 47.12; // 2 · π · 7,5 (el radio del mini anillo)

function MiniAnillo({ pendientes, hechasHoy }: { pendientes: number; hechasHoy: number }) {
  const total = pendientes + hechasHoy;
  const hueco = total ? PERIMETRO * (1 - hechasHoy / total) : PERIMETRO;
  const todoHecho = pendientes === 0 && hechasHoy > 0;
  return (
    <span className="mini-anillo" role="img" aria-label={`${pendientes} pendientes · ${hechasHoy} hechas hoy`}>
      <svg width="19" height="19" viewBox="0 0 19 19" aria-hidden="true">
        <circle className="mini-anillo-fondo" cx="9.5" cy="9.5" r="7.5" fill="none" strokeWidth="2" />
        <circle className="mini-anillo-lleno" cx="9.5" cy="9.5" r="7.5" fill="none" strokeWidth="2" strokeLinecap="round" strokeDasharray={PERIMETRO} strokeDashoffset={hueco} />
      </svg>
      <span className="relative" aria-hidden="true">
        {todoHecho ? '✓' : pendientes > 99 ? '99+' : pendientes}
      </span>
    </span>
  );
}

interface Props {
  pendientes: number;
  hechasHoy: number;
  menuAbierto: boolean;
  alAbrirMenu: () => void;
  alNuevaTarea: () => void;
}

function BarraInferior({ pendientes, hechasHoy, menuAbierto, alAbrirMenu, alNuevaTarea }: Props) {
  const { pathname } = useLocation();
  // "Menú" se marca si está abierto o si estás en una pantalla que solo se abre desde él (Mi ritmo, Ajustes)
  const menuMarcado = menuAbierto || pathname === '/ritmo' || pathname === '/ajustes';

  return (
    <nav aria-label="Principal" className="barra-inferior">
      <button type="button" className={'pestana' + (menuMarcado ? ' marcada' : '')} onClick={alAbrirMenu} aria-expanded={menuAbierto} aria-haspopup="dialog">
        <Icono trazo="menu" tamano={22} className="pestana-icono" />
        <span className="pestana-texto">Menú</span>
      </button>

      <NavLink to="/hoy" end className={({ isActive }) => 'pestana' + (isActive ? ' marcada' : '')}>
        <Icono trazo="hoy" tamano={22} className="pestana-icono" />
        <span className="pestana-texto">Hoy</span>
      </NavLink>

      <div className="flex justify-center">
        <button type="button" className="boton-crear" onClick={alNuevaTarea} aria-label="Nueva tarea">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <NavLink to="/tareas" end className={({ isActive }) => 'pestana' + (isActive ? ' marcada' : '')}>
        <span className="pestana-icono relative flex">
          <Icono trazo="tareas" tamano={22} />
          <MiniAnillo pendientes={pendientes} hechasHoy={hechasHoy} />
        </span>
        <span className="pestana-texto">Tareas</span>
      </NavLink>

      <NavLink to="/calendario" end className={({ isActive }) => 'pestana' + (isActive ? ' marcada' : '')}>
        <Icono trazo="calendario" tamano={22} className="pestana-icono" />
        <span className="pestana-texto">Calendario</span>
      </NavLink>
    </nav>
  );
}

export default BarraInferior;
