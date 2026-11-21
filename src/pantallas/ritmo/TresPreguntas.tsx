// pantallas/ritmo/TresPreguntas.tsx
// La fila de arriba de Mi ritmo (Fase 9, paso 9.5, bloque 4: idea A «las tres preguntas»), igual que el prototipo.
// Cada tarjeta responde a una pregunta y lleva su «?»:
//  1. «Tu semana, tarea a tarea»: una hoja de libreta con una raya por tarea en su día (tachadas, atrasadas en rojo);
//     al tocar una raya, vas a esa tarea
//  2. «¿Te cabe lo de hoy?»: «Sí, te sobran…» / «No: te faltan…» con su barra; si no cabe, «Reorganizar mi día»
//  3. «Tu récord»: cuánto te falta para superar tu mejor racha, la cadena de 14 días y el descanso de la semana
// Los cálculos están en ritmo.ts; aquí solo se dibuja.
import { useId, type ReactNode } from 'react';
import { textoDia, textoDuracion } from '../tareas/frase';
import { FIN_DIA, INICIO_DIA, textoHora } from '../tareas/pulso';
import { fraseCabe, fraseRecord, fraseSemana, type CabeHoy, type PuntoRacha, type RachaAmable, type RecordRacha, type SemanaTareas } from './ritmo';

const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const ESTADO_RAYA = { hecha: 'tachada', atrasada: 'se te ha pasado', hoy: 'por hacer', pendiente: 'por hacer' } as const;
const MAX_PUNTOS_FALTAN = 5;

