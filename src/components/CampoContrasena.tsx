// components/CampoContrasena.tsx
// Campo de contraseña con el botón del ojo para mostrarla u ocultarla.
// Se usa en el login y en el registro.
import { useState } from 'react';

interface Props {
  id: string;
  valor: string;
  alCambiar: (valor: string) => void;
  autoComplete: 'current-password' | 'new-password';
  placeholder?: string;
  describidoPor?: string; // id del texto que explica el campo (los requisitos)
}

function CampoContrasena({ id, valor, alCambiar, autoComplete, placeholder, describidoPor }: Props) {
  // Empieza OCULTA: solo se ve si el usuario pulsa el ojo
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-describedby={describidoPor}
        required
        maxLength={200}
        // Al mostrarla como texto, que el navegador NO la corrija ni la mande a su corrector ortográfico
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        className="h-[46px] w-full rounded-[10px] border border-[#cfd8e3] bg-white pl-[14px] pr-12 text-[15px] text-[#0f1f2e] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento"
      />
      <button
        type="button" // "button" para que NO envíe el formulario al pulsarlo
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-controls={id}
        className="absolute inset-y-0 right-1 my-auto flex h-10 w-10 items-center justify-center rounded-lg text-[#5b6b7c] hover:text-[#0f1f2e] focus-visible:outline-3 focus-visible:outline-tachit-acento"
      >
        {visible ? (
          // Ojo tachado: ahora se ve, pulsa para ocultar
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.7 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.2 3.2M6.6 6.6C3.7 8.5 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20" />
          </svg>
        ) : (
          // Ojo abierto: está oculta, pulsa para ver
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default CampoContrasena;
