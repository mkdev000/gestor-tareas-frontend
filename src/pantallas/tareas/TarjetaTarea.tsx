// pantallas/tareas/TarjetaTarea.tsx
// Una tarea de la lista (Fase 5, pasos 5.4 y 5.5), igual que en el prototipo:
//  - borde izquierdo del color de la prioridad (verde suave si ya está hecha)
//  - círculo para completarla (se rellena de verde con ✓ y el título se tacha)
//  - icono, título y pastillas: cuándo (en rojo si va atrasada), duración, aviso, repetición, categorías y prioridad
//  - botón de subtareas (con barrita de progreso "2/4"), lápiz para editar y papelera para borrar
//  - al abrir las subtareas: marcarlas y añadir nuevas escribiendo + Enter
import { useState } from 'react';
import type { Tarea } from '../useTareas';
import { minutosDe } from './pulso';
import { textoDia, textoDuracion, textoAviso, textoRepeticion, textoHora } from './frase';
import { PastillaIcono, DibujoIcono } from './PastillaIcono';

const PRIORIDAD: Record<string, { color: string; texto: string; fondo: string; nombre: string }> = {
  alta: { color: '#F2711C', texto: '#a84a0a', fondo: '#fdeee3', nombre: 'Alta' },
  urgente: { color: '#F2711C', texto: '#a84a0a', fondo: '#fdeee3', nombre: 'Urgente' },
  media: { color: '#4daeeb', texto: '#17699e', fondo: '#e6f3fd', nombre: 'Media' },
  baja: { color: '#94a3b8', texto: '#4b5a6c', fondo: '#eef1f5', nombre: 'Baja' },
};

const LAPIZ = 'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.6 7.6M11 11a2 2 0 1 0 0 .01';
const PAPELERA = 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14';
const CAMPANA = 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0';

interface Props {
  tarea: Tarea;
  hoy: string;
  ahora: number; // minutos desde las 00:00 (para saber si va atrasada)
  abierta: boolean; // ¿se ven las subtareas?
  resaltada: boolean; // recién creada o a la que has saltado desde el pulso
  editandose: boolean;
  alCompletar: () => void;
  alAbrir: () => void;
  alEditar: () => void;
  alBorrar: () => void;
  alMarcarSubtarea: (id: number, hecha: boolean) => void;
  alAnadirSubtarea: (titulo: string) => Promise<boolean>;
}

