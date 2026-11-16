// pantallas/ritmo/ritmo.ts
// Los cálculos de Mi ritmo (Fase 9, paso 9.3). Sin pantalla: solo funciones que reciben datos y devuelven
// resultados, así se pueden probar una a una (ritmo.test.ts) y las usan la web, el móvil y la barra lateral.
//
// De dónde salen los datos:
//  - GET /api/ritmo (paso 9.2): el historial (cuándo tachaste, destachaste o moviste cada tarea),
//    lo que se te atasca y las semanas que ya cerraste.
//  - GET /api/tareas: tus tareas (duración prevista, minutos reales, categorías, prioridad...).
//
// La hora: el servidor manda cada momento como milisegundos desde 1970 (igual en todo el mundo).
// Aquí se pasa a TU hora con new Date(ms), que usa la zona horaria de tu dispositivo.
import type { Tarea } from '../useTareas';
import { aTextoISO, esFechaValida, semanaDe, sumarDias } from '../../utils/dias';

// ---------- Lo que llega del servidor ----------

export interface EventoRitmo {
  tipo: 'completada' | 'reabierta' | 'movida';
  tarea_id: number | null; // null si la tarea se borró (el historial se conserva)
  en: number; // milisegundos desde 1970
  fecha_anterior: string | null;
  fecha_nueva: string | null;
}

export interface Atascada {
  id: number;
  titulo: string;
  veces_aplazada: number;
  fecha_limite: string | null;
  prioridad: string;
}

export interface CierreSemana {
  semana_inicio: string;
  completadas: number;
  pasadas_al_lunes: number;
  foco_categoria_id: number | null;
}

export interface HistorialRitmo {
  desde: string;
  hasta: string;
  eventos: EventoRitmo[];
  recortado: boolean;
  atascadas: Atascada[];
  cierres: CierreSemana[];
}

const TIPOS = ['completada', 'reabierta', 'movida'];
const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const esEntero = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x);
const fechaONull = (x: unknown) => (esFechaValida(x) ? x : null);

// Revisa la respuesta del servidor antes de usarla: lo que no tenga la forma esperada se descarta
// (nunca se da por bueno lo que llega de fuera). Si la respuesta entera no vale, devuelve null.
export function leerHistorial(json: unknown): HistorialRitmo | null {
  if (!esObjeto(json) || !esFechaValida(json.desde) || !esFechaValida(json.hasta)) return null;
  const lista = (x: unknown) => (Array.isArray(x) ? x.filter(esObjeto) : []);

  const eventos: EventoRitmo[] = lista(json.eventos)
    .filter((e) => TIPOS.includes(e.tipo as string) && Number.isFinite(e.en) && (e.tarea_id === null || esEntero(e.tarea_id)))
    .map((e) => ({
      tipo: e.tipo as EventoRitmo['tipo'],
      tarea_id: e.tarea_id as number | null,
      en: e.en as number,
      fecha_anterior: fechaONull(e.fecha_anterior),
      fecha_nueva: fechaONull(e.fecha_nueva),
    }))
    .sort((a, b) => a.en - b.en);

  const atascadas: Atascada[] = lista(json.atascadas)
    .filter((t) => esEntero(t.id) && typeof t.titulo === 'string' && esEntero(t.veces_aplazada))
    .map((t) => ({
      id: t.id as number,
      titulo: t.titulo as string,
      veces_aplazada: t.veces_aplazada as number,
      fecha_limite: fechaONull(t.fecha_limite),
      prioridad: typeof t.prioridad === 'string' ? t.prioridad : 'media',
    }));

  const cierres: CierreSemana[] = lista(json.cierres)
    .filter((c) => esFechaValida(c.semana_inicio) && esEntero(c.completadas) && esEntero(c.pasadas_al_lunes))
    .map((c) => ({
      semana_inicio: c.semana_inicio as string,
      completadas: c.completadas as number,
      pasadas_al_lunes: c.pasadas_al_lunes as number,
      foco_categoria_id: esEntero(c.foco_categoria_id) ? c.foco_categoria_id : null,
    }));

  return { desde: json.desde, hasta: json.hasta, eventos, recortado: json.recortado === true, atascadas, cierres };
}

