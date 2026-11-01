// utils/useEsWeb.ts
// ¿Se está viendo el diseño web (1024 px o más, igual que "lg" de Tailwind) o el del móvil? (Fase 5, paso 5.6)
// Se usa cuando una pantalla tiene que dibujar cosas DISTINTAS en web y en móvil (no solo esconderlas con CSS),
// como las tarjetas de Tareas: en la web llevan botones; en el móvil se deslizan con el dedo.
//
// useSyncExternalStore es el hook de React para "escuchar" algo que vive fuera de React
// (aquí, el tamaño de la ventana). React vuelve a dibujar solo cuando cambia la respuesta.
import { useSyncExternalStore } from 'react';

const ANCHO_WEB = '(min-width: 1024px)';

function suscribirse(avisar: () => void) {
  const consulta = window.matchMedia(ANCHO_WEB);
  consulta.addEventListener('change', avisar);
  return () => consulta.removeEventListener('change', avisar);
}

const leer = () => window.matchMedia(ANCHO_WEB).matches;

export function useEsWeb() {
  return useSyncExternalStore(suscribirse, leer);
}
