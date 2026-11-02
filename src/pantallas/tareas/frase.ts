// pantallas/tareas/frase.ts
// "Escribir la tarea como hablas" (Fase 5, paso 5.3), igual que en el prototipo.
// Lee una frase como "Dentista el jueves a las 17:30 #Salud avísame" y saca de ella:
//   título "Dentista" · fecha (el próximo jueves) · hora 17:30 · categoría Salud · aviso 10 min antes
// Solo son funciones "puras": reciben texto y devuelven datos (no tocan React ni el servidor).
// Así se pueden probar solas y explicar paso a paso.
//
// Cómo funciona (como un niño de 10 años con un rotulador):
//   1. Ponemos un espacio delante y detrás de la frase (así " mañana " siempre tiene espacios alrededor).
//   2. Buscamos cada "pista" con una expresión regular (#categoría, "a las 18", "1h", "mañana"...).
//   3. Cada pista que encontramos la apuntamos y la TACHAMOS de la frase (la cambiamos por un espacio).
//   4. Lo que queda sin tachar es el título.
// El orden importa: "pasado mañana" se busca antes que "mañana", y "1h30" antes que "1h".
import { aTextoISO, deTextoISO, sumarDias } from '../../utils/dias';
import { textoHora } from './pulso';
import { estiloPrioridad } from './prioridades';
import type { Tarea } from '../useTareas';

export type Repeticion = 'diaria' | 'semanal' | 'mensual';
export type Prioridad = 'alta' | 'media' | 'baja';

export interface FraseLeida {
  titulo: string;
  fecha: string | null; // "2026-11-05"
  inicio: number | null; // minutos desde las 00:00 (18:30 → 1110)
  duracion: number | null; // minutos
  prioridad: Prioridad | null;
  categorias: string[]; // nombres sin la # ("Casa", "Salud")
  repeticion: Repeticion | null;
  dias: number[] | null; // días de la semana para "semanal" (0 = domingo ... 6 = sábado)
  aviso: number | null; // minutos antes: 0, 10, 60 o 1440
  icono: string | null;
}

// Lo que eliges tocando la frase de colores (los paneles CUÁNDO, A QUÉ HORA...).
// Si eliges algo, gana a lo que diga la frase.
export interface OpcionesFrase {
  fecha: string; // '' = lo que diga la frase (o hoy)
  hora: string; // "18:30" o ''
  aviso: 'nada' | 'sin' | '0' | '10' | '60' | '1440'; // 'nada' = lo que diga la frase · 'sin' = sin aviso
  dias: number[]; // días elegidos para repetir
  mensual: boolean;
  duracion: number | null;
  icono: string; // '' = sin icono
  prioridad: Prioridad | ''; // '' = lo que diga la frase (o media)
}

export const OPCIONES_VACIAS: OpcionesFrase = { fecha: '', hora: '', aviso: 'nada', dias: [], mensual: false, duracion: null, icono: '', prioridad: '' };

const NOMBRES_DIA: Record<string, number> = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };
const DIAS_RE = 'lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo';

// Quita tildes, pone minúsculas y cambia _ por espacio: "Mi_Casa" → "mi casa" (para comparar nombres)
export function normalizar(texto: string) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/_/g, ' ').trim();
}

const dosCifras = (n: number) => String(n).padStart(2, '0');

// El próximo "jueves" a partir de hoy (si hoy es jueves, el de la semana que viene)
function proximoDia(nombre: string, hoy: string) {
  const objetivo = NOMBRES_DIA[normalizar(nombre)] ?? 1;
  const actual = deTextoISO(hoy).getDay();
  let diferencia = (objetivo - actual + 7) % 7;
  if (diferencia === 0) diferencia = 7;
  return sumarDias(hoy, diferencia);
}

