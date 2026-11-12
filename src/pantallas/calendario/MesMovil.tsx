// pantallas/calendario/MesMovil.tsx
// El mes del Calendario en el MÓVIL (Fase 8, paso 8.5), como en el prototipo móvil:
// la misma «ficha» que en la web (CasillaMes.tsx) pero en pequeño, porque en el móvil no caben los nombres:
//  - el número del día se va tachando según tachas sus tareas
//  - debajo, una barrita por tarea (del color de su prioridad; verde clarito si está hecha, roja si se te ha pasado)
//  - arriba: "Noviembre 2026" con ‹ y › para cambiar de mes, y "Noviembre: 4 de 11 tachadas" con su barra
// Al tocar un día, su página de libreta sale debajo (la pone la pantalla, Calendario.tsx).
import type { Tarea } from '../useTareas';
import { DibujoIcono } from '../tareas/PastillaIcono';
import CasillaMes from './CasillaMes';
import { tituloMes, type DiaCalendario, type EstadoCalendario } from './calendario';

const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface Props {
  mes: string; // el día 1 del mes que se ve
  dias: DiaCalendario[];
  porDia: Map<string, Tarea[]>;
  elegido: string;
  tachado: { hechas: number; total: number; parte: number };
  estadoDe: (t: Tarea) => EstadoCalendario;
  alElegir: (fecha: string) => void;
  alMover: (cuanto: number) => void; // -1 = mes anterior, 1 = mes siguiente
}

function MesMovil({ mes, dias, porDia, elegido, tachado, estadoDe, alElegir, alMover }: Props) {
  const titulo = tituloMes(mes);
  return (
    <div className="cal-tarjeta-movil">
      <div className="flex items-center gap-2 px-1 pb-1">
        <h2 aria-live="polite" className="m-0 grow text-lg font-extrabold">
          {titulo}
        </h2>
        <button type="button" onClick={() => alMover(-1)} aria-label="Mes anterior" className="cal-flecha-movil">
          <DibujoIcono trazo="M15 6l-6 6 6 6" tam={18} grosor={2.4} />
        </button>
        <button type="button" onClick={() => alMover(1)} aria-label="Mes siguiente" className="cal-flecha-movil">
          <DibujoIcono trazo="M9 6l6 6-6 6" tam={18} grosor={2.4} />
        </button>
      </div>

      <div className="cal-progreso movil">
        <span>{`${titulo.split(' ')[0]}: ${tachado.hechas} de ${tachado.total} tachadas`}</span>
        <div className="cal-barra" aria-hidden="true">
          <i style={{ width: `${tachado.parte * 100}%` }} />
        </div>
      </div>

      <div className="cal-letras" aria-hidden="true">
        {LETRAS.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <div className="cal-rejilla cal-movil">
        {dias.map((d) => (
          <CasillaMes key={d.fecha} dia={d} tareas={porDia.get(d.fecha) ?? []} elegido={d.fecha === elegido} estadoDe={estadoDe} alElegir={alElegir} />
        ))}
      </div>

      <div className="cal-leyenda movil">
        <span>
          <i className="punto pendiente" />
          Pendiente
        </span>
        <span>
          <i className="punto hecha" />
          Hecha
        </span>
        <span>
          <i className="punto atrasada" />
          Atrasada
        </span>
      </div>
    </div>
  );
}

export default MesMovil;
