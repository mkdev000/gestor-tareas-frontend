// pantallas/midia/PanelesDia.tsx
// Las dos tarjetas de la columna derecha de Mi día (Fase 7, paso 7.4), igual que en el prototipo web:
//  - "Notas sueltas": las tareas de hoy sin hora, como notitas pegadas. Su botón dice a qué hora se
//    pondrá la tarea (el primer hueco libre desde ahora), así se sabe qué hace antes de pulsarlo.
//    También se pueden arrastrar a la línea de tiempo (paso 7.5).
//  - "Resumen del día": el hilo con las tareas de hoy (las hechas tachadas), la frase de cómo vas
//    (con "Recolocar" si se te pasó algo) y qué toca ahora y después
// Las dos llevan una "?" que explica para qué sirven.
import type { CSSProperties } from 'react';
import type { Tarea } from '../useTareas';
import type { Resumen, hiloDelDia } from './dia';
import { duracion, fraseDelDia, inicioDe } from './dia';
import Ayuda from './Ayuda';
import { empezarArrastre } from './arrastre';
import { textoDuracion } from '../tareas/frase';
import { estiloPrioridad } from '../tareas/prioridades';
import { INICIO_DIA, textoHora } from '../tareas/pulso';

interface PropsSinHora {
  tareas: Tarea[];
  huecos: Map<number, number | null>; // id → minuto del primer hueco libre (null = ya no cabe hoy)
  planificando: number | null; // la que se está guardando ahora mismo
  alPlanificar: (t: Tarea) => void;
}

// Cada nota un poco torcida, alternando, como en el prototipo
const GIROS = [-1.5, 1.2, 1, -1.2];