export function leerFrase(frase: string, hoy: string): FraseLeida {
  const o: FraseLeida = {
    titulo: '', fecha: null, inicio: null, duracion: null, prioridad: null,
    categorias: [], repeticion: null, dias: null, aviso: null, icono: null,
  };
  let t = ` ${frase} `;
  const tachar = (patron: RegExp, apuntar: (...partes: string[]) => void) => {
    t = t.replace(patron, (...coincidencia) => {
      apuntar(...(coincidencia.slice(0, -2) as string[]));
      return ' ';
    });
  };

  // #Casa #Salud → categorías (todas las que haya)
  tachar(/#([A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ_-]+)/g, (_, nombre) => {
    if (!o.categorias.some((c) => normalizar(c) === normalizar(nombre))) o.categorias.push(nombre.slice(0, 40));
  });
  // !alta !media !baja → prioridad
  tachar(/!(alta|media|baja)/i, (_, p) => (o.prioridad = p.toLowerCase() as Prioridad));
  // "avísame", "recuérdamelo"... → aviso 10 minutos antes
  tachar(/\s(av[ií]same|recu[eé]rdamelo|recu[eé]rdame|con aviso)(?=\s)/i, () => (o.aviso = 10));
  // Repeticiones
  tachar(/\s(cada d[ií]a|todos los d[ií]as|diariamente)(?=\s)/i, () => (o.repeticion = 'diaria'));
  tachar(/\s(cada semana|semanalmente)(?=\s)/i, () => (o.repeticion = 'semanal'));
  tachar(/\s(cada mes|mensualmente)(?=\s)/i, () => (o.repeticion = 'mensual'));
  // "cada lunes" → semanal, los lunes, empezando el próximo lunes
  tachar(new RegExp(`\\scada (${DIAS_RE})(?=\\s)`, 'i'), (_, dia) => {
    o.repeticion = 'semanal';
    o.fecha = proximoDia(dia, hoy);
    o.dias = [deTextoISO(o.fecha).getDay()];
  });
  // Hora: "a las 18", "a las 9:30", "a las 18h" y también "17:30" suelto
  tachar(/\sa las (\d{1,2})(?:[:.h](\d{2}))?(?:\s?h\b)?(?=\s)/i, (_, h, m) => (o.inicio = Math.min(23, +h) * 60 + (m ? Math.min(59, +m) : 0)));
  tachar(/\s(\d{1,2}):(\d{2})(?=\s)/, (_, h, m) => (o.inicio = Math.min(23, +h) * 60 + Math.min(59, +m)));
  // Duración: "1h30", "1 h 30 min", "2h", "1,5 horas", "45 min"
  tachar(/\s(\d{1,2})\s?h\s?(\d{1,2})(?:\s?min)?(?=\s)/i, (_, h, m) => (o.duracion = +h * 60 + +m));
  tachar(/\s(\d{1,2}(?:[.,]5)?)\s?(?:h|horas?)(?=\s)/i, (_, h) => (o.duracion = Math.round(parseFloat(h.replace(',', '.')) * 60)));
  tachar(/\s(\d{1,3})\s?(?:min|minutos|mins)(?=\s)/i, (_, m) => (o.duracion = +m));
  // Fechas: "pasado mañana" antes que "mañana"
  tachar(/\s(pasado ma[nñ]ana)(?=\s)/i, () => (o.fecha = sumarDias(hoy, 2)));
  tachar(/\s(ma[nñ]ana)(?=\s)/i, () => (o.fecha = sumarDias(hoy, 1)));
  tachar(/\s(hoy)(?=\s)/i, () => (o.fecha = hoy));
  // "el jueves", "este viernes", "domingo"
  tachar(new RegExp(`\\s(?:el |este )?(${DIAS_RE})(?=\\s)`, 'i'), (_, dia) => (o.fecha = proximoDia(dia, hoy)));
  // "el 3", "el día 15" → ese día de este mes (o del que viene, si ya ha pasado)
  tachar(/\sel (?:d[ií]a )?(\d{1,2})(?=\s)/i, (_, d) => {
    const base = deTextoISO(hoy);
    const dia = Math.max(1, +d);
    let anio = base.getFullYear();
    let mes = base.getMonth();
    if (dia < base.getDate()) {
      mes += 1;
      if (mes > 11) { mes = 0; anio += 1; }
    }
    // Si el mes no tiene ese día (31 de noviembre), usamos su último día
    const ultimo = new Date(anio, mes + 1, 0).getDate();
    o.fecha = `${anio}-${dosCifras(mes + 1)}-${dosCifras(Math.min(dia, ultimo))}`;
  });

  // Lo que queda es el título (sin espacios dobles ni una palabra suelta al final como "el" o "para")
  const titulo = t.replace(/\s+/g, ' ').trim().replace(/\s(el|para|a|de|y)$/i, '').trim();
  o.titulo = titulo ? (titulo.charAt(0).toUpperCase() + titulo.slice(1)).slice(0, 150) : '';
  // Límites del servidor: la duración va de 5 min a 24 h
  if (o.duracion !== null) o.duracion = Math.min(1440, Math.max(5, o.duracion));
  return o;
}

