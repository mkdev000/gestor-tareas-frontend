// components/LogoTachit.tsx
// El logo de Tachit dibujado en SVG: la palabra "Tachit" (con T mayúscula) tachada con un check.
// La palabra usa el color del texto que la rodea (currentColor) y el check, el color que le pasemos.
// Al ser SVG se ve nítido a cualquier tamaño y no hay que descargar ninguna imagen.

interface Props {
  ancho?: number;
  colorCheck?: string;
  animado?: boolean; // true: al cargar, aparece la palabra y el trazo la tacha (se usa en el panel de acceso)
}

function LogoTachit({ ancho = 168, colorCheck = '#4daeea', animado = false }: Props) {
  const alto = Math.round((ancho * 130) / 460);

  return (
    <svg
      viewBox="0 0 460 130"
      width={ancho}
      height={alto}
      role="img"
      aria-label="Tachit"
      className={'block overflow-visible' + (animado ? ' logo-animado' : '')}
    >
      <text
        x="6"
        y="98"
        textLength="380"
        lengthAdjust="spacingAndGlyphs"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontWeight="800"
        fontSize="104"
        fill="currentColor"
      >
        Tachit
      </text>
      <path
        className="tachon"
        d="M0 70 H384 L400 88 L436 44"
        fill="none"
        stroke={colorCheck}
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default LogoTachit;
