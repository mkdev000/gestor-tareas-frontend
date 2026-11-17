// pantallas/tareas/avisoTachada.ts
// El aviso que sale al tachar una tarea (Fase 9, paso 9.4, idea C1). Lo usan Tareas, Mi día (móvil) y el Calendario,
// así el aviso es igual en todas partes:
//  - si la tarea tiene duración, pregunta «¿Cuánto has tardado?» (es opcional: si no contestas, no se guarda nada)
//  - si además se repite, dice cuándo es la siguiente
//  - si no tiene duración, solo avisa de la siguiente (si se repite)
// Al elegir un tiempo, se guarda (PATCH /api/tareas/:id/minutos-reales) y el aviso dice si te sobró o te faltó tiempo.
import type { DatosAviso } from '../../componentes/base/AvisoFlotante';
import type { Tarea } from '../useTareas';
import { textoDia } from './frase';
import { apuntarMinutosReales } from './guardar';

export const PREGUNTA_MS = 8000; // 8 s: da tiempo a leer y pulsar sin prisa

const textoMin = (min: number) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`);

// Lo que dice el aviso después de elegir: comparado con lo que habías previsto
export function avisoApuntado(minutos: number, previsto: number): DatosAviso {
  const diferencia = minutos - previsto;
  return {
    titulo: `Apuntado: ${textoMin(minutos)}`,
    texto:
      diferencia === 0
        ? 'Justo lo que tenías previsto.'
        : diferencia > 0
          ? `${textoMin(diferencia)} más de lo previsto. Mi ritmo lo tendrá en cuenta.`
          : `${textoMin(-diferencia)} menos de lo previsto. ¡Te ha sobrado tiempo!`,
  };
}

// t: la tarea ANTES de tachar · siguiente: la fecha de la siguiente vez (si se repite) · mostrar: para cambiar el aviso
export function avisoAlTachar(t: Tarea, siguiente: string | null, hoy: string, mostrar: (aviso: DatosAviso) => void): DatosAviso | null {
  const textoSiguiente = siguiente ? `Se repite: la siguiente es ${textoDia(siguiente, hoy).toLowerCase()}.` : '';
  const acabaDeTachar = t.estado !== 'completada';
  const previsto = t.duracion_min;

  if (acabaDeTachar && previsto && previsto > 0 && previsto <= 720) {
    return {
      titulo: t.titulo,
      texto: textoSiguiente,
      tachado: true,
      duracionMs: PREGUNTA_MS,
      pregunta: {
        duracion: previsto,
        alElegir: async (minutos) => {
          try {
            await apuntarMinutosReales(t.id, minutos);
            mostrar(avisoApuntado(minutos, previsto));
          } catch (e) {
            mostrar({ titulo: 'No se pudo apuntar', texto: e instanceof Error ? e.message : 'Inténtalo otra vez en un momento' });
          }
        },
      },
    };
  }
  if (siguiente) return { titulo: 'Tarea recurrente completada', texto: `Se ha creado la siguiente para ${textoDia(siguiente, hoy).toLowerCase()}.` };
  return null;
}
