// pantallas/midia/BriefingDia.tsx
// La tarjeta de arriba de Mi día, "Así va tu día" (Fase 7, paso 7.4), igual que en el prototipo web:
// el saludo, el tiempo libre que queda y las atrasadas; la nota pegada "Lo importante de hoy"
// (con las tareas clave, con las ya hechas tachadas, o "Nada urgente por ahora" y un atajo para
// añadir una); y el botón "Reorganizar mi día" con sus tres bloques que se ordenan.
// Los textos salen de dia.ts (textoBriefing y loImportante); aquí solo se dibujan.
import { useId } from 'react';
import type { EstadoNota } from './dia';

export type EstadoReorganizar = '' | 'trabajando' | 'listo';

interface Props {
  titular: string; // "Buenos días, Ana. Hoy tienes 2 tareas clave."
  detalle: string; // "Te quedan unas 5 h libres y 1 tarea atrasada."
  nota: { estado: EstadoNota; tareas: { id: number; titulo: string; hora: string }[] }; // la nota pegada
  alAnadirImportante: () => void; // el atajo "+ Añadir algo importante" (abre Nueva tarea con prioridad alta)
  estado: EstadoReorganizar; // '' normal · 'trabajando' ordenando · 'listo' acaba de terminar
  alReorganizar: () => void;
}

const TEXTO_BOTON: Record<EstadoReorganizar, string> = {
  '': 'Reorganizar mi día',
  trabajando: 'Reorganizando…',
  listo: '✓ Listo',
};

function BriefingDia({ titular, detalle, nota, alAnadirImportante, estado, alReorganizar }: Props) {
  const idAyuda = useId();
  return (
    <section aria-labelledby="midia-briefing" className="midia-briefing">
      <div className="min-w-0 grow">
        <p className="text-[13px] font-bold tracking-[1.2px] text-tachit-panel-enlace">ASÍ VA TU DÍA</p>
        <h2 id="midia-briefing" className="mt-1 text-2xl font-extrabold tracking-[-0.3px]">
          {titular}
        </h2>
        <p className="mt-1 text-[15px] text-tachit-panel-texto-detalle">{detalle}</p>
      </div>
      <div className="midia-nota">
        <p className="midia-nota-titulo">LO IMPORTANTE DE HOY</p>
        {nota.estado === 'vacia' ? (
          <>
            <button type="button" className="midia-nota-ayuda" aria-label="¿Qué sale aquí?" aria-describedby={idAyuda}>
              ?
            </button>
            <p id={idAyuda} role="tooltip" className="midia-nota-explica">
              Aquí salen las tareas de hoy con prioridad alta que aún no has terminado.
            </p>
            <p className="midia-nota-mensaje">Nada urgente por ahora.</p>
            <button type="button" onClick={alAnadirImportante} className="midia-nota-atajo">
              + Añadir algo importante
            </button>
          </>
        ) : (
          <>
            <ul>
              {nota.tareas.map((t) => (
                <li key={t.id} className={nota.estado === 'hechas' ? 'midia-nota-hecha' : undefined}>
                  <b>{t.hora}</b>
                  {nota.estado === 'hechas' ? (
                    // El trazo de Tachit, en rojo, tacha lo que ya has terminado
                    <span className="midia-nota-tachada">
                      <span className="truncate">{t.titulo}</span>
                      <span className="sr-only"> (hecha)</span>
                      <svg viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden="true">
                        <path d="M0 6 H96 L104 10 L118 1" fill="none" stroke="#b42318" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  ) : (
                    <span className="truncate">{t.titulo}</span>
                  )}
                </li>
              ))}
            </ul>
            {nota.estado === 'hechas' && <p className="midia-nota-fin">✓ Lo importante de hoy, hecho.</p>}
          </>
        )}
      </div>
      <button type="button" onClick={alReorganizar} disabled={estado !== ''} data-estado={estado} className="midia-reorganizar">
        <span className="midia-bloques" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span aria-live="polite">{TEXTO_BOTON[estado]}</span>
      </button>
    </section>
  );
}

export default BriefingDia;
