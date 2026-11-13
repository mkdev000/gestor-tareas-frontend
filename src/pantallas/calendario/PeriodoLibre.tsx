// pantallas/calendario/PeriodoLibre.tsx
// La línea suave de encima del Calendario (Fase 8, paso 8.6) cuando SÍ tienes tareas, pero ninguna
// en el mes (o la semana) que estás mirando: "Diciembre está libre. Tu próxima tarea es el lunes 11 de enero."
// Si hay una próxima tarea, el botón te lleva a ese día con un toque.
interface Props {
  texto: string;
  irA?: { texto: string; alPulsar: () => void } | null;
}

function PeriodoLibre({ texto, irA }: Props) {
  return (
    <div className="cal-libre" role="status">
      <span>{texto}</span>
      {irA && (
        <button type="button" onClick={irA.alPulsar}>
          {irA.texto}
        </button>
      )}
    </div>
  );
}

export default PeriodoLibre;
