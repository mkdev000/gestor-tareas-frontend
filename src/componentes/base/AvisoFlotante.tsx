// componentes/base/AvisoFlotante.tsx
// El aviso que aparece unos segundos (un "toast"), igual que en el prototipo:
//  - web: abajo a la derecha, blanco, con icono de Tachit, "Tachit · ahora", un título en negrita y una frase
//  - móvil (paso 4.6): arriba, de lado a lado, con el color del panel del tema (como en el prototipo móvil),
//    para que no lo tape la barra de abajo
// Se cierra solo a los 4,2 segundos (como en el prototipo).
import { useEffect } from 'react';

export interface DatosAviso {
  titulo: string;
  texto: string;
}

const DURACION_MS = 4200;

function AvisoFlotante({ aviso, alCerrar }: { aviso: DatosAviso; alCerrar: () => void }) {
  useEffect(() => {
    const temporizador = setTimeout(alCerrar, DURACION_MS);
    // Si el aviso cambia o se sale de la pantalla antes de tiempo, paramos el temporizador
    return () => clearTimeout(temporizador);
  }, [aviso, alCerrar]);

  return (
    // role="status": los lectores de pantalla lo leen en voz alta sin interrumpir lo que estés haciendo
    <div
      role="status"
      className={
        'fixed top-3 right-3.5 left-3.5 z-[70] flex items-center gap-2.5 rounded-[18px] bg-tachit-panel px-3.5 py-3 font-jakarta text-tachit-panel-texto shadow-[0_14px_30px_rgba(10,30,47,0.3)] ' +
        'lg:top-auto lg:right-6 lg:bottom-6 lg:left-auto lg:w-[360px] lg:items-start lg:gap-3 lg:rounded-[14px] lg:border lg:border-[#e3e8ef] lg:bg-white lg:px-4 lg:py-3.5 lg:text-[#0f1f2e] lg:shadow-[0_14px_40px_rgba(10,30,47,0.18)]'
      }
    >
      {/* Icono pequeño de Tachit (T tachada) con los colores del tema */}
      <svg viewBox="0 0 120 120" width="34" height="34" className="h-8 w-8 shrink-0 lg:h-[34px] lg:w-[34px]" aria-hidden="true">
        <rect width="120" height="120" rx="28" fill="var(--tachit-panel)" />
        <text x="58" y="92" textAnchor="middle" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="88" fill="var(--tachit-icono-t)">
          T
        </text>
        <path d="M16 64 H82 L91 75 L107 52" fill="none" stroke="var(--tachit-acento)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="min-w-0 grow">
        <p className="hidden text-xs font-semibold text-[#5b6b7c] lg:block">Tachit · ahora</p>
        <p className="text-sm font-extrabold lg:mt-px lg:text-[15px]">{aviso.titulo}</p>
        <p className="text-xs text-tachit-panel-texto-suave lg:mt-0.5 lg:text-sm lg:text-[#33475b]">{aviso.texto}</p>
      </div>
    </div>
  );
}

export default AvisoFlotante;
