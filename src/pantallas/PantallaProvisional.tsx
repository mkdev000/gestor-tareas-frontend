// pantallas/PantallaProvisional.tsx
// Contenido provisional de las pantallas que todavía no se han construido (Fase 4, paso 4.4).
// Cada una se rellena en su fase. El título lo pone la cabecera del marco (paso 4.5).
// Los enlaces de abajo son temporales y solo salen en pantallas estrechas (en las anchas ya está
// la barra lateral). En el paso 4.6 los sustituye la barra de abajo del móvil.
import { NavLink } from 'react-router-dom';

const ENLACES = [
  { ruta: '/hoy', texto: 'Mi día' },
  { ruta: '/tareas', texto: 'Tareas' },
  { ruta: '/calendario', texto: 'Calendario' },
  { ruta: '/ritmo', texto: 'Mi ritmo' },
  { ruta: '/ajustes', texto: 'Ajustes' },
];

function PantallaProvisional({ fase }: { fase: number }) {
  return (
    <div className="flex max-w-[1100px] flex-col gap-3">
      <nav aria-label="Pantallas (provisional)" className="flex flex-wrap gap-2 text-sm font-bold lg:hidden">
        {ENLACES.map((enlace) => (
          <NavLink
            key={enlace.ruta}
            to={enlace.ruta}
            className={({ isActive }) =>
              'rounded-full border px-3 py-1 ' +
              (isActive ? 'border-tachit-panel bg-tachit-panel text-tachit-tinta' : 'border-[#dde3ea] bg-white text-[#0f1f2e] hover:border-tachit-acento-borde')
            }
          >
            {enlace.texto}
          </NavLink>
        ))}
      </nav>
      <p className="text-sm text-[#5b6b7c]">Esta pantalla se construye en la Fase {fase}.</p>
    </div>
  );
}

export default PantallaProvisional;
