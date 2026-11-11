// pantallas/tareas/PanelesHoja.tsx
// Los paneles de la hoja de crear del MÓVIL (Fase 5, paso 5.6), igual que en el prototipo móvil.
// Se abren con los botones de la barra de herramientas de la hoja (calendario, reloj de arena, campana...).
// Son distintos de los de la web (PanelesFrase.tsx) porque en el móvil hay menos sitio y se usan con el dedo:
//  - CUÁNDO: atajos (Hoy, Mañana, Sábado, Lunes), la semana con puntitos de "cuánto tienes ese día",
//    "Otra fecha" y la HORA en un reloj con el cielo de esa hora (RelojHora.tsx; avisa si se solapa con otra tarea)
//  - CUÁNTO DURA · AVISO · SE REPITE · ICONO · CATEGORÍA
import { sumarDias, deTextoISO } from '../../utils/dias';
import type { Tarea, CategoriaDeLista } from '../useTareas';
import { minutosDe } from './pulso';
import {
  ORDEN_SEMANA, LETRA_DIA, PASOS_AVISO, avisoActual, nombreDia, diaCorto, textoDuracion, textoHora, horaConCeros, normalizar,
  type FraseLeida, type OpcionesFrase,
} from './frase';
import { ICONOS_TAREA, CLAVES_ICONO, SIN_ICONO } from './iconosTarea';
import { DibujoIcono } from './PastillaIcono';
import RelojHora from './RelojHora';

const MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

export interface PropsPanelHoja {
  op: OpcionesFrase;
  cambiar: (cambio: Partial<OpcionesFrase>) => void;
  crudo: FraseLeida;
  fin: FraseLeida;
  hayBorrador: boolean;
  hoy: string;
}

// ---------- CUÁNDO (+ HORA) ----------

