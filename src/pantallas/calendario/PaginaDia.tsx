// pantallas/calendario/PaginaDia.tsx
// La página de libreta del día elegido (Fase 8, paso 8.3), a la derecha del mes:
//  - arriba, el día ("Martes, 29 de septiembre") y cuántas llevas tachadas
//  - cada tarea en su renglón: la hora en naranja, el círculo para tacharla y su nombre
//    (al pulsar el nombre se abre la tarea para editarla)
//  - «+ Añadir tarea este día»: abre la caja (o la hoja) de crear con ese día ya puesto
import type { Tarea } from '../useTareas';
import { inicioDe } from '../midia/dia';
import { textoHora } from '../tareas/pulso';
import { estiloPrioridad } from '../tareas/prioridades';
import { DibujoIcono } from '../tareas/PastillaIcono';
import { resumenTachado, tituloDia, type EstadoCalendario } from './calendario';

interface Props {
  fecha: string;
  tareas: Tarea[]; // las de ese día, ya en orden de hora
  estadoDe: (t: Tarea) => EstadoCalendario;
  alTachar: (t: Tarea) => void;
  alAbrir: (id: number) => void;
  alAnadir: () => void;
}

const CLASE_ESTADO: Record<EstadoCalendario, string> = { pendiente: '', hecha: ' hecha', atrasada: ' atrasada' };

function PaginaDia({ fecha, tareas, estadoDe, alTachar, alAbrir, alAnadir }: Props) {
  const { hechas, total } = resumenTachado(tareas);

  return (
    <section aria-labelledby="pagina-dia-titulo" className="cal-pagina">
      <h2 id="pagina-dia-titulo" className="cal-pagina-titulo">
        {tituloDia(fecha)}
      </h2>
      <p className="cal-pagina-sub">{total ? `${hechas} de ${total} tachadas` : 'Sin tareas este día'}</p>
      <ul className="cal-lista">
        {tareas.map((t) => {
          const estado = estadoDe(t);
          const inicio = inicioDe(t);
          return (
            <li key={t.id} className={'cal-fila' + CLASE_ESTADO[estado]}>
              <span className="cal-fila-hora">{inicio !== null ? textoHora(inicio) : 'sin hora'}</span>
              <button
                type="button"
                onClick={() => alTachar(t)}
                aria-pressed={estado === 'hecha'}
                aria-label={`${estado === 'hecha' ? 'Destachar' : 'Tachar'} «${t.titulo}»`}
                className="cal-tachar"
              >
                <DibujoIcono trazo="M5 12.5l4.5 4.5L19 7.5" tam={11} grosor={3.6} />
              </button>
              <button
                type="button"
                onClick={() => alAbrir(t.id)}
                title={`Abrir «${t.titulo}»`}
                className="cal-fila-nombre"
                style={{ background: `color-mix(in srgb, ${estiloPrioridad(t.prioridad).color} 25%, transparent)` }}
              >
                {t.titulo}
                {estado === 'atrasada' && <span className="sr-only"> (atrasada)</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {total === 0 && <p className="cal-vacia">Página en blanco: nada apuntado este día.</p>}
      <button type="button" onClick={alAnadir} className="cal-anadir">
        + Añadir tarea este día
      </button>
    </section>
  );
}

export default PaginaDia;
