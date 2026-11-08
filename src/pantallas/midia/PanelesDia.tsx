// pantallas/midia/PanelesDia.tsx
// Las dos tarjetas de la columna derecha de Mi día (Fase 7, paso 7.4), igual que en el prototipo web:
//  - "Notas sueltas": las tareas de hoy sin hora, como notitas pegadas. Su botón dice a qué hora se
//    pondrá la tarea (el primer hueco libre desde ahora), así se sabe qué hace antes de pulsarlo.
//    (Arrastrarlas a la línea de tiempo llega con la línea de tiempo, en el paso 7.5)
//  - "Resumen del día": tiempo planificado, tiempo libre restante, atrasadas y completadas
import type { CSSProperties } from 'react';
import type { Tarea } from '../useTareas';
import type { Resumen } from './dia';
import { duracion } from './dia';
import { textoDuracion } from '../tareas/frase';
import { estiloPrioridad } from '../tareas/prioridades';
import { textoHora } from '../tareas/pulso';

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
    <section aria-labelledby="midia-sin-hora" className="midia-carta">
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
              <li key={t.id} className="midia-suelta" style={estilo}>
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

export function ResumenDia({ resumen }: { resumen: Resumen }) {
  const fila = 'flex justify-between text-sm';
  return (
    <section aria-labelledby="midia-resumen" className="midia-carta flex flex-col gap-2.5">
      <h2 id="midia-resumen" className="text-base font-extrabold">
        Resumen del día
      </h2>
      <p className={fila}>
        <span className="text-[#5b6b7c]">Tiempo planificado</span>
        <strong>{textoDuracion(resumen.planificado)}</strong>
      </p>
      <p className={fila}>
        <span className="text-[#5b6b7c]">Tiempo libre restante</span>
        <strong>{textoDuracion(resumen.libre)}</strong>
      </p>
      <p className={fila}>
        <span className="text-[#5b6b7c]">Atrasadas</span>
        <strong style={{ color: resumen.atrasadas.length ? '#b42318' : '#17804f' }}>{resumen.atrasadas.length}</strong>
      </p>
      <p className={fila}>
        <span className="text-[#5b6b7c]">Completadas</span>
        <strong className="text-[#17804f]">{resumen.completadas}</strong>
      </p>
    </section>
  );
}