// Junta la frase con lo que has elegido en los paneles (lo elegido gana)
export function aplicarOpciones(p: FraseLeida, op: OpcionesFrase, hoy: string): FraseLeida {
  const r: FraseLeida = { ...p };
  if (op.prioridad) r.prioridad = op.prioridad;
  if (op.fecha) r.fecha = op.fecha;
  if (op.duracion) r.duracion = op.duracion;
  if (op.icono) r.icono = op.icono;
  if (op.hora) {
    const [h, m] = op.hora.split(':').map(Number);
    r.inicio = h * 60 + m;
  }
  if (op.aviso === 'sin') r.aviso = null;
  else if (op.aviso !== 'nada') r.aviso = Number(op.aviso);
  if (op.mensual) {
    r.repeticion = 'mensual';
    r.dias = null;
  } else if (op.dias.length) {
    r.repeticion = op.dias.length === 7 ? 'diaria' : 'semanal';
    r.dias = op.dias.length === 7 ? null : [...op.dias];
    // Sin fecha: el primer día elegido a partir de hoy
    if (!op.fecha && !p.fecha) {
      for (let i = 0; i < 7; i++) {
        const dia = sumarDias(hoy, i);
        if (op.dias.includes(deTextoISO(dia).getDay())) {
          r.fecha = dia;
          break;
        }
      }
    }
  }
  return r;
}

// ---------- Textos (los mismos que en el prototipo) ----------
const DIA_CORTO = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DIA_LARGO = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const ORDEN_SEMANA = [1, 2, 3, 4, 5, 6, 0]; // de lunes a domingo
export const LETRA_DIA = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

// "Hoy", "Mañana", "Ayer" o "jue 5 nov"
export function textoDia(fecha: string, hoy: string) {
  if (fecha === hoy) return 'Hoy';
  if (fecha === sumarDias(hoy, 1)) return 'Mañana';
  if (fecha === sumarDias(hoy, -1)) return 'Ayer';
  const d = deTextoISO(fecha);
  return `${DIA_CORTO[d.getDay()]} ${d.getDate()} ${MES_CORTO[d.getMonth()]}`;
}

export function nombreDia(numero: number) {
  return DIA_LARGO[numero];
}
export function diaCorto(numero: number) {
  return DIA_CORTO[numero];
}

// 45 → "45 min" · 90 → "1 h 30 min"
export function textoDuracion(minutos: number) {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${h} h${resto ? ` ${resto} min` : ''}`;
}

export function textoAviso(minutos: number) {
  if (minutos === 0) return 'A la hora';
  if (minutos === 10) return '10 min antes';
  if (minutos === 60) return '1 h antes';
  if (minutos === 1440) return '1 día antes';
  return `${minutos} min antes`;
}

// "Cada día", "Cada mes", "De lunes a viernes", "Cada lunes y jueves"... (corto: "L · J")
export function textoRepeticion(repeticion: Repeticion | null, dias: number[] | null, corto = false) {
  if (repeticion === 'diaria') return 'Cada día';
  if (repeticion === 'mensual') return 'Cada mes';
  if (dias && dias.length) {
    const ordenados = ORDEN_SEMANA.filter((d) => dias.includes(d));
    if (corto) return ordenados.map((d) => LETRA_DIA[d]).join(' · ');
    if (ordenados.join() === '1,2,3,4,5') return 'De lunes a viernes';
    const nombres = ordenados.map((d) => DIA_LARGO[d]);
    return 'Cada ' + (nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}` : nombres[0]);
  }
  return 'Cada semana';
}

