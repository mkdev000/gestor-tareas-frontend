// pantallas/calendario/Leyenda.tsx
// La leyenda de debajo del Calendario (Fase 8, paso 8.4): qué significa cada color.
//  - el FONDO de cada tarea dice su estado: pendiente, hecha (tachada) o atrasada (en rojo)
//  - la RAYITA de la izquierda dice su prioridad: alta (naranja), media (azul) o baja (gris)
// En el móvil las fichas son tan pequeñas que solo se ve la barrita del estado, así que solo sale esa parte.
import { PRIORIDADES } from '../tareas/prioridades';

function Leyenda({ movil = false }: { movil?: boolean }) {
  return (
    <div className={'cal-leyenda' + (movil ? ' movil' : '')}>
      <span>
        <i className="pendiente" />
        Pendiente
      </span>
      <span>
        <i className="hecha" />
        Hecha
      </span>
      <span>
        <i className="atrasada" />
        Atrasada
      </span>
      {!movil && (
        <>
          <span className="cal-leyenda-sep" aria-hidden="true" />
          <span className="font-bold">Prioridad:</span>
          {(['alta', 'media', 'baja'] as const).map((p) => (
            <span key={p}>
              <i className="prioridad" style={{ background: PRIORIDADES[p].color }} />
              {PRIORIDADES[p].nombre}
            </span>
          ))}
        </>
      )}
    </div>
  );
}

export default Leyenda;
