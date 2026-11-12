// pantallas/calendario/CasillaMes.tsx
// Un día del mes en el Calendario (Fase 8, paso 8.3): «la ficha».
//  - el número del día se va TACHANDO según tachas sus tareas (con 2 de 4, medio trazo; con todas, entero)
//  - arriba a la derecha, cuántas llevas ("2/4") o ✓ si están todas
//  - debajo, hasta 4 renglones con sus tareas (del color de su prioridad; tachadas si están hechas,
//    en rojo si se te han pasado) y "+3 más" si hay más
// Toda la casilla es un botón: al pulsarla se elige ese día y su página de libreta sale a la derecha.
import type { Tarea } from '../useTareas';
import { estiloPrioridad } from '../tareas/prioridades';
import { casilla, resumenTachado, tituloDia, type DiaCalendario, type EstadoCalendario } from './calendario';

interface Props {
  dia: DiaCalendario;
  tareas: Tarea[]; // las de ese día, ya en orden de hora
  elegido: boolean;
  estadoDe: (t: Tarea) => EstadoCalendario;
  alElegir: (fecha: string) => void;
}

const CLASE_ESTADO: Record<EstadoCalendario, string> = { pendiente: '', hecha: ' hecha', atrasada: ' atrasada' };

function CasillaMes({ dia, tareas, elegido, estadoDe, alElegir }: Props) {
  const { hechas, total, parte, completo } = resumenTachado(tareas);
  const { visibles, mas } = casilla(tareas);
  const clase = 'cal-casilla' + (dia.delMes ? '' : ' fuera') + (dia.esHoy ? ' es-hoy' : '') + (elegido ? ' elegida' : '') + (completo ? ' completa' : '');
  const resumen = total ? `${hechas} de ${total} tachadas` : 'sin tareas';

  return (
    <button
      type="button"
      onClick={() => alElegir(dia.fecha)}
      aria-pressed={elegido}
      aria-label={`${tituloDia(dia.fecha)}${dia.esHoy ? ' (hoy)' : ''}: ${resumen}`}
      className={clase}
    >
      {hechas > 0 && (
        <span className="cal-cuenta" aria-hidden="true">
          {completo ? '✓' : `${hechas}/${total}`}
        </span>
      )}
      <span className="cal-num" aria-hidden="true">
        {dia.numero}
        {parte > 0 && (
          // El trazo con su "check" al final; se dibuja más o menos largo según la parte tachada
          <svg viewBox="0 0 120 10" preserveAspectRatio="none">
            <path d="M1 5 H96 L104 9 L118 1" style={{ strokeDashoffset: 140 * (1 - parte) }} />
          </svg>
        )}
      </span>
      {visibles.map((t) => (
        <span
          key={t.id}
          aria-hidden="true"
          className={'cal-renglon' + CLASE_ESTADO[estadoDe(t)]}
          style={{ background: `color-mix(in srgb, ${estiloPrioridad(t.prioridad).color} 26%, transparent)` }}
        >
          {/* En el móvil solo se ve la barrita: el nombre se esconde (cal-movil, en index.css) */}
          <span className="cal-renglon-texto">{t.titulo}</span>
        </span>
      ))}
      {mas > 0 && (
        <span className="cal-mas" aria-hidden="true">
          +{mas} más
        </span>
      )}
    </button>
  );
}

export default CasillaMes;
