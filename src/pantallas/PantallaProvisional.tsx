// pantallas/PantallaProvisional.tsx
// Contenido provisional de las pantallas que todavía no se han construido (Fase 4, paso 4.4).
// Cada una se rellena en su fase. Los enlaces de abajo son temporales: en el paso 4.5 los sustituye la barra lateral.
import { NavLink } from 'react-router-dom';

const ENLACES = [
  { ruta: '/hoy', texto: 'Mi día' },
  { ruta: '/tareas', texto: 'Tareas' },
  { ruta: '/calendario', texto: 'Calendario' },
  { ruta: '/ritmo', texto: 'Mi ritmo' },
  { ruta: '/ajustes', texto: 'Ajustes' },
];

function PantallaProvisional({ titulo, fase }: { titulo: string; fase: number }) {
  return (
    <main className="mx-auto flex max-w-[1100px] flex-col gap-3 px-4 py-8 sm:px-8">
      <nav aria-label="Pantallas (provisional)" className="flex flex-wrap gap-2 text-sm font-bold">
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
      <h1 className="mt-4 text-xl font-extrabold tracking-[-0.3px]">{titulo}</h1>
      <p className="text-sm text-[#5b6b7c]">Esta pantalla se construye en la Fase {fase}.</p>
    </main>
  );
}

export default PantallaProvisional;