// ---------- Cuándo tachaste de verdad ----------

export interface Tachada {
  tarea_id: number | null;
  dia: string; // "2026-11-16", en tu hora
  minuto: number; // minutos desde las 0:00, en tu hora
  dow: number; // 0 = lunes ... 6 = domingo
}

// Las tareas que siguen tachadas, con el día y la hora en que las tachaste.
// Si una tarea se tachó, se destachó y se volvió a tachar, cuenta UNA vez: la última.
// Si se tachó y luego se destachó (y sigue pendiente), no cuenta.
// Las de tareas ya borradas (tarea_id null) cuentan siempre: las hiciste.
export function tachadasDe(eventos: EventoRitmo[]): Tachada[] {
  const ultimoDe = new Map<number, EventoRitmo>();
  const borradas: EventoRitmo[] = [];
  for (const e of [...eventos].sort((a, b) => a.en - b.en)) {
    if (e.tipo === 'movida') continue;
    if (e.tarea_id === null) {
      if (e.tipo === 'completada') borradas.push(e);
    } else {
      ultimoDe.set(e.tarea_id, e);
    }
  }
  return [...ultimoDe.values(), ...borradas]
    .filter((e) => e.tipo === 'completada')
    .sort((a, b) => a.en - b.en)
    .map((e) => {
      const fecha = new Date(e.en);
      return { tarea_id: e.tarea_id, dia: aTextoISO(fecha), minuto: fecha.getHours() * 60 + fecha.getMinutes(), dow: (fecha.getDay() + 6) % 7 };
    });
}

// ---------- La racha amable ----------
// Suma un día por cada día en que tachas al menos una tarea. Cada semana (de lunes a domingo) tienes
// UN día de descanso que no la rompe (pero tampoco suma). Hoy, mientras no taches nada, no la rompe.

export type EstadoDia = 'hecho' | 'descanso' | 'hoy' | 'nada' | 'futuro';

export interface RachaAmable {
  dias: number;
  descansos: string[]; // los días de descanso que la han salvado
  hoyHecho: boolean;
  semana: { dia: string; estado: EstadoDia }[]; // esta semana, de lunes a domingo
}

export function rachaAmable(tachadas: Tachada[], hoy: string): RachaAmable {
  const conTachadas = new Set(tachadas.map((t) => t.dia));
  const hoyHecho = conTachadas.has(hoy);
  const descansoDeLaSemana = new Map<string, string>(); // lunes → día de descanso usado
  const masAntiguo = tachadas.length ? tachadas[0].dia : hoy;

  let dias = 0;
  let primerDia = ''; // el día tachado más antiguo de la racha
  let cursor = hoyHecho ? hoy : sumarDias(hoy, -1);
  // Hacia atrás, día a día, hasta que un día sin tachar no se pueda cubrir con el descanso
  while (cursor >= masAntiguo) {
    if (conTachadas.has(cursor)) {
      dias++;
      primerDia = cursor;
    } else {
      const { lunes } = semanaDe(cursor);
      if (descansoDeLaSemana.has(lunes)) break;
      descansoDeLaSemana.set(lunes, cursor);
    }
    cursor = sumarDias(cursor, -1);
  }
  // Un descanso más antiguo que el primer día tachado de la racha no ha salvado nada: fuera
  const descansos = dias > 0 ? [...descansoDeLaSemana.values()].filter((d) => d > primerDia).sort() : [];

  const { lunes } = semanaDe(hoy);
  const semana = [0, 1, 2, 3, 4, 5, 6].map((n) => {
    const dia = sumarDias(lunes, n);
    const estado: EstadoDia = conTachadas.has(dia) ? 'hecho' : dia > hoy ? 'futuro' : dia === hoy ? 'hoy' : descansos.includes(dia) ? 'descanso' : 'nada';
    return { dia, estado };
  });

  return { dias, descansos, hoyHecho, semana };
}

