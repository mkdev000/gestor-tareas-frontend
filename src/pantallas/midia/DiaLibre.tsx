// pantallas/midia/DiaLibre.tsx
// Mi día cuando hoy no tienes ninguna tarea: «Día libre… ¿o adelantas algo?» (Fase 7, paso 7.8),
// igual que el prototipo, en la web y en el móvil.
//  - SelloDiaLibre: el sello «DÍA LIBRE · NADA APUNTADO PARA HOY» con un «+» fino en la esquina.
//    Al pulsarlo sale un bocadillo pequeño: «No tienes nada apuntado para hoy. ¿Empezamos?» y
//    «+ Crear una tarea». Se cierra con la ×, con Escape o pulsando fuera.
//  - AdelantarAlgo: las 3 tareas más cercanas de los próximos días con «Traer a hoy», que la pone
//    hoy en tu primer hueco libre. Si no hay ninguna, un texto y el botón para crear.
// Los cálculos (esDiaLibre, proximasTareas) están en dia.ts; lo que se guarda lo hace MiDia.tsx.
import { useEffect, useId, useRef, useState } from 'react';
import type { Proxima } from './dia';

interface PropsSello {
  alCrear: () => void; // abre Nueva tarea para hoy (sin hora)
  movil?: boolean;
}

export function SelloDiaLibre({ alCrear, movil = false }: PropsSello) {
  const [abierto, setAbierto] = useState(false);
  const zona = useRef<HTMLDivElement>(null);
  const sello = useRef<HTMLButtonElement>(null);
  const crear = useRef<HTMLButtonElement>(null);
  const idBocadillo = useId();
  const idTitulo = useId();

  // Al abrir, el foco va a «Crear una tarea»; mientras está abierto, tocar fuera lo cierra
  useEffect(() => {
    if (!abierto) return;
    crear.current?.focus();
    const alTocarFuera = (e: PointerEvent) => {
      if (!zona.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('pointerdown', alTocarFuera);
    return () => document.removeEventListener('pointerdown', alTocarFuera);
  }, [abierto]);

  // Cerrar con la × o con Escape: el foco vuelve al sello (para seguir con el teclado donde estabas)
  const cerrar = () => {
    setAbierto(false);
    sello.current?.focus();
  };

  return (
    <div
      ref={zona}
      className={movil ? 'libre-zona libre-zona-movil' : 'libre-zona'}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && abierto) {
          e.preventDefault();
          cerrar();
        }
      }}
      // Si con el tabulador sales del bocadillo, se cierra
      onBlur={(e) => {
        if (abierto && !e.currentTarget.contains(e.relatedTarget as Node | null)) setAbierto(false);
      }}
    >
      <button
        ref={sello}
        type="button"
        className="libre-sello"
        aria-expanded={abierto}
        aria-controls={idBocadillo}
        aria-label="Día libre, nada apuntado para hoy. Pulsa para crear una tarea"
        onClick={() => setAbierto((a) => !a)}
      >
        DÍA LIBRE
        <small>NADA APUNTADO PARA HOY</small>
        <span className="libre-mas" aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M12 6v12M6 12h12" />
          </svg>
        </span>
      </button>
      {abierto && (
        <div id={idBocadillo} role="dialog" aria-labelledby={idTitulo} className="libre-pop">
          <button type="button" className="libre-x" aria-label="Cerrar" onClick={cerrar}>
            ×
          </button>
          <p id={idTitulo} className="libre-pop-titulo">
            No tienes nada apuntado para hoy.
          </p>
          <p className="libre-pop-texto">¿Empezamos?</p>
          <button
            ref={crear}
            type="button"
            className="libre-crear"
            onClick={() => {
              setAbierto(false);
              alCrear();
            }}
          >
            + Crear una tarea
          </button>
        </div>
      )}
    </div>
  );
}

interface PropsAdelantar {
  proximas: Proxima[];
  sinTareas: boolean; // la cuenta no tiene ninguna tarea (cuenta nueva)
  ocupado: boolean; // se está guardando algo (evita dobles toques)
  alTraer: (id: number) => void;
  alCrear: () => void;
  movil?: boolean;
}

export function AdelantarAlgo({ proximas, sinTareas, ocupado, alTraer, alCrear, movil = false }: PropsAdelantar) {
  const idTitulo = useId();
  return (
    <section aria-labelledby={idTitulo} className={movil ? 'adel adel-movil' : 'midia-carta adel'}>
      <h2 id={idTitulo} className={movil ? 'text-lg font-extrabold' : 'text-base font-extrabold'}>
        ¿Adelantas algo?
      </h2>
      {proximas.length > 0 ? (
        <>
          <p className="adel-texto">Disfrútalo, o trae a hoy algo de los próximos días.</p>
          <ul className="adel-lista">
            {proximas.map((p) => (
              <li key={p.id} className="adel-fila">
                <span className="adel-dia">
                  {p.dia}
                  <b>{p.hora}</b>
                </span>
                <span className="adel-titulo">{p.titulo}</span>
                <button type="button" className="adel-traer" disabled={ocupado} aria-label={`Traer «${p.titulo}» a hoy`} onClick={() => alTraer(p.id)}>
                  Traer a hoy
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="adel-texto">
            {sinTareas ? 'Aún no tienes tareas. Apunta la primera y Tachit la coloca en tu día.' : 'Tampoco tienes nada en los próximos días. Disfrútalo.'}
          </p>
          <button type="button" className="libre-crear libre-crear-suelto" onClick={alCrear}>
            {sinTareas ? 'Crear mi primera tarea' : '+ Crear una tarea'}
          </button>
        </>
      )}
    </section>
  );
}
