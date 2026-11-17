// pantallas/ritmo/CabeceraRitmo.tsx
// La cabecera de Mi ritmo, «Así va tu semana» (Fase 9, paso 9.4, idea 1 «El pulso de la semana»).
// La misma banda que «Así va tu día» en Mi día, con:
//  - una frase que se escribe sola con tus datos, con lo importante subrayado con rotulador
//  - a la derecha (en el móvil, debajo), la semana dibujada como la línea de pulso del icono de Mi ritmo:
//    cada día sube según cuántas tareas tachaste; el descanso queda plano con su lunita; hoy lleva un puntito
//    y lo que falta de semana va en línea discontinua.
// Los cálculos están en ritmo.ts (pulsoSemana, trazosPulso y textosCabecera); aquí solo se dibuja.
import { useId } from 'react';
import { LIENZO_PULSO, textosCabecera, trazosPulso, type PulsoSemana, type RachaAmable } from './ritmo';

const NOMBRE_DIA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

// La misma semana, en palabras, para los lectores de pantalla (el dibujo no se puede "leer")
function semanaEnPalabras(pulso: PulsoSemana) {
  return pulso.dias
    .map((d, i) => {
      const nombre = d.esHoy ? 'hoy' : NOMBRE_DIA[i];
      if (d.estado === 'futuro') return null;
      if (d.estado === 'descanso') return `${nombre}, descanso`;
      return `${nombre}, ${d.n} ${d.n === 1 ? 'tachada' : 'tachadas'}`;
    })
    .filter(Boolean)
    .join('; ');
}

function CabeceraRitmo({ pulso, racha }: { pulso: PulsoSemana; racha: RachaAmable }) {
  const id = useId();
  const tx = textosCabecera(pulso, racha);
  const tr = trazosPulso(pulso.dias);
  const { ancho, alto } = LIENZO_PULSO;

  return (
    <section aria-labelledby={id} className="ritmo-banda">
      <div className="ritmo-banda-texto">
        <p className="ritmo-ojo">{tx.ojo}</p>
        <h2 id={id} className="ritmo-titular">
          {tx.titular.antes}
          <span className="ritmo-rotu">{tx.titular.destacado}</span>
          {tx.titular.despues}
        </h2>
        <p className="ritmo-detalle">{tx.detalle}</p>
      </div>

      <figure className="ritmo-pulso">
        <svg viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label={`Tu semana: ${semanaEnPalabras(pulso)}`}>
          <path className="ritmo-pulso-linea" d={tr.solido} />
          {tr.discontinuo && <path className="ritmo-pulso-falta" d={tr.discontinuo} />}
          {tr.numeros.map((n) => (
            <text key={`${n.x}`} x={n.x} y={n.y} textAnchor="middle" className="ritmo-pulso-num">
              {n.n}
            </text>
          ))}
          {tr.lunas.map((l) => (
            <path key={`${l.x}`} className="ritmo-pulso-luna" transform={`translate(${l.x - 6} ${l.y - 9})`} d="M10 1.5a6 6 0 1 0 1.5 9.3A5 5 0 0 1 10 1.5z" />
          ))}
          {tr.discontinuo && (
            <>
              <circle className="ritmo-pulso-halo" cx={tr.punto.x} cy={tr.punto.y} r="11" />
              <circle className="ritmo-pulso-punto" cx={tr.punto.x} cy={tr.punto.y} r="5.5" />
            </>
          )}
        </svg>
        <div className="ritmo-pulso-dias" aria-hidden="true">
          {pulso.dias.map((d) => (
            <span key={d.dia} className={d.esHoy ? 'hoy' : d.estado === 'futuro' ? 'futuro' : undefined}>
              {d.esHoy ? 'HOY' : d.letra}
            </span>
          ))}
        </div>
      </figure>
    </section>
  );
}

export default CabeceraRitmo;
