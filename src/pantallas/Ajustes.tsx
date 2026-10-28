// pantallas/Ajustes.tsx
// Pantalla de Ajustes. De momento solo tiene la tarjeta "Tema" (paso 4.2); el resto de Ajustes llega en la Fase 10.
// La sesión y el tema de tu cuenta ya los comprueba el marco (marco/RutaProtegida.tsx y marco/MarcoApp.tsx).
import { Link } from 'react-router-dom';
import SelectorTema from '../tema/SelectorTema';

function Ajustes() {
  return (
    <main className="mx-auto flex max-w-[1100px] flex-col gap-4 px-4 py-8 sm:px-8">
      {/* Enlace provisional: en el paso 4.5 se cambia por la barra lateral */}
      <Link to="/hoy" className="text-sm font-bold text-tachit-acento-fuerte hover:underline">
        ← Volver a Mi día
      </Link>
      <h1 className="text-xl font-extrabold tracking-[-0.3px]">Ajustes</h1>
      <SelectorTema />
    </main>
  );
}

export default Ajustes;
