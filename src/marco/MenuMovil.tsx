// marco/MenuMovil.tsx
// El menú lateral del móvil (Fase 4, paso 4.6), igual que en el prototipo móvil:
// entra desde la izquierda con el logo arriba, las opciones con su dato "a la vista" y el pase abajo.
//  - Mi ritmo: tu racha y una barrita por cada uno de los últimos 7 días
//  - Google Calendar: si está conectado (se conecta en la Fase 11)
//  - Tema: se cambia tocando los puntitos, sin entrar a otra pantalla
//  - Ajustes y Ayuda
// Es un diálogo accesible (useDialogo): Escape, foco atrapado, foco de vuelta al botón "Menú".
import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import LogoTachit from '../components/LogoTachit';
import AvisoFlotante, { type DatosAviso } from '../componentes/base/AvisoFlotante';
import { useDialogo } from '../componentes/base/useDialogo';
import { useTema } from '../tema/contextoTema';
import { TEMAS, nombreDelTema, type ClaveTema } from '../tema/temas';
import { Icono } from './iconos';
import { useCuenta } from './useCuenta';
import { ChipMetodo, IconoSalir } from './cuenta';

// El color de cada puntito de Tema (el color de acento de cada tema)
const COLOR_PUNTO: Record<ClaveTema, string> = { nube: '#7d8cf0', malva: '#b07a9a', peonia: '#e86f9a', cacao: '#d6a58f' };

interface Props {
  abierto: boolean;
  alCerrar: () => void;
  racha: number;
  ultimos7: boolean[];
}

