// componentes/base/useDialogo.ts
// Lo que necesita cualquier ventana que se abre ENCIMA de la página (Fase 4, paso 4.6):
// la hoja inferior (4.3) y el menú del móvil (4.6) la usan igual, así no repetimos el código.
//  - se cierra con la tecla Escape
//  - mientras está abierta, el tabulador no se escapa de ella (se "atrapa" el foco)
//  - al abrir, el foco entra en la ventana; al cerrar, vuelve al botón que la abrió
//  - la página de detrás no se mueve con el scroll
import { useEffect, useRef, type RefObject } from 'react';

const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialogo(abierto: boolean, ventana: RefObject<HTMLElement | null>, alCerrar: () => void) {
  // Guardamos alCerrar en una referencia para no volver a montar el efecto si la función cambia
  const cerrar = useRef(alCerrar);
  useEffect(() => {
    cerrar.current = alCerrar;
  }, [alCerrar]);

  useEffect(() => {
    if (!abierto) return;

    const focoAnterior = document.activeElement as HTMLElement | null;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // la página de detrás no se mueve
    ventana.current?.focus();

    const alPulsarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        cerrar.current();
        return;
      }
      // Tabulador: al llegar al último elemento vuelve al primero (y al revés con Mayús)
      if (evento.key === 'Tab' && ventana.current) {
        const elementos = Array.from(ventana.current.querySelectorAll<HTMLElement>(ENFOCABLES));
        if (elementos.length === 0) {
          evento.preventDefault();
          return;
        }
        const primero = elementos[0];
        const ultimo = elementos[elementos.length - 1];
        if (evento.shiftKey && (document.activeElement === primero || document.activeElement === ventana.current)) {
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
  }, [abierto, ventana]);
}
