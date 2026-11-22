// pantallas/ritmo/EjemploRitmo.tsx
// Cuando una sección de Mi ritmo aún no tiene datos tuyos (Fase 9, paso 9.5), en vez de un mensaje vacío:
//  - un EJEMPLO de cómo será, sujeto con un clip («EJEMPLO · así se verá»), apagado y sin poder tocarlo
//  - debajo, «PARA VER LO TUYO»: lo que tienes que hacer para que salga lo tuyo, con su casilla y un enlace para empezar
// Lo usan «Lo que se te atasca», «Lo que tardas de verdad», «A qué le das tu tiempo» y «¿Lo importante, primero?».
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode; // el dibujo del ejemplo (sin botones de verdad)
  reto: string; // «Pasa una tarea de día 2 veces»
  cuenta?: string; // «1 de 3», si se puede contar
  nota?: string; // una línea entre el ejemplo y «Para ver lo tuyo» (la buena noticia de «Nada atascado»)
  // adónde lleva el enlace; con nuevaTarea, abre «Nueva tarea» en Tareas (y con prioridad, ya puesta)
  enlace: { texto: string; a: string; nuevaTarea?: boolean; prioridad?: 'alta' };
}

export function EjemploRitmo({ children, reto, cuenta, nota, enlace }: Props) {
  const navigate = useNavigate();
  return (
    <>
      <div className="ritmo-ejemplo">
        <span className="ritmo-ejemplo-clip" aria-hidden="true">
          <svg width="12" height="26" viewBox="0 0 12 26" fill="none" stroke="#8a97a8" strokeWidth="1.6" strokeLinecap="round">
            <path d="M3 9V4.5a3 3 0 0 1 6 0V19a4 4 0 0 1-8 0V8" />
          </svg>
          <span>
            EJEMPLO <em>así se verá</em>
          </span>
        </span>
        <p className="sr-only">Ejemplo de cómo se verá esta sección cuando tengas datos.</p>
        {/* inert: no se puede tocar ni llegar con el teclado; aria-hidden: el lector de pantalla no lo lee como si fuera tuyo */}
        <div className="ritmo-ejemplo-contenido" aria-hidden="true" inert>
          {children}
        </div>
      </div>
      {nota && <p className="ritmo-ejemplo-bien">{nota}</p>}
      <div className="ritmo-reto">
        <span className="ritmo-reto-casilla" aria-hidden="true" />
        <span className="ritmo-reto-texto">
          <small>PARA VER LO TUYO</small>
          {reto}
        </span>
        {cuenta && <span className="ritmo-reto-cuenta">{cuenta}</span>}
        <button
          type="button"
          className="ritmo-reto-ir"
          onClick={() =>
            navigate(
              enlace.a,
              enlace.nuevaTarea ? { state: { nuevaTarea: Date.now(), ...(enlace.prioridad ? { prioridad: enlace.prioridad } : {}) } } : undefined,
            )
          }
        >
          {enlace.texto} →
        </button>
      </div>
    </>
  );
}

// Un botón de mentira para los ejemplos (se ve como uno de verdad, pero no hace nada)
export const BotonFalso = ({ texto, recomendado = false }: { texto: string; recomendado?: boolean }) => (
  <span className={'ritmo-boton-falso' + (recomendado ? ' recomendado' : '')}>{texto}</span>
);
