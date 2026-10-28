// componentes/base/Panel.tsx
// La tarjeta blanca con bordes redondeados del prototipo (Ajustes, Mi ritmo...).
// Puede llevar un título en negrita y, a su lado, una frase en gris.
import type { ReactNode } from 'react';

interface Props {
  titulo?: string;
  subtitulo?: string;
  className?: string;
  children: ReactNode;
}

function Panel({ titulo, subtitulo, className = '', children }: Props) {
  return (
    <section className={`flex flex-col gap-3.5 rounded-2xl border border-[#e3e8ef] bg-white p-[22px] ${className}`}>
      {(titulo || subtitulo) && (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {titulo && <h2 className="text-[17px] font-extrabold">{titulo}</h2>}
          {subtitulo && <p className="text-[13px] text-[#5b6b7c]">{subtitulo}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export default Panel;
