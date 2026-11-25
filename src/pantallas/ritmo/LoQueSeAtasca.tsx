// pantallas/ritmo/LoQueSeAtasca.tsx
// «Lo que se te atasca» de Mi ritmo (Fase 9, paso 9.5; idea B «los "mañana" tachados»), igual que el prototipo:
//  - las tareas que has pasado a otro día 2 veces o más
//  - cada vez que la pasaste a otro día sale lo que «dijiste» (mañana, el viernes…), escrito a mano y tachado,
//    y al final, cuándo toca ahora («→ hoy»)
//  - un consejo según el caso y 3 botones claros, con el recomendado primero y en color:
//    «Hoy, sí» (la pasa a hoy) · «Partirla en pasos» o «Ver los pasos» · «Ya no la hago» (la borra, con Deshacer)
//  - la «?» con cómo funciona y, cuando no hay nada atascado, la buena noticia y un ejemplo de cómo se verá (EjemploRitmo)
// Los cálculos están en ritmo.ts (consejosAtasco y excusasAtasco); lo que hace cada botón lo decide MiRitmo.
import { useId } from 'react';
import { EjemploRitmo, BotonFalso } from './EjemploRitmo';
import { excusasAtasco, type Atascada, type ConsejoAtasco, type EventoRitmo } from './ritmo';

export type AtascadaConConsejo = Atascada & { pasos: number; consejo: ConsejoAtasco; primerPaso: string | null };

export interface AccionesAtasco {
  hoy: (a: AtascadaConConsejo) => void;
  partir: (a: AtascadaConConsejo) => void;
  verPasos: (a: AtascadaConConsejo) => void;
  soltar: (a: AtascadaConConsejo) => void;
}

interface Props {
  atascadas: AtascadaConConsejo[];
  eventos: EventoRitmo[];
  hoy: string;
  ocupadas: number[]; // tareas con una acción en marcha (sus botones se desactivan)
  acciones: AccionesAtasco;
}

const AYUDA = [
  { icono: '↻', texto: <>Aquí salen las tareas que has pasado a otro día 2 veces o más.</> },
  { icono: '✕', texto: <>Cada «mañana» tachado es una vez que la pasaste a otro día; la flecha dice cuándo toca ahora.</> },
  { icono: '●', texto: <>El botón en color es lo más recomendable para esa tarea.</> },
  {
    icono: '✓',
    texto: (
      <>
        <b>Hoy, sí</b> la pasa a hoy · <b>Partirla en pasos</b> le añade 3 pasos · <b>Ya no la hago</b> la borra.
      </>
    ),
  },
];

// Los «mañana» tachados: lo que «dijiste» cada vez, tachado, y al final cuándo toca ahora
function Excusas({ dichos, ocultos, ahora, etiqueta }: { dichos: string[]; ocultos: number; ahora: string; etiqueta?: string }) {
  return (
    <p className="ritmo-excusas" role={etiqueta ? 'img' : undefined} aria-label={etiqueta}>
      {ocultos > 0 && <span className="ritmo-excusas-mas">+{ocultos}</span>}
      {dichos.map((d, i) => (
        <s key={i}>{d}</s>
      ))}
      <span className="ritmo-excusas-ahora">→ {ahora}</span>
    </p>
  );
}

function consejo(a: AtascadaConConsejo) {
  if (a.consejo === 'pasos')
    return {
      fuerte: `Ya la tienes en ${a.pasos} ${a.pasos === 1 ? 'paso' : 'pasos'}.`,
      resto: a.primerPaso ? ` Empieza por el primero: «${a.primerPaso}».` : ' Revísalos y termina el que falta.',
    };
  if (a.consejo === 'partir') return { fuerte: 'Suele ser demasiado grande.', resto: ' Pártela y empieza por solo 15 minutos.' };
  return { fuerte: 'Dale hoy un hueco pequeño', resto: ' y quítatela de encima.' };
}