// ---------- El mapa de energía ----------
// A qué día de la semana y en qué franja del día tachas más. Las franjas de los extremos recogen
// también lo de antes de las 8 y lo de después de las 22 (madrugadores y noctámbulos también cuentan).

export const FRANJAS = [
  { nombre: '8–10', desde: 0 },
  { nombre: '10–13', desde: 600 },
  { nombre: '13–16', desde: 780 },
  { nombre: '16–20', desde: 960 },
  { nombre: '20–22', desde: 1200 },
];
export const MINIMO_PARA_MAPA = 5; // con menos tachadas, "tu mejor franja" sería pura casualidad

export interface MapaEnergia {
  celdas: number[][]; // [día 0 = lunes ... 6 = domingo][franja 0...4] → cuántas tachaste
  total: number;
  mejor: { dow: number; franja: number; n: number } | null;
  otroDia: number | null; // otro día que rinde bien en esa misma franja
}

export const franjaDe = (minuto: number) => FRANJAS.reduce((elegida, f, i) => (minuto >= f.desde ? i : elegida), 0);

export function mapaEnergia(tachadas: Tachada[]): MapaEnergia {
  const celdas = Array.from({ length: 7 }, () => FRANJAS.map(() => 0));
  for (const t of tachadas) celdas[t.dow][franjaDe(t.minuto)]++;
  const total = tachadas.length;
  if (total < MINIMO_PARA_MAPA) return { celdas, total, mejor: null, otroDia: null };

  // La mejor: la casilla con más tachadas (si empatan, la primera de la semana y del día)
  let mejor = { dow: 0, franja: 0, n: -1 };
  celdas.forEach((fila, dow) => fila.forEach((n, franja) => n > mejor.n && (mejor = { dow, franja, n })));
  let otroDia: number | null = null;
  celdas.forEach((fila, dow) => {
    if (dow !== mejor.dow && fila[mejor.franja] > 0 && (otroDia === null || fila[mejor.franja] > celdas[otroDia][mejor.franja])) otroDia = dow;
  });
  return { celdas, total, mejor, otroDia };
}

// Lo oscura que va cada casilla: 0 (vacía) a 4 (la que más), relativo a TU mejor casilla
export function nivelCasilla(n: number, maximo: number) {
  if (n <= 0 || maximo <= 0) return 0;
  return Math.min(4, Math.ceil((n / maximo) * 4));
}

// ---------- Lo que se te atasca ----------

export type ConsejoAtasco = 'pasos' | 'partir' | 'hueco';

// Qué te propone Tachit con cada atascada:
//  - si ya tiene subtareas: empezar por el primer paso
//  - si la has movido 4 veces o más: partirla (suele ser demasiado grande)
//  - si no: darle hoy un hueco pequeño
export function consejosAtasco(atascadas: Atascada[], tareas: Tarea[]) {
  const porId = new Map(tareas.map((t) => [t.id, t]));
  return atascadas
    .filter((a) => porId.get(a.id)?.estado !== 'completada')
    .map((a) => {
      const pasos = porId.get(a.id)?.subtareas?.length ?? 0;
      const consejo: ConsejoAtasco = pasos > 0 ? 'pasos' : a.veces_aplazada >= 4 ? 'partir' : 'hueco';
      return { ...a, pasos, consejo };
    });
}

// ---------- Progreso por categoría y por prioridad ----------

export interface Progreso {
  clave: string;
  nombre: string;
  color: string | null;
  hechas: number;
  total: number;
}

const PRIORIDADES = [
  { clave: 'alta', nombre: 'Alta' },
  { clave: 'media', nombre: 'Media' },
  { clave: 'baja', nombre: 'Baja' },
];

