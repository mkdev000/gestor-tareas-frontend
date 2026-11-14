// pantallas/tareas/PanelesFrase.tsx
// Los paneles que se abren al tocar una opción de la nota de crear (Fase 5, paso 5.3; rehechos antes de la Fase 9),
// como en el prototipo. Casi todos se reparten en DOS MITADES que llenan el panel (sin huecos):
//   CUÁNDO: el día (7 días + «Otra fecha» como una ficha del calendario) | la hora (el mismo reloj con el cielo del móvil)
//   CUÁNTO DURA: de un toque (bloques) | a tu medida (regla, − y +)
//   AVISO: cuándo te avisamos (barras) | así te llegará (una notificación de ejemplo con la hora)
//   SE REPITE: qué días | quedará así
//   ICONO (los 11 con su nombre) · CATEGORÍA (tus categorías o ninguna), a lo ancho
// Solo se abre uno a la vez. Cada panel recibe lo elegido (op) y una función para cambiarlo.
import type { ReactNode } from 'react';
import { sumarDias, deTextoISO } from '../../utils/dias';
import {
  ORDEN_SEMANA, LETRA_DIA, PASOS_AVISO, avisoActual, nombreDia, diaCorto, textoDuracion, textoHora, textoAviso, textoRepeticion, normalizar,
  type FraseLeida, type OpcionesFrase,
} from './frase';
import RelojHora from './RelojHora';
import { ICONOS_TAREA, CLAVES_ICONO, SIN_ICONO } from './iconosTarea';
import { DibujoIcono } from './PastillaIcono';

export type Seccion = 'cuando' | 'dura' | 'aviso' | 'repite' | 'icono' | 'categoria';

export interface PropsPanel {
  op: OpcionesFrase;
  cambiar: (cambio: Partial<OpcionesFrase>) => void;
  crudo: FraseLeida; // lo que dice la frase sola
  fin: FraseLeida; // la frase + lo elegido
  hayBorrador: boolean;
  hoy: string;
}

// Una mitad del panel, con su título pequeño (DÍA, HORA...)
function Mitad({ titulo, color, children }: { titulo: string; color: string; children: ReactNode }) {
  return (
    <div className="panel-mitad">
      <span className="panel-subtitulo" style={{ color }}>
        {titulo}
      </span>
      {children}
    </div>
  );
}

// El marco común: título en mayúsculas con su color, botón × y una rayita de color arriba
function MarcoPanel({ titulo, color, raya, alCerrar, children }: { titulo: string; color: string; raya: string; alCerrar: () => void; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={titulo}
      className="aparecer flex flex-col gap-3.5 rounded-[14px] border border-[#e9eef4] bg-white px-[18px] pt-3.5 pb-4"
      style={{ boxShadow: `inset 0 3px 0 ${raya}, 0 6px 16px rgba(10,30,47,0.04)` }}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-[11px] font-extrabold tracking-[1.4px]" style={{ color }}>
          {titulo}
        </span>
        <button type="button" onClick={alCerrar} aria-label="Cerrar" className="frase-cerrar">
          ×
        </button>
      </div>
      {children}
    </div>
  );
}

// ---------- CUÁNDO: el día y la hora juntos ----------
const MES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