export function PanelCuandoHoja({
  op, cambiar, crudo, fin, hayBorrador, hoy, semana, setSemana, tareas, editandoId, ahora,
}: PropsPanelHoja & { semana: number; setSemana: (n: number) => void; tareas: Tarea[]; editandoId: number | null; ahora: number }) {
  const diaElegido = op.fecha || (hayBorrador && crudo.fecha) || hoy;
  const diasDesdeHoy = (iso: string) => Math.round((deTextoISO(iso).getTime() - deTextoISO(hoy).getTime()) / 86400000);
  const semanaDe = (iso: string) => Math.max(0, Math.floor(diasDesdeHoy(iso) / 7));
  const elegirDia = (iso: string) => {
    cambiar({ fecha: op.fecha === iso ? '' : iso });
    setSemana(semanaDe(iso));
  };
  const tareasDel = (iso: string) => tareas.filter((t) => t.fecha_limite?.slice(0, 10) === iso && t.id !== editandoId);

  // Atajos: Hoy, Mañana, el próximo sábado y el próximo lunes
  const diaHoy = deTextoISO(hoy).getDay();
  const sabado = sumarDias(hoy, (6 - diaHoy + 7) % 7 || 7);
  const lunes = sumarDias(hoy, (8 - diaHoy) % 7 || 7);
  const atajos = [
    { texto: 'Hoy', iso: hoy },
    { texto: 'Mañana', iso: sumarDias(hoy, 1) },
    { texto: 'Sábado', iso: sabado },
    { texto: 'Lunes', iso: lunes },
  ];

  // La hora: la que has elegido (o la de la frase), con su duración, y las tareas de ese día que ya tienen hora
  const duracion = fin.duracion || 30;
  const inicio = fin.inicio;
  const fin_ = inicio !== null ? inicio + duracion : null;
  const delDia = tareasDel(diaElegido);
  const ocupadas = delDia
    .map((t) => ({ t, ini: minutosDe(t.hora_limite) }))
    .filter((x): x is { t: Tarea; ini: number } => x.ini !== null)
    .map(({ t, ini }) => ({ t, ini, fin: ini + (t.duracion_min ?? 30) }));
  const choque = inicio !== null && fin_ !== null ? ocupadas.find((o) => o.ini < fin_ && inicio < o.fin) : undefined;

  const ponerHora = (minutos: number) => cambiar({ hora: horaConCeros(Math.max(0, Math.min(1439, minutos))) });
  const base = inicio ?? (diaElegido === hoy ? Math.ceil(ahora / 15) * 15 : 9 * 60);
  const textoHueco =
    inicio === null
      ? 'Sin hora · toca una flecha para ponerla'
      : choque
        ? `Se solapa con «${choque.t.titulo}»`
        : `${textoHora(inicio)}–${textoHora((inicio + duracion) % 1440)} · hueco libre`;

  const fechaElegida = deTextoISO(diaElegido);

  // La regla de meses (debajo de la semana): los días seguidos del mismo mes forman un "tramo".
  // Una semana normal tiene 1 tramo; si en ella acaba un mes y empieza otro, tiene 2
  // (por ejemplo: 29 y 30 → "Nov"; del 1 al 5 → "Diciembre"). Cada tramo ocupa lo mismo que sus días.
  const tramos: { mes: number; anio: number; dias: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = deTextoISO(sumarDias(hoy, semana * 7 + i));
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && ultimo.mes === d.getMonth() && ultimo.anio === d.getFullYear()) ultimo.dias++;
    else tramos.push({ mes: d.getMonth(), anio: d.getFullYear(), dias: 1 });
  }
  const anioActual = deTextoISO(hoy).getFullYear();

  return (
    <div className="flex flex-col gap-3">
      {/* Atajos */}
      <div className="flex gap-1.5">
        {atajos.map((a) => {
          const d = deTextoISO(a.iso);
          const elegido = diaElegido === a.iso;
          return (
            <button key={a.texto} type="button" aria-pressed={elegido} onClick={() => elegirDia(a.iso)} className={'hoja-rapido' + (elegido ? ' elegido' : '')}>
              <span>{a.texto}</span>
              <span className="hoja-rapido-sub">{`${d.getDate()} ${MES_CORTO[d.getMonth()]}`}</span>
            </button>
          );
        })}
      </div>

      {/* La semana, con flechas para ir a la siguiente */}
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => semana > 0 && setSemana(semana - 1)} disabled={semana === 0} aria-label="Semana anterior" className="hoja-flecha">
          <DibujoIcono trazo="M15 6l-6 6 6 6" tam={16} grosor={2.6} />
        </button>
        <div className="flex min-w-0 grow justify-between rounded-2xl bg-tachit-fondo p-1">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const iso = sumarDias(hoy, semana * 7 + i);
            const d = deTextoISO(iso);
            const elegido = diaElegido === iso;
            const deLaFrase = elegido && !op.fecha && hayBorrador && !!crudo.fecha;
            const carga = Math.min(3, tareasDel(iso).length);
            return (
              <button
                key={iso}
                type="button"
                aria-pressed={elegido}
                aria-label={`${nombreDia(d.getDay())} ${d.getDate()}`}
                onClick={() => elegirDia(iso)}
                className={'hoja-dia' + (elegido ? ' elegido' : '') + (deLaFrase ? ' de-la-frase' : '') + (iso === hoy ? ' hoy' : '')}
              >
                <span className="hoja-dia-nombre">{iso === hoy ? 'hoy' : diaCorto(d.getDay())}</span>
                <span className="text-[15px] leading-none font-extrabold">{d.getDate()}</span>
                <span className="flex h-1 gap-0.5" aria-hidden="true">
                  {Array.from({ length: carga }, (_, k) => (
                    <span key={k} className="hoja-dia-punto" />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <button type="button" onClick={() => setSemana(semana + 1)} aria-label="Semana siguiente" className="hoja-flecha">
          <DibujoIcono trazo="M9 6l6 6-6 6" tam={16} grosor={2.6} />
        </button>
      </div>

      {/* La regla de meses: cada nombre de mes, justo debajo de sus días */}
      <div className="hoja-regla" aria-hidden="true">
        {tramos.map((t) => {
          // El mes del día elegido va más fuerte; el otro, más suave
          const otro = tramos.length > 1 && !(t.mes === fechaElegida.getMonth() && t.anio === fechaElegida.getFullYear());
          return (
            <div key={`${t.anio}-${t.mes}`} className={'hoja-tramo' + (otro ? ' otro' : '')} style={{ flexGrow: t.dias }}>
              <span>
                {mayuscula(t.dias >= 3 ? MES_LARGO[t.mes] : MES_CORTO[t.mes])}
                {/* El año solo si cabe (tramos de 3 días o más) */}
                {t.anio !== anioActual && t.dias >= 3 && <small> {t.anio}</small>}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-[#5b6b7c]">
        <span className="truncate font-bold text-[#33475b]">
          {`${mayuscula(nombreDia(fechaElegida.getDay()))} ${fechaElegida.getDate()} · `}
          {delDia.length ? `${delDia.length} ${delDia.length === 1 ? 'tarea' : 'tareas'}` : 'Día libre'}
        </span>
        <label className="hoja-otra-fecha">
          <DibujoIcono trazo="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4" tam={14} grosor={2.4} />
          Otra fecha
          <input
            type="date"
            value={op.fecha}
            aria-label="Otra fecha"
            onChange={(e) => {
              cambiar({ fecha: e.target.value });
              setSemana(e.target.value ? semanaDe(e.target.value) : 0);
            }}
            // El campo de fecha es invisible y tapa el botón: al tocarlo abrimos el calendario del navegador.
            // showPicker() lo abre a la fuerza (en el ordenador, si no, solo se abría tocando el iconito)
            onClick={(e) => {
              try {
                e.currentTarget.showPicker();
              } catch {
                // navegadores antiguos: abren su calendario ellos solos al tocar el campo
              }
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>

      <div className="border-t border-dashed border-[#dde5ee]" />

      {/* HORA: el reloj con el cielo (y «Quitar hora» si la has elegido tú) */}
      <div className="flex min-h-[22px] items-center justify-between gap-2">
        <span className="text-[10px] font-extrabold tracking-[1.4px] text-tachit-acento-fuerte">HORA</span>
        {op.hora && (
          <button type="button" onClick={() => cambiar({ hora: '' })} className="hoja-quitar-hora">
            Quitar hora
          </button>
        )}
      </div>
      <RelojHora inicio={inicio} propuesta={base} choca={!!choque} alPoner={ponerHora} />
      <p aria-live="polite" className="m-0 min-w-0 truncate text-xs font-bold" style={{ color: inicio === null ? '#5b6b7c' : choque ? '#c4320a' : '#1b7a50' }}>
        {textoHueco}
      </p>
    </div>
  );
}

// ---------- CUÁNTO DURA ----------
const REGLA_MAX = 240;
export function PanelDuraHoja({ cambiar, fin }: PropsPanelHoja) {
  const duracion = fin.duracion || 30;
  const relleno = Math.min(100, (duracion / REGLA_MAX) * 100);
  const elegir = (m: number) => cambiar({ duracion: Math.max(5, Math.min(720, m)) });
  const pulsarRegla = (e: React.MouseEvent<HTMLDivElement>) => {
    const caja = e.currentTarget.getBoundingClientRect();
    if (!caja.width) return;
    elegir(Math.max(5, Math.min(REGLA_MAX, Math.round((((e.clientX - caja.left) / caja.width) * REGLA_MAX) / 5) * 5)));
  };
  const marcas = [];
  for (let m = 0; m <= REGLA_MAX; m += 15) marcas.push(m);
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-end gap-1.5">
        {[15, 30, 45, 60, 90, 120, 180].map((m) => {
          const elegido = duracion === m;
          return (
            <button key={m} type="button" aria-pressed={elegido} onClick={() => elegir(m)} className={'hoja-bloque' + (elegido ? ' elegido' : '')}>
              <span className="hoja-bloque-barra" style={{ height: Math.round(8 + (m / 120) * 28) }} />
              {m < 60 ? `${m}'` : textoDuracion(m).replace(' min', '')}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-1">
        <div
          role="slider"
          tabIndex={0}
          aria-label="Duración"
          aria-valuemin={5}
          aria-valuemax={720}
          aria-valuenow={duracion}
          aria-valuetext={textoDuracion(duracion)}
          onClick={pulsarRegla}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); elegir(duracion + 5); }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); elegir(duracion - 5); }
          }}
          className="frase-regla"
          style={{ borderColor: '#dde5ee' }}
        >
          {marcas.map((m) => (
            <span
              key={m}
              className="pointer-events-none absolute bottom-0 w-px"
              style={{ left: `${(m / REGLA_MAX) * 100}%`, height: m % 60 === 0 ? 12 : 6, background: m % 60 === 0 ? 'var(--tachit-tinta)' : '#b9cbdc' }}
            />
          ))}
          <span className="frase-regla-relleno" style={{ width: `${relleno}%` }} />
          <span className="frase-regla-tirador" style={{ left: `${relleno}%` }} />
        </div>
        <div className="flex justify-between text-[11px] font-bold text-[#5b6b7c]">
          <span>0</span>
          <span>1 h</span>
          <span>2 h</span>
          <span>3 h</span>
          <span>4 h</span>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={() => elegir(duracion - 5)} aria-label="Cinco minutos menos" className="hoja-mas-menos-grande">
          −
        </button>
        <span className="grow text-center text-[13px] text-[#5b6b7c]">
          {fin.inicio !== null ? `de ${textoHora(fin.inicio)} a ${textoHora(fin.inicio + duracion)}` : 'ajuste de 5 en 5 min'}
        </span>
        <button type="button" onClick={() => elegir(duracion + 5)} aria-label="Cinco minutos más" className="hoja-mas-menos-grande">
          +
        </button>
      </div>
    </div>
  );
}

// ---------- AVISO ----------
export function PanelAvisoHoja({ op, cambiar, fin }: PropsPanelHoja) {
  const { indice } = avisoActual(op, fin);
  return (
    <div className="flex h-[66px] items-end justify-between">
      {PASOS_AVISO.map((p, i) => {
        const elegido = i === indice;
        const lleno = i > 0 && i <= indice;
        return (
          <button
            key={p.valor}
            type="button"
            aria-pressed={elegido}
            aria-label={p.valor === 'sin' ? 'Sin aviso' : `Aviso ${p.texto}`}
            onClick={() => cambiar({ aviso: p.valor })}
            className="frase-aviso"
            style={{ width: 60, gap: 6 }}
          >
            <span
              className="w-[34px] rounded-md"
              style={{
                height: i === 0 ? 7 : 10 + i * 7,
                background: lleno ? '#6d4fc9' : elegido ? '#94a3b8' : '#e3e8ef',
                boxShadow: elegido ? `0 0 0 2px #ffffff, 0 0 0 4px ${i === 0 ? '#94a3b8' : '#6d4fc9'}` : undefined,
              }}
            />
            <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: elegido ? (i === 0 ? '#33475b' : '#5a3fb8') : '#5b6b7c' }}>
              {p.texto}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- SE REPITE ----------
export function PanelRepiteHoja({ op, cambiar }: PropsPanelHoja) {
  const alternar = (d: number) => cambiar({ dias: op.dias.includes(d) ? op.dias.filter((x) => x !== d) : [...op.dias, d], mensual: false });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between">
        {ORDEN_SEMANA.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={op.dias.includes(d)}
            aria-label={`Repetir los ${nombreDia(d)}`}
            onClick={() => alternar(d)}
            className={'frase-semana' + (op.dias.includes(d) ? ' elegido' : '')}
            style={{ width: 40, height: 40, fontSize: 14 }}
          >
            {LETRA_DIA[d]}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => cambiar({ dias: [1, 2, 3, 4, 5], mensual: false })} className="hoja-repite">
          Laborables
        </button>
        <button type="button" onClick={() => cambiar({ dias: [1, 2, 3, 4, 5, 6, 0], mensual: false })} className="hoja-repite">
          Todos
        </button>
        <button type="button" aria-pressed={op.mensual} onClick={() => cambiar({ mensual: !op.mensual, dias: [] })} className={'hoja-repite' + (op.mensual ? ' elegido' : '')}>
          Cada mes
        </button>
      </div>
    </div>
  );
}

// ---------- ICONO ----------
export function PanelIconoHoja({ op, cambiar }: PropsPanelHoja) {
  const opciones = [{ clave: '', ...SIN_ICONO }, ...CLAVES_ICONO.map((clave) => ({ clave, ...ICONOS_TAREA[clave] }))];
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-6 gap-2">
        {opciones.map((x) => {
          const elegido = op.icono === x.clave;
          return (
            <button
              key={x.clave || 'ninguno'}
              type="button"
              aria-pressed={elegido}
              aria-label={x.nombre}
              onClick={() => cambiar({ icono: x.clave })}
              className="frase-icono"
              style={{
                width: 42,
                height: 42,
                color: x.color,
                background: elegido ? x.fondo : '#ffffff',
                border: elegido ? `2px solid ${x.color}` : '1px solid #dde3ea',
                boxShadow: elegido ? `0 0 0 3px ${x.fondo}` : undefined,
              }}
            >
              <DibujoIcono trazo={x.trazo} tam={20} grosor={2} />
            </button>
          );
        })}
      </div>
      <span className="text-xs text-[#5b6b7c]">Se verá en el calendario, en tu agenda y en la lista de tareas.</span>
    </div>
  );
}

// ---------- CATEGORÍA ----------
// Tocar una categoría la añade a la frase como "#Casa" (o la quita si ya estaba)
export function PanelCategoriaHoja({ fin, categorias, borrador, setBorrador }: PropsPanelHoja & { categorias: CategoriaDeLista[]; borrador: string; setBorrador: (t: string) => void }) {
  const alternar = (nombre: string) => {
    const etiqueta = nombre.replace(/\s+/g, '_');
    const escapada = etiqueta.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patron = new RegExp(`\\s*#${escapada}(?![\\wÀ-ÿ])`, 'i');
    setBorrador(patron.test(borrador) ? borrador.replace(patron, '').trim() : `${borrador.trim()} #${etiqueta}`.trim());
  };
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        {categorias.map((c) => {
          const elegida = fin.categorias.some((n) => normalizar(n) === normalizar(c.nombre));
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={elegida}
              onClick={() => alternar(c.nombre)}
              className="hoja-categoria"
              style={elegida ? { background: c.color, color: '#ffffff', borderColor: c.color } : undefined}
            >
              <span className="h-2 w-2 rotate-45 rounded-[3px]" style={{ background: elegida ? '#ffffff' : c.color }} />#{c.nombre}
            </button>
          );
        })}
      </div>
      <span className="text-xs text-[#5b6b7c]">O escríbela en la frase con #, por ejemplo #Casa.</span>
    </div>
  );
}