// La siguiente vez que toca una tarea que se repite (al completarla se crea la siguiente)
export function siguienteFecha(fecha: string, repeticion: Repeticion, dias: number[] | null) {
  if (repeticion === 'semanal' && dias && dias.length) {
    for (let i = 1; i <= 7; i++) {
      const candidata = sumarDias(fecha, i);
      if (dias.includes(deTextoISO(candidata).getDay())) return candidata;
    }
  }
  if (repeticion === 'diaria') return sumarDias(fecha, 1);
  if (repeticion === 'semanal') return sumarDias(fecha, 7);
  // Cada mes: el mismo día del mes siguiente (el 31 de enero pasa al último día de febrero)
  const d = deTextoISO(fecha);
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 2, 0).getDate();
  return aTextoISO(new Date(d.getFullYear(), d.getMonth() + 1, Math.min(d.getDate(), ultimo)));
}

// 1110 → "18:30" (con dos cifras, para los <input type="time">)
export function horaConCeros(minutos: number) {
  return `${dosCifras(Math.floor(minutos / 60) % 24)}:${dosCifras(minutos % 60)}`;
}

// ---------- Aviso: los 5 pasos de las barras (No, En punto, 10 min, 1 h, 1 día) ----------
export const PASOS_AVISO: { valor: OpcionesFrase['aviso']; texto: string }[] = [
  { valor: 'sin', texto: 'No' },
  { valor: '0', texto: 'En punto' },
  { valor: '10', texto: '10 min' },
  { valor: '60', texto: '1 h' },
  { valor: '1440', texto: '1 día' },
];

// Qué aviso vale ahora (lo elegido o, si no, lo de la frase) y su posición en las barras
export function avisoActual(op: OpcionesFrase, fin: FraseLeida) {
  const valor = op.aviso !== 'nada' ? op.aviso : fin.aviso !== null ? (String(fin.aviso) as OpcionesFrase['aviso']) : 'sin';
  return { valor, indice: Math.max(0, PASOS_AVISO.findIndex((p) => p.valor === valor)) };
}

// Al editar: la tarea se convierte en frase + opciones (como editPatch en el prototipo).
// La usan la caja de la web (CajaCrear) y la hoja del móvil (HojaCrearMovil).
export function desdeTarea(t: Tarea): { borrador: string; op: OpcionesFrase } {
  const etiquetas = (t.categorias ?? []).map((c) => `#${c.nombre.replace(/\s+/g, '_')}`).join(' ');
  const fecha = t.fecha_limite ? t.fecha_limite.slice(0, 10) : '';
  let dias: number[] = [];
  if (t.repeticion === 'diaria') dias = [1, 2, 3, 4, 5, 6, 0];
  if (t.repeticion === 'semanal') dias = t.dias_semana && t.dias_semana.length ? [...t.dias_semana] : fecha ? [deTextoISO(fecha).getDay()] : [];
  return {
    borrador: t.titulo + (etiquetas ? ` ${etiquetas}` : ''),
    op: {
      fecha,
      hora: t.hora_limite ? t.hora_limite.slice(0, 5) : '',
      aviso: t.aviso_min !== null && t.aviso_min !== undefined ? (String(t.aviso_min) as OpcionesFrase['aviso']) : 'sin',
      dias,
      mensual: t.repeticion === 'mensual',
      duracion: t.duracion_min ?? null,
      icono: t.icono ?? '',
      prioridad: estiloPrioridad(t.prioridad).clave,
    },
  };
}

export { textoHora };