export function PanelCuando({
  op, cambiar, fin, hayBorrador, hoy, alCerrar, ahora, tareasDelDia,
}: PropsPanel & { alCerrar: () => void; ahora: number; tareasDelDia: (fecha: string) => number }) {
  const ultimoDia = sumarDias(hoy, 6);
  // «Otra fecha»: si eliges un día fuera de los 7 de arriba, la ficha lleva ese día
  const lejana = !!op.fecha && (op.fecha < hoy || op.fecha > ultimoDia);
  const fichaLejana = lejana ? deTextoISO(op.fecha) : null;
  // Debajo: el día que quedará y cuántas tareas tienes ya ese día
  const diaFinal = op.fecha || fin.fecha || hoy;
  const fechaFinal = deTextoISO(diaFinal);
  const cuantas = tareasDelDia(diaFinal);
  // El reloj: sin hora, propone la siguiente hora en punto o y cuarto (hoy) o las 9:00 (otro día)
  const propuesta = diaFinal === hoy ? Math.ceil(ahora / 15) * 15 : 9 * 60;
  const duracion = fin.duracion || 30;
  return (
    <MarcoPanel titulo="CUÁNDO" color="var(--tachit-acento-fuerte)" raya="var(--tachit-linea)" alCerrar={alCerrar}>
      <div className="panel-mitades">
        <Mitad titulo="DÍA" color="var(--tachit-acento-fuerte)">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => {
              const dia = sumarDias(hoy, i);
              const numero = deTextoISO(dia);
              const elegido = op.fecha === dia;
              // Borde de puntos: el día que ha entendido de tu frase (aún sin elegirlo tú)
              const deLaFrase = !op.fecha && hayBorrador && fin.fecha === dia;
              return (
                <button
                  key={dia}
                  type="button"
                  aria-pressed={elegido}
                  aria-label={`${i === 0 ? 'Hoy, ' : ''}${nombreDia(numero.getDay())} ${numero.getDate()}`}
                  onClick={() => cambiar({ fecha: elegido ? '' : dia })}
                  className={'frase-dia ancho' + (elegido ? ' elegido' : deLaFrase ? ' de-la-frase' : '')}
                >
                  <span className="frase-dia-nombre">{i === 0 ? 'hoy' : diaCorto(numero.getDay())}</span>
                  <span className="text-[15px] leading-none font-extrabold">{numero.getDate()}</span>
                </button>
              );
            })}
          </div>
          {/* Una ficha del calendario en blanco: toda ella abre el calendario del navegador */}
          <label className={'otra-fecha' + (lejana ? ' elegida' : '')} title="Elegir otro día en el calendario">
            <span aria-hidden="true" className="otra-fecha-ficha">
              <small>{fichaLejana ? diaCorto(fichaLejana.getDay()).toUpperCase() : '···'}</small>
              <b>{fichaLejana ? fichaLejana.getDate() : '+'}</b>
            </span>
            <span className="otra-fecha-texto">
              <small>Otra fecha</small>
              <b>{fichaLejana ? `${mayuscula(nombreDia(fichaLejana.getDay()))} ${fichaLejana.getDate()} de ${MES_LARGO[fichaLejana.getMonth()]}` : 'Elige un día del calendario'}</b>
            </span>
            <DibujoIcono trazo="M9 6l6 6-6 6" tam={16} grosor={2.4} />
            <input
              type="date"
              value={op.fecha}
              onChange={(e) => cambiar({ fecha: e.target.value })}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker();
                } catch {
                  // si el navegador no deja abrirlo así, se abre con el iconito (que ocupa toda la ficha)
                }
              }}
              aria-label="Otra fecha: elegir un día en el calendario"
              className="otra-fecha-campo"
            />
          </label>
          <p className="panel-nota">
            {diaFinal === hoy ? 'Hoy' : `${mayuscula(nombreDia(fechaFinal.getDay()))} ${fechaFinal.getDate()}`} ·{' '}
            {cuantas ? `${cuantas} ${cuantas === 1 ? 'tarea ya apuntada' : 'tareas ya apuntadas'}` : 'día libre'}
          </p>
        </Mitad>
        <Mitad titulo="HORA" color="#9a5b00">
          {op.hora && (
            <button type="button" onClick={() => cambiar({ hora: '' })} className="panel-quitar-hora">
              Sin hora
            </button>
          )}
          <div className="reloj-web">
            <RelojHora
              inicio={fin.inicio}
              propuesta={propuesta}
              choca={false}
              alPoner={(minutos) => cambiar({ hora: `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}` })}
            />
          </div>
          <p aria-live="polite" className={'panel-nota' + (fin.inicio !== null ? ' verde' : '')}>
            {fin.inicio !== null ? `${textoHora(fin.inicio)}–${textoHora(fin.inicio + duracion)}` : 'Sin hora · toca una flecha para ponerla'}
          </p>
        </Mitad>
      </div>
    </MarcoPanel>
  );
}

// ---------- CUÁNTO DURA ----------
const REGLA_MAX = 240; // la regla va de 0 a 4 horas
const PRESETS = [15, 30, 45, 60, 90, 120, 180];

