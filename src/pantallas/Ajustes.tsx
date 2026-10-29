// pantallas/Ajustes.tsx
// Pantalla de Ajustes. De momento solo tiene la tarjeta "Tema" (paso 4.2); el resto de Ajustes llega en la Fase 10.
// La sesión y el tema de tu cuenta ya los comprueba el marco (marco/RutaProtegida.tsx y marco/MarcoApp.tsx).
// El título "Ajustes" lo pone el marco (cabecera en la web, título grande en el móvil).
import SelectorTema from '../tema/SelectorTema';

function Ajustes() {
  return (
    <div className="flex max-w-[1100px] flex-col gap-4">
      <SelectorTema />
    </div>
  );
}

export default Ajustes;
