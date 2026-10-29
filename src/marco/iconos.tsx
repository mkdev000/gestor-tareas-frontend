// marco/iconos.tsx
// Los iconos de Tachit para moverse por la app (Fase 4, pasos 4.5 y 4.6).
// Los usan la barra lateral (web), la barra de abajo y el menú (móvil): así son siempre los mismos.
// Solo son los "trazos" (paths) de dentro del <svg>; cada sitio decide el tamaño.
import type { ReactNode } from 'react';

const TRAZOS: Record<'hoy' | 'tareas' | 'calendario' | 'ritmo' | 'ajustes' | 'google' | 'tema' | 'ayuda' | 'menu', ReactNode> = {
  // Un sol que sale por el horizonte
  hoy: (
    <>
      <path d="M12 6v3M5.6 9.6l2 2M18.4 9.6l-2 2" />
      <path d="M7 18a5 5 0 0 1 10 0" />
      <path d="M3 18h18" />
    </>
  ),
  // Una casilla con su check
  tareas: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <path d="M8 12.5l2.6 2.6L16.5 9" />
    </>
  ),
  // Un calendario con un punto en el día de hoy
  calendario: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="4" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  // El pulso
  ritmo: <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />,
  // Dos deslizadores
  ajustes: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  // Un calendario con un check (Google Calendar)
  google: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="4" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="M9 15.5l2 2 4-4" />
    </>
  ),
  // Una paleta de pintor
  tema: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-4-4-7.4-9-7.4z" />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="10.5" cy="7.3" r="1" />
      <circle cx="15" cy="7.8" r="1" />
    </>
  ),
  // Una interrogación en un círculo
  ayuda: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.6a2.4 2.4 0 1 1 3.4 2.2c-.6.3-1 .8-1 1.4v.4" />
      <path d="M12 16.6h.01" />
    </>
  ),
  // Tres líneas con una flechita (el botón "Menú" del móvil)
  menu: (
    <>
      <path d="M4 7h16M4 12h10M4 17h6" />
      <path d="M18 15.5l2 2 -2 2" />
    </>
  ),
};

// Un <svg> de icono con el trazo indicado
export function Icono({ trazo, tamano = 20, className }: { trazo: keyof typeof TRAZOS; tamano?: number; className?: string }) {
  return (
    <svg className={className} width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TRAZOS[trazo]}
    </svg>
  );
}
