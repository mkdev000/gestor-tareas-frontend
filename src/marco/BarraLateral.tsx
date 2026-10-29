// marco/BarraLateral.tsx
// La barra lateral de la web (Fase 4, paso 4.5), igual que en el prototipo:
//  - el logo de Tachit con los colores del tema
//  - los 5 apartados: el elegido lleva un fondo que se desvanece y el subrayado suave de Tachit
//  - el anillo de hoy en "Tareas" (el número = pendientes; el anillo se llena con las hechas hoy)
//  - "Categorías · esta semana": un trocito por tarea; al acabarlas todas, el nombre se tacha
//  - el "pase" de abajo: tu nombre, cómo entraste (Google o email) y el botón de salir
// Los colores salen de las variables del tema (--tachit-...), así cambia sola al cambiar de tema.
import { useLocation, NavLink, Link } from 'react-router-dom';
import LogoTachit from '../components/LogoTachit';
import { useTema } from '../tema/contextoTema';
import type { ResumenBarra, ResumenCategoria } from './useResumenBarra';
import { Icono } from './iconos';
import { useCuenta } from './useCuenta';
import { ChipMetodo, IconoSalir } from './cuenta';

// ---------- Los apartados ----------
const APARTADOS = [
  { ruta: '/hoy', texto: 'Mi día', icono: 'hoy' },
  { ruta: '/tareas', texto: 'Tareas', icono: 'tareas' },
  { ruta: '/calendario', texto: 'Calendario', icono: 'calendario' },
  { ruta: '/ritmo', texto: 'Mi ritmo', icono: 'ritmo' },
  { ruta: '/ajustes', texto: 'Ajustes', icono: 'ajustes' },
] as const;

// El subrayado suave de Tachit: una línea que acaba en un pequeño check
function Subrayado() {
  return (
    <svg className="barra-subrayado" viewBox="0 0 100 9" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 4 H80 L86 8 L98 1" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------- El anillo de hoy ----------
const PERIMETRO = 65.97; // 2 · π · 10,5 (el radio del círculo)

function AnilloDeHoy({ pendientes, hechasHoy }: { pendientes: number; hechasHoy: number }) {
  const total = pendientes + hechasHoy;
  // stroke-dashoffset: cuánto trazo se "esconde". Todo escondido = vacío; 0 = lleno
  const hueco = total ? PERIMETRO * (1 - hechasHoy / total) : PERIMETRO;
  const todoHecho = pendientes === 0 && hechasHoy > 0;

  return (
    <span className="barra-anillo" role="img" aria-label={`${pendientes} pendientes · ${hechasHoy} hechas hoy`}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <circle className="barra-anillo-fondo" cx="13" cy="13" r="10.5" fill="none" strokeWidth="2.5" />
        <circle
          className="barra-anillo-lleno"
          cx="13"
          cy="13"
          r="10.5"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={PERIMETRO}
          strokeDashoffset={hueco}
        />
      </svg>
      <span className="relative" aria-hidden="true">
        {todoHecho ? '✓' : pendientes}
      </span>
    </span>
  );
}

// ---------- Categorías · esta semana ----------
const ES_COLOR = /^#[0-9a-f]{6}$/i; // solo #1a2b3c: así nunca se cuela nada raro en el estilo
const COLOR_POR_DEFECTO = '#7d8cf0';
const MAXIMO_TROZOS = 10; // con más tareas, una barra continua (si no, los trocitos serían diminutos)

// Mezcla un color con blanco (0,45 = 45 % más claro). En Cacao, el fondo es oscuro
// y los colores de las categorías se leen mejor un poco más claros.
function aclarar(hex: string, cuanto: number) {
  const n = parseInt(hex.slice(1), 16);
  const canales = [n >> 16, (n >> 8) & 255, n & 255];
  return '#' + canales.map((c) => Math.round(c + (255 - c) * cuanto).toString(16).padStart(2, '0')).join('');
}

function FilaCategoria({ categoria, activa, oscuro }: { categoria: ResumenCategoria; activa: boolean; oscuro: boolean }) {
  const { total, hechas } = categoria;
  const base = ES_COLOR.test(categoria.color) ? categoria.color : COLOR_POR_DEFECTO;
  const color = oscuro ? aclarar(base, 0.45) : base;
  const apagado = `${color}38`; // "38" al final = 22 % de opacidad: el trocito sin hacer
  const vacia = total === 0;
  const completa = !vacia && hechas === total;

  return (
    <Link
      to={`/tareas?categoria=${categoria.id}`}
      className={'barra-categoria' + (activa ? ' activa' : '')}
      aria-current={activa ? 'page' : undefined}
    >
      <span className="flex items-baseline gap-2">
        <span className={'barra-categoria-nombre' + (vacia ? ' vacia' : completa ? ' completa' : '')}>
          {categoria.nombre}
          {completa && (
            // El trazo de Tachit tacha el nombre: ¡categoría terminada esta semana!
            <svg className="barra-tachon" viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 6 H96 L104 10 L118 1" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span className="barra-categoria-cuenta">{vacia ? 'Sin tareas' : `${hechas}/${total}${completa ? ' ✓' : ''}`}</span>
      </span>
      {!vacia && total <= MAXIMO_TROZOS && (
        <span className="flex gap-1" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < hechas ? color : apagado }} />
          ))}
        </span>
      )}
      {total > MAXIMO_TROZOS && (
        <span className="block h-1.5 overflow-hidden rounded-full" style={{ background: apagado }} aria-hidden="true">
          <span className="block h-full rounded-full" style={{ background: color, width: `${Math.round((hechas / total) * 100)}%` }} />
        </span>
      )}
    </Link>
  );
}

