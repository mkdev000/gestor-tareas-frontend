// pantallas/calendario/MesMovil.tsx
// El mes (o la semana) del Calendario en el MÓVIL (Fase 8, pasos 8.5 y 8.4), como en el prototipo móvil:
// la misma «ficha» que en la web (CasillaMes.tsx) pero en pequeño, porque en el móvil no caben los nombres:
//  - el número del día se va tachando según tachas sus tareas
//  - debajo, una barrita por tarea, del color de su estado: gris azulado pendiente, verde clarito hecha, roja
//    si se te ha pasado (la prioridad no se ve aquí: no cabe; se ve en la página del día)
//  - arriba: "Noviembre 2026" (o "9 – 15 nov 2026") con ‹ y ›, y cuántas llevas tachadas con su barra
// En la Semana salen solo 7 fichas, más altas, con el día de la semana dentro ("JUE") y hasta 6 barritas.
// Al tocar un día, su página de libreta sale debajo (la pone la pantalla, Calendario.tsx).
import type { Tarea } from '../useTareas';
import { DibujoIcono } from '../tareas/PastillaIcono';
import CasillaMes from './CasillaMes';
import Leyenda from './Leyenda';
import type { DiaCalendario, EstadoCalendario } from './calendario';

const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DIAS_SEMANA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

interface Props {
  semana: boolean; // false = el mes entero; true = solo los 7 días de la semana
  titulo: string; // "Noviembre 2026" o "9 – 15 nov 2026"
  textoTachado: string; // "Noviembre: 4 de 11 tachadas" o "Esta semana: 5 de 14 tachadas"
  parte: number; // de 0 a 1, lo que se llena la barra
  dias: DiaCalendario[];
  porDia: Map<string, Tarea[]>;
  elegido: string;
  estadoDe: (t: Tarea) => EstadoCalendario;
  alElegir: (fecha: string) => void;
  alMover: (cuanto: number) => void; // -1 = anterior, 1 = siguiente
}

function MesMovil({ semana, titulo, textoTachado, parte, dias, porDia, elegido, estadoDe, alElegir, alMover }: Props) {
  const queMueve = semana ? 'Semana' : 'Mes';
  return (
    <div className="cal-tarjeta-movil">
      <div className="flex items-center gap-2 px-1 pb-1">
        <h2 aria-live="polite" className="m-0 grow text-lg font-extrabold">
          {titulo}
        </h2>
        <button type="button" onClick={() => alMover(-1)} aria-label={`${queMueve} anterior`} className="cal-flecha-movil">
          <DibujoIcono trazo="M15 6l-6 6 6 6" tam={18} grosor={2.4} />
        </button>
        <button type="button" onClick={() => alMover(1)} aria-label={`${queMueve} siguiente`} className="cal-flecha-movil">
          <DibujoIcono trazo="M9 6l6 6-6 6" tam={18} grosor={2.4} />
        </button>
      </div>

      <div className="cal-progreso movil">
        <span>{textoTachado}</span>
        <div className="cal-barra" aria-hidden="true">
          <i style={{ width: `${parte * 100}%` }} />
        </div>
      </div>

      {!semana && (
        <div className="cal-letras" aria-hidden="true">
          {LETRAS.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      )}
      <div className={'cal-rejilla cal-movil' + (semana ? ' cal-semana-movil' : '')}>
        {dias.map((d, i) => (
          <CasillaMes
            key={d.fecha}
            dia={d}
            tareas={porDia.get(d.fecha) ?? []}
            elegido={d.fecha === elegido}
            estadoDe={estadoDe}
            alElegir={alElegir}
            renglones={semana ? 6 : 4}
            diaSemana={semana ? DIAS_SEMANA[i] : undefined}
          />
        ))}
      </div>

      {!semana && <Leyenda movil />}
    </div>
  );
}

export default MesMovil;
