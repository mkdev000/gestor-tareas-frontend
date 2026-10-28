// marco/RutaProtegida.tsx
// El "portero" de la app (Fase 4, paso 4.4): envuelve todas las pantallas que necesitan sesión.
//  1. Si ya hay un pase en memoria, deja pasar al momento.
//  2. Si no (acabas de abrir o recargar la página), pide uno con la cookie y, MIENTRAS TANTO, no dibuja
//     la pantalla. Así ya no se ve "un instante" la pantalla antes de echarte (el parpadeo del 4.1).
//  3. Sin sesión → a "Entrar", recordando a qué pantalla ibas para volver a ella después.
//  4. Si la sesión caduca mientras usas la app → a "Entrar" con el aviso "Tu sesión ha caducado".
import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Boton from '../componentes/base/Boton';
import { alCaducarSesion, haySesion, renovarSesion } from '../utils/sesion';

type Estado = 'comprobando' | 'dentro' | 'fuera' | 'sin-conexion';

function RutaProtegida({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>(() => (haySesion() ? 'dentro' : 'comprobando'));

  // Pedir un pase con la cookie (solo cuando hay que comprobar)
  useEffect(() => {
    if (estado !== 'comprobando') return;
    let activo = true;
    renovarSesion().then((resultado) => {
      if (!activo) return;
      if (resultado === 'ok') setEstado('dentro');
      else if (resultado === 'caducada') setEstado('fuera');
      else setEstado('sin-conexion');
    });
    return () => {
      activo = false;
    };
  }, [estado]);

  // Si la sesión caduca del todo mientras usas la app (30 días sin usarla, o se cerró en otro sitio)
  useEffect(
    () => alCaducarSesion(() => navigate('/login', { replace: true, state: { aviso: 'Tu sesión ha caducado. Vuelve a entrar.' } })),
    [navigate],
  );

  if (estado === 'fuera') {
    // "desde": la pantalla a la que ibas. Al entrar, utils/destino.ts decide si se puede volver a ella.
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }

  if (estado === 'comprobando') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-tachit-fondo font-jakarta">
        <p role="status" className="flex items-center gap-2.5 text-sm font-semibold text-[#5b6b7c]">
          <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-tachit-acento-borde border-t-tachit-acento-fuerte" />
          Comprobando tu sesión…
        </p>
      </div>
    );
  }

  if (estado === 'sin-conexion') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-tachit-fondo px-4 font-jakarta text-[#0f1f2e]">
        <div role="alert" className="flex max-w-sm flex-col items-center gap-3 text-center">
          <p className="text-lg font-extrabold">No se pudo conectar con el servidor</p>
          <p className="text-sm text-[#5b6b7c]">Comprueba tu conexión a internet y vuelve a intentarlo.</p>
          <Boton onClick={() => setEstado('comprobando')}>Reintentar</Boton>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default RutaProtegida;
