// componentes/base/AvisoFlotante.tsx
// El aviso que aparece abajo a la derecha unos segundos (un "toast"), igual que en el prototipo:
// icono de Tachit, "Tachit · ahora", un título en negrita y una frase.
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
      className="fixed right-6 bottom-6 z-[70] flex w-[360px] max-w-[calc(100vw-32px)] items-start gap-3 rounded-[14px] border border-[#e3e8ef] bg-white px-4 py-3.5 font-jakarta text-[#0f1f2e] shadow-[0_14px_40px_rgba(10,30,47,0.18)]"
    >
      {/* Icono pequeño de Tachit (T tachada) con los colores del tema */}
      <svg viewBox="0 0 120 120" width="34" height="34" className="shrink-0" aria-hidden="true">
        <rect width="120" height="120" rx="28" fill="var(--tachit-panel)" />
        <text x="58" y="92" textAnchor="middle" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="88" fill="var(--tachit-icono-t)">
          T
        </text>
        <path d="M16 64 H82 L91 75 L107 52" fill="none" stroke="var(--tachit-acento)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="grow">
        <p className="text-xs font-semibold text-[#5b6b7c]">Tachit · ahora</p>
        <p className="mt-px text-[15px] font-extrabold">{aviso.titulo}</p>
        <p className="mt-0.5 text-sm text-[#33475b]">{aviso.texto}</p>
      </div>
    </div>
  );
}

export default AvisoFlotante;
