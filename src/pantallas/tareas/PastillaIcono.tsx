// pantallas/tareas/PastillaIcono.tsx
// Cómo se dibujan los iconos de las tareas (los datos están en iconosTarea.ts).
// Van en archivos separados porque Vite solo puede "recargar en caliente" un archivo
// si exporta únicamente componentes.
import { ICONOS_TAREA } from './iconosTarea';

// El dibujo suelto (hereda el color del texto que lo rodea: stroke="currentColor")
export function DibujoIcono({ trazo, tam, grosor = 2.2 }: { trazo: string; tam: number; grosor?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={trazo} />
    </svg>
  );
}

// La pastilla de color con el dibujo dentro (en la tarjeta: 24 px con el dibujo de 14 px)
export function PastillaIcono({ clave, tam = 24, radio = 8, dibujo = 14 }: { clave: string | null | undefined; tam?: number; radio?: number; dibujo?: number }) {
  const icono = clave ? ICONOS_TAREA[clave] : undefined;
  if (!icono) return null;
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center"
      style={{ width: tam, height: tam, borderRadius: radio, background: icono.fondo, color: icono.color }}
    >
      <DibujoIcono trazo={icono.trazo} tam={dibujo} />
    </span>
  );
}
