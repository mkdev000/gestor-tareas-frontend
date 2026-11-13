// pantallas/calendario/PrimerTachado.tsx
// La banda de «el primer tachado» (Fase 8, paso 8.6): sale encima del Calendario cuando todavía
// no tienes NINGUNA tarea. Enseña cómo funciona Tachit con una fichita en la que el número se tacha
// solo (una animación en bucle, solo con CSS) y tiene el botón «Apuntar mi primera tarea», que abre
// la creación de tareas para que escribas la tuya. En cuanto apuntas algo, la pantalla deja de enseñarla.
function PrimerTachado({ alApuntar }: { alApuntar: () => void }) {
  return (
    <div className="cal-primer">
      <div className="cal-primer-ficha" aria-hidden="true">
        <span className="cal-primer-num">
          13
          <svg viewBox="0 0 120 10" preserveAspectRatio="none">
            <path d="M1 5 H96 L104 9 L118 1" />
          </svg>
        </span>
        <span className="cal-primer-barra" />
      </div>
      <div className="cal-primer-texto">
        <h2>Aún no tienes nada apuntado</h2>
        <p>Cada día se tacha a medida que tachas sus tareas. Empieza por algo pequeño.</p>
      </div>
      <button type="button" onClick={alApuntar} className="cal-primer-boton">
        Apuntar mi primera tarea
      </button>
    </div>
  );
}

export default PrimerTachado;
