// pantallas/Ajustes.tsx
// Pantalla de Ajustes. De momento (Fase 4, paso 4.2) solo tiene la tarjeta "Tema".
// En el paso 4.4 entrará dentro del marco nuevo (barra lateral y cabecera) y el resto de Ajustes llega en la Fase 10.
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SelectorTema from '../tema/SelectorTema';
import { useTema } from '../tema/contextoTema';
import { alCaducarSesion } from '../utils/sesion';

function Ajustes() {
  const navigate = useNavigate();
  const { cargarTemaDeLaCuenta } = useTema();

  // Si no hay sesión (o caduca), a "Entrar"
  useEffect(
    () => alCaducarSesion(() => navigate('/login', { replace: true, state: { aviso: 'Tu sesión ha caducado. Vuelve a entrar.' } })),
    [navigate],
  );

  // Trae el tema guardado en tu cuenta (y de paso comprueba que hay sesión)
  useEffect(() => {
    cargarTemaDeLaCuenta();
  }, [cargarTemaDeLaCuenta]);

  return (
    <div className="min-h-screen bg-tachit-fondo font-jakarta text-[#0f1f2e]">
      <main className="mx-auto flex max-w-[1100px] flex-col gap-4 px-4 py-8 sm:px-8">
        {/* Enlace provisional: en el paso 4.5 se cambia por la barra lateral */}
        <Link to="/tareas" className="text-sm font-bold text-tachit-acento-fuerte hover:underline">
          ← Volver a tus tareas
        </Link>
        <h1 className="text-xl font-extrabold tracking-[-0.3px]">Ajustes</h1>
        <SelectorTema />
      </main>
    </div>
  );
}

export default Ajustes;