function LoQueSeAtasca({ atascadas, eventos, hoy, ocupadas, acciones }: Props) {
  const id = useId();
  const n = atascadas.length;

  return (
    <section aria-labelledby={`${id}-titulo`} className="ritmo-bloque ritmo-atasca">
      <p id={`${id}-titulo`} className="ritmo-hora-ojo">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <path d="M21 4v5h-5" />
        </svg>
        LO QUE SE TE ATASCA
      </p>

      <button type="button" className="ritmo-q" aria-label="¿Cómo funciona?" aria-describedby={`${id}-ayuda`}>
        ?
      </button>
      <div id={`${id}-ayuda`} role="tooltip" className="ritmo-q-texto">
        <b>¿Cómo funciona?</b>
        <ul>
          {AYUDA.map((a) => (
            <li key={a.icono}>
              <i aria-hidden="true">{a.icono}</i>
              <span>{a.texto}</span>
            </li>
          ))}
        </ul>
      </div>

      {n === 0 ? (
        <>
          <EjemploRitmo reto="Pasa una tarea de día 2 veces" nota="✓ Ahora no tienes nada atascado." enlace={{ texto: 'Ver mis tareas', a: '/tareas' }}>
            <p className="ritmo-atasca-frase">
              Hay <span className="ritmo-rotu">1 tarea</span> que vas dejando para mañana.
            </p>
            <p className="ritmo-atasca-titulo">Ordenar el trastero</p>
            <Excusas dichos={['mañana', 'mañana', 'el viernes']} ocultos={0} ahora="hoy" />
            <p className="ritmo-atasca-consejo">
              <b>Suele ser demasiado grande.</b> Pártela y empieza por solo 15 minutos.
            </p>
            <div className="ritmo-atasca-botones">
              <BotonFalso texto="Partirla en pasos" recomendado />
              <BotonFalso texto="Hoy, sí" />
              <BotonFalso texto="Ya no la hago" />
            </div>
          </EjemploRitmo>
        </>
      ) : (
        <>
          <p className="ritmo-atasca-frase">
            Hay <span className="ritmo-rotu">{n === 1 ? '1 tarea' : `${n} tareas`}</span> que vas dejando para mañana.
          </p>
          <ul className="ritmo-atasca-lista">
            {atascadas.map((a) => {
              const e = excusasAtasco(a, eventos, hoy);
              // Si alguna vez la moviste hace más de 2 meses, eso no está en el historial: se cuenta en el «+N»
              const ocultos = Math.max(e.ocultos, a.veces_aplazada - e.dichos.length);
              const ahora = e.ahora ?? 'sin día';
              const c = consejo(a);
              const ocupada = ocupadas.includes(a.id);
              const partir = {
                texto: a.pasos > 0 ? 'Ver los pasos' : 'Partirla en pasos',
                accion: () => (a.pasos > 0 ? acciones.verPasos(a) : acciones.partir(a)),
              };
              const hoyBoton = { texto: 'Hoy, sí', accion: () => acciones.hoy(a) };
              const orden = a.consejo === 'hueco' ? [hoyBoton, partir] : [partir, hoyBoton];
              return (
                <li key={a.id} className="ritmo-atasca-tarea">
                  <p className="ritmo-atasca-titulo">{a.titulo}</p>
                  <Excusas
                    dichos={e.dichos}
                    ocultos={ocultos}
                    ahora={ahora}
                    etiqueta={`La has dejado para otro día ${a.veces_aplazada} veces${e.dichos.length ? ` (${e.dichos.join(', ')})` : ''}. Ahora toca ${ahora}.`}
                  />
                  <p className="ritmo-atasca-consejo">
                    <b>{c.fuerte}</b>
                    {c.resto}
                  </p>
                  <div className="ritmo-atasca-botones">
                    {orden.map((b, i) => (
                      <button
                        key={b.texto}
                        type="button"
                        disabled={ocupada}
                        onClick={b.accion}
                        className={'ritmo-atasca-boton' + (i === 0 ? ' recomendado' : '')}
                      >
                        {b.texto}
                      </button>
                    ))}
                    <button type="button" disabled={ocupada} onClick={() => acciones.soltar(a)} className="ritmo-atasca-boton suelta">
                      Ya no la hago
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

export default LoQueSeAtasca;
