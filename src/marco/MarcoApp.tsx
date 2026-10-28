// marco/MarcoApp.tsx
// El marco común de todas las pantallas con sesión (Fase 4, paso 4.4).
// <Outlet /> es el "hueco" donde React Router pone la pantalla que toca (Mi día, Tareas...).
// En el paso 4.5 se le añaden la barra lateral y la cabecera, y en el 4.6 la barra de abajo del móvil.
// Lo que vale para todas las pantallas se hace aquí UNA vez:
//  - traer el tema que elegiste en tu cuenta
//  - enseñar el aviso de bienvenida al entrar ("Sesión iniciada", "Cuenta creada con Google"...)
import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AvisoFlotante, { type DatosAviso } from '../componentes/base/AvisoFlotante';
import { useTema } from '../tema/contextoTema';

function MarcoApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cargarTemaDeLaCuenta } = useTema();

  useEffect(() => {
    cargarTemaDeLaCuenta();
  }, [cargarTemaDeLaCuenta]);

  // El aviso de bienvenida llega desde la pantalla de acceso dentro del "state" de la navegación
  const bienvenidaRecibida = (location.state as { bienvenida?: DatosAviso } | null)?.bienvenida ?? null;
  const [bienvenida, setBienvenida] = useState<DatosAviso | null>(bienvenidaRecibida);
  const cerrarBienvenida = useCallback(() => setBienvenida(null), []);

  // Borramos ese "state" del historial: si recargas la página, el aviso no vuelve a salir
  useEffect(() => {
    if (bienvenidaRecibida) navigate(location.pathname, { replace: true, state: null });
  }, [bienvenidaRecibida, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-tachit-fondo font-jakarta text-[#0f1f2e]">
      <Outlet />
      {bienvenida && <AvisoFlotante aviso={bienvenida} alCerrar={cerrarBienvenida} />}
    </div>
  );
}

export default MarcoApp;
