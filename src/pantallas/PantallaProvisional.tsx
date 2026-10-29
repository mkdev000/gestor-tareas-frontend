// pantallas/PantallaProvisional.tsx
// Contenido provisional de las pantallas que todavía no se han construido (Fase 4, paso 4.4).
// Cada una se rellena en su fase. El título lo pone el marco: la cabecera en la web (4.5)
// y el título grande en el móvil (4.6). Para moverse están la barra lateral y la barra de abajo.

function PantallaProvisional({ fase }: { fase: number }) {
  return (
    <div className="flex max-w-[1100px] flex-col gap-3">
      <p className="text-sm text-[#5b6b7c]">Esta pantalla se construye en la Fase {fase}.</p>
    </div>
  );
}

export default PantallaProvisional;
