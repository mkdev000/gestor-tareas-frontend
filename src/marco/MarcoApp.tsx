// marco/MarcoApp.tsx
// El marco común de todas las pantallas con sesión (Fase 4, pasos 4.4 y 4.5).
// <Outlet /> es el "hueco" donde React Router pone la pantalla que toca (Mi día, Tareas...).
// Alrededor del hueco: la barra lateral (a la izquierda) y la cabecera (arriba), como en el prototipo.
// En el paso 4.6 se le añade la barra de abajo del móvil.
// Lo que vale para todas las pantallas se hace aquí UNA vez:
//  - traer el tema que elegiste en tu cuenta
//  - enseñar el aviso de bienvenida al entrar ("Sesión iniciada", "Cuenta creada con Google"...)
import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AvisoFlotante, { type DatosAviso } from '../componentes/base/AvisoFlotante';
import { useTema } from '../tema/contextoTema';
import BarraLateral from './BarraLateral';
import Cabecera from './Cabecera';

// El nombre de cada pantalla, para la cabecera
const TITULOS: Record<string, string> = {
  '/hoy': 'Mi día',
  '/tareas': 'Tareas',
  '/calendario': 'Calendario',
  '/ritmo': 'Mi ritmo',
  '/ajustes': 'Ajustes',
};

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

  // "Nueva tarea": de momento te lleva a Tareas y avisa de que quieres crear una
  // (en el paso 4.7 la pantalla de Tareas abre su formulario; el formulario nuevo llega en la Fase 6)
  const nuevaTarea = () => navigate('/tareas', { state: { nuevaTarea: Date.now() } });

  return (
    <div className="flex min-h-screen bg-tachit-fondo font-jakarta text-[#0f1f2e]">
      {/* La barra lateral solo en pantallas anchas; en el móvil llega la barra de abajo (paso 4.6) */}
      <div className="hidden lg:block">
        <BarraLateral />
      </div>
      <div className="flex min-w-0 grow flex-col">
        <Cabecera titulo={TITULOS[location.pathname] ?? ''} alNuevaTarea={nuevaTarea} />
        <main className="grow px-4 pt-7 pb-10 sm:px-8">
          <Outlet />
        </main>
      </div>
      {bienvenida && <AvisoFlotante aviso={bienvenida} alCerrar={cerrarBienvenida} />}
    </div>
  );
}

export default MarcoApp;
