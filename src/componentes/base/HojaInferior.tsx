// componentes/base/HojaInferior.tsx
// La hoja que sube desde abajo en el móvil (por ejemplo, para crear una tarea), igual que en el prototipo:
// fondo oscuro detrás, esquinas de arriba redondeadas, la rayita para cerrar y un degradado con los colores del tema.
//
// Para que se pueda usar bien con teclado y lector de pantalla:
//  - es un diálogo (role="dialog" + aria-modal): el lector sabe que es una ventana encima de la página
//  - se cierra con Escape, tocando el fondo oscuro o la rayita
//  - mientras está abierta, el tabulador no se escapa de ella, y al cerrarla el foco vuelve a donde estaba
//  - la página de detrás no se mueve con el scroll
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  abierta: boolean;
  alCerrar: () => void;
  etiqueta: string; // lo que dice el lector de pantalla al abrirla (por ejemplo, "Nueva tarea")
  children: ReactNode;
}

const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function HojaInferior({ abierta, alCerrar, etiqueta, children }: Props) {
  const hoja = useRef<HTMLDivElement>(null);
  // Guardamos alCerrar en una referencia para no volver a montar los efectos si la función cambia
  const cerrar = useRef(alCerrar);
  useEffect(() => {
    cerrar.current = alCerrar;
  }, [alCerrar]);

  useEffect(() => {
    if (!abierta) return;

    const focoAnterior = document.activeElement as HTMLElement | null;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // la página de detrás no se mueve
    hoja.current?.focus();

    const alPulsarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        cerrar.current();
        return;
      }
      // Tabulador: al llegar al último elemento vuelve al primero (y al revés con Mayús)
      if (evento.key === 'Tab' && hoja.current) {
        const elementos = Array.from(hoja.current.querySelectorAll<HTMLElement>(ENFOCABLES));
        if (elementos.length === 0) {
          evento.preventDefault();
          return;
        }
        const primero = elementos[0];
        const ultimo = elementos[elementos.length - 1];
        if (evento.shiftKey && (document.activeElement === primero || document.activeElement === hoja.current)) {
          evento.preventDefault();
          ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
          evento.preventDefault();
          primero.focus();
        }
      }
    };
    document.addEventListener('keydown', alPulsarTecla);

    return () => {
      document.removeEventListener('keydown', alPulsarTecla);
      document.body.style.overflow = overflowAnterior;
      focoAnterior?.focus(); // el foco vuelve al botón que la abrió
    };
  }, [abierta]);

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
