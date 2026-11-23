// pantallas/ritmo/CierreSemana.tsx
// «Cierre de semana» de Mi ritmo (Fase 9, paso 9.6; idea A «la hoja de la semana que se arranca»), igual que el prototipo:
//  0. la hoja de la semana (tachadas y pendientes) y «Empezar el cierre» (se abre el viernes)
//  1. lo que has tachado, tachado en la hoja
//  2. ¿qué pasa al lunes?: casillas con las pendientes (todas marcadas) y la hojita del lunes
//  3. tu foco: una categoría, marcada con rotulador fosforito (o «Nada en especial»)
//  4. hecho: la hoja arrancada y, debajo, la del lunes con lo que ha pasado y el foco
// Tres rayitas dicen en qué paso vas. Lo de guardar (POST /api/ritmo/cierres) lo hace MiRitmo con alCerrar.
import { useState, type ReactNode } from 'react';
import { deTextoISO, sumarDias } from '../../utils/dias';
import type { CategoriaDeLista, Tarea } from '../useTareas';
import TarjetaRitmo from './TarjetaRitmo';
import { MAX_PASAR_AL_LUNES, type CierreSemana as Cierre } from './ritmo';

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const corta = (iso: string) => {
  const d = deTextoISO(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
};
const MAX_EN_HOJA = 4;

export interface ResultadoCierre {
  movidas: string[]; // los títulos de lo que ha pasado al lunes
  foco: number | null;
}

interface Props {
  lunes: string; // el lunes de la semana que se cierra
  abierta: boolean; // ya se puede cerrar (a partir del viernes)
  cierre: Cierre | null; // si ya está cerrada, lo que se guardó
  tachadas: string[]; // los títulos de lo que tachaste esta semana (los de tareas borradas no salen)
  nTachadas: number; // cuántas tachaste (contando también las borradas)
  pendientes: Tarea[];
  categorias: CategoriaDeLista[];
  alCerrar: (ids: number[], foco: number | null) => Promise<boolean>; // true si se ha guardado
}

function Hoja({ cabeza, fecha, children }: { cabeza: string; fecha: string; children: ReactNode }) {
  return (
    <div className="ritmo-cierre-hoja">
      <p className="ritmo-cierre-hoja-cab">
        <span>{cabeza}</span>
        <span>{fecha}</span>
      </p>
      <div className="ritmo-cierre-hoja-cuerpo">{children}</div>
    </div>
  );
}

function CierreSemana({ lunes, abierta, cierre, tachadas, nTachadas, pendientes, categorias, alCerrar }: Props) {
  const [paso, setPaso] = useState(0);
  const [desmarcadas, setDesmarcadas] = useState<number[]>([]); // todas empiezan marcadas
  const [foco, setFoco] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [hecho, setHecho] = useState<ResultadoCierre | null>(null);

  const domingo = sumarDias(lunes, 6);
  const lunesSiguiente = sumarDias(lunes, 7);
  const marcadas = pendientes.filter((t) => !desmarcadas.includes(t.id)).slice(0, MAX_PASAR_AL_LUNES);
  const resto = pendientes.length - marcadas.length;
  const nombreDe = (id: number | null) => categorias.find((c) => c.id === id)?.nombre ?? null;

  const cambiar = (id: number) => setDesmarcadas((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const cerrar = async () => {
    if (guardando) return;
    setGuardando(true);
    const movidas = marcadas.map((t) => t.titulo);
    const bien = await alCerrar(
      marcadas.map((t) => t.id),
      foco,
    );
    setGuardando(false);
    if (bien) setHecho({ movidas, foco });
  };

  // Lo que se enseña en «hecho»: lo de esta vez (con títulos) o, si ya estaba cerrada, lo que se guardó
  const final = hecho ?? (cierre ? { movidas: [] as string[], foco: cierre.foco_categoria_id } : null);
  const actual = final ? 4 : paso;
  const nombreFoco = final ? nombreDe(final.foco) : null;
  const pasadas = hecho ? hecho.movidas.length : (cierre?.pasadas_al_lunes ?? 0);

  return (
    <TarjetaRitmo
      clase="ritmo-bloque ritmo-cierre"
      titulo="CIERRE DE SEMANA"
      icono={
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M4 10h16" />
          <path d="M9 3v4" />
          <path d="M15 3v4" />
        </>
      }
      ayuda={[
        { icono: '1', texto: 'Repasas lo que has tachado esta semana.' },
        { icono: '2', texto: 'Marcas qué tareas pendientes pasan al lunes (se mueven de verdad).' },
        { icono: '3', texto: 'Eliges tu foco para la semana que viene.' },
        { icono: '📅', texto: 'Se abre el viernes y se cierra una vez por semana.' },
      ]}
    >
      <span className="ritmo-cierre-pasos" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <i key={i} className={actual > i || actual === 4 ? 'ya' : actual === i ? 'ahora' : undefined} />
        ))}
      </span>
      {actual > 0 && actual < 4 && <p className="sr-only">Paso {actual} de 3</p>}

      {actual === 0 && (
        <>
          <p className="ritmo-cierre-frase">Cinco minutos para empezar el lunes con la cabeza despejada.</p>
          <Hoja cabeza="SEMANA" fecha={`${corta(lunes)} – ${corta(domingo)}`}>
            <p className="ritmo-cierre-numeros">
              <span>
                <b>{nTachadas}</b>tachadas
              </span>
              <span>
                <b>{pendientes.length}</b>pendientes
              </span>
            </p>
          </Hoja>
          <p className="ritmo-pregunta-sub">{abierta ? 'Ya puedes cerrar esta semana.' : 'Se abre el viernes.'}</p>
          <div className="ritmo-cierre-botones">
            <button type="button" className="ritmo-cierre-boton" disabled={!abierta} onClick={() => setPaso(1)}>
              Empezar el cierre
            </button>
          </div>
        </>
      )}

      {actual === 1 && (
        <>
          <p className="ritmo-cierre-frase" aria-live="polite">
            {nTachadas ? (
              <>
                Esta semana has tachado <span className="ritmo-rotu">{nTachadas === 1 ? '1 tarea' : `${nTachadas} tareas`}</span>.
              </>
            ) : (
              <>
                Esta semana <span className="ritmo-rotu">aún no has tachado nada</span>. La que viene, más.
              </>
            )}
          </p>
          {tachadas.length > 0 && (
            <Hoja cabeza="SEMANA" fecha={`${corta(lunes)} – ${corta(domingo)}`}>
              {tachadas.slice(0, MAX_EN_HOJA).map((t, i) => (
                <span key={i} className="ritmo-cierre-tachada">
                  {t}
                </span>
              ))}
              {nTachadas > MAX_EN_HOJA && <span className="ritmo-cierre-mas">y {nTachadas - Math.min(MAX_EN_HOJA, tachadas.length)} más</span>}
            </Hoja>
          )}
          <div className="ritmo-cierre-botones">
            <button type="button" className="ritmo-cierre-boton" onClick={() => setPaso(2)}>
              Siguiente
            </button>
          </div>
        </>
      )}

      {actual === 2 && (
        <>
          {pendientes.length ? (
            <>
              <p className="ritmo-cierre-frase" aria-live="polite">
                Te quedan <span className="ritmo-rotu">{pendientes.length}</span>. ¿Cuáles pasan al lunes?
              </p>
              <div className="ritmo-cierre-lista">
                {pendientes.map((t) => {
                  const on = !desmarcadas.includes(t.id);
                  return (
                    <button key={t.id} type="button" role="checkbox" aria-checked={on} className="ritmo-cierre-fila" onClick={() => cambiar(t.id)}>
                      <span className="ritmo-cierre-casilla" aria-hidden="true">
                        ✓
                      </span>
                      <span className="ritmo-cierre-titulo">{t.titulo}</span>
                      {(t.veces_aplazada ?? 0) >= 2 && <small>{t.veces_aplazada} veces</small>}
                    </button>
                  );
                })}
              </div>
              <p className="ritmo-cierre-flecha">
                {marcadas.length === 0 ? 'Ninguna pasa al lunes' : marcadas.length === 1 ? '1 se va al' : `${marcadas.length} se van al`}
                <span className="ritmo-cierre-mini" aria-hidden="true">
                  <small>LUN</small>
                  <b>{deTextoISO(lunesSiguiente).getDate()}</b>
                </span>
                {resto > 0 && (resto === 1 ? '· la otra se queda donde está' : `· las otras ${resto} se quedan donde están`)}
              </p>
            </>
          ) : (
            <p className="ritmo-cierre-frase">No te queda nada pendiente de esta semana. ✓</p>
          )}
          <div className="ritmo-cierre-botones">
            <button type="button" className="ritmo-cierre-boton" onClick={() => setPaso(3)}>
              {marcadas.length ? `Pasar ${marcadas.length} al lunes` : 'Siguiente'}
            </button>
            <button type="button" className="ritmo-cierre-boton otro" onClick={() => setPaso(1)}>
              Atrás
            </button>
          </div>
        </>
      )}

      {actual === 3 && (
        <>
          <p className="ritmo-cierre-frase" aria-live="polite">
            ¿Qué no quieres que se te escape la semana que viene?
          </p>
          <div className="ritmo-cierre-chips">
            {categorias.map((c) => (
              <button key={c.id} type="button" className="ritmo-cierre-chip" aria-pressed={foco === c.id} onClick={() => setFoco(foco === c.id ? null : c.id)}>
                #{c.nombre}
              </button>
            ))}
            <button type="button" className="ritmo-cierre-chip" aria-pressed={foco === null} onClick={() => setFoco(null)}>
              Nada en especial
            </button>
          </div>
          <p className="ritmo-pregunta-sub">Lo marcas con el rotulador y saldrá en la hoja del lunes.</p>
          <div className="ritmo-cierre-botones">
            <button type="button" className="ritmo-cierre-boton" disabled={guardando} onClick={() => void cerrar()}>
              {guardando ? 'Cerrando…' : 'Cerrar la semana'}
            </button>
            <button type="button" className="ritmo-cierre-boton otro" disabled={guardando} onClick={() => setPaso(2)}>
              Atrás
            </button>
          </div>
        </>
      )}

      {actual === 4 && final && (
        <>
          <p className="ritmo-cierre-bien" role="status">
            ✓ Semana cerrada
          </p>
          <div className="ritmo-cierre-arrancada">
            <div className="ritmo-cierre-trozo" aria-hidden="true" />
            <Hoja cabeza="LUNES" fecha={corta(lunesSiguiente)}>
              {final.movidas.slice(0, 3).map((t, i) => (
                <span key={i}>· {t}</span>
              ))}
              {final.movidas.length > 3 && <span className="ritmo-cierre-mas">y {final.movidas.length - 3} más</span>}
              {!hecho && pasadas > 0 && <span>{pasadas === 1 ? '1 tarea ha pasado aquí.' : `${pasadas} tareas han pasado aquí.`}</span>}
              {pasadas === 0 && <span className="ritmo-cierre-mas">Nada pendiente: empiezas de cero.</span>}
              {nombreFoco ? (
                <span>
                  Foco: <span className="ritmo-cierre-foco">#{nombreFoco}</span>
                </span>
              ) : (
                <span className="ritmo-cierre-mas">Sin foco elegido, y está bien.</span>
              )}
            </Hoja>
          </div>
          <p className="ritmo-pregunta-sub">
            {hecho ? nTachadas : (cierre?.completadas ?? nTachadas)} tachadas · {pasadas} pasan al lunes.
          </p>
        </>
      )}
    </TarjetaRitmo>
  );
}

export default CierreSemana;
