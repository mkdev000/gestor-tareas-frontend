// componentes/base/Chip.tsx
// La "pastilla" pequeña de color del prototipo: categorías (#Trabajo) y prioridades (Alta, Media, Baja).
//  - color: el color del texto. Si no se da "fondo", el fondo es ese mismo color muy clarito (8 % de opacidad).
//  - fondo: un fondo concreto (las prioridades del prototipo lo traen fijo).
import type { ReactNode } from 'react';

// Solo se aceptan colores del tipo #1a2b3c: así nunca se cuela nada raro dentro del estilo
const ES_COLOR = /^#[0-9a-f]{6}$/i;
const COLOR_POR_DEFECTO = '#4b5a6c';

interface Props {
  color?: string;
  fondo?: string;
  children: ReactNode;
}

function Chip({ color = COLOR_POR_DEFECTO, fondo, children }: Props) {
  const texto = ES_COLOR.test(color) ? color : COLOR_POR_DEFECTO;
  // "14" al final de un color = 8 % de opacidad (14 en hexadecimal son 20 de 255)
  const fondoFinal = fondo && ES_COLOR.test(fondo) ? fondo : `${texto}14`;

  return (
    <span className="inline-flex items-center rounded-full px-[9px] py-[3px] text-xs font-bold whitespace-nowrap" style={{ color: texto, background: fondoFinal }}>
      {children}
    </span>
  );
}

export default Chip;
