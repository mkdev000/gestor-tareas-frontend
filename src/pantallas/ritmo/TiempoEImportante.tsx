// pantallas/ritmo/TiempoEImportante.tsx
// El bloque de abajo de Mi ritmo (Fase 9, paso 9.5, bloque 5: idea A), igual que el prototipo. Mira las últimas 4 semanas:
//  - «A qué le das tu tiempo»: un recibo (como un tique) con lo tachado por categoría y su tiempo; la que se te queda atrás,
//    en rojo, con «el vale»: guarda 20 min libres para ella (hoy o, si no queda hueco, mañana)
//  - «¿Lo importante, primero?»: una pila de hojitas por prioridad (las tachadas, tachadas) y la respuesta: «Sí» / «No»
// Cada tarjeta, con su «?». Los cálculos están en ritmo.ts; lo que hace el vale lo decide MiRitmo.
import TarjetaRitmo from './TarjetaRitmo';
import { textoDuracion } from '../tareas/frase';
import { textoHora } from '../tareas/pulso';
import { VALE_MIN, fraseImportante, fraseRecibo, type Recibo, type importantePrimero } from './ritmo';

const MAX_HOJITAS = 16;
const COLOR_PRIORIDAD = { alta: '#a84a0a', media: '#17699e', baja: '#4b5a6c' } as const;