function Flecha() {
  return (
    <svg className="menu-flecha" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function MenuMovil({ abierto, alCerrar, racha, ultimos7 }: Props) {
  const navigate = useNavigate();
  const cajon = useRef<HTMLDivElement>(null);
  const { tema, cambiarTema } = useTema();
  const { nombre, inicial, metodo, salir } = useCuenta();
  const [aviso, setAviso] = useState<DatosAviso | null>(null);
  const cerrarAviso = useCallback(() => setAviso(null), []);
  useDialogo(abierto, cajon, alCerrar);

  // Ir a una pantalla: primero se cierra el menú
  const ir = (ruta: string) => {
    alCerrar();
    navigate(ruta);
  };

  const elegirTema = async (clave: ClaveTema) => {
    if (clave === tema) return;
    const nombreTema = nombreDelTema(clave);
    setAviso({ titulo: `Tema ${nombreTema} aplicado`, texto: 'Se ha cambiado al instante en toda la app.' });
    const guardado = await cambiarTema(clave);
    if (!guardado) setAviso({ titulo: `Tema ${nombreTema} aplicado en este dispositivo`, texto: 'No se ha podido guardar en tu cuenta. Inténtalo más tarde.' });
  };

  const diasConTareas = ultimos7.filter(Boolean).length;

  return (
    <>
      {abierto &&
        createPortal(
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div className="fondo-hoja absolute inset-0 bg-[rgba(10,30,47,0.5)]" onClick={alCerrar} aria-hidden="true" />
            <div ref={cajon} role="dialog" aria-modal="true" aria-label="Menú" tabIndex={-1} className="menu-cajon">
              {/* Cabecera: logo, saludo y cerrar */}
              <div className="menu-cabecera">
                <div className="min-w-0 grow">
                  <div className="mb-0.5 flex">
                    <LogoTachit ancho={112} colorCheck="var(--tachit-acento)" />
                  </div>
                  <div className="menu-saludo truncate">Hola, {nombre}</div>
                </div>
                <button type="button" onClick={alCerrar} aria-label="Cerrar" className="menu-cerrar">
                  ×
                </button>
              </div>

              <div className="menu-cuerpo">
                {/* Mi ritmo: la racha y los últimos 7 días */}
                <button type="button" className="menu-opcion" onClick={() => ir('/ritmo')}>
                  <span className="menu-icono">
                    <Icono trazo="ritmo" />
                  </span>
                  <span className="menu-textos">
                    <span className="menu-titulo">Mi ritmo</span>
                    <span className="menu-dato">{racha === 1 ? '1 día de racha' : `${racha} días de racha`}</span>
                  </span>
                  <span className="menu-derecha">
                    <span className="menu-racha" role="img" aria-label={`${diasConTareas} de 7 días con tareas hechas`}>
                      {ultimos7.map((hizo, i) => (
                        <span key={i} className={hizo ? 'hizo' : ''} style={{ height: hizo ? 8 + i * 2 : 6 }} />
                      ))}
                    </span>
                    <Flecha />
                  </span>
                </button>

                {/* Google Calendar: de momento sin conectar; la tarjeta para conectarlo irá en Ajustes (Fase 11) */}
                <button type="button" className="menu-opcion" onClick={() => ir('/ajustes')}>
                  <span className="menu-icono">
                    <Icono trazo="google" />
                  </span>
                  <span className="menu-textos">
                    <span className="menu-titulo">Google Calendar</span>
                    <span className="menu-dato">Sin conectar</span>
                  </span>
                  <span className="menu-derecha">
                    <Flecha />
                  </span>
                </button>

                {/* Tema: los puntitos cambian el tema al momento */}
                <div className="menu-opcion">
                  <span className="menu-icono">
                    <Icono trazo="tema" />
                  </span>
                  <span className="menu-textos">
                    <span className="menu-titulo">Tema</span>
                    <span className="menu-dato">{nombreDelTema(tema)}</span>
                  </span>
                  <span className="menu-derecha" role="group" aria-label="Tema">
                    {TEMAS.map((opcion) => (
                      <button
                        key={opcion.clave}
                        type="button"
                        className="menu-punto"
                        aria-label={opcion.nombre}
                        aria-pressed={opcion.clave === tema}
                        onClick={() => elegirTema(opcion.clave)}
                        // color = el del aro que rodea al elegido (en el CSS se usa como currentColor)
                        style={{ background: COLOR_PUNTO[opcion.clave], color: COLOR_PUNTO[opcion.clave] }}
                      />
                    ))}
                  </span>
                </div>

                <button type="button" className="menu-opcion" onClick={() => ir('/ajustes')}>
                  <span className="menu-icono">
                    <Icono trazo="ajustes" />
                  </span>
                  <span className="menu-textos">
                    <span className="menu-titulo">Ajustes</span>
                    <span className="menu-dato">Avisos, idioma y cuenta</span>
                  </span>
                  <span className="menu-derecha">
                    <Flecha />
                  </span>
                </button>

                {/* Ayuda: las preguntas frecuentes irán en Ajustes (Fase 10) */}
                <button type="button" className="menu-opcion" onClick={() => ir('/ajustes')}>
                  <span className="menu-icono">
                    <Icono trazo="ayuda" />
                  </span>
                  <span className="menu-textos">
                    <span className="menu-titulo">Ayuda</span>
                    <span className="menu-dato">Preguntas frecuentes</span>
                  </span>
                  <span className="menu-derecha">
                    <Flecha />
                  </span>
                </button>

                {/* El pase, igual que en la barra lateral web pero sobre fondo blanco */}
                <div className="h-4 shrink-0" />
                <div className="menu-pase">
                  <span className="menu-pase-avatar" aria-hidden="true">
                    {inicial}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-bold text-[#0f1f2e]">{nombre}</span>
                    <ChipMetodo metodo={metodo} className="menu-pase-chip" />
                  </div>
                  <span className="menu-pase-corte" aria-hidden="true" />
                  <button type="button" onClick={salir} className="boton-salir menu-salir" aria-label="Cerrar sesión" title="Cerrar sesión">
                    <IconoSalir />
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
      {aviso && <AvisoFlotante aviso={aviso} alCerrar={cerrarAviso} />}
    </>
  );
}

export default MenuMovil;
