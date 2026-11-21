// pantallas/ritmo/TarjetaRitmo.tsx
// La tarjeta de Mi ritmo que responde a una pregunta (paso 9.5): el título con su icono, la «?» con «¿Cómo funciona?»
// y el contenido. La usan «las tres preguntas» (TresPreguntas) y el bloque de abajo (TiempoEImportante).
import { useId, type ReactNode } from 'react';

export interface LineaAyuda {
  icono: string;
  texto: string;
}

interface Props {
  titulo: string;
  icono: ReactNode; // el dibujo del icono (lo de dentro del <svg>)
  ayuda: LineaAyuda[];
  clase: string; // 'ritmo-pregunta' (en la fila de arriba) o 'ritmo-bloque' (tarjeta suelta)
  children: ReactNode;
}

function TarjetaRitmo({ titulo, icono, ayuda, clase, children }: Props) {
  const id = useId();
  return (
    <section aria-labelledby={`${id}-titulo`} className={clase}>
      <p id={`${id}-titulo`} className="ritmo-hora-ojo">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {icono}
        </svg>
        {titulo}
      </p>
      <button type="button" className="ritmo-q" aria-label="¿Cómo funciona?" aria-describedby={`${id}-ayuda`}>
        ?
      </button>
      <div id={`${id}-ayuda`} role="tooltip" className="ritmo-q-texto">
        <b>¿Cómo funciona?</b>
        <ul>
          {ayuda.map((a) => (
            <li key={a.icono}>
              <i aria-hidden="true">{a.icono}</i>
              <span>{a.texto}</span>
            </li>
          ))}
        </ul>
      </div>
      {children}
    </section>
  );
}

export default TarjetaRitmo;