// Las tareas con día entre "desde" y "hasta": cuántas hay y cuántas has tachado, agrupadas.
// Una tarea con dos categorías cuenta en las dos. Las que no tienen categoría van a "Sin categoría".
export function progresoPor(tareas: Tarea[], desde: string, hasta: string, por: 'categoria' | 'prioridad'): Progreso[] {
  const grupos = new Map<string, Progreso>();
  const sumar = (clave: string, nombre: string, color: string | null, hecha: boolean) => {
    const g = grupos.get(clave) ?? { clave, nombre, color, hechas: 0, total: 0 };
    g.total++;
    if (hecha) g.hechas++;
    grupos.set(clave, g);
  };
  for (const t of tareas) {
    const dia = t.fecha_limite?.slice(0, 10);
    if (!dia || dia < desde || dia > hasta) continue;
    const hecha = t.estado === 'completada';
    if (por === 'prioridad') {
      sumar(t.prioridad, PRIORIDADES.find((p) => p.clave === t.prioridad)?.nombre ?? t.prioridad, null, hecha);
    } else if (t.categorias?.length) {
      for (const c of t.categorias) sumar(String(c.id), c.nombre, c.color, hecha);
    } else {
      sumar('-', 'Sin categoría', null, hecha);
    }
  }
  const lista = [...grupos.values()];
  if (por === 'prioridad') return PRIORIDADES.map((p) => grupos.get(p.clave)).filter((g): g is Progreso => !!g);
  // Primero las que más tareas tienen; "Sin categoría", al final
  return lista.sort((a, b) => Number(a.clave === '-') - Number(b.clave === '-') || b.total - a.total || a.nombre.localeCompare(b.nombre));
}

// ---------- Lo que planeas contra lo que tardas (para "Corregir mis tiempos") ----------

export const MINIMO_PARA_MARGEN = 3; // con menos tareas por categoría, el porcentaje no dice nada

export interface Margen {
  clave: string;
  nombre: string;
  color: string | null;
  plan: number; // minutos previstos (sumados)
  real: number; // minutos de verdad (sumados)
  porcentaje: number; // +25 = tardas un 25 % más de lo que planeas; -10 = te sobra tiempo
  n: number;
}

// Solo cuentan las tareas tachadas que tienen las dos cosas: duración prevista y minutos reales.
export function margenTiempos(tareas: Tarea[]): Margen[] {
  const grupos = new Map<string, Margen>();
  for (const t of tareas) {
    if (t.estado !== 'completada' || !t.duracion_min || !t.minutos_reales) continue;
    const cats = t.categorias?.length ? t.categorias : [{ id: 0, nombre: 'Sin categoría', color: '' }];
    for (const c of cats) {
      const clave = c.id ? String(c.id) : '-';
      const g = grupos.get(clave) ?? { clave, nombre: c.nombre, color: c.color || null, plan: 0, real: 0, porcentaje: 0, n: 0 };
      g.plan += t.duracion_min;
      g.real += t.minutos_reales;
      g.n++;
      grupos.set(clave, g);
    }
  }
  return [...grupos.values()]
    .filter((g) => g.n >= MINIMO_PARA_MARGEN)
    .map((g) => ({ ...g, porcentaje: Math.round(((g.real - g.plan) / g.plan) * 100) }))
    .sort((a, b) => b.porcentaje - a.porcentaje);
}

// ---------- El cierre de semana ----------

// La semana que toca cerrar: la de hoy (de lunes a domingo)
export function semanaACerrar(hoy: string) {
  return semanaDe(hoy);
}

export const estaCerrada = (cierres: CierreSemana[], lunes: string) => cierres.some((c) => c.semana_inicio === lunes);

// Paso 1: cuántas tareas tachaste esa semana (el día de verdad en que las tachaste)
export const hechasEnSemana = (tachadas: Tachada[], lunes: string) => tachadas.filter((t) => t.dia >= lunes && t.dia <= sumarDias(lunes, 6)).length;

// Paso 2: las pendientes que puedes pasar al lunes: las de esa semana o de antes que siguen sin tachar
export function pendientesParaElLunes(tareas: Tarea[], lunes: string) {
  const domingo = sumarDias(lunes, 6);
  return tareas
    .filter((t) => t.estado !== 'completada' && t.fecha_limite && t.fecha_limite.slice(0, 10) <= domingo)
    .sort((a, b) => (a.fecha_limite as string).localeCompare(b.fecha_limite as string) || (a.hora_limite ?? '').localeCompare(b.hora_limite ?? ''));
}
