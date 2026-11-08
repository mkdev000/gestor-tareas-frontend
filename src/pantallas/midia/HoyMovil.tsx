// pantallas/midia/HoyMovil.tsx
// «Hoy» en el móvil (Fase 7, paso 7.6): lo nuevo de Mi día web, adaptado al móvil (idea 1 con la tira).
// De arriba abajo: la fecha grande; «Así va tu día» con el hilo (tocar un puntito dice qué tarea es)
// y la frase; la tira «Lo importante» que se abre; la agenda con estilo libreta (en el móvil se toca,
// no se arrastra: el círculo tacha la tarea y el nombre la abre); y las notas sueltas en una fila.
// Los cálculos están en dia.ts y lo que se guarda lo hace MiDia.tsx; aquí solo se dibuja.
import { Fragment, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import type { Tarea } from '../useTareas';
import { choques, duracion, estaAtrasada, esDeHoy, fraseDelDia, hecha, inicioDe, type EstadoNota, type Resumen, type hiloDelDia } from './dia';
import type { EstadoReorganizar } from './BriefingDia';
import { estiloPrioridad } from '../tareas/prioridades';
import { textoDuracion } from '../tareas/frase';
import { textoHora } from '../tareas/pulso';
import { PastillaIcono } from '../tareas/PastillaIcono';
import { deTextoISO } from '../../utils/dias';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const GIROS = [-1.5, 1.2, 1, -1.2];

interface Props {
  tareas: Tarea[];
  hoy: string;
  ahora: number;
  inicial: string; // la letra del avatar
  titular: string; // "Buenos días, Ana. Hoy tienes 2 tareas clave."
  resumen: Resumen;
  hilo: ReturnType<typeof hiloDelDia>;
  nota: { estado: EstadoNota; tareas: { id: number; titulo: string; hora: string }[] };
  huecos: Map<number, number | null>; // notas sueltas: id → minuto del primer hueco (null = no cabe)
  estadoReorg: EstadoReorganizar;
  ocupado: boolean; // se está guardando algo (evita dobles toques)
  alTachar: (t: Tarea) => void;
  alAbrir: (id: number) => void;
  alRecolocar: () => void;
  alReorganizar: () => void;
  alSeparar: (primeraId: number, segundaId: number) => void;
  alPlanificar: (t: Tarea) => void;
  alAnadirImportante: () => void;
  alIrACuenta: () => void;
}

// El trazo de Tachit (raya que acaba en check)
function Tachon() {
  return (
    <svg className="hoy-tachon" viewBox="0 0 120 10" preserveAspectRatio="none" aria-hidden="true">
      <path d="M1 5 H96 L104 9 L118 1" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Check({ tam = 14 }: { tam?: number }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function HoyMovil(p: Props) {
  const { tareas, hoy, ahora, resumen, hilo, nota } = p;
  const [tiraAbierta, setTiraAbierta] = useState(false);
  const [punto, setPunto] = useState<number | null>(null); // el puntito del hilo que has tocado
  const [resaltada, setResaltada] = useState<number | null>(null);
  const reloj = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fecha = deTextoISO(hoy);
  const atrasadas = resumen.atrasadas;
  const vasAlDia = atrasadas.length === 0 && hilo.total > 0 && hilo.hechas < hilo.total;

  // ---------- El hilo: el dedo es más gordo que un puntito, así que se elige el más cercano ----------
  const alTocarHilo = (e: MouseEvent<HTMLButtonElement>) => {
    const caja = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - caja.left) / caja.width) * 100;
    let mejor: (typeof hilo.puntos)[number] | null = null;
    for (const pt of hilo.puntos) if (!mejor || Math.abs(pt.x - x) < Math.abs(mejor.x - x)) mejor = pt;
    if (mejor) setPunto((actual) => (actual === mejor!.id ? null : mejor!.id));
  };
  const elegido = hilo.puntos.find((pt) => pt.id === punto) ?? null;
  const ESTADO_TEXTO = { hecha: 'hecha', atrasada: 'se te pasó', encurso: 'en curso', pendiente: '', sinhora: 'sin hora' } as const;
  const verEnAgenda = () => {
    if (!elegido) return;
    const id = elegido.id;
    setPunto(null);
    setResaltada(id);
    clearTimeout(reloj.current);
    reloj.current = setTimeout(() => setResaltada(null), 1500);
    // Después de dibujar: bajar hasta la tarea (o hasta las notas sueltas si no tiene hora)
    requestAnimationFrame(() => {
      const el = document.getElementById(`hoy-fila-${id}`) ?? document.getElementById('hoy-sueltas');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  // ---------- La agenda: tareas de hoy con hora, en orden, y la raya de "ahora" en su sitio ----------
  const conHora = tareas.filter((t) => esDeHoy(t, hoy) && inicioDe(t) !== null).sort((a, b) => inicioDe(a)! - inicioDe(b)!);
  const pisan = choques(tareas, hoy);
  const indiceAhora = conHora.findIndex((t) => inicioDe(t)! > ahora);
  const raya = (
    <div className="hoy-ahora" aria-hidden="true">
      <span>{textoHora(ahora)}</span>
    </div>
  );
  const sueltas = resumen.sinHora;

  // ---------- La tira «Lo importante» ----------
  const resumenTira =
    nota.estado === 'pendientes'
      ? nota.tareas.map((t) => `${t.hora} ${t.titulo}`).join(' · ')
      : nota.estado === 'hechas'
        ? '✓ Lo importante de hoy, hecho'
        : 'Nada urgente por ahora';

  return (
    <div className="hoy">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-bold tracking-[0.3px] text-[#5b6b7c]">
            {MESES[fecha.getMonth()]} · ahora {textoHora(ahora)}
          </p>
          <h1 className="mt-0.5 text-[34px] leading-[1.05] font-extrabold tracking-[-1.2px]">
            {DIAS[fecha.getDay()]} <span className="text-tachit-acento-fuerte">{fecha.getDate()}</span>
          </h1>
        </div>
        <button type="button" onClick={p.alIrACuenta} aria-label="Tu cuenta" className="hoy-avatar">
          {p.inicial}
        </button>
      </div>

      {/* Así va tu día: el hilo y la frase */}
      <section aria-labelledby="hoy-asi" className="hoy-asi">
        <div>
          <p className="hoy-et">ASÍ VA TU DÍA</p>
          <h2 id="hoy-asi" className="text-[17px] leading-[1.3] font-extrabold">
            {p.titular}
          </h2>
        </div>
        <button type="button" className="hoy-hilo" onClick={alTocarHilo} aria-label="Toca un puntito para ver qué tarea es">
          <span className="hoy-hilo-linea" />
          {hilo.puntos.map((pt) => (
            <span key={pt.id} className={`hoy-punto hoy-punto-${pt.estado}${pt.id === punto ? ' hoy-punto-elegido' : ''}`} style={{ left: `${pt.x}%` }} />
          ))}
          <span className="hoy-hilo-ahora" style={{ left: `${hilo.ahora}%` }} />
        </button>
        {elegido && (
          <div className="hoy-bocata" role="status" style={{ '--px': `${elegido.x}%` } as CSSProperties}>
            <span className="hoy-bocata-texto">
              <b>{elegido.inicio === null ? 'Sin hora' : textoHora(elegido.inicio)}</b> {elegido.titulo}
              {ESTADO_TEXTO[elegido.estado] && <span className="hoy-bocata-estado"> · {ESTADO_TEXTO[elegido.estado]}</span>}
            </span>
            <button type="button" onClick={verEnAgenda}>
              Ver en la agenda ›
            </button>
          </div>
        )}
        <p className="text-[13.5px] leading-[1.55]">
          {fraseDelDia(resumen.libre, hilo.hechas, hilo.total)}
          {atrasadas.length > 0 && (
            <>
              {' '}
              <strong className="hoy-mal">
                {atrasadas.length === 1
                  ? `A las ${textoHora(inicioDe(atrasadas[0]) ?? 0)} se te pasó «${atrasadas[0].titulo}».`
                  : `Se te pasaron ${atrasadas.length} tareas.`}
              </strong>
              <button type="button" onClick={p.alRecolocar} disabled={p.ocupado} className="midia-recolocar">
                {atrasadas.length === 1 ? 'Recolocar' : 'Recolocarlas'}
              </button>
            </>
          )}
          {vasAlDia && (
            <>
              {' '}
              <strong className="hoy-ok">Vas al día.</strong>
            </>
          )}
        </p>
      </section>

      {/* La tira «Lo importante»: recogida ocupa una línea; al tocarla se abre */}
      <div className={tiraAbierta ? 'hoy-tira hoy-tira-abierta' : 'hoy-tira'}>
        <button type="button" className="hoy-tira-cab" onClick={() => setTiraAbierta((a) => !a)} aria-expanded={tiraAbierta}>
          <span className="hoy-tira-et">LO IMPORTANTE</span>
          <span className={nota.estado === 'hechas' ? 'hoy-tira-res text-[#17804f]' : 'hoy-tira-res'}>{resumenTira}</span>
          <svg
            className="hoy-tira-flecha"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {tiraAbierta && (
          <div className="hoy-tira-cuerpo">
            {nota.estado === 'vacia' ? (
              <>
                <p className="text-[12.5px] leading-[1.45] text-[#5b6b7c]">Aquí salen las tareas de hoy con prioridad alta que aún no has terminado.</p>
                <button type="button" onClick={p.alAnadirImportante} className="midia-nota-atajo">
                  + Añadir algo importante
                </button>
              </>
            ) : (
              <ul>
                {nota.tareas.map((t) => (
                  <li key={t.id} className={nota.estado === 'hechas' ? 'hoy-tira-fila hoy-tira-hecha' : 'hoy-tira-fila'}>
                    <b>{t.hora}</b>
                    <span className="relative min-w-0">
                      {t.titulo}
                      {nota.estado === 'hechas' && (
                        <>
                          <span className="sr-only"> (hecha)</span>
                          <Tachon />
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* La agenda libreta */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">Agenda de hoy</h2>
        <button type="button" onClick={p.alReorganizar} disabled={p.estadoReorg !== ''} data-estado={p.estadoReorg} className="midia-reorganizar hoy-reorg">
          <span className="midia-bloques" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span aria-live="polite">{p.estadoReorg === 'trabajando' ? 'Reorganizando…' : p.estadoReorg === 'listo' ? '✓ Listo' : 'Reorganizar'}</span>
        </button>
      </div>
      <div className="hoy-agenda">
        {conHora.length === 0 && <p className="py-3 text-sm text-[#5b6b7c]">Hoy no tienes tareas con hora.</p>}
        {conHora.map((t, i) => {
          const inicio = inicioDe(t)!;
          const dura = duracion(t);
          const atrasada = estaAtrasada(t, hoy, ahora);
          const enCurso = !hecha(t) && inicio <= ahora && ahora < inicio + dura;
          const pz = pisan.find((c) => c.segunda.id === t.id);
          const categoria = t.categorias?.[0]?.nombre;
          const estado = hecha(t) ? 'hecha' : atrasada ? 'se te pasó' : enCurso ? 'en curso' : '';
          const clase = [
            'hoy-fila',
            hecha(t) && 'hoy-fila-hecha',
            atrasada && 'hoy-fila-atrasada',
            enCurso && 'hoy-fila-encurso',
            resaltada === t.id && 'hoy-fila-brillo',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <Fragment key={t.id}>
              {i === indiceAhora && raya}
              <div id={`hoy-fila-${t.id}`} className={clase} style={{ '--c': estiloPrioridad(t.prioridad).color } as CSSProperties}>
                {/* La duración, corta para que quepa en la columna: "1 h 30" (como el prototipo) */}
                <span className="hoy-hora">
                  {textoHora(inicio)}
                  <small>{dura >= 60 ? textoDuracion(dura).replace(' min', '') : textoDuracion(dura)}</small>
                </span>
                <button
                  type="button"
                  className="hoy-check"
                  onClick={() => p.alTachar(t)}
                  aria-label={hecha(t) ? `Destachar «${t.titulo}»` : `Tachar «${t.titulo}»`}
                >
                  <Check />
                </button>
                <button type="button" className="hoy-texto" onClick={() => p.alAbrir(t.id)} aria-label={`Abrir «${t.titulo}»`}>
                  <span className="hoy-titulo">
                    <PastillaIcono clave={t.icono} tam={18} radio={6} dibujo={11} />
                    <span className="hoy-nombre">
                      {t.titulo}
                      {hecha(t) && <Tachon />}
                    </span>
                  </span>
                  <span className="hoy-dato">
                    {categoria ? `#${categoria}` : ''}
                    {estado && `${categoria ? ' · ' : ''}${estado}`}
                  </span>
                </button>
                {pz && (
                  <span className="hoy-pisa" role="status">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
                    </svg>
                    Se pisan {textoHora(pz.desde)}–{textoHora(pz.hasta)}
                    <button type="button" onClick={() => p.alSeparar(pz.primera.id, pz.segunda.id)}>
                      Separar
                    </button>
                  </span>
                )}
              </div>
            </Fragment>
          );
        })}
        {conHora.length > 0 && indiceAhora === -1 && raya}
      </div>

      {/* Las notas sueltas: en una fila que se desliza de lado */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-extrabold">Notas sueltas</h2>
        {sueltas.length > 0 && <span className="midia-sueltas-n">{sueltas.length}</span>}
      </div>
      {sueltas.length > 0 ? (
        <ul id="hoy-sueltas" className="hoy-sueltas">
          {sueltas.map((t, i) => {
            const prioridad = estiloPrioridad(t.prioridad);
            const hueco = p.huecos.get(t.id) ?? null;
            return (
              <li
                key={t.id}
                className={resaltada === t.id ? 'midia-suelta hoy-fila-brillo' : 'midia-suelta'}
                style={{ '--cinta': prioridad.color, '--giro': `${GIROS[i % GIROS.length]}deg` } as CSSProperties}
              >
                <p className="midia-suelta-titulo">{t.titulo}</p>
                <p className="midia-suelta-dato">
                  {textoDuracion(duracion(t))} · {prioridad.nombre.toLowerCase()}
                </p>
                <button
                  type="button"
                  onClick={() => p.alPlanificar(t)}
                  disabled={p.ocupado}
                  aria-label={hueco === null ? `No queda hueco hoy para «${t.titulo}»` : `Poner «${t.titulo}» a las ${textoHora(hueco)}`}
                  className="midia-planificar"
                >
                  {hueco === null ? 'Sin hueco hoy' : `A las ${textoHora(hueco)}`}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div id="hoy-sueltas" className="midia-sueltas-ok">
          <span className="midia-sello" aria-hidden="true">
            <Check tam={18} />
          </span>
          <strong>No hay notas sueltas.</strong>
          <span className="midia-sueltas-ok-hora">Todo tiene su hora.</span>
        </div>
      )}
    </div>
  );
}

export default HoyMovil;
