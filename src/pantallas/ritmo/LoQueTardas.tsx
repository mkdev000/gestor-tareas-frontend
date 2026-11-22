// pantallas/ritmo/LoQueTardas.tsx
// «Lo que tardas de verdad» de Mi ritmo (Fase 9, paso 9.5; el bloque «¿Cuánto te equivocas calculando?»),
// idea A «el tiempo tachado y reescrito», igual que el prototipo:
//  - una frase arriba: «Calculas bien, salvo con [#Trabajo]: ahí tus 30 min son 40 min.»
//  - una fila por categoría: «APUNTAS ~~30 min~~ 40 min» + «te quedas corto / te sobra tiempo / clavado»
//  - las categorías con 1 o 2 tareas dicen cuántas faltan («1 de 3»)
//  - si aún no hay ninguna con 3, un ejemplo de cómo se verá y «Para ver lo tuyo» (EjemploRitmo)
//  - la «?» con cómo funciona y el interruptor «Usar mis tiempos de verdad» (lo usa el paso 9.8)
// Los cálculos están en ritmo.ts (tiemposDeVerdad y fraseTiempos); aquí solo se dibuja.
import { useId } from 'react';
import { textoDuracion } from '../tareas/frase';
import { EjemploRitmo } from './EjemploRitmo';
import { MINIMO_PARA_MARGEN, fraseTiempos, nombreCategoria, type TiemposDeVerdad } from './ritmo';

const AYUDA = [
  { icono: '⏱', texto: 'Al tachar una tarea, dices cuánto has tardado.' },
  { icono: '↔', texto: 'Aquí se compara con lo que habías apuntado, por categoría.' },
  { icono: '3', texto: `Hacen falta ${MINIMO_PARA_MARGEN} tareas de una categoría para sacar la cuenta.` },
  { icono: '✓', texto: 'Con el interruptor, las tareas nuevas sin duración se crean con lo que sueles tardar.' },
];

const QUE = { corto: 'te quedas corto', sobra: 'te sobra tiempo', clavado: 'clavado' } as const;

