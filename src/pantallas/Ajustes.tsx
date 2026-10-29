// pantallas/Ajustes.tsx
// Pantalla de Ajustes. De momento solo tiene la tarjeta "Tema" (paso 4.2); el resto de Ajustes llega en la Fase 10.
// La sesión y el tema de tu cuenta ya los comprueba el marco (marco/RutaProtegida.tsx y marco/MarcoApp.tsx).
// El título "Ajustes" y la fecha los pone la cabecera del marco (paso 4.5).
import { Link } from 'react-router-dom';
import SelectorTema from '../tema/SelectorTema';

function Ajustes() {
  return (
    <div className="flex max-w-[1100px] flex-col gap-4">
      {/* Enlace provisional SOLO en pantallas estrechas (en las anchas ya está la barra lateral).
          En el paso 4.6 lo sustituye la barra de abajo del móvil. */}
      <Link to="/hoy" className="text-sm font-bold text-tachit-acento-fuerte hover:underline lg:hidden">
        ← Volver a Mi día
      </Link>
      <SelectorTema />
    </div>
  );
}

export default Ajustes;
