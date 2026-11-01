// utils/racha.ts
// La racha: cuántos días seguidos has tachado al menos una tarea (Fase 5, paso 5.2).
// La usan la barra lateral y el menú del móvil (useResumenBarra) y el "Pulso del día" de Tareas,
// así se calcula igual en todas partes.
// De momento se cuenta con la FECHA de las tareas completadas; en la Fase 9 (Mi ritmo)
// se contará con el historial (tarea_eventos), que sabe el día exacto en que las tachaste.
import { hoyISO, sumarDias } from './dias';

interface TareaConFecha {
  estado: string;
  fecha_limite: string | null;
}

export interface Racha {
  dias: number; // días seguidos (hasta hoy, o hasta ayer si hoy aún no has tachado nada)
  ultimos7: boolean[]; // de hace 6 días a hoy: ¿tachaste algo ese día?
}

export function calcularRacha(tareas: TareaConFecha[]): Racha {
  const hoy = hoyISO();
  const diasConHechas = new Set(
    tareas.filter((t) => t.estado === 'completada' && t.fecha_limite).map((t) => (t.fecha_limite as string).slice(0, 10)),
  );
  const ultimos7 = [6, 5, 4, 3, 2, 1, 0].map((n) => diasConHechas.has(sumarDias(hoy, -n)));
  // Si hoy aún no has tachado nada, la racha no se rompe: se cuenta desde ayer
  let cursor = diasConHechas.has(hoy) ? hoy : sumarDias(hoy, -1);
  let dias = 0;
  while (diasConHechas.has(cursor)) {
    dias++;
    cursor = sumarDias(cursor, -1);
  }
  return { dias, ultimos7 };
}
