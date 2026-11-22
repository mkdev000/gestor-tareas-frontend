// pantallas/ritmo/LoQueSeAtasca.tsx
// «Lo que se te atasca» de Mi ritmo (Fase 9, paso 9.5, idea A «las hojas de calendario arrancadas»), igual que el prototipo:
//  - las tareas que has pasado a otro día 2 veces o más
//  - cada día al que estaba apuntada y que pasaste a otro es una hojita de calendario tachada; la última es para cuándo es ahora
//  - un consejo según el caso y 3 botones claros, con el recomendado primero y en color:
//    «Hoy, sí» (la pasa a hoy) · «Partirla en pasos» o «Ver los pasos» · «Ya no la hago» (la borra, con Deshacer)
//  - la «?» con cómo funciona y, cuando no hay nada atascado, la buena noticia y un ejemplo de cómo se verá (EjemploRitmo)
// Los cálculos están en ritmo.ts (consejosAtasco y hojasAtasco); lo que hace cada botón lo decide MiRitmo.
import { useId } from 'react';
import { deTextoISO } from '../../utils/dias';
import { textoDia } from '../tareas/frase';
import { EjemploRitmo, BotonFalso } from './EjemploRitmo';
import { hojasAtasco, type Atascada, type ConsejoAtasco, type EventoRitmo } from './ritmo';

const DIA_CORTO = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const GIROS = [-4, 3, -2, 4, -3];
const EJEMPLO_HOJAS = [
  ['LUN', 9],
  ['MIÉ', 11],
  ['VIE', 13],
] as const;

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
  { icono: '✕', texto: <>Cada hoja tachada es un día al que estaba apuntada y que pasaste a otro.</> },
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

function Hoja({ fecha, hoy, actual, giro }: { fecha: string | null; hoy: string; actual: boolean; giro: number }) {
  const dia = fecha ? deTextoISO(fecha) : null;
  return (
    <span className={'ritmo-hoja' + (actual ? ' actual' : ' vieja')} style={actual ? undefined : { transform: `rotate(${giro}deg)` }}>
      <small>{!dia ? 'SIN DÍA' : fecha === hoy ? 'HOY' : DIA_CORTO[dia.getDay()]}</small>
      <b>{dia ? dia.getDate() : '—'}</b>
    </span>
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
              Hay <span className="ritmo-rotu">1 tarea</span> que vas pasando de un día a otro.
            </p>
            <p className="ritmo-atasca-titulo">Ordenar el trastero</p>
            <div className="ritmo-hojas">
              {EJEMPLO_HOJAS.map(([dia, num], i) => (
                <span key={num} className="ritmo-hoja vieja" style={{ transform: `rotate(${GIROS[i]}deg)` }}>
                  <small>{dia}</small>
                  <b>{num}</b>
                </span>
              ))}
              <span className="ritmo-hoja actual">
                <small>HOY</small>
                <b>16</b>
              </span>
              <span className="ritmo-veces">3 veces</span>
            </div>
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
            Hay <span className="ritmo-rotu">{n === 1 ? '1 tarea' : `${n} tareas`}</span> que vas pasando de un día a otro.
          </p>
          <ul className="ritmo-atasca-lista">
            {atascadas.map((a) => {
              const h = hojasAtasco(a, eventos);
              const c = consejo(a);
              const ocupada = ocupadas.includes(a.id);
              const partir = {
                texto: a.pasos > 0 ? 'Ver los pasos' : 'Partirla en pasos',
                accion: () => (a.pasos > 0 ? acciones.verPasos(a) : acciones.partir(a)),
              };
              const hoyBoton = { texto: 'Hoy, sí', accion: () => acciones.hoy(a) };
              const orden = a.consejo === 'hueco' ? [hoyBoton, partir] : [partir, hoyBoton];
              const ahora = h.actual ? (h.actual === hoy ? 'hoy' : textoDia(h.actual, hoy).toLowerCase()) : 'sin día';
              return (
                <li key={a.id} className="ritmo-atasca-tarea">
                  <p className="ritmo-atasca-titulo">{a.titulo}</p>
                  <div
                    className="ritmo-hojas"
                    role="img"
                    aria-label={`La has pasado de día ${a.veces_aplazada} veces${h.viejas.length ? ` (${h.viejas.map((f) => textoDia(f, hoy).toLowerCase()).join(', ')})` : ''}. Ahora es para ${ahora}.`}
                  >
                    {h.ocultas > 0 && <span className="ritmo-hojas-mas">+{h.ocultas}</span>}
                    {h.viejas.map((f, i) => (
                      <Hoja key={f} fecha={f} hoy={hoy} actual={false} giro={GIROS[i % GIROS.length]} />
                    ))}
                    <Hoja fecha={h.actual} hoy={hoy} actual giro={0} />
                    <span className="ritmo-veces" aria-hidden="true">
                      {a.veces_aplazada} veces
                    </span>
                  </div>
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
