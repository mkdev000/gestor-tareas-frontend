// pantallas/tareas/TarjetaMovil.tsx
// La tarjeta de tarea del MÓVIL (Fase 5, paso 5.6), igual que en el prototipo móvil:
//  - desliza a la derecha → completar (debajo aparece el fondo verde con "Hecha")
//  - desliza a la izquierda → borrar (debajo aparece el fondo rojo con "Borrar")
//  - tócala → editar
// Si sueltas antes de 90 px, la tarjeta vuelve a su sitio y no pasa nada.
//
// Cómo se sabe que el dedo se mueve: con los "pointer events" (valen para dedo, ratón y lápiz).
//  1. onPointerDown: apuntamos dónde empezó el dedo (x0)
//  2. onPointerMove: la tarjeta se mueve lo que se haya movido el dedo (dx = x - x0), con un tope de 150 px
//  3. onPointerUp: si dx pasa de 90 → completar; si baja de -90 → borrar
// touch-action: pan-y deja que el navegador siga haciendo el scroll vertical de la lista;
// solo el movimiento horizontal es para la tarjeta.
import { useRef, useState } from 'react';
import type { Tarea } from '../useTareas';
import { minutosDe } from './pulso';
import { textoDia, textoAviso, textoRepeticion, textoHora } from './frase';
import { PastillaIcono } from './PastillaIcono';
import { AnilloPrioridad } from './AnilloPrioridad';
import { estiloPrioridad } from './prioridades';

const UMBRAL = 90; // px que hay que deslizar para que cuente
const TOPE = 150; // px como mucho que se mueve la tarjeta
const MOVIMIENTO_MINIMO = 12; // menos que esto es un toque, no un deslizamiento

interface Props {
  tarea: Tarea;
  hoy: string;
  ahora: number;
  resaltada: boolean;
  alCompletar: () => void;
  alBorrar: () => void;
  alEditar: () => void;
}

