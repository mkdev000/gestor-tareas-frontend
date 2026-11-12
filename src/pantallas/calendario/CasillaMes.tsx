// pantallas/calendario/CasillaMes.tsx
// Un día del mes en el Calendario (Fase 8, paso 8.3): «la ficha».
//  - el número del día se va TACHANDO según tachas sus tareas (con 2 de 4, medio trazo; con todas, entero)
//  - arriba a la derecha, cuántas llevas ("2/4") o ✓ si están todas
//  - debajo, hasta 4 renglones con sus tareas y "+3 más" si hay más. El FONDO dice el estado (gris azulado
//    pendiente, tachada si está hecha, rojo si se te ha pasado) y la rayita de la izquierda, la prioridad
//    (naranja alta, azul media, gris baja), como en las tarjetas de Tareas (cambio del paso 8.4)
// Toda la casilla es un botón: al pulsarla se elige ese día y su página de libreta sale a la derecha.
// Paso 8.4: la misma ficha sirve para la Semana, más alta: con el día de la semana arriba ("JUE"),
// más renglones y la hora delante de cada tarea ("10:00 Ir al dentista").
import type { CSSProperties } from 'react';
import type { Tarea } from '../useTareas';
import { estiloPrioridad } from '../tareas/prioridades';
import { inicioDe } from '../midia/dia';
import { textoHora } from '../tareas/pulso';
import { casilla, resumenTachado, tituloDia, type DiaCalendario, type EstadoCalendario } from './calendario';

interface Props {
  dia: DiaCalendario;
  tareas: Tarea[]; // las de ese día, ya en orden de hora
  elegido: boolean;
  estadoDe: (t: Tarea) => EstadoCalendario;
  alElegir: (fecha: string) => void;
  renglones?: number; // cuántos renglones caben (mes: 4)
  diaSemana?: string; // "JUE" (en la Semana)
  conHora?: boolean; // la hora delante de cada tarea (en la Semana)
}

// "10:00 " delante del nombre (en la Semana); nada si la tarea no tiene hora
const horaDelante = (t: Tarea) => {
  const inicio = inicioDe(t);
  return inicio !== null ? `${textoHora(inicio)} ` : '';
};

const CLASE_ESTADO: Record<EstadoCalendario, string> = { pendiente: '', hecha: ' hecha', atrasada: ' atrasada' };

function CasillaMes({ dia, tareas, elegido, estadoDe, alElegir, renglones = 4, diaSemana, conHora = false }: Props) {
  const { hechas, total, parte, completo } = resumenTachado(tareas);
  const { visibles, mas } = casilla(tareas, renglones);
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
      {diaSemana && (
        <span className="cal-dia-sem" aria-hidden="true">
          {diaSemana}
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
          style={{ '--prio': estiloPrioridad(t.prioridad).color } as CSSProperties}
        >
          {/* En el móvil solo se ve la barrita: el nombre se esconde (cal-movil, en index.css) */}
          <span className="cal-renglon-texto">
            {conHora ? horaDelante(t) : ''}
            {t.titulo}
          </span>
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
