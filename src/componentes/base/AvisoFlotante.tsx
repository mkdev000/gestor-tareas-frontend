// componentes/base/AvisoFlotante.tsx
// El aviso que aparece unos segundos (un "toast"), igual que en el prototipo:
//  - web: abajo a la derecha, blanco, con icono de Tachit, "Tachit · ahora", un título en negrita y una frase
//  - móvil (paso 4.6): arriba, de lado a lado, con el color del panel del tema (como en el prototipo móvil),
//    para que no lo tape la barra de abajo
// Se cierra solo a los 4,2 segundos (como en el prototipo).
// Paso 6.6: si el aviso trae "deshacer", lleva el botón Deshacer con un anillo que se vacía
// mientras dura el aviso (idea B elegida por ti, igual que en el prototipo v133).
// Paso 9.4: si el aviso trae "pregunta" (al tachar una tarea), el título sale tachado con rotulador y debajo
// pregunta «¿Cuánto has tardado?» con 4 botones: 15', 30', 1 h y «Lo previsto». Una rayita baja mientras dura.
// Si pasas el ratón por encima o entras con el teclado, el aviso se espera (no se cierra mientras lo usas).
import { useEffect, useId, useRef, useState, type FocusEvent } from 'react';

export interface DatosAviso {
  titulo: string;
  texto: string;
  deshacer?: () => void; // si está, sale el botón "Deshacer"
  duracionMs?: number; // cuánto dura (por defecto 4,2 s)
  tachado?: boolean; // el título va tachado con rotulador (la tarea que acabas de tachar)
  pregunta?: { duracion: number; alElegir: (minutos: number) => void }; // «¿Cuánto has tardado?»
}

// 45 → "45'", 60 → "1 h", 90 → "1 h 30'"
const corto = (min: number) => (min < 60 ? `${min}'` : `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60}'` : ''}`);
const largo = (min: number) => (min < 60 ? `${min} minutos` : `${Math.floor(min / 60)} h${min % 60 ? ` y ${min % 60} minutos` : ''}`);

const DURACION_MS = 4200;

function AvisoFlotante({ aviso, alCerrar }: { aviso: DatosAviso; alCerrar: () => void }) {
  const duracion = aviso.duracionMs ?? DURACION_MS;

  // Pausa: mientras el ratón está encima o el foco dentro, el reloj se para (y sigue donde iba al salir)
  const [pausado, setPausado] = useState(false);
  const restante = useRef(duracion);
  useEffect(() => {
    restante.current = duracion; // un aviso nuevo empieza con su tiempo entero
  }, [aviso, duracion]);
  useEffect(() => {
    if (pausado) return;
    const inicio = Date.now();
    const temporizador = setTimeout(alCerrar, restante.current);
    // Si el aviso cambia, se pausa o se sale de la pantalla antes de tiempo, paramos el temporizador
    // y apuntamos cuánto le quedaba
    return () => {
      clearTimeout(temporizador);
      restante.current = Math.max(0, restante.current - (Date.now() - inicio));
    };
  }, [aviso, alCerrar, pausado]);
  const idPregunta = useId();
  const alSalirFoco = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setPausado(false);
  };

  // Cada aviso nuevo cuenta como "otra vez" (vez + 1): así el anillo vuelve a empezar lleno
  // aunque llegue un aviso detrás de otro. Se hace mientras se dibuja, sin useEffect.
  const [ultimo, setUltimo] = useState(aviso);
  const [vez, setVez] = useState(0);
  if (aviso !== ultimo) {
    setUltimo(aviso);
    setVez((v) => v + 1);
    setPausado(false); // un aviso nuevo no hereda la pausa (en el móvil, el dedo no "sale" del aviso)
  }

  return (
    // role="status": los lectores de pantalla lo leen en voz alta sin interrumpir lo que estés haciendo
    <div
      role="status"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setPausado(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={alSalirFoco}
      data-pausado={pausado || undefined}
      className={
        'aviso-flotante fixed top-3 right-3.5 left-3.5 z-[70] flex items-center gap-2.5 rounded-[18px] bg-tachit-panel px-3.5 py-3 font-jakarta text-tachit-panel-texto shadow-[0_14px_30px_rgba(10,30,47,0.3)] ' +
        'lg:top-auto lg:right-6 lg:bottom-6 lg:left-auto lg:w-[360px] lg:items-start lg:gap-3 lg:rounded-[14px] lg:border lg:border-[#e3e8ef] lg:bg-white lg:px-4 lg:py-3.5 lg:text-[#0f1f2e] lg:shadow-[0_14px_40px_rgba(10,30,47,0.18)]'
      }
    >
      {/* Icono pequeño de Tachit (T tachada) con los colores del tema */}
      <svg viewBox="0 0 120 120" width="34" height="34" className="h-8 w-8 shrink-0 lg:h-[34px] lg:w-[34px]" aria-hidden="true">
        <rect width="120" height="120" rx="28" fill="var(--tachit-panel)" />
        <text x="58" y="92" textAnchor="middle" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="88" fill="var(--tachit-icono-t)">
          T
        </text>
        <path d="M16 64 H82 L91 75 L107 52" fill="none" stroke="var(--tachit-acento)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="min-w-0 grow">
        <p className="hidden text-xs font-semibold text-[#5b6b7c] lg:block">Tachit · ahora</p>
        <p className="text-sm font-extrabold lg:mt-px lg:text-[15px]">
          {aviso.tachado ? (
            <>
              <span className="aviso-tachado">{aviso.titulo}</span>
              <span className="sr-only"> (tachada)</span>
            </>
          ) : (
            aviso.titulo
          )}
        </p>
        {aviso.texto && <p className="text-xs text-tachit-panel-texto-suave lg:mt-0.5 lg:text-sm lg:text-[#33475b]">{aviso.texto}</p>}
        {aviso.pregunta && (
          <>
            <p id={idPregunta} className="aviso-pregunta">
              ¿Cuánto has tardado?
            </p>
            <div role="group" aria-labelledby={idPregunta} className="aviso-chips">
              {[15, 30, 60]
                .filter((m) => m !== aviso.pregunta!.duracion)
                .map((m) => (
                  <button key={m} type="button" className="aviso-chip" aria-label={`He tardado ${largo(m)}`} onClick={() => aviso.pregunta!.alElegir(m)}>
                    {corto(m)}
                  </button>
                ))}
              <button
                type="button"
                className="aviso-chip aviso-chip-previsto"
                aria-label={`He tardado lo previsto: ${largo(aviso.pregunta.duracion)}`}
                onClick={() => aviso.pregunta!.alElegir(aviso.pregunta!.duracion)}
              >
                Lo previsto · {corto(aviso.pregunta.duracion)}
              </button>
            </div>
            <span className="aviso-barra" aria-hidden="true">
              <i key={vez} style={{ animationDuration: `${duracion}ms` }} />
            </span>
          </>
        )}
      </div>
      {aviso.deshacer && (
        <button type="button" onClick={aviso.deshacer} className="aviso-deshacer">
          <svg key={vez} viewBox="0 0 18 18" className="aviso-deshacer-anillo" aria-hidden="true">
            <circle className="fondo" cx="9" cy="9" r="7" />
            <circle className="lleno" cx="9" cy="9" r="7" style={{ animationDuration: `${duracion}ms` }} />
          </svg>
          Deshacer
        </button>
      )}
    </div>
  );
}

export default AvisoFlotante;
