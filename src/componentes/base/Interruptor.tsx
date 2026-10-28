// componentes/base/Interruptor.tsx
// El interruptor de encendido/apagado de Ajustes (avisos, briefing...), igual que en el prototipo.
// Para el lector de pantalla es un "switch" (role="switch" + aria-checked): dice "activado" o "desactivado".
// Siempre necesita una etiqueta (etiqueta), porque el interruptor solo no dice qué enciende.
interface Props {
  activo: boolean;
  alCambiar: (nuevo: boolean) => void;
  etiqueta: string;
  desactivado?: boolean;
}

function Interruptor({ activo, alCambiar, etiqueta, desactivado = false }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      disabled={desactivado}
      onClick={() => alCambiar(!activo)}
      className={
        'flex h-[30px] w-[50px] shrink-0 cursor-pointer rounded-full border-0 p-[3px] transition-colors duration-200 ' +
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento-fuerte ' +
        'disabled:cursor-not-allowed disabled:opacity-60 ' +
        (activo ? 'bg-tachit-acento-fuerte' : 'bg-[#cfd8e3]')
      }
    >
      {/* La bolita blanca: se desliza 20 px a la derecha al encenderlo */}
      <span
        aria-hidden="true"
        className={
          'bola-interruptor h-6 w-6 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-200 ' +
          (activo ? 'translate-x-5' : 'translate-x-0')
        }
      />
    </button>
  );
}

export default Interruptor;
