// pantallas/ritmo/RitmoVacio.tsx
// Mi ritmo cuando aún no hay ritmo que contar (Fase 9, paso 9.4, idea B2 «Mi ritmo se escribe tachando»).
// En vez de bloques vacíos, una nota de papel con tres renglones, como una lista de Tachit.
// Cada renglón se tacha solo cuando lo consigues (con lo que llevas: «2 de 5»):
//   1. Tacha tu primera tarea → empieza tu racha
//   2. Tacha 5 tareas → tu mapa de energía (a qué hora rindes más)
//   3. Di cuánto tardas en 3 tareas → si te quedas corto calculando
// Sale mientras lleves menos de 5 tareas tachadas (MINIMO_PARA_MAPA).
import { Link } from 'react-router-dom';
import { MINIMO_PARA_MAPA, MINIMO_PARA_MARGEN } from './ritmo';

interface Props {
  hechas: number; // tareas tachadas (del historial)
  conTiempo: number; // tareas tachadas en las que has dicho cuánto tardaste
  textoIr: string; // "Ir a Mi día" (web) o "Ir a Hoy" (móvil)
}

function RitmoVacio({ hechas, conTiempo, textoIr }: Props) {
  const renglones = [
    { hecho: hechas >= 1, titulo: 'Tacha tu primera tarea', sub: 'Empieza tu racha', cuenta: '' },
    {
      hecho: hechas >= MINIMO_PARA_MAPA,
      titulo: `Tacha ${MINIMO_PARA_MAPA} tareas`,
      sub: 'Verás a qué hora rindes más',
      cuenta: `${Math.min(hechas, MINIMO_PARA_MAPA)} de ${MINIMO_PARA_MAPA}`,
    },
    {
      hecho: conTiempo >= MINIMO_PARA_MARGEN,
      titulo: `Di cuánto tardas en ${MINIMO_PARA_MARGEN} tareas`,
      sub: 'Verás si te quedas corto calculando',
      cuenta: `${Math.min(conTiempo, MINIMO_PARA_MARGEN)} de ${MINIMO_PARA_MARGEN}`,
    },
  ];

  return (
    <section aria-labelledby="ritmo-vacio" className="ritmo-vacio">
      <div className="ritmo-vacio-texto">
        <h2 id="ritmo-vacio">Aún no hay ritmo que contar</h2>
        <p>
          Mi ritmo usa lo que tachas para decirte cuándo rindes más, qué se te atasca y cuánto tardas de verdad. En cuanto taches unas pocas tareas, aparece
          aquí.
        </p>
      </div>
      <div className="ritmo-nota">
        <h3>Mi ritmo se escribe tachando</h3>
        <ul>
          {renglones.map((r) => (
            <li key={r.titulo} className={r.hecho ? 'hecho' : undefined}>
              <span className="ritmo-caja" aria-hidden="true">
                ✓
              </span>
              <span className="ritmo-renglon">
                <span className="sr-only">{r.hecho ? 'Hecho: ' : 'Pendiente: '}</span>
                <b>{r.titulo}</b>
                <small>{r.sub}</small>
              </span>
              {!r.hecho && r.cuenta && <span className="ritmo-cuenta">{r.cuenta}</span>}
            </li>
          ))}
        </ul>
        <Link to="/hoy" className="ritmo-ir">
          {textoIr}
        </Link>
      </div>
    </section>
  );
}

export default RitmoVacio;