// Los colores de las categorías vienen del servidor: solo se usa si es un #rrggbb de verdad
const colorSeguro = (color: string | null) => (color && /^#[0-9a-f]{6}$/i.test(color) ? color : '#8492a3');

// El vale: «20 min para #Salud, hoy a las 18:30». Después de tocarlo, «Guardado».
export type EstadoVale =
  | { tipo: 'ninguno' }
  | { tipo: 'libre'; categoria: string; dia: 'hoy' | 'mañana'; inicio: number; ocupado: boolean; alPulsar: () => void }
  | { tipo: 'guardado'; categoria: string; dia: 'hoy' | 'mañana'; inicio: number };

interface Props {
  recibo: Recibo;
  importante: ReturnType<typeof importantePrimero>;
  vale: EstadoVale;
}

function TiempoEImportante({ recibo, importante, vale }: Props) {
  const fr = fraseRecibo(recibo);
  const fi = fraseImportante(importante);

  return (
    <div className="ritmo-par">
      <TarjetaRitmo
        clase="ritmo-bloque"
        titulo="A QUÉ LE DAS TU TIEMPO"
        icono={
          <>
            <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
            <path d="M9 8h6" />
            <path d="M9 12h6" />
          </>
        }
        ayuda={[
          { icono: '🧾', texto: 'Cada línea es una categoría: lo que has tachado de lo que tenías y cuánto te ha llevado.' },
          { icono: '!', texto: 'En rojo, la que se te queda atrás (menos de la mitad tachada).' },
          { icono: '✂', texto: `El vale te guarda ${VALE_MIN} min libres para ella: tócalo y se apunta en tu día.` },
          { icono: '4', texto: 'Cuenta las tareas de las últimas 4 semanas.' },
        ]}
      >
        <p className="ritmo-pregunta-frase">
          {fr.antes}
          <span className="ritmo-rotu">{fr.destacado}</span>
          {fr.medio}
          {fr.rojo && <span className="ritmo-no">{fr.rojo}</span>}
          {fr.despues}
        </p>
        {recibo.lineas.length > 0 && (
          <div className="ritmo-recibo">
            <p className="ritmo-recibo-titulo">ÚLTIMAS 4 SEMANAS</p>
            <ul>
              {recibo.lineas.map((l) => (
                <li key={l.clave} className={'ritmo-recibo-linea' + (recibo.olvidada?.clave === l.clave ? ' atras' : '')}>
                  <span className="nombre">
                    <i aria-hidden="true" style={{ background: colorSeguro(l.color) }} />
                    {l.id === null ? l.nombre : `#${l.nombre}`}
                  </span>
                  <span className="puntos" aria-hidden="true" />
                  <span className="valor">
                    {l.hechas} de {l.total} · {textoDuracion(l.minutos)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="ritmo-recibo-total">
              <span>TOTAL TACHADO</span>
              <span>
                {recibo.hechas} · {textoDuracion(recibo.minutos)}
              </span>
            </p>
          </div>
        )}
        {vale.tipo === 'libre' && (
          <button type="button" className="ritmo-vale" disabled={vale.ocupado} onClick={vale.alPulsar}>
            <span className="ritmo-vale-talon" aria-hidden="true">
              <small>VALE</small>
              <b>{VALE_MIN}′</b>
            </span>
            <span className="ritmo-vale-cuerpo">
              <span className="ritmo-vale-tijeras" aria-hidden="true">
                ✂
              </span>
              <b>
                {VALE_MIN} min para #{vale.categoria}, {vale.dia} a las {textoHora(vale.inicio)}
              </b>
              <small>{vale.ocupado ? 'Guardando…' : 'Lo tienes libre · toca para guardarlo en tu día'}</small>
            </span>
          </button>
        )}
        {vale.tipo === 'guardado' && (
          <div className="ritmo-vale hecho" role="status">
            <span className="ritmo-vale-talon" aria-hidden="true">
              <small>HECHO</small>
              <b>✓</b>
            </span>
            <span className="ritmo-vale-cuerpo">
              <b>
                Guardado: {vale.dia} a las {textoHora(vale.inicio)}, #{vale.categoria}
              </b>
              <small>Ponle nombre en Mi día</small>
            </span>
          </div>
        )}
      </TarjetaRitmo>

      <TarjetaRitmo
        clase="ritmo-bloque"
        titulo="¿LO IMPORTANTE, PRIMERO?"
        icono={<path d="M12 4l8 14H4z" />}
        ayuda={[
          { icono: '▤', texto: 'Cada hojita es una tarea de esa prioridad; las tachadas, tachadas.' },
          { icono: '%', texto: 'El número es cuántas has tachado de cada prioridad.' },
          { icono: '▲', texto: 'Si lo importante va por detrás, la respuesta es «No».' },
        ]}
      >
        <p className="ritmo-pregunta-frase">
          {fi.respuesta && <span className={importante.no ? 'ritmo-no' : 'ritmo-si'}>{fi.respuesta}</span>}
          {fi.antes}
          <span className="ritmo-rotu">{fi.destacado}</span>
          {fi.despues}
        </p>
        {importante.filas.length > 0 && (
          <ul className="ritmo-pilas">
            {importante.filas.map((f) => {
              const n = Math.min(f.total, MAX_HOJITAS);
              const tachadas = Math.round((f.hechas / f.total) * n);
              return (
                <li key={f.clave} className="ritmo-pila">
                  <b style={{ color: COLOR_PRIORIDAD[f.clave] }}>{f.nombre}</b>
                  <span className="ritmo-pila-hojas" role="img" aria-label={`${f.nombre}: ${f.hechas} de ${f.total} tachadas (${f.porcentaje} %)`}>
                    {Array.from({ length: n }, (_, i) => (
                      <span key={i} className={i < tachadas ? 'hecha' : undefined} />
                    ))}
                  </span>
                  <span className={'ritmo-pila-porcentaje' + (f.clave === 'alta' && importante.no ? ' ritmo-no' : '')} aria-hidden="true">
                    {f.porcentaje} %
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="ritmo-pregunta-sub">
          {importante.alta === null
            ? 'Marca como alta lo que de verdad importa y aquí verás si va primero.'
            : importante.no
              ? 'Lo importante que no tachas acaba pasándose de día. Pon 1 tarea alta en tu mejor rato («Tu hora de tachar»).'
              : 'Lo importante va primero: sigue así.'}
        </p>
      </TarjetaRitmo>
    </div>
  );
}

export default TiempoEImportante;
