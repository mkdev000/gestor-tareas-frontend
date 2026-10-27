// tema/SelectorTema.tsx
// La tarjeta "Tema" de Ajustes, igual que en el prototipo: 4 miniaturas de la app, una por tema.
// Truco: cada miniatura lleva su propio data-tema, así sus colores salen de index.css
// (las variables --tachit-...) y no hay que repetir ningún color aquí.
import { useCallback, useState } from 'react';
import { useTema } from './contextoTema';
import { TEMAS, nombreDelTema, type ClaveTema } from './temas';
import AvisoFlotante, { type DatosAviso } from '../components/AvisoFlotante';

function SelectorTema() {
  const { tema, cambiarTema } = useTema();
  const [aviso, setAviso] = useState<DatosAviso | null>(null);
  const cerrarAviso = useCallback(() => setAviso(null), []);

  const elegir = async (clave: ClaveTema) => {
    if (clave === tema) return;
    const nombre = nombreDelTema(clave);
    setAviso({ titulo: `Tema ${nombre} aplicado`, texto: 'Se ha cambiado al instante en toda la app.' });
    const guardado = await cambiarTema(clave);
    if (!guardado) {
      setAviso({ titulo: `Tema ${nombre} aplicado en este dispositivo`, texto: 'No se ha podido guardar en tu cuenta. Inténtalo más tarde.' });
    }
  };

  return (
    <section className="flex flex-col gap-3.5 rounded-2xl border border-[#e3e8ef] bg-white p-[22px]">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-[17px] font-extrabold">Tema</h2>
        <p className="text-[13px] text-[#5b6b7c]">Elige el color de Tachit. Se aplica al momento.</p>
      </div>

      <div role="group" aria-label="Tema" className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3.5">
        {TEMAS.map((opcion) => {
          const elegido = opcion.clave === tema;
          return (
            <button
              key={opcion.clave}
              type="button"
              data-tema={opcion.clave}
              aria-pressed={elegido}
              onClick={() => elegir(opcion.clave)}
              className={
                'flex cursor-pointer flex-col gap-2 rounded-2xl border-0 bg-white p-2 text-left font-jakarta ' +
                (elegido
                  ? 'shadow-[0_0_0_2px_var(--tachit-acento),0_8px_20px_rgba(10,30,47,0.12)]'
                  : 'shadow-[0_0_0_1px_#e3e8ef]')
              }
            >
              {/* Miniatura de la app: barra lateral a la izquierda y contenido a la derecha */}
              <span aria-hidden="true" className="flex h-[72px] overflow-hidden rounded-[10px] bg-[#f4f6f9]">
                <span className="flex w-[22px] shrink-0 flex-col items-center gap-[5px] bg-[linear-gradient(180deg,var(--tachit-panel),var(--tachit-panel-activo))] pt-2">
                  <span className="h-2 w-2 rounded-[3px] bg-tachit-acento" />
                  <span className="h-2 w-2 rounded-[3px] bg-white/25" />
                  <span className="h-2 w-2 rounded-[3px] bg-white/25" />
                </span>
                <span className="flex grow flex-col gap-1.5 px-2 py-[9px]">
                  <span className="h-[9px] w-[70%] rounded bg-tachit-acento" />
                  <span className="h-1.5 w-[90%] rounded-[3px] bg-[#dde3ea]" />
                  <span className="h-1.5 w-[64%] rounded-[3px] bg-[#dde3ea]" />
                  <span className="h-3.5 w-[42%] rounded-full bg-tachit-panel" />
                </span>
              </span>

              <span className="flex items-center gap-[7px] px-0.5">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-tachit-acento" />
                <span className="text-sm font-extrabold text-[#0f1f2e]">{opcion.nombre}</span>
                <span aria-hidden="true" className={'ml-auto text-[13px] font-extrabold ' + (elegido ? 'text-tachit-acento' : 'text-transparent')}>
                  ✓
                </span>
              </span>
              <span className="-mt-[5px] truncate px-0.5 text-[11px] text-[#5b6b7c]">{opcion.descripcion}</span>
            </button>
          );
        })}
      </div>

      <p className="text-[13px] text-[#33475b]">El tema se guarda en tu cuenta y se aplica en la web y en el móvil.</p>

      {aviso && <AvisoFlotante aviso={aviso} alCerrar={cerrarAviso} />}
    </section>
  );
}

export default SelectorTema;