export function PanelDura({ cambiar, fin, alCerrar }: PropsPanel & { alCerrar: () => void }) {
  const duracion = fin.duracion || 30;
  const relleno = Math.min(100, (duracion / REGLA_MAX) * 100);
  const elegir = (minutos: number) => cambiar({ duracion: Math.max(5, Math.min(720, minutos)) });

  // Pulsar en la regla: la posición del ratón se convierte en minutos (de 5 en 5)
  const pulsarRegla = (e: React.MouseEvent<HTMLDivElement>) => {
    const caja = e.currentTarget.getBoundingClientRect();
    if (!caja.width) return;
    const minutos = Math.round((((e.clientX - caja.left) / caja.width) * REGLA_MAX) / 5) * 5;
    elegir(Math.max(5, Math.min(REGLA_MAX, minutos)));
  };
  // Con el teclado: flechas de 5 en 5 minutos
  const teclaRegla = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); elegir(duracion + 5); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); elegir(duracion - 5); }
  };

  const marcas = [];
  for (let m = 0; m <= REGLA_MAX; m += 15) marcas.push(m);

  return (
    <MarcoPanel titulo="CUÁNTO DURA" color="#b83a70" raya="#f6d3e0" alCerrar={alCerrar}>
      <div className="panel-mitades">
        <Mitad titulo="DE UN TOQUE" color="#b83a70">
          {/* Bloques: cuanto más dura, más alto */}
          <div className="mt-auto flex w-full items-end gap-1.5">
            {PRESETS.map((m) => {
              const elegido = duracion === m;
              return (
                <button key={m} type="button" aria-pressed={elegido} onClick={() => elegir(m)} className={'frase-bloque' + (elegido ? ' elegido' : '')}>
                  <span className="frase-bloque-barra" style={{ height: Math.round(12 + (m / 180) * 46) }} />
                  {m < 60 ? `${m}'` : textoDuracion(m).replace(' min', '')}
                </button>
              );
            })}
          </div>
        </Mitad>
        <Mitad titulo="A TU MEDIDA" color="#b83a70">
          {/* La regla de 0 a 4 h */}
          <div
            role="slider"
            tabIndex={0}
            aria-label="Duración"
            aria-valuemin={5}
            aria-valuemax={720}
            aria-valuenow={duracion}
            aria-valuetext={textoDuracion(duracion)}
            title="Toca la regla para elegir la duración"
            onClick={pulsarRegla}
            onKeyDown={teclaRegla}
            className="frase-regla"
          >
            {marcas.map((m) => (
              <span
                key={m}
                className="pointer-events-none absolute bottom-0 w-px"
                style={{ left: `${(m / REGLA_MAX) * 100}%`, height: m % 60 === 0 ? 12 : 6, background: m % 60 === 0 ? 'var(--tachit-tinta)' : '#9fb3c6' }}
              />
            ))}
            <span className="frase-regla-relleno" style={{ width: `${relleno}%` }} />
            <span className="frase-regla-tirador" style={{ left: `${relleno}%` }} />
          </div>
          <div className="relative h-4">
            {[0, 60, 120, 180, 240].map((m) => (
              <span
                key={m}
                className="absolute top-0 text-[11px] font-bold whitespace-nowrap text-[#5b6b7c]"
                style={{ left: `${(m / REGLA_MAX) * 100}%`, transform: `translateX(${m === 0 ? '0' : m === REGLA_MAX ? '-100%' : '-50%'})` }}
              >
                {m === 0 ? '0' : `${m / 60} h`}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => elegir(duracion - 5)} aria-label="Cinco minutos menos" className="frase-mas-menos">
              −
            </button>
            <span className="grow text-center text-xs text-[#5b6b7c]">
              {fin.inicio !== null ? `de ${textoHora(fin.inicio)} a ${textoHora(fin.inicio + duracion)}` : 'Sin hora de inicio'}
            </span>
            <button type="button" onClick={() => elegir(duracion + 5)} aria-label="Cinco minutos más" className="frase-mas-menos">
              +
            </button>
          </div>
        </Mitad>
      </div>
    </MarcoPanel>
  );
}

// ---------- AVISO ----------
const CAMPANA = 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0';

export function PanelAviso({ op, cambiar, fin, alCerrar }: PropsPanel & { alCerrar: () => void }) {
  const { indice, valor } = avisoActual(op, fin);
  // «Así te llegará»: a qué hora sonaría el aviso (si la tarea tiene hora)
  const antes = indice > 0 ? Number(valor) : null;
  const sonaria = antes !== null && fin.inicio !== null ? fin.inicio - antes : null;
  const cuando =
    antes === null
      ? 'sin aviso'
      : sonaria === null
        ? textoAviso(antes).toLowerCase()
        : sonaria < 0
          ? `el día antes, a las ${textoHora(sonaria + 1440)}`
          : `a las ${textoHora(sonaria)}`;
  const texto =
    antes === null
      ? 'Esta tarea no te avisará.'
      : fin.inicio === null
        ? 'Ponle una hora en «Cuándo» para saber a qué hora te avisa.'
        : antes === 0
          ? 'Empieza ahora.'
          : `Empieza a las ${textoHora(fin.inicio)}.`;
  return (
    <MarcoPanel titulo="AVISO" color="#5a3fb8" raya="#ddd3f7" alCerrar={alCerrar}>
      <div className="panel-mitades">
        <Mitad titulo="CUÁNDO TE AVISAMOS" color="#5a3fb8">
          <div className="mt-auto flex h-[74px] items-end gap-2">
            {PASOS_AVISO.map((p, i) => {
              const elegido = i === indice;
              const lleno = i > 0 && i <= indice;
              return (
                <button
                  key={p.valor}
                  type="button"
                  aria-pressed={elegido}
                  aria-label={p.valor === 'sin' ? 'Sin aviso' : `Aviso ${p.texto}${p.valor === '0' ? '' : ' antes'}`}
                  onClick={() => cambiar({ aviso: p.valor })}
                  className="frase-aviso ancho"
                >
                  <span
                    className="w-full max-w-[46px] rounded-[5px]"
                    style={{
                      height: i === 0 ? 6 : 8 + i * 7,
                      background: lleno ? '#6d4fc9' : elegido ? '#94a3b8' : '#e3e8ef',
                      boxShadow: elegido ? `0 0 0 2px #ffffff, 0 0 0 4px ${i === 0 ? '#94a3b8' : '#6d4fc9'}` : undefined,
                    }}
                  />
                  <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: elegido ? (i === 0 ? '#33475b' : '#5a3fb8') : '#5b6b7c' }}>
                    {p.texto}
                  </span>
                </button>
              );
            })}
          </div>
        </Mitad>
        <Mitad titulo="ASÍ TE LLEGARÁ" color="#5a3fb8">
          <div className={'panel-ejemplo' + (antes === null ? ' apagado' : '')}>
            <span aria-hidden="true" className="panel-ejemplo-icono aviso">
              <DibujoIcono trazo={CAMPANA} tam={20} />
            </span>
            <span className="panel-ejemplo-texto">
              <small>Tachit · {cuando}</small>
              <b>{fin.titulo || 'Tu tarea'}</b>
              <span>{texto}</span>
            </span>
          </div>
        </Mitad>
      </div>
    </MarcoPanel>
  );
}

