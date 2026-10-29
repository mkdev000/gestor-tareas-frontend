// marco/MarcoApp.tsx
// El marco común de todas las pantallas con sesión (Fase 4, pasos 4.4, 4.5 y 4.6).
// <Outlet /> es el "hueco" donde React Router pone la pantalla que toca (Mi día, Tareas...).
// Alrededor del hueco, según el ancho de la pantalla (diseño "responsive"):
//  - ancha (1024 px o más, "lg"): la barra lateral a la izquierda y la cabecera arriba (paso 4.5)
//  - estrecha (móvil): el título grande arriba, la barra de abajo y el menú lateral (paso 4.6)
// No hay que elegir a mano: Tailwind enseña una cosa u otra con "hidden lg:block" / "lg:hidden".
// Lo que vale para todas las pantallas se hace aquí UNA vez:
//  - traer el tema que elegiste en tu cuenta
//  - pedir los datos de las barras (anillo, categorías, racha) y pasárselos a cada una
//  - enseñar el aviso de bienvenida al entrar ("Sesión iniciada", "Cuenta creada con Google"...)
import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AvisoFlotante, { type DatosAviso } from '../componentes/base/AvisoFlotante';
import { useTema } from '../tema/contextoTema';
import BarraLateral from './BarraLateral';
import Cabecera from './Cabecera';
import BarraInferior from './BarraInferior';
import MenuMovil from './MenuMovil';
import { useResumenBarra } from './useResumenBarra';

// El nombre de cada pantalla, para la cabecera (web) y el título grande (móvil)
const TITULOS: Record<string, string> = {
  '/hoy': 'Mi día',
  '/tareas': 'Tareas',
  '/calendario': 'Calendario',
  '/ritmo': 'Mi ritmo',
  '/ajustes': 'Ajustes',
};

// La misma medida que "lg" de Tailwind: desde aquí se ve el diseño web
const ANCHO_WEB = '(min-width: 1024px)';

function MarcoApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cargarTemaDeLaCuenta } = useTema();
  const resumen = useResumenBarra();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const abrirMenu = useCallback(() => setMenuAbierto(true), []);
  const cerrarMenu = useCallback(() => setMenuAbierto(false), []);

  useEffect(() => {
    cargarTemaDeLaCuenta();
  }, [cargarTemaDeLaCuenta]);

  // Si giras la tablet o agrandas la ventana hasta el diseño web con el menú abierto, se cierra solo
  // (si no, la página se quedaría sin poder hacer scroll por culpa del menú escondido)
  useEffect(() => {
    const consulta = window.matchMedia(ANCHO_WEB);
    const alCambiar = () => {
      if (consulta.matches) setMenuAbierto(false);
    };
    consulta.addEventListener('change', alCambiar);
    return () => consulta.removeEventListener('change', alCambiar);
  }, []);

  // El aviso de bienvenida llega desde la pantalla de acceso dentro del "state" de la navegación
  const bienvenidaRecibida = (location.state as { bienvenida?: DatosAviso } | null)?.bienvenida ?? null;
  const [bienvenida, setBienvenida] = useState<DatosAviso | null>(bienvenidaRecibida);
  const cerrarBienvenida = useCallback(() => setBienvenida(null), []);

  // Borramos ese "state" del historial: si recargas la página, el aviso no vuelve a salir
  useEffect(() => {
    if (bienvenidaRecibida) navigate(location.pathname, { replace: true, state: null });
  }, [bienvenidaRecibida, location.pathname, navigate]);

  // "Nueva tarea" (el botón de la cabecera y el rombo del móvil): de momento te lleva a Tareas
  // y avisa de que quieres crear una (en el paso 4.7 la pantalla de Tareas abre su formulario;
  // el formulario nuevo llega en la Fase 6)
  const nuevaTarea = () => navigate('/tareas', { state: { nuevaTarea: Date.now() } });
  const titulo = TITULOS[location.pathname] ?? '';

  return (
    <div className="flex min-h-screen bg-tachit-fondo font-jakarta text-[#0f1f2e]">
      {/* Web: la barra lateral */}
      <div className="hidden lg:block">
        <BarraLateral resumen={resumen} />
      </div>

      <div className="flex min-w-0 grow flex-col">
        {/* Web: la cabecera (ella misma se esconde en el móvil, para poder quedarse pegada arriba al hacer scroll) */}
        <Cabecera titulo={titulo} alNuevaTarea={nuevaTarea} />
        {/* Móvil: abajo se deja sitio (pb-[120px]) para que la barra flotante no tape nada */}
        <main className="grow px-5 pt-8 pb-[120px] lg:px-8 lg:pt-7 lg:pb-10">
          {/* Móvil: el título grande de la pantalla, como en el prototipo móvil */}
          <h1 className="mb-4 text-[30px] font-extrabold tracking-[-1px] lg:hidden">{titulo}</h1>
          <Outlet />
        </main>
      </div>

      {/* Móvil: la barra de abajo y el menú lateral */}
      <div className="lg:hidden">
        <BarraInferior
          pendientes={resumen.pendientes}
          hechasHoy={resumen.hechasHoy}
          menuAbierto={menuAbierto}
          alAbrirMenu={abrirMenu}
          alNuevaTarea={nuevaTarea}
        />
      </div>
      <MenuMovil abierto={menuAbierto} alCerrar={cerrarMenu} racha={resumen.racha} ultimos7={resumen.ultimos7} />

      {bienvenida && <AvisoFlotante aviso={bienvenida} alCerrar={cerrarBienvenida} />}
    </div>
  );
}

export default MarcoApp;
