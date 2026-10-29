// componentes/base/HojaInferior.tsx
// La hoja que sube desde abajo en el móvil (por ejemplo, para crear una tarea), igual que en el prototipo:
// fondo oscuro detrás, esquinas de arriba redondeadas, la rayita para cerrar y un degradado con los colores del tema.
//
// Para que se pueda usar bien con teclado y lector de pantalla:
//  - es un diálogo (role="dialog" + aria-modal): el lector sabe que es una ventana encima de la página
//  - se cierra con Escape, tocando el fondo oscuro o la rayita
//  - mientras está abierta, el tabulador no se escapa de ella, y al cerrarla el foco vuelve a donde estaba
//  - la página de detrás no se mueve con el scroll
import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDialogo } from './useDialogo';

interface Props {
  abierta: boolean;
  alCerrar: () => void;
  etiqueta: string; // lo que dice el lector de pantalla al abrirla (por ejemplo, "Nueva tarea")
  children: ReactNode;
}

function HojaInferior({ abierta, alCerrar, etiqueta, children }: Props) {
  const hoja = useRef<HTMLDivElement>(null);
  // Escape, foco atrapado, foco de vuelta y página quieta: todo en useDialogo (paso 4.6)
  useDialogo(abierta, hoja, alCerrar);

  if (!abierta) return null;

  // createPortal la dibuja al final del <body>, por encima de todo lo demás
  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div className="fondo-hoja absolute inset-0 bg-[rgba(10,30,47,0.5)]" onClick={alCerrar} aria-hidden="true" />
      <div
        ref={hoja}
        role="dialog"
        aria-modal="true"
        aria-label={etiqueta}
        tabIndex={-1}
        className="hoja-inferior absolute inset-x-0 bottom-0 mx-auto box-border flex max-h-[95vh] w-full max-w-[520px] flex-col gap-2.5 overflow-y-auto rounded-t-[30px] px-3.5 pt-1 pb-[22px] font-jakarta text-[#0f1f2e] outline-none"
      >
        <button type="button" onClick={alCerrar} aria-label="Cerrar" className="flex h-[18px] w-16 shrink-0 cursor-pointer items-center justify-center self-center border-0 bg-transparent p-0">
          <span className="h-[5px] w-10 rounded-full bg-tachit-acento-borde" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default HojaInferior;
