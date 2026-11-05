// pantallas/midia/PanelesDia.tsx
// Las dos tarjetas de la columna derecha de Mi día (Fase 7, paso 7.4), igual que en el prototipo web:
//  - "Sin hora asignada": las tareas de hoy sin hora, con el botón "Planificar" (primer hueco libre)
//  - "Resumen del día": tiempo planificado, tiempo libre restante, atrasadas y completadas
import type { Tarea } from '../useTareas';
import type { Resumen } from './dia';
import { duracion } from './dia';
import { textoDuracion } from '../tareas/frase';
import { estiloPrioridad } from '../tareas/prioridades';

interface PropsSinHora {
  tareas: Tarea[];
  planificando: number | null; // la que se está guardando ahora mismo
  alPlanificar: (t: Tarea) => void;
}

export function SinHoraAsignada({ tareas, planificando, alPlanificar }: PropsSinHora) {
  return (
    <section aria-labelledby="midia-sin-hora" className="midia-carta">
      <h2 id="midia-sin-hora" className="mb-1 text-base font-extrabold">
        Sin hora asignada
      </h2>
      <p className="mb-3 text-[13px] text-[#5b6b7c]">Planifícalas en el primer hueco libre o arrástralas a la línea de tiempo.</p>
      <div className="flex flex-col gap-2">
        {tareas.map((t) => {
          const prioridad = estiloPrioridad(t.prioridad);
          return (
            <div key={t.id} className="midia-sin-hora" style={{ borderLeftColor: prioridad.color }}>
              <div className="min-w-0 grow">
                <p className="text-sm font-bold text-[#0f1f2e]">{t.titulo}</p>
                <p className="text-xs text-[#5b6b7c]">
                  {textoDuracion(duracion(t))} · prioridad {prioridad.nombre.toLowerCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => alPlanificar(t)}
                disabled={planificando === t.id}
                aria-label={`Planificar: ${t.titulo}`}
                className="midia-planificar"
              >
                Planificar
              </button>
            </div>
          );
        })}
        {tareas.length === 0 && <p className="py-2 text-sm text-[#5b6b7c]">Todo tiene su hora.</p>}
      </div>
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