// ---------- SE REPITE ----------
export function PanelRepite({ op, cambiar, fin, alCerrar }: PropsPanel & { alCerrar: () => void }) {
  const alternarDia = (d: number) => {
    const dias = op.dias.includes(d) ? op.dias.filter((x) => x !== d) : [...op.dias, d];
    cambiar({ dias, mensual: false });
  };
  return (
    <MarcoPanel titulo="SE REPITE" color="#0e6f78" raya="#c9e6e8" alCerrar={alCerrar}>
      <div className="panel-mitades">
        <Mitad titulo="QUÉ DÍAS" color="#0e6f78">
          <div className="flex gap-1.5">
            {ORDEN_SEMANA.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={op.dias.includes(d)}
                aria-label={`Repetir los ${nombreDia(d)}`}
                onClick={() => alternarDia(d)}
                className={'frase-semana ancho' + (op.dias.includes(d) ? ' elegido' : '')}
              >
                {LETRA_DIA[d]}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => cambiar({ dias: [1, 2, 3, 4, 5], mensual: false })} className="frase-repite grow">
              Laborables
            </button>
            <button type="button" onClick={() => cambiar({ dias: [1, 2, 3, 4, 5, 6, 0], mensual: false })} className="frase-repite grow">
              Todos
            </button>
            <button
              type="button"
              aria-pressed={op.mensual}
              onClick={() => cambiar({ mensual: !op.mensual, dias: [] })}
              className={'frase-repite grow' + (op.mensual ? ' elegido' : '')}
            >
              Cada mes
            </button>
          </div>
        </Mitad>
        <Mitad titulo="QUEDARÁ ASÍ" color="#0e6f78">
          <div className={'panel-ejemplo' + (fin.repeticion ? '' : ' apagado')}>
            <span aria-hidden="true" className="panel-ejemplo-icono repite">
              ↻
            </span>
            <span className="panel-ejemplo-texto">
              <b>{fin.repeticion ? mayuscula(textoRepeticion(fin.repeticion, fin.dias)) : 'Una sola vez'}</b>
              <span>{fin.repeticion ? 'Cuando la taches, Tachit apunta la siguiente.' : 'Elige días o pulsa «Cada mes» para que se repita.'}</span>
            </span>
          </div>
        </Mitad>
      </div>
    </MarcoPanel>
  );
}