function TarjetaTarea({ tarea, hoy, ahora, abierta, resaltada, editandose, alCompletar, alAbrir, alEditar, alBorrar, alMarcarSubtarea, alAnadirSubtarea }: Props) {
  const [nuevaSubtarea, setNuevaSubtarea] = useState('');
  const hecha = tarea.estado === 'completada';
  const prioridad = PRIORIDAD[tarea.prioridad] ?? PRIORIDAD.media;
  const fecha = tarea.fecha_limite ? tarea.fecha_limite.slice(0, 10) : null;
  const inicio = minutosDe(tarea.hora_limite);
  const duracion = tarea.duracion_min ?? 30;
  // Atrasada: es de hoy, no está hecha y su hora de terminar ya ha pasado
  const atrasada = !hecha && fecha === hoy && inicio !== null && inicio + duracion <= ahora;
  const subtareas = tarea.subtareas ?? [];
  const subHechas = subtareas.filter((s) => s.hecha).length;
  const cuando = (fecha ? textoDia(fecha, hoy) : 'Sin fecha') + (inicio !== null ? ` · ${textoHora(inicio)}` : '') + (atrasada ? ' · atrasada' : '');
  const repeticion = tarea.repeticion ? textoRepeticion(tarea.repeticion, tarea.dias_semana ?? null, true) : '';

  const enviarSubtarea = async () => {
    const titulo = nuevaSubtarea.trim();
    if (!titulo) return;
    if (await alAnadirSubtarea(titulo)) setNuevaSubtarea('');
  };

  return (
    <article
      id={`tarea-${tarea.id}`}
      tabIndex={-1}
      aria-label={tarea.titulo}
      className={'tarjeta-tarea' + (resaltada ? ' resaltada' : '') + (editandose ? ' editandose' : '')}
      style={{ borderLeftColor: hecha ? '#9fd8bd' : prioridad.color }}
    >
      {/* Esta tarjeta es solo de la web; en el móvil se usa TarjetaMovil (la que se desliza, paso 5.6) */}
      <div className="flex items-center gap-3.5">
        {/* Completar */}
        <button
          type="button"
          onClick={alCompletar}
          aria-label={hecha ? 'Marcar como pendiente' : 'Marcar como completada'}
          aria-pressed={hecha}
          className="tarjeta-check"
          style={{ borderColor: hecha ? '#17804f' : prioridad.color, background: hecha ? '#17804f' : '#ffffff' }}
        >
          <span className="text-sm leading-none font-extrabold text-white" style={{ opacity: hecha ? 1 : 0 }}>
            ✓
          </span>
        </button>

        <div className="flex min-w-0 grow flex-col gap-[7px]">
          <div className="flex min-w-0 items-center gap-[9px]">
            <PastillaIcono clave={tarea.icono} />
            <span className={'text-base font-bold ' + (hecha ? 'text-[#66788a] line-through' : 'text-[#0f1f2e]')}>{tarea.titulo}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={'tarjeta-pastilla font-bold ' + (atrasada ? 'bg-[#fde8e4] text-[#b42318]' : 'bg-[#eef1f5] text-[#33475b]')}>{cuando}</span>
            <span className="tarjeta-pastilla bg-[#eef1f5] text-[#4b5a6c]">{textoDuracion(duracion)}</span>
            {tarea.aviso_min !== null && tarea.aviso_min !== undefined && (
              <span className="tarjeta-pastilla flex items-center gap-1 bg-[#efeafc] text-[#5a3fb8]">
                <DibujoIcono trazo={CAMPANA} tam={12} grosor={2.4} />
                {textoAviso(tarea.aviso_min)}
              </span>
            )}
            {tarea.repeticion && (
              <span className="tarjeta-pastilla bg-[#e2f4f5] text-[#0e6f78]">↻ {repeticion === 'Cada semana' ? 'Semanal' : repeticion}</span>
            )}
            {(tarea.categorias ?? []).map((c) => (
              <span key={c.id} className="tarjeta-pastilla font-bold" style={{ background: `${c.color}14`, color: c.color }}>
                #{c.nombre}
              </span>
            ))}
            <span className="tarjeta-pastilla font-bold" style={{ background: prioridad.fondo, color: prioridad.texto }}>
              {prioridad.nombre}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          {/* Subtareas */}
          <button type="button" onClick={alAbrir} aria-expanded={abierta} className="tarjeta-subtareas">
            {subtareas.length > 0 && (
              <span aria-hidden="true" className="flex h-1.5 w-11 overflow-hidden rounded-full bg-[#e8edf3]">
                <span className="h-1.5 bg-[#17804f]" style={{ width: `${Math.round((subHechas / subtareas.length) * 100)}%` }} />
              </span>
            )}
            {subtareas.length ? `${subHechas}/${subtareas.length}` : '+ Subtareas'}
            <span className="sr-only"> subtareas</span>
          </button>
          <button type="button" onClick={alEditar} aria-label="Editar tarea" title="Editar tarea" className="tarjeta-editar">
            <DibujoIcono trazo={LAPIZ} tam={17} grosor={2} />
          </button>
          <button type="button" onClick={alBorrar} aria-label="Borrar tarea" title="Borrar tarea" className="tarjeta-borrar">
            <DibujoIcono trazo={PAPELERA} tam={17} grosor={2} />
          </button>
        </div>
      </div>

      {abierta && (
        <div className="mt-3 ml-[42px] flex flex-col gap-2 border-t border-[#edf1f5] pt-3">
          {subtareas.map((s) => (
            <div key={s.id} className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => alMarcarSubtarea(s.id, !s.hecha)}
                aria-label={s.hecha ? `Desmarcar subtarea: ${s.titulo}` : `Completar subtarea: ${s.titulo}`}
                aria-pressed={s.hecha}
                className="subtarea-check"
                style={{ borderColor: s.hecha ? '#17804f' : '#a8b5c3', background: s.hecha ? '#17804f' : '#ffffff' }}
              >
                <span className="text-xs leading-none font-extrabold text-white" style={{ opacity: s.hecha ? 1 : 0 }}>
                  ✓
                </span>
              </button>
              <span className={'text-sm ' + (s.hecha ? 'text-[#66788a] line-through' : 'text-[#0f1f2e]')}>{s.titulo}</span>
            </div>
          ))}
          <input
            value={nuevaSubtarea}
            onChange={(e) => setNuevaSubtarea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                enviarSubtarea();
              }
            }}
            maxLength={150}
            aria-label="Nueva subtarea"
            placeholder="Añadir subtarea y pulsar Enter"
            className="subtarea-nueva"
          />
        </div>
      )}
    </article>
  );
}

export default TarjetaTarea;
