// pantallas/Calendario.tsx
// Calendario (Fase 4, paso 4.7): de momento, el calendario que ya tenías, dentro del marco nuevo.
// En la Fase 8 se rehace como en el prototipo (vista Mes y Semana).
import Calendario from '../components/Calendario';
import { useTareas } from './useTareas';

function PantallaCalendario() {
  const { tareas, error, alCambiar } = useTareas();
  return (
    <div className="flex max-w-[1100px] flex-col">
      {error && <p className="mb-3 text-sm text-[#b42318]">{error}</p>}
      <Calendario tareas={tareas} onCambio={alCambiar} />
    </div>
  );
}

export default PantallaCalendario;
