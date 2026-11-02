// pantallas/tareas/prioridades.ts
// Los colores y nombres de las prioridades (los mismos del prototipo), en un solo sitio.
// Los usan las tarjetas (web y móvil) y el anillo para elegir la prioridad (Fase 6, paso 6.2).
import type { Prioridad } from './frase';

export interface EstiloPrioridad {
  nombre: string; // "Alta"
  color: string; // la barrita / el borde de la tarjeta
  texto: string; // el texto de la pastilla
  fondo: string; // el fondo de la pastilla
  nivel: 1 | 2 | 3; // cuántos tramos del anillo se llenan
}

export const PRIORIDADES: Record<Prioridad, EstiloPrioridad> = {
  alta: { nombre: 'Alta', color: '#F2711C', texto: '#a84a0a', fondo: '#fdeee3', nivel: 3 },
  media: { nombre: 'Media', color: '#4daeeb', texto: '#17699e', fondo: '#e6f3fd', nivel: 2 },
  baja: { nombre: 'Baja', color: '#94a3b8', texto: '#4b5a6c', fondo: '#eef1f5', nivel: 1 },
};

// La del servidor puede ser 'urgente' (de la app antigua): se trata como alta
export function estiloPrioridad(valor: string | null | undefined): EstiloPrioridad {
  if (valor === 'baja' || valor === 'media' || valor === 'alta') return PRIORIDADES[valor];
  return valor === 'urgente' ? PRIORIDADES.alta : PRIORIDADES.media;
}

// Un toque: media → alta → baja → media
export const SIGUIENTE_PRIORIDAD: Record<Prioridad, Prioridad> = { media: 'alta', alta: 'baja', baja: 'media' };
