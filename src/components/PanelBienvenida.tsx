// components/PanelBienvenida.tsx
// Panel de bienvenida de la pantalla de acceso (solo en pantallas grandes).
// Idea: las 3 ventajas de Tachit son "tareas" que se van marcando y tachando solas,
// con el mismo trazo del logo. Al terminar las 3, la lista vuelve a empezar.
// Detrás de todo, el logo gigante y casi transparente como marca de agua.
import { useEffect, useState } from 'react';
import LogoTachit from './LogoTachit';

const VENTAJAS = [
  { titulo: 'Captura en lenguaje natural', texto: '“Estudiar mañana a las 18 #iLerna 1h” y listo.' },
  { titulo: 'Mi día, reorganizado en un toque', texto: 'Si algo se retrasa, lo pendiente se recoloca solo.' },
  { titulo: 'Funciona sin conexión', texto: 'Tus cambios se guardan y se sincronizan al volver internet.' },
];

const PAUSA_MS = 1700; // cada cuánto se tacha la siguiente

function PanelBienvenida() {
  // Cuántas ventajas están tachadas ahora mismo (de 0 a 3)
  const [hechas, setHechas] = useState(0);

  useEffect(() => {
    // Si el usuario pide "reducir movimiento" en su sistema, no animamos nada
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const temporizador = setInterval(() => {
      // 0 → 1 → 2 → 3 → vuelta a 0
      setHechas((n) => (n >= VENTAJAS.length ? 0 : n + 1));
    }, PAUSA_MS);

    // Al salir de la pantalla, paramos el temporizador (si no, seguiría funcionando en segundo plano)
    return () => clearInterval(temporizador);
  }, []);

  return (
    <aside className="relative hidden w-[620px] shrink-0 flex-col overflow-hidden bg-[linear-gradient(160deg,var(--tachit-panel)_0%,var(--tachit-panel-hover)_100%)] px-16 py-14 text-tachit-panel-texto lg:flex">
      {/* Marca de agua: el logo GIGANTE y casi transparente, saliéndose por la esquina de abajo.
          Es solo decoración: aria-hidden para que los lectores de pantalla no la lean. */}
      <svg
        className="marca-agua pointer-events-none absolute -bottom-[60px] -left-[30px] h-auto w-[760px] opacity-[0.07]"
        viewBox="0 0 460 130"
        aria-hidden="true"
      >
        <text x="6" y="98" textLength="380" lengthAdjust="spacingAndGlyphs" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="104" fill="currentColor">
          Tachit
        </text>
        <path className="tachon" d="M0 70 H384 L400 88 L436 44" fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* "relative" pone el contenido por encima de la marca de agua */}
      <div className="relative">
        <LogoTachit ancho={168} colorCheck="var(--tachit-acento)" animado />
      </div>

      <div className="relative flex flex-1 flex-col justify-center gap-16">
        {/* Titular en dos tonos: negrita arriba, fina abajo y "plan de hoy" subrayado a mano */}
        <h1 className="text-[46px] leading-[1.1] font-bold tracking-[-1.6px]">
          Escribe lo que tienes que hacer.
          <span className="mt-2.5 block font-normal tracking-[-1.2px] text-tachit-panel-texto-suave">
            Tachit lo convierte en tu{' '}
            <span className="relative font-bold whitespace-nowrap text-tachit-panel-texto">
              plan de hoy.
              <svg
                className="absolute -right-1 -bottom-2.5 -left-1 h-4 w-[calc(100%+8px)] overflow-visible"
                viewBox="0 0 220 16"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path className="subrayado-tachit" d="M3 11 C 60 4, 140 4, 217 9" fill="none" stroke="var(--tachit-acento)" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>
          </span>
        </h1>

        <div className="flex flex-col gap-[26px]">
          <ul className="flex flex-col gap-[26px]">
            {VENTAJAS.map((v, i) => (
              <li key={v.titulo} className={'tarea-panel flex items-start gap-[18px]' + (i < hechas ? ' hecha' : '')}>
                <span className="caja-tarea" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <p className="titulo-tarea text-[17px] font-bold tracking-[-0.2px]">{v.titulo}</p>
                  <p className="texto-tarea mt-[5px] text-[14.5px] leading-[1.45] text-tachit-panel-texto-suave">{v.texto}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Barrita de progreso: es solo decoración, por eso la ocultamos a los lectores de pantalla */}
          <div className="flex max-w-[420px] items-center gap-3 text-[13px] font-bold text-tachit-panel-enlace" aria-hidden="true">
            <span>{hechas} de {VENTAJAS.length}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-tachit-acento/18">
              <span
                className="block h-full rounded-full bg-tachit-acento transition-[width] duration-500 ease-[cubic-bezier(.2,.9,.2,1)]"
                style={{ width: `${(hechas / VENTAJAS.length) * 100}%` }}
              />
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default PanelBienvenida;
