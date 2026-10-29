// marco/Cabecera.tsx
// La cabecera de la web (Fase 4, paso 4.5), igual que en el prototipo:
// a la izquierda el nombre de la pantalla y la fecha de hoy; a la derecha el botón "Nueva tarea".
// El botón (idea A, "el borde que se dibuja"): al pasar el ratón, un trazo recorre el borde como un
// bolígrafo, el fondo se rellena de izquierda a derecha y el + gira. Todo con CSS (ver index.css).
import { hoyISO, fechaLarga } from '../utils/dias';

interface Props {
  titulo: string;
  alNuevaTarea: () => void;
}

function Cabecera({ titulo, alNuevaTarea }: Props) {
  return (
    <header className="sticky top-0 z-10 flex h-[72px] shrink-0 items-center gap-3 border-b border-[#e3e8ef] bg-white px-4 sm:px-8">
      <div className="flex min-w-0 grow flex-col">
        <h1 className="truncate text-xl font-extrabold tracking-[-0.3px]">{titulo}</h1>
        <span className="text-[13px] text-[#5b6b7c]">{fechaLarga(hoyISO())}</span>
      </div>
      <button type="button" onClick={alNuevaTarea} className="boton-nueva-tarea">
        {/* El borde que se dibuja: un rectángulo con las esquinas redondeadas del botón */}
        <svg className="trazo-borde" aria-hidden="true">
          <rect x="0.75" y="0.75" width="calc(100% - 1.5px)" height="calc(100% - 1.5px)" rx="11.25" pathLength="400" />
        </svg>
        <svg className="mas-nueva-tarea" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>Nueva tarea</span>
      </button>
    </header>
  );
}

export default Cabecera;
