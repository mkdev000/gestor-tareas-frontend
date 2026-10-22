// components/MarcoAcceso.tsx
// El "marco" de las pantallas de acceso: panel de bienvenida a la izquierda (pantallas grandes)
// y la columna del formulario a la derecha. Lo comparten Entrar/Crear cuenta y Recuperar contraseña.
import type { ReactNode } from 'react';
import LogoTachit from './LogoTachit';
import PanelBienvenida from './PanelBienvenida';

function MarcoAcceso({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-tachit-fondo text-[#0f1f2e]">
      {/* ===== Panel de bienvenida (pantallas grandes) ===== */}
      <PanelBienvenida />

      {/* ===== Formulario ===== */}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-[420px] flex-col gap-5">
          {/* En móvil no hay panel: mostramos el logo arriba */}
          <div className="mb-2 text-tachit-tinta lg:hidden">
            <LogoTachit ancho={140} colorCheck="var(--tachit-acento)" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export default MarcoAcceso;
