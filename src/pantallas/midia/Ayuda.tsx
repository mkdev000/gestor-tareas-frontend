// pantallas/midia/Ayuda.tsx
// La "?" de ayuda de los paneles de Mi día (paso 7.4): un botoncito redondo arriba a la derecha que,
// al pasar el ratón o al llegar con el teclado (Tab), enseña para qué sirve ese apartado
// en un bocadillo con el color suave del tema.
// El texto va unido al botón con aria-describedby, así los lectores de pantalla también lo leen.
import { useId } from 'react';

function Ayuda({ texto }: { texto: string }) {
  const id = useId();
  return (
    <>
      <button type="button" className="midia-ayuda" aria-label="¿Para qué sirve?" aria-describedby={id}>
        ?
      </button>
      <p id={id} role="tooltip" className="midia-ayuda-texto">
        <b>¿Para qué sirve?</b>
        {texto}
      </p>
    </>
  );
}

export default Ayuda;
