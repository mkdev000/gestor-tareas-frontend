// marco/cuenta.tsx
// Las piezas del "pase" de tu cuenta (Fase 4, pasos 4.5 y 4.6): la etiqueta Google/Email y el icono de salir.
// Las usan el pase de la barra lateral (web) y el del menú (móvil). Los datos los da useCuenta.ts.

// La etiqueta "Google" o "Email" del pase (si no sabemos cómo entraste, no sale)
export function ChipMetodo({ metodo, className }: { metodo: 'google' | 'email' | null; className: string }) {
  if (!metodo) return null;
  return (
    <span>
      <span className={className}>
        {metodo === 'google' ? <LogoGoogle /> : <IconoEmail />}
        {metodo === 'google' ? 'Google' : 'Email'}
      </span>
    </span>
  );
}

function LogoGoogle() {
  return (
    <svg width="12" height="12" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M44.5 24.5c0-1.6-.1-2.8-.4-4.1H24v7.7h11.6c-.5 2.9-2.2 5.3-4.8 7l7.4 5.7c4.3-4 6.3-9.8 6.3-16.3z" />
      <path fill="#34A853" d="M24 45c5.8 0 10.7-1.9 14.2-5.2l-7.4-5.7c-2 1.3-4.6 2.2-6.8 2.2-5.6 0-10.4-3.8-12.1-8.9l-7.6 5.9C7.8 40.1 15.3 45 24 45z" />
      <path fill="#FBBC05" d="M11.9 27.4c-.4-1.3-.7-2.6-.7-4s.3-2.7.7-4l-7.6-5.9C2.8 16.5 2 19.6 2 23.4s.8 6.9 2.3 9.9l7.6-5.9z" />
      <path fill="#EA4335" d="M24 10.5c3.1 0 5.9 1.1 8.1 3.2l6.5-6.5C34.7 3.5 29.8 1.5 24 1.5 15.3 1.5 7.8 6.4 4.3 13.5l7.6 5.9c1.7-5.1 6.5-8.9 12.1-8.9z" />
    </svg>
  );
}

function IconoEmail() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}

// El icono de salir (una puerta y una flecha que sale). Las clases animan la flecha al pasar el ratón.
export function IconoSalir() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path className="salir-puerta" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path className="salir-flecha" d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
