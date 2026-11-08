// pantallas/midia/arrastre.ts
// Arrastrar tareas a la línea de tiempo (paso 7.5): lo comparten los bloques y las notas sueltas.
// Mientras arrastras, el navegador NO deja leer los datos (solo al soltar), pero sí sus "tipos".
// Por eso la duración va escondida en un tipo: así la línea puede dibujar el hueco del tamaño justo.
import type { DragEvent } from 'react';

const PREFIJO = 'application/x-tachit-dura-';

export function empezarArrastre(e: DragEvent, id: number, dura: number) {
  e.dataTransfer.setData('text/plain', String(id));
  e.dataTransfer.setData(`${PREFIJO}${dura}`, '');
  e.dataTransfer.effectAllowed = 'move';
}

// Cuánto dura lo que se está arrastrando (30 min si no se sabe, por ejemplo si viene de otra app)
export function duraArrastrada(e: DragEvent) {
  const tipo = Array.from(e.dataTransfer.types).find((t) => t.startsWith(PREFIJO));
  const dura = tipo ? Number(tipo.slice(PREFIJO.length)) : NaN;
  return Number.isInteger(dura) && dura > 0 ? dura : 30;
}