// ---------- ICONO ----------
export function PanelIcono({ op, cambiar, alCerrar }: PropsPanel & { alCerrar: () => void }) {
  const opciones = [{ clave: '', ...SIN_ICONO }, ...CLAVES_ICONO.map((clave) => ({ clave, ...ICONOS_TAREA[clave] }))];
  return (
    <MarcoPanel titulo="ICONO" color="#3d4f66" raya="#dde3ea" alCerrar={alCerrar}>
      <div className="panel-iconos">
        {opciones.map((x) => {
          const elegido = op.icono === x.clave;
          return (
            <button
              key={x.clave || 'ninguno'}
              type="button"
              aria-pressed={elegido}
              aria-label={x.nombre}
              title={x.nombre}
              onClick={() => cambiar({ icono: x.clave })}
              className="frase-icono"
              style={{
                color: x.color,
                background: elegido ? x.fondo : '#ffffff',
                border: elegido ? `2px solid ${x.color}` : '1px solid #dde3ea',
                boxShadow: elegido ? `0 0 0 3px ${x.fondo}` : undefined,
              }}
            >
              <DibujoIcono trazo={x.trazo} tam={18} grosor={2} />
              <span className="panel-icono-nombre">{x.nombre}</span>
            </button>
          );
        })}
      </div>
    </MarcoPanel>
  );
}

// ---------- CATEGORÍA ----------
// Tus categorías como pastillas de su color, y «Ninguna». La elegida gana a la #categoría de la frase.
export function PanelCategoria({ op, cambiar, fin, alCerrar, categorias }: PropsPanel & { alCerrar: () => void; categorias: { id: number; nombre: string; color: string }[] }) {
  const actual = op.categoria === '-' ? '' : op.categoria || fin.categorias[0] || '';
  const opciones = [{ id: 0, nombre: '', color: '#4b5a6c' }, ...categorias];
  return (
    <MarcoPanel titulo="CATEGORÍA" color="#1b7a50" raya="#cfe8da" alCerrar={alCerrar}>
      <div className="panel-categorias">
        {opciones.map((c) => {
          const elegida = c.nombre ? normalizar(actual) === normalizar(c.nombre) : op.categoria === '-';
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={elegida}
              onClick={() => cambiar({ categoria: c.nombre || '-' })}
              className="frase-categoria"
              style={elegida ? { background: c.color, borderColor: c.color, color: '#ffffff' } : { color: c.color }}
            >
              {c.nombre ? `#${c.nombre}` : 'Ninguna'}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-[#66788a]">También puedes escribirla en la frase con #, por ejemplo «#Salud».</p>
    </MarcoPanel>
  );
}
