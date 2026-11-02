// pantallas/tareas/pulso.ts
// Los cálculos del "Pulso del día" (Fase 5, paso 5.2), separados del dibujo:
// solo reciben tus tareas y la hora, y devuelven números y textos. Así son fáciles de entender y de probar.
import { hoyISO } from '../../utils/dias';
import type { Tarea } from '../useTareas';
import { estiloPrioridad } from './prioridades';

// La franja del día va de 8:00 a 22:00 (como en el prototipo), en minutos desde medianoche
export const INICIO_DIA = 8 * 60;
export const FIN_DIA = 22 * 60;
const DURACION_DIA = FIN_DIA - INICIO_DIA;

// Colores de la franja (los mismos del prototipo). Los de cada prioridad salen de prioridades.ts
const COLOR_HECHA = '#17804f';
const COLOR_ATRASADA = '#c4320a';

export interface Segmento {
  id: number;
  titulo: string;
  inicio: string; // "9:30"
  izquierda: number; // % desde la izquierda de la franja
  ancho: number; // % de ancho
  color: string;
  apagado: boolean; // las pendientes que aún no han pasado van un poco más suaves
}

export interface Pulso {
  hechas: number;
  total: number;
  pendientes: number;
  titulo: string;
  saludo: string;
  siguiente: { texto: string; id: number } | null;
  segmentos: Segmento[];
  ahora: number | null; // % donde va la rayita de "ahora" (null si estás fuera de 8–22)
}

// "18:30:00" → 1110 minutos (o null si no hay hora)
export function minutosDe(hora: string | null): number | null {
  if (!hora) return null;
  const [h, m] = hora.split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}

// 1110 → "18:30"
export function textoHora(minutos: number) {
  const m = ((minutos % 1440) + 1440) % 1440;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

const enFranja = (minutos: number) => Math.min(100, Math.max(0, ((minutos - INICIO_DIA) / DURACION_DIA) * 100));

export function calcularPulso(tareas: Tarea[], ahora: Date): Pulso {
  const hoy = hoyISO();
  const minutoAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const deHoy = tareas.filter((t) => t.fecha_limite?.slice(0, 10) === hoy);
  const hecha = (t: Tarea) => t.estado === 'completada';
  const duracion = (t: Tarea) => t.duracion_min ?? 30;

  const total = deHoy.length;
  const hechas = deHoy.filter(hecha).length;
  const pendientes = total - hechas;

  // ¿Qué toca ahora? Y si no hay nada ahora, ¿qué es lo siguiente?
  const conHora = deHoy.filter((t) => minutosDe(t.hora_limite) !== null);
  const pendientesConHora = conHora.filter((t) => !hecha(t));
  const empieza = (t: Tarea) => minutosDe(t.hora_limite) as number;
  const actual = pendientesConHora.find((t) => empieza(t) <= minutoAhora && empieza(t) + duracion(t) > minutoAhora);
  const proxima = pendientesConHora.filter((t) => empieza(t) > minutoAhora).sort((a, b) => empieza(a) - empieza(b))[0];

  let siguiente: Pulso['siguiente'] = null;
  if (actual) siguiente = { texto: `Ahora: ${actual.titulo} (hasta ${textoHora(empieza(actual) + duracion(actual))})`, id: actual.id };
  else if (proxima) siguiente = { texto: `Siguiente: ${proxima.titulo} a las ${textoHora(empieza(proxima))}`, id: proxima.id };

  // Un trocito en la franja por cada tarea de hoy con hora
  const segmentos = conHora.map((t) => {
    const inicio = empieza(t);
    const atrasada = !hecha(t) && inicio + duracion(t) <= minutoAhora;
    const izquierda = enFranja(inicio);
    return {
      id: t.id,
      titulo: t.titulo,
      inicio: textoHora(inicio),
      izquierda,
      // mínimo 1,8 % para que una tarea corta se vea; y que no se salga por la derecha
      ancho: Math.min(100 - izquierda, Math.max(1.8, (duracion(t) / DURACION_DIA) * 100)),
      color: hecha(t) ? COLOR_HECHA : atrasada ? COLOR_ATRASADA : estiloPrioridad(t.prioridad).color,
      apagado: !hecha(t) && !atrasada,
    };
  });

  const titulo = total === 0 ? 'Nada apuntado para hoy' : hechas === total ? '¡Día completado!' : `Llevas ${hechas} de ${total} tareas`;
  const saludo =
    total === 0
      ? 'Hoy no tienes nada apuntado.'
      : pendientes === 0
        ? 'Has terminado todo lo de hoy.'
        : pendientes === 1
          ? 'Te queda 1 tarea para hoy. Vas bien.'
          : `Te quedan ${pendientes} tareas para hoy. Vas bien.`;

  return {
    hechas,
    total,
    pendientes,
    titulo,
    saludo,
    siguiente,
    segmentos,
    ahora: minutoAhora >= INICIO_DIA && minutoAhora <= FIN_DIA ? enFranja(minutoAhora) : null,
  };
}