export function SinHoraAsignada({ tareas, huecos, planificando, alPlanificar }: PropsSinHora) {
  return (
    <section aria-labelledby="midia-sin-hora" className="midia-carta relative">
      <Ayuda texto="Aquí salen las tareas de hoy que aún no tienen hora. El botón dice a qué hora se pondrá (el primer hueco libre desde ahora); también puedes arrastrarlas a la línea de tiempo." />
      <div className="mb-1 flex items-center gap-2">
        <h2 id="midia-sin-hora" className="text-base font-extrabold">
          Notas sueltas
        </h2>
        {tareas.length > 0 && <span className="midia-sueltas-n">{tareas.length}</span>}
      </div>
      <p className="mb-3 text-[13px] text-[#5b6b7c]">Son de hoy y aún no tienen hora.</p>
      {tareas.length > 0 ? (
        <ul className="midia-sueltas">
          {tareas.map((t, i) => {
            const prioridad = estiloPrioridad(t.prioridad);
            const hueco = huecos.get(t.id) ?? null;
            const estilo = { '--cinta': prioridad.color, '--giro': `${GIROS[i % GIROS.length]}deg` } as CSSProperties;
            return (
              <li key={t.id} className="midia-suelta" style={estilo} draggable onDragStart={(e) => empezarArrastre(e, t.id, duracion(t))}>
                <p className="midia-suelta-titulo">{t.titulo}</p>
                <p className="midia-suelta-dato">
                  {textoDuracion(duracion(t))} · {prioridad.nombre.toLowerCase()}
                </p>
                <button
                  type="button"
                  onClick={() => alPlanificar(t)}
                  disabled={planificando === t.id}
                  aria-label={hueco === null ? `No queda hueco hoy para «${t.titulo}»` : `Poner «${t.titulo}» a las ${textoHora(hueco)}`}
                  className="midia-planificar"
                >
                  {hueco === null ? 'Sin hueco hoy' : `A las ${textoHora(hueco)}`}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="midia-sueltas-ok">
          <span className="midia-sello" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <strong>No hay notas sueltas.</strong>
          <span className="midia-sueltas-ok-hora">Todo tiene su hora.</span>
        </div>
      )}
    </section>
  );
}

interface PropsResumen {
  resumen: Resumen;
  hilo: ReturnType<typeof hiloDelDia>;
  recolocando: boolean; // se está guardando (evita dobles clics)
  alRecolocar: () => void; // una atrasada → a su primer hueco; varias → Reorganizar
}

// El trazo de Tachit (raya que acaba en check) que tacha los puntitos de las tareas hechas
function Tachon() {
  return (
    <svg className="midia-punto-tachon" viewBox="0 0 30 12" aria-hidden="true">
      <path d="M1 7 H20 L23 10 L29 2" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ResumenDia({ resumen, hilo, recolocando, alRecolocar }: PropsResumen) {
  const atrasadas = resumen.atrasadas;
  const vasAlDia = atrasadas.length === 0 && hilo.total > 0 && hilo.hechas < hilo.total;
  return (
    <section aria-labelledby="midia-resumen" className="midia-carta relative">
      <Ayuda texto="Cómo va tu día de un vistazo: cada puntito es una tarea de hoy en su hora. Las hechas se tachan, las rojas se te pasaron y la raya es «ahora». Abajo, qué toca ahora y qué viene después." />
      <h2 id="midia-resumen" className="mb-4 text-base font-extrabold">
        Resumen del día
      </h2>
      {/* El hilo es un dibujo: lo importante se dice también con palabras en la frase de debajo */}
      <div className="midia-hilo" aria-hidden="true">
        <span className="midia-hilo-linea" />
        <span className="midia-hilo-separa" />
        {hilo.puntos.map((p) => (
          <span
            key={p.id}
            className={`midia-punto midia-punto-${p.estado}`}
            style={{ left: `${p.x}%` }}
            title={`${p.inicio === null ? 'sin hora' : textoHora(p.inicio)} · ${p.titulo}`}
          >
            {p.estado === 'hecha' && <Tachon />}
          </span>
        ))}
        <span className="midia-hilo-ahora" style={{ left: `${hilo.ahora}%` }}>
          <span>ahora</span>
        </span>
        <span className="midia-hilo-etiqueta left-0">{textoHora(INICIO_DIA)}</span>
        <span className="midia-hilo-etiqueta right-0">sin hora</span>
      </div>
      <p className="midia-frase">
        {fraseDelDia(resumen.libre, hilo.hechas, hilo.total)}
        {atrasadas.length > 0 && (
          <>
            {' '}
            <strong className="text-[#b42318]">
              {atrasadas.length === 1
                ? `A las ${textoHora(inicioDe(atrasadas[0]) ?? 0)} se te pasó «${atrasadas[0].titulo}».`
                : `Se te pasaron ${atrasadas.length} tareas.`}
            </strong>
            <button type="button" onClick={alRecolocar} disabled={recolocando} className="midia-recolocar">
              {atrasadas.length === 1 ? 'Recolocar' : 'Recolocarlas'}
            </button>
          </>
        )}
        {vasAlDia && (
          <>
            {' '}
            <strong className="text-[#17804f]">Vas al día.</strong>
          </>
        )}
      </p>
      <div className="midia-siguiente">
        <p>
          <span className="midia-siguiente-que">AHORA</span>
          <span className={hilo.enCurso ? 'midia-siguiente-tarea' : 'midia-siguiente-nada'}>{hilo.enCurso?.titulo ?? 'Nada en curso'}</span>
          {hilo.enCurso && <span className="midia-siguiente-hora">hasta {hilo.enCurso.hasta}</span>}
        </p>
        <p>
          <span className="midia-siguiente-que">DESPUÉS</span>
          <span className={hilo.despues ? 'midia-siguiente-tarea' : 'midia-siguiente-nada'}>{hilo.despues?.titulo ?? 'Nada más con hora hoy'}</span>
          {hilo.despues && <span className="midia-siguiente-hora">{hilo.despues.hora}</span>}
        </p>
      </div>
    </section>
  );
}
