// pantallas/ritmo/HoraDeTachar.tsx
// «Tu hora de tachar» de Mi ritmo (Fase 9, paso 9.5; antes «Tu mapa de energía»), igual que el prototipo:
//  - la respuesta en grande: «Rindes más [los martes por la mañana], de 9 a 12 h.»
//  - la onda de ese día (de 0 a 24 h), con un puntito en tu mejor rato
//  - la mini semana: una barrita por día (cuántas tachas); al tocar un día, la onda y la frase son las de ese día
//  - la «?» con cómo funciona (en 4 líneas)
//  - el interruptor «Lo importante, a tu mejor hora» (lo usa «Reorganizar mi día» en el paso 9.8)
// Los cálculos están en ritmo.ts (mapaEnergia, mejorRato, fraseHoraDeTachar y ondaEnergia); aquí solo se dibuja.
import { useId, useState } from 'react';
import { FRANJAS, LIENZO_ONDA, fraseHoraDeTachar, mejorRato, ondaEnergia, type MapaEnergia } from './ritmo';

const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DIAS_PLURAL = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos'];
const HORAS = ['0', '3', '6', '9', '12', '15', '18', '21', '24 h'];

const AYUDA = [
  { icono: '✓', texto: 'Cada vez que tachas una tarea, Tachit apunta la hora.' },
  { icono: '●', texto: 'La onda sube cuando más tachas. El punto es tu mejor rato.' },
  { icono: '↔', texto: 'Toca un día de la semana para ver el suyo.' },
  { icono: '⇅', texto: 'Con el interruptor, «Reorganizar mi día» pondrá ahí tus tareas importantes.' },
];

interface Props {
  mapa: MapaEnergia;
  reorganizar: { activo: boolean; disponible: boolean; alCambiar: (nuevo: boolean) => void };
}

function HoraDeTachar({ mapa, reorganizar }: Props) {
  const id = useId();
  const [elegido, setElegido] = useState<number | null>(null);
  const dia = elegido ?? mapa.diaFuerte ?? 0;
  const frase = fraseHoraDeTachar(mapa, dia);
  const onda = ondaEnergia(mapa.celdas[dia]);
  const rato = mejorRato(mapa, dia);
  const maximo = Math.max(1, ...mapa.totales);
  const { ancho, alto } = LIENZO_ONDA;

  return (
    <section aria-labelledby={`${id}-titulo`} className="ritmo-hora">
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
          <path d="M3 15c3 0 4-8 7-8s3 10 6 10 3-6 5-6" />
        </svg>
        TU HORA DE TACHAR
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

      <p className="ritmo-hora-frase" aria-live="polite">
        {frase.antes}
        <span className="ritmo-rotu">{frase.destacado}</span>
        {frase.despues}
      </p>

      <div className="ritmo-onda">
        <svg
          viewBox={`0 0 ${ancho} ${alto}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={
            rato
              ? `Los ${DIAS_PLURAL[dia]}, tachas más de ${rato.desde} a ${rato.hasta} h (${rato.n} ${rato.n === 1 ? 'tarea' : 'tareas'}).`
              : `Los ${DIAS_PLURAL[dia]} aún no has tachado nada.`
          }
        >
          <path className="ritmo-onda-area" d={onda.area} />
          <path className="ritmo-onda-linea" d={onda.linea} />
        </svg>
        {onda.cima && (
          <>
            <span className="ritmo-onda-cima" style={{ left: `${(onda.cima.x / ancho) * 100}%`, top: onda.cima.y }} aria-hidden="true" />
            <span className="ritmo-onda-cima-texto" style={{ left: `${(onda.cima.x / ancho) * 100}%`, top: onda.cima.y }} aria-hidden="true">
              {onda.cima.n} {onda.cima.n === 1 ? 'tachada' : 'tachadas'}
            </span>
          </>
        )}
        <div className="ritmo-onda-horas" aria-hidden="true">
          {HORAS.slice(0, FRANJAS.length + 1).map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
      </div>

      <div role="group" aria-label="Elige un día para ver su onda" className="ritmo-semana">
        {LETRAS.map((letra, i) => (
          <button
            key={letra}
            type="button"
            aria-pressed={i === dia}
            aria-label={`Ver los ${DIAS_PLURAL[i]}: ${mapa.totales[i]} ${mapa.totales[i] === 1 ? 'tarea tachada' : 'tareas tachadas'}`}
            className={i === mapa.diaFuerte ? 'fuerte' : undefined}
            onClick={() => setElegido(i)}
          >
            <i aria-hidden="true">
              <em style={{ height: `${Math.round((mapa.totales[i] / maximo) * 100)}%` }} />
            </i>
            {letra}
          </button>
        ))}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={reorganizar.activo}
        disabled={!reorganizar.disponible}
        onClick={() => reorganizar.alCambiar(!reorganizar.activo)}
        className="ritmo-interruptor"
      >
        <span className="ritmo-interruptor-texto">
          <b>Lo importante, a tu mejor hora</b>
          <small>
            {reorganizar.activo
              ? 'Al reorganizar tu día, Tachit pone tus tareas importantes en tu mejor rato de ese día.'
              : 'Si lo activas, al reorganizar tu día Tachit pondrá tus tareas importantes en tu mejor rato.'}
          </small>
        </span>
        <span className="ritmo-interruptor-pista" aria-hidden="true" />
      </button>
    </section>
  );
}

export default HoraDeTachar;