function Ayuda({ lineas }: { lineas: { icono: string; texto: string }[] }) {
  const id = useId();
  return (
    <>
      <button type="button" className="ritmo-q" aria-label="¿Cómo funciona?" aria-describedby={`${id}-ayuda`}>
        ?
      </button>
      <div id={`${id}-ayuda`} role="tooltip" className="ritmo-q-texto">
        <b>¿Cómo funciona?</b>
        <ul>
          {lineas.map((a) => (
            <li key={a.icono}>
              <i aria-hidden="true">{a.icono}</i>
              <span>{a.texto}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function Tarjeta({ titulo, icono, ayuda, children }: { titulo: string; icono: ReactNode; ayuda: { icono: string; texto: string }[]; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="ritmo-pregunta">
      <p id={id} className="ritmo-hora-ojo">
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
          {icono}
        </svg>
        {titulo}
      </p>
      <Ayuda lineas={ayuda} />
      {children}
    </section>
  );
}

const Frase = ({ f }: { f: { antes: string; destacado: string; despues: string } }) => (
  <>
    {f.antes}
    <span className="ritmo-rotu">{f.destacado}</span>
    {f.despues}
  </>
);

interface Props {
  semana: SemanaTareas;
  cabe: CabeHoy;
  ahora: number;
  record: RecordRacha;
  racha: RachaAmable;
  cadena: PuntoRacha[];
  hoy: string;
  irATarea: (id: number) => void;
  reorganizar: { ocupado: boolean; alPulsar: () => void };
}

function TresPreguntas({ semana, cabe, ahora, record, racha, cadena, hoy, irATarea, reorganizar }: Props) {
  const fCabe = fraseCabe(cabe);
  const faltan = record.anterior > record.actual ? Math.min(MAX_PUNTOS_FALTAN, record.anterior - record.actual + 1) : 0;
  const descansoUsado = racha.semana.some((d) => d.estado === 'descanso');
  const pendientes = semana.total - semana.hechas - semana.atrasadas;

  return (
    <div className="ritmo-fila">
      <Tarjeta
        titulo="TU SEMANA, TAREA A TAREA"
        icono={
          <>
            <path d="M4 7h16" />
            <path d="M4 12h10" />
            <path d="M4 17h13" />
          </>
        }
        ayuda={[
          { icono: '✎', texto: 'Cada raya es una tarea de esta semana, en su día.' },
          { icono: '✓', texto: 'Las hechas salen tachadas; las rojas se te han pasado.' },
          { icono: '↗', texto: 'Toca una raya para ir a esa tarea.' },
        ]}
      >
        <p className="ritmo-pregunta-frase">
          <Frase f={fraseSemana(semana)} />
        </p>
        <div className="ritmo-libreta">
          {semana.dias.map((d) => (
            <div key={d.dia} className="ritmo-libreta-dia">
              {d.rayas.map((r) => {
                const texto = `${r.titulo} · ${ESTADO_RAYA[r.estado]} · ${textoDia(r.dia, hoy).toLowerCase()} (ir a la tarea)`;
                return (
                  <button key={r.id} type="button" className={`ritmo-raya ${r.estado}`} onClick={() => irATarea(r.id)} aria-label={texto} title={texto}>
                    <span style={{ width: `${r.ancho}%` }} />
                  </button>
                );
              })}
              {d.mas > 0 && <span className="ritmo-raya-mas">+{d.mas}</span>}
            </div>
          ))}
        </div>
        <div className="ritmo-libreta-letras" aria-hidden="true">
          {semana.dias.map((d, i) => (
            <span key={d.dia} className={d.dia === hoy ? 'hoy' : undefined}>
              {d.dia === hoy ? 'HOY' : LETRAS[i]}
            </span>
          ))}
        </div>
        <div className="ritmo-leyenda">
          <span>
            <i className="hecha" aria-hidden="true" />
            Tachadas · {semana.hechas}
          </span>
          <span>
            <i className="pendiente" aria-hidden="true" />
            Por hacer · {pendientes}
          </span>
          <span>
            <i className="atrasada" aria-hidden="true" />
            Atrasadas · {semana.atrasadas}
          </span>
        </div>
      </Tarjeta>

      <Tarjeta
        titulo="¿TE CABE LO DE HOY?"
        icono={
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </>
        }
        ayuda={[
          { icono: '▬', texto: 'La barra es lo que te queda por hacer hoy.' },
          { icono: '▨', texto: 'Lo rayado es el tiempo que te sobra hasta el fin del día.' },
          { icono: '⇅', texto: 'Si no cabe, «Reorganizar mi día» lo reparte.' },
        ]}
      >
        <p className="ritmo-pregunta-frase" aria-live="polite">
          {fCabe.respuesta && <span className={cabe.cabe ? 'ritmo-si' : 'ritmo-no'}>{fCabe.respuesta}</span>}
          <Frase f={fCabe} />
        </p>
        <div className="ritmo-cabe">
          <div
            className={'ritmo-cabe-barra' + (cabe.cabe ? '' : ' no')}
            role="img"
            aria-label={`Lo que te queda: ${textoDuracion(cabe.quedaMin)} de ${textoDuracion(cabe.diaMin)} de día.`}
          >
            <span style={{ width: `${cabe.diaMin ? Math.min(100, Math.round((cabe.quedaMin / cabe.diaMin) * 100)) : 100}%` }} />
          </div>
          <div className="ritmo-marcas">
            <span>ahora · {textoHora(Math.min(Math.max(ahora, INICIO_DIA), FIN_DIA))}</span>
            <span>fin del día · {textoHora(FIN_DIA)}</span>
          </div>
        </div>
        <p className="ritmo-pregunta-sub">
          {!cabe.quedan
            ? cabe.hechoMin
              ? `Has tachado todo lo de hoy (${textoDuracion(cabe.hechoMin)}).`
              : 'Hoy no tienes tareas.'
            : `${cabe.quedan === 1 ? 'Te queda 1 tarea' : `Te quedan ${cabe.quedan} tareas`} (${textoDuracion(cabe.quedaMin)}) y ${textoDuracion(cabe.diaMin)} de día.${
                cabe.hechoMin ? ` Ya has tachado ${textoDuracion(cabe.hechoMin)}.` : ''
              }`}
        </p>
        {!cabe.cabe && (
          <button type="button" className="ritmo-atasca-boton recomendado ritmo-pregunta-boton" disabled={reorganizar.ocupado} onClick={reorganizar.alPulsar}>
            {reorganizar.ocupado ? 'Reorganizando…' : 'Reorganizar mi día'}
          </button>
        )}
      </Tarjeta>

      <Tarjeta
        titulo="TU RÉCORD"
        icono={
          <>
            <path d="M5 21V4" />
            <path d="M5 4h12l-2 4 2 4H5" />
          </>
        }
        ayuda={[
          { icono: '●', texto: 'Cada punto es un día en que tachaste algo.' },
          { icono: '○', texto: 'Puedes descansar 1 día por semana sin romper la racha.' },
          { icono: '⚑', texto: 'La bandera es tu mejor racha de los últimos 2 meses: llega y supérala.' },
        ]}
      >
        <p className="ritmo-pregunta-frase">
          <Frase f={fraseRecord(record)} />
        </p>
        <div
          className="ritmo-cadena"
          role="img"
          aria-label={`Últimos 14 días: llevas ${record.actual} días de racha; tu récord es ${Math.max(record.actual, record.anterior)}.`}
        >
          {cadena.map((p, i) => (
            <span key={i} className={`ritmo-punto ${p}`} />
          ))}
          {Array.from({ length: faltan }, (_, i) => (
            <span key={`f${i}`} className="ritmo-punto falta" />
          ))}
          {faltan > 0 && (
            <span className="ritmo-bandera" aria-hidden="true">
              ⚑
            </span>
          )}
        </div>
        <div className="ritmo-marcas" aria-hidden="true">
          <span>hace 14 días</span>
          <span>hoy</span>
        </div>
        <p className="ritmo-pregunta-sub">
          {!record.actual
            ? 'Puedes descansar 1 día por semana sin romperla.'
            : descansoUsado
              ? 'Esta semana ya has usado tu día de descanso.'
              : 'Esta semana aún te queda 1 día de descanso sin perder la racha.'}
        </p>
      </Tarjeta>
    </div>
  );
}

export default TresPreguntas;
