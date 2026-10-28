// utils/destino.ts
// A qué pantalla vamos después de entrar (Fase 4, paso 4.4).
// Si intentaste abrir una pantalla sin sesión (por ejemplo /calendario), al entrar vuelves a ella.
// Solo se aceptan las pantallas de esta lista: así nadie puede preparar un enlace que,
// tras entrar, te mande a otra web (eso se llama "redirección abierta" y es un fallo de seguridad).
const PANTALLAS = ['/hoy', '/tareas', '/calendario', '/ritmo', '/ajustes'];

export const PANTALLA_INICIAL = '/hoy';

export function destinoSeguro(desde: unknown): string {
  return typeof desde === 'string' && PANTALLAS.includes(desde) ? desde : PANTALLA_INICIAL;
}
