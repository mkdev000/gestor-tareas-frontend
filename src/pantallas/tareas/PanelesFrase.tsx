// pantallas/tareas/PanelesFrase.tsx
// Los paneles que se abren al tocar una opción de la caja de crear (Fase 5, paso 5.3), como en el prototipo:
//   CUÁNDO (7 días + otra fecha) · A QUÉ HORA (arco de mañana a noche + hora exacta)
//   CUÁNTO DURA (bloques + regla) · AVISO (barras que crecen) · SE REPITE (días) · ICONO
//   · CATEGORÍA (rediseño de Tareas web: elegir una de tus categorías o ninguna)
// Solo se abre uno a la vez. Cada panel recibe lo elegido (op) y una función para cambiarlo.
import type { ReactNode } from 'react';
import { sumarDias, deTextoISO } from '../../utils/dias';
import {
  ORDEN_SEMANA, LETRA_DIA, PASOS_AVISO, avisoActual, nombreDia, diaCorto, textoDuracion, textoHora, normalizar,
  type FraseLeida, type OpcionesFrase,
} from './frase';
import { ICONOS_TAREA, CLAVES_ICONO, SIN_ICONO } from './iconosTarea';
import { DibujoIcono } from './PastillaIcono';

export type Seccion = 'cuando' | 'hora' | 'dura' | 'aviso' | 'repite' | 'icono' | 'categoria';