// Orden: primero las que tienen tareas por hacer, luego las terminadas y al final las que no tienen tareas
// (dentro de cada grupo se respeta el orden alfabético que manda el servidor)
function grupo(c: ResumenCategoria) {
  if (c.total === 0) return 2;
  return c.hechas === c.total ? 1 : 0;
}

// ---------- La barra entera ----------
// Los datos (anillo y categorías) llegan del marco (MarcoApp), que los pide una sola vez
function BarraLateral({ resumen }: { resumen: ResumenBarra }) {
  const location = useLocation();
  const { tema } = useTema();
  const { pendientes, hechasHoy, categorias } = resumen;
  const { nombre, inicial, metodo, salir } = useCuenta();

  // ¿Qué categoría estás mirando? (/tareas?categoria=3 → la 3)
  const categoriaActiva = location.pathname === '/tareas' ? new URLSearchParams(location.search).get('categoria') : null;
  const ordenadas = [...categorias].sort((a, b) => grupo(a) - grupo(b));

  return (
    <nav aria-label="Principal" className="barra-lateral sticky top-0 flex h-screen w-[248px] shrink-0 flex-col gap-1.5 px-4 py-6">
      <div className="flex items-center px-2 pb-[22px] text-tachit-tinta">
        <LogoTachit ancho={128} colorCheck="var(--tachit-acento)" />
      </div>

      {APARTADOS.map((apartado) => (
        <NavLink
          key={apartado.ruta}
          to={apartado.ruta}
          // "end": /tareas?categoria=3 sigue marcando "Tareas", pero no se confunde con otras rutas
          end
          className="barra-apartado"
        >
          {({ isActive }) => (
            <>
              <Icono trazo={apartado.icono} className="barra-icono" />
              <span className="relative">
                {apartado.texto}
                {isActive && <Subrayado />}
              </span>
              {apartado.ruta === '/tareas' && <AnilloDeHoy pendientes={pendientes} hechasHoy={hechasHoy} />}
            </>
          )}
        </NavLink>
      ))}

      {/* Si aún no tienes categorías, la sección no sale (su estado vacío se diseña en la Fase 5) */}
      {ordenadas.length > 0 && (
        <>
          <div className="barra-seccion mx-2 mt-[22px] mb-2 text-[11px] font-bold tracking-[1.2px]">
            CATEGORÍAS<span className="ml-1 font-semibold tracking-normal">· esta semana</span>
          </div>
          {/* Si hay muchas, solo esta parte se desplaza: el pase de abajo siempre se ve */}
          <div className="barra-sin-scroll -mx-1 flex min-h-0 flex-col gap-1.5 overflow-y-auto px-1">
            {ordenadas.map((categoria) => (
              <FilaCategoria
                key={categoria.id}
                categoria={categoria}
                activa={categoriaActiva === String(categoria.id)}
                oscuro={tema === 'cacao'}
              />
            ))}
          </div>
        </>
      )}

      {/* El pase: como una entrada de concierto, con dos muescas y una línea de corte antes de "salir" */}
      <div className="barra-pase">
        <span className="barra-pase-avatar" aria-hidden="true">
          {inicial}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="barra-pase-nombre truncate">{nombre}</span>
          <ChipMetodo metodo={metodo} className="barra-pase-chip" />
        </div>
        <span className="barra-pase-corte" aria-hidden="true" />
        <button type="button" onClick={salir} className="boton-salir" aria-label="Cerrar sesión" title="Cerrar sesión">
          <IconoSalir />
        </button>
      </div>
    </nav>
  );
}

export default BarraLateral;