function TarjetaMovil({ tarea, hoy, ahora, resaltada, alCompletar, alBorrar, alEditar }: Props) {
  const [dx, setDx] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const inicio = useRef<number | null>(null);
  const ultimoDeslizamiento = useRef(0); // para que soltar después de deslizar no cuente como "tocar"

  const hecha = tarea.estado === 'completada';
  const prioridad = estiloPrioridad(tarea.prioridad);
  const fecha = tarea.fecha_limite ? tarea.fecha_limite.slice(0, 10) : null;
  const inicioMin = minutosDe(tarea.hora_limite);
  const atrasada = !hecha && fecha === hoy && inicioMin !== null && inicioMin + (tarea.duracion_min ?? 30) <= ahora;
  const subtareas = tarea.subtareas ?? [];
  const subHechas = subtareas.filter((s) => s.hecha).length;
  const cuando = (fecha ? textoDia(fecha, hoy) : 'Sin fecha') + (inicioMin !== null ? ` · ${textoHora(inicioMin)}` : '') + (atrasada ? ' · atrasada' : '');

  const terminar = (contar: boolean) => {
    const distancia = dx;
    inicio.current = null;
    setArrastrando(false);
    setDx(0);
    if (Math.abs(distancia) > MOVIMIENTO_MINIMO) ultimoDeslizamiento.current = Date.now();
    if (contar && distancia > UMBRAL) alCompletar();
    else if (contar && distancia < -UMBRAL) alBorrar();
  };

  return (
    <div id={`m-tarea-${tarea.id}`} className="relative overflow-hidden rounded-2xl">
      {/* Lo que se ve DEBAJO al deslizar: verde a la izquierda (completar), rojo a la derecha (borrar) */}
      <div aria-hidden="true" className="movil-fondo movil-fondo-hecha" style={{ background: hecha ? '#94a3b8' : '#17804f', opacity: dx > 0 ? 1 : 0 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5L20 7" />
        </svg>
        {hecha ? 'Pendiente' : 'Hecha'}
      </div>
      <div aria-hidden="true" className="movil-fondo movil-fondo-borrar" style={{ opacity: dx < 0 ? 1 : 0 }}>
        Borrar
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
        </svg>
      </div>

      {/* La tarjeta que se mueve */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`${tarea.titulo}. ${cuando}. Toca para editar`}
        onPointerDown={(e) => {
          inicio.current = e.clientX;
          setArrastrando(true);
          try {
            e.currentTarget.setPointerCapture(e.pointerId); // seguimos el dedo aunque salga de la tarjeta
          } catch {
            // algunos navegadores antiguos no lo permiten: no pasa nada
          }
        }}
        onPointerMove={(e) => {
          if (inicio.current === null) return;
          setDx(Math.max(-TOPE, Math.min(TOPE, e.clientX - inicio.current)));
        }}
        onPointerUp={() => {
          if (inicio.current !== null) terminar(true);
        }}
        onPointerCancel={() => terminar(false)}
        onClick={() => {
          if (Date.now() - ultimoDeslizamiento.current < 450) return;
          alEditar();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            alEditar();
          }
        }}
        className={'tarjeta-movil' + (resaltada ? ' resaltada' : '') + (arrastrando ? ' arrastrando' : '')}
        style={{ transform: `translateX(${dx}px)` }}
      >
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="w-1 shrink-0 self-stretch rounded" style={{ background: hecha ? '#9fd8bd' : prioridad.color }} />
          <div className="flex min-w-0 grow flex-col gap-[7px]">
            <span className="flex min-w-0 items-center gap-2">
              <PastillaIcono clave={tarea.icono} />
              <span className={'text-[15px] font-bold ' + (hecha ? 'text-[#66788a] line-through' : 'text-[#0f1f2e]')}>{tarea.titulo}</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              <span className={'movil-pastilla ' + (atrasada ? 'bg-[#fde8e4] text-[#b42318]' : 'bg-[#eef1f5] text-[#33475b]')}>{cuando}</span>
              {tarea.aviso_min !== null && tarea.aviso_min !== undefined && (
                <span className="movil-pastilla bg-[#efeafc] text-[#5a3fb8]">Aviso {textoAviso(tarea.aviso_min).toLowerCase()}</span>
              )}
              {tarea.repeticion && (
                <span className="movil-pastilla bg-[#e2f4f5] text-[#0e6f78]">↻ {textoRepeticion(tarea.repeticion, tarea.dias_semana ?? null, true)}</span>
              )}
              {(tarea.categorias ?? []).map((c) => (
                <span key={c.id} className="movil-pastilla" style={{ background: `${c.color}14`, color: c.color }}>
                  #{c.nombre}
                </span>
              ))}
              {/* La prioridad con su anillo de tres tramos en pequeño (paso 6.2) */}
              <span className="movil-pastilla inline-flex items-center gap-1" style={{ background: prioridad.fondo, color: prioridad.texto }}>
                <AnilloPrioridad prioridad={prioridad.clave} tam={12} apagado="#d5dce5" />
                {prioridad.nombre}
              </span>
            </div>
          </div>
          {subtareas.length > 0 && (
            <span className="shrink-0 rounded-lg bg-[#e7f5ee] px-2 py-1 text-xs font-extrabold text-[#157546]">
              {subHechas}/{subtareas.length}
            </span>
          )}
        </div>
      </div>

      {/* Para lectores de pantalla (no se ven): deslizar con el dedo no siempre es posible */}
      <button type="button" onClick={alCompletar} className="sr-only">
        {hecha ? `Marcar como pendiente: ${tarea.titulo}` : `Completar: ${tarea.titulo}`}
      </button>
      <button type="button" onClick={alBorrar} className="sr-only">
        Borrar: {tarea.titulo}
      </button>
    </div>
  );
}

export default TarjetaMovil;
