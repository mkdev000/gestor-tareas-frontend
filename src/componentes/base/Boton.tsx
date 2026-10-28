// componentes/base/Boton.tsx
// Los botones de Tachit, copiados del prototipo. Todos usan los colores del tema activo.
//  - "principal": el del color de acento, como "Nueva tarea" de la cabecera (puede llevar el + en un rombo)
//  - "suave":     fondo clarito y borde del tema, como "Probar una notificación" en Ajustes
//  - "borde":     blanco con borde gris, para acciones secundarias (por ejemplo, "Ver subtareas")
// Acepta todo lo que acepta un <button> normal (onClick, disabled, aria-label...).
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variante = 'principal' | 'suave' | 'borde';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  conMas?: boolean; // muestra el + dentro de un rombo, a la izquierda (como "Nueva tarea")
  children: ReactNode;
}

const COMUN =
  'inline-flex shrink-0 cursor-pointer items-center justify-center font-jakarta whitespace-nowrap ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento-fuerte ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const ESTILOS: Record<Variante, string> = {
  principal: 'boton-principal h-10 gap-2.5 rounded-xl border-0 bg-tachit-acento text-[13px] font-extrabold text-tachit-sobre-acento',
  suave: 'h-[38px] gap-2 rounded-[10px] border border-tachit-acento-borde bg-tachit-acento-claro px-3.5 text-sm font-bold text-tachit-acento-fuerte',
  borde: 'h-[34px] gap-2 rounded-full border border-[#dde3ea] bg-white px-3 text-[13px] font-semibold text-[#0f1f2e]',
};

function Boton({ variante = 'principal', conMas = false, type = 'button', className = '', children, ...resto }: Props) {
  // El principal deja menos espacio a la izquierda cuando lleva el + (igual que en el prototipo)
  const relleno = variante === 'principal' ? (conMas ? 'pr-4 pl-2.5' : 'px-4') : '';

  return (
    <button type={type} className={`${COMUN} ${ESTILOS[variante]} ${relleno} ${className}`} {...resto}>
      {conMas && <IconoMas />}
      {children}
    </button>
  );
}

// El + del botón principal: un cuadrado girado 45° (se ve como un rombo) y la cruz girada al revés para que quede recta
function IconoMas() {
  return (
    <span aria-hidden="true" className="flex h-[22px] w-[22px] rotate-45 items-center justify-center rounded-[7px] bg-tachit-panel text-tachit-panel-enlace">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" className="-rotate-45">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </span>
  );
}

export default Boton;