export interface PropsPanel {
  op: OpcionesFrase;
  cambiar: (cambio: Partial<OpcionesFrase>) => void;
  crudo: FraseLeida; // lo que dice la frase sola
  fin: FraseLeida; // la frase + lo elegido
  hayBorrador: boolean;
  hoy: string;
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

// ---------- CUÁNDO ----------
export function PanelCuando({ op, cambiar, fin, hayBorrador, hoy, alCerrar }: PropsPanel & { alCerrar: () => void }) {
  return (
    <MarcoPanel titulo="CUÁNDO" color="var(--tachit-acento-fuerte)" raya="var(--tachit-linea)" alCerrar={alCerrar}>
      <div className="flex flex-wrap items-center gap-[18px]">
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
                className={'frase-dia' + (elegido ? ' elegido' : deLaFrase ? ' de-la-frase' : '')}
              >
                <span className="frase-dia-nombre">{i === 0 ? 'hoy' : diaCorto(numero.getDay())}</span>
                <span className="text-[15px] leading-none font-extrabold">{numero.getDate()}</span>
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 text-[13px] text-[#33475b]">
          Otra fecha
          <input type="date" value={op.fecha} onChange={(e) => cambiar({ fecha: e.target.value })} className="frase-campo" />
        </label>
      </div>
    </MarcoPanel>
  );
}

// ---------- A QUÉ HORA ----------
// Los 4 momentos del día colocados sobre un arco (como el sol): 9, 13, 17 y 21 h
const MOMENTOS = [
  { hora: '09:00', numero: '9', nombre: 'Mañana', x: 30, y: 48 },
  { hora: '13:00', numero: '13', nombre: 'Mediodía', x: 82, y: 17 },
  { hora: '17:00', numero: '17', nombre: 'Tarde', x: 158, y: 17 },
  { hora: '21:00', numero: '21', nombre: 'Noche', x: 210, y: 48 },
];

export function PanelHora({ op, cambiar, alCerrar, horaFin }: PropsPanel & { alCerrar: () => void; horaFin: string }) {
  return (
    <MarcoPanel titulo="A QUÉ HORA" color="#9a5b00" raya="#f3dfb4" alCerrar={alCerrar}>
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative h-[70px] w-[240px]">
          <svg width="240" height="70" viewBox="0 0 240 70" aria-hidden="true" className="absolute top-0 left-0">
            <path d="M24 66 A96 54 0 0 1 216 66" fill="none" stroke="#e0b768" strokeWidth="2" strokeDasharray="3 5" />
            <path d="M8 66 H232" stroke="#ecd6a8" strokeWidth="1" />
          </svg>
          {MOMENTOS.map((m) => {
            const elegido = op.hora === m.hora;
            const deLaFrase = !op.hora && horaFin === m.hora;
            const noche = m.hora === '21:00';
            return (
              <button
                key={m.hora}
                type="button"
                aria-pressed={elegido}
                aria-label={`${m.nombre}, ${m.hora}`}
                title={`${m.nombre}, ${m.hora}`}
                onClick={() => cambiar({ hora: elegido ? '' : m.hora })}
                className={'frase-momento' + (elegido ? (noche ? ' elegido noche' : ' elegido') : deLaFrase ? ' de-la-frase' : '')}
                style={{ left: m.x - 16, top: m.y - 16 }}
              >
                {m.numero}
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 text-[13px] text-[#33475b]">
          Hora exacta
          <input type="time" value={op.hora} onChange={(e) => cambiar({ hora: e.target.value })} className="frase-campo" />
        </label>
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
      <div className="flex flex-wrap items-end gap-[22px]">
        {/* Bloques: cuanto más dura, más alto */}
        <div className="flex w-full max-w-[330px] items-end gap-1.5">
          {PRESETS.map((m) => {
            const elegido = duracion === m;
            return (
              <button key={m} type="button" aria-pressed={elegido} onClick={() => elegir(m)} className={'frase-bloque' + (elegido ? ' elegido' : '')}>
                <span className="frase-bloque-barra" style={{ height: Math.round(6 + (m / 180) * 30) }} />
                {m < 60 ? `${m}'` : textoDuracion(m).replace(' min', '')}
              </button>
            );
          })}
        </div>
        {/* La regla de 0 a 4 h */}
        <div className="flex w-full max-w-[300px] flex-col gap-1">
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
        </div>
        <div className="flex items-center gap-2 pb-[18px]">
          <button type="button" onClick={() => elegir(duracion - 5)} aria-label="Cinco minutos menos" className="frase-mas-menos">
            −
          </button>
          <span className="min-w-[110px] text-center text-xs text-[#5b6b7c]">
            {fin.inicio !== null ? `de ${textoHora(fin.inicio)} a ${textoHora(fin.inicio + duracion)}` : 'Sin hora de inicio'}
          </span>
          <button type="button" onClick={() => elegir(duracion + 5)} aria-label="Cinco minutos más" className="frase-mas-menos">
            +
          </button>
        </div>
      </div>
    </MarcoPanel>
  );
}

// ---------- AVISO ----------
export function PanelAviso({ op, cambiar, fin, alCerrar }: PropsPanel & { alCerrar: () => void }) {
  const { indice } = avisoActual(op, fin);
  return (
    <MarcoPanel titulo="AVISO" color="#5a3fb8" raya="#ddd3f7" alCerrar={alCerrar}>
      <div className="flex h-[66px] items-end gap-2.5">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={indice > 0 ? '#6d4fc9' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mr-1.5 mb-5">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
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
              className="frase-aviso"
            >
              <span
                className="w-[26px] rounded-[5px]"
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
    </MarcoPanel>
  );
}

// ---------- SE REPITE ----------
export function PanelRepite({ op, cambiar, alCerrar }: PropsPanel & { alCerrar: () => void }) {
  const alternarDia = (d: number) => {
    const dias = op.dias.includes(d) ? op.dias.filter((x) => x !== d) : [...op.dias, d];
    cambiar({ dias, mensual: false });
  };
  return (
    <MarcoPanel titulo="SE REPITE" color="#0e6f78" raya="#c9e6e8" alCerrar={alCerrar}>
      <div className="flex flex-wrap items-center gap-[18px]">
        <div className="flex gap-1.5">
          {ORDEN_SEMANA.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={op.dias.includes(d)}
              aria-label={`Repetir los ${nombreDia(d)}`}
              onClick={() => alternarDia(d)}
              className={'frase-semana' + (op.dias.includes(d) ? ' elegido' : '')}
            >
              {LETRA_DIA[d]}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => cambiar({ dias: [1, 2, 3, 4, 5], mensual: false })} className="frase-repite">
            Laborables
          </button>
          <button type="button" onClick={() => cambiar({ dias: [1, 2, 3, 4, 5, 6, 0], mensual: false })} className="frase-repite">
            Todos
          </button>
          <button type="button" aria-pressed={op.mensual} onClick={() => cambiar({ mensual: !op.mensual, dias: [] })} className={'frase-repite' + (op.mensual ? ' elegido' : '')}>
            Cada mes
          </button>
        </div>
      </div>
    </MarcoPanel>
  );
}

// ---------- ICONO ----------
export function PanelIcono({ op, cambiar, alCerrar }: PropsPanel & { alCerrar: () => void }) {
  const opciones = [{ clave: '', ...SIN_ICONO }, ...CLAVES_ICONO.map((clave) => ({ clave, ...ICONOS_TAREA[clave] }))];
  return (
    <MarcoPanel titulo="ICONO" color="#3d4f66" raya="#dde3ea" alCerrar={alCerrar}>
      <div className="flex flex-wrap gap-2">
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
      <div className="flex flex-wrap gap-2">
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