// Los colores de las categorías vienen del servidor: solo se usa si es un #rrggbb de verdad
const colorSeguro = (color: string | null) => (color && /^#[0-9a-f]{6}$/i.test(color) ? color : '#8492a3');

interface Props {
  tiempos: TiemposDeVerdad;
  usar: { activo: boolean; disponible: boolean; alCambiar: (nuevo: boolean) => void };
}

function LoQueTardas({ tiempos, usar }: Props) {
  const id = useId();
  const frase = fraseTiempos(tiempos);
  const ejemplo = tiempos.listas.find((c) => c.estado === 'corto') ?? tiempos.listas[0];

  return (
    <section aria-labelledby={`${id}-titulo`} className="ritmo-bloque ritmo-tardas">
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
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 2.5" />
          <path d="M10 2h4" />
        </svg>
        LO QUE TARDAS DE VERDAD
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

      {tiempos.listas.length === 0 ? (
        <EjemploRitmo
          reto={`Di cuánto tardas en ${MINIMO_PARA_MARGEN} tareas de una categoría`}
          cuenta={`${Math.min(MINIMO_PARA_MARGEN - 1, Math.max(0, ...tiempos.faltan.map((c) => c.n)))} de ${MINIMO_PARA_MARGEN}`}
          enlace={{ texto: 'Tachar una', a: '/hoy' }}
        >
          <p className="ritmo-atasca-frase">
            Calculas bien, salvo con <span className="ritmo-rotu">#Estudio</span>: ahí tus 30 min son 40 min.
          </p>
          <ul className="ritmo-tardas-lista">
            <li className="ritmo-tardas-fila">
              <span className="ritmo-tardas-cat">
                <i style={{ background: '#6d4fc9' }} />
                Estudio
              </span>
              <span className="ritmo-tardas-ticket">
                <small>APUNTAS</small>
                <s>30 min</s>
                <span className="ritmo-tardas-real">40 min</span>
              </span>
              <span className="ritmo-tardas-que">
                <b className="corto">te quedas corto</b>
                <small>5 tareas</small>
              </span>
            </li>
            <li className="ritmo-tardas-fila">
              <span className="ritmo-tardas-cat">
                <i style={{ background: '#9a5b00' }} />
                Casa
              </span>
              <span className="ritmo-tardas-ticket">
                <small>APUNTAS</small>
                <span className="ritmo-tardas-real clavado">30 min ✓</span>
              </span>
              <span className="ritmo-tardas-que">
                <b className="clavado">clavado</b>
                <small>4 tareas</small>
              </span>
            </li>
          </ul>
        </EjemploRitmo>
      ) : (
        <>
          <p className="ritmo-atasca-frase">
            {frase.antes}
            <span className="ritmo-rotu">{frase.destacado}</span>
            {frase.despues}
          </p>

          {(tiempos.listas.length > 0 || tiempos.faltan.length > 0) && (
            <ul className="ritmo-tardas-lista">
              {tiempos.listas.map((c) => (
                <li key={c.clave} className="ritmo-tardas-fila">
                  <span className="ritmo-tardas-cat">
                    <i aria-hidden="true" style={{ background: colorSeguro(c.color) }} />
                    {c.clave === '-' ? 'Sin categoría' : c.nombre}
                  </span>
                  <span className="sr-only">
                    {c.estado === 'clavado'
                      ? `Apuntas ${textoDuracion(c.plan)} y tardas eso, clavado (${c.n} tareas).`
                      : `Apuntas ${textoDuracion(c.plan)} y tardas ${textoDuracion(c.real)}: ${QUE[c.estado]} (${c.n} tareas).`}
                  </span>
                  <span className="ritmo-tardas-ticket" aria-hidden="true">
                    <small>APUNTAS</small>
                    {c.estado !== 'clavado' && <s>{textoDuracion(c.plan)}</s>}
                    <span className={'ritmo-tardas-real' + (c.estado === 'clavado' ? ' clavado' : '')}>
                      {textoDuracion(c.real)}
                      {c.estado === 'clavado' && ' ✓'}
                    </span>
                  </span>
                  <span className="ritmo-tardas-que" aria-hidden="true">
                    <b className={c.estado}>{QUE[c.estado]}</b>
                    <small>{c.n} tareas</small>
                  </span>
                </li>
              ))}
              {tiempos.faltan.map((c) => {
                const quedan = MINIMO_PARA_MARGEN - c.n;
                return (
                  <li key={c.clave} className="ritmo-tardas-fila">
                    <span className="ritmo-tardas-cat">
                      <i aria-hidden="true" style={{ background: colorSeguro(c.color) }} />
                      {c.clave === '-' ? 'Sin categoría' : c.nombre}
                    </span>
                    <span className="ritmo-tardas-falta">
                      Di cuánto tardas en {quedan === 1 ? '1 tarea más' : `${quedan} tareas más`} de {nombreCategoria(c)} para verlo ({c.n} de{' '}
                      {MINIMO_PARA_MARGEN}
                      ).
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={usar.activo}
        disabled={!usar.disponible}
        onClick={() => usar.alCambiar(!usar.activo)}
        className="ritmo-interruptor"
      >
        <span className="ritmo-interruptor-texto">
          <b>Usar mis tiempos de verdad</b>
          <small>
            {usar.activo
              ? 'Las tareas nuevas sin duración se crean con lo que sueles tardar en su categoría.'
              : `Si lo activas, al crear una tarea sin duración Tachit pondrá lo que sueles tardar${ejemplo ? ` (${textoDuracion(ejemplo.real)} en ${nombreCategoria(ejemplo)})` : ''}.`}
          </small>
        </span>
        <span className="ritmo-interruptor-pista" aria-hidden="true" />
      </button>
    </section>
  );
}

export default LoQueTardas;
