// componentes/base/ChipFiltro.tsx
// Los botones redondos para filtrar (Todas · Hoy · Próximas...) con su contador, como en Tareas del prototipo.
// El elegido se rellena con el color del panel del tema; los demás son blancos con borde gris.
// aria-pressed le dice al lector de pantalla si está elegido o no.
interface Props {
  texto: string;
  cantidad?: number;
  activo: boolean;
  alPulsar: () => void;
  color?: string; // color del texto cuando NO está elegido (por ejemplo, rojo para "Atrasadas")
}

const ES_COLOR = /^#[0-9a-f]{6}$/i;

function ChipFiltro({ texto, cantidad, activo, alPulsar, color }: Props) {
  const colorApagado = color && ES_COLOR.test(color) ? color : '#0f1f2e';

  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={alPulsar}
      style={activo ? undefined : { color: colorApagado }}
      className={
        'inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border pr-3 pl-3.5 font-jakarta text-sm font-bold ' +
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento-fuerte ' +
        (activo ? 'border-tachit-panel bg-tachit-panel text-tachit-tinta' : 'border-[#dde3ea] bg-white')
      }
    >
      {texto}
      {cantidad !== undefined && (
        <span
          className={
            'rounded-full px-[7px] py-px text-xs ' +
            (activo ? 'bg-[color-mix(in_srgb,var(--tachit-tinta)_16%,transparent)] text-tachit-tinta' : 'bg-[#eef1f5] text-[#4b5a6c]')
          }
        >
          {cantidad}
        </span>
      )}
    </button>
  );
}

export default ChipFiltro;
