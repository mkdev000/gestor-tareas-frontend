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
import { aTextoISO, deTextoISO, esFechaValida, semanaDe, sumarDias } from '../../utils/dias';
import { textoDuracion } from '../tareas/frase';
import { FIN_DIA, INICIO_DIA, duracion, esDeHoy, estaAtrasada, hecha, inicioDe } from '../midia/dia';

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

// ---------- El pulso de la semana (la cabecera «Así va tu semana», paso 9.4) ----------
// La semana se dibuja como la línea de pulso del icono de Mi ritmo: cada día sube según cuántas tareas
// tachaste; el descanso queda plano (con su lunita); hoy lleva un puntito y lo que falta, línea discontinua.

const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export interface DiaPulso {
  dia: string;
  letra: string;
  n: number; // tareas tachadas ese día
  estado: EstadoDia;
  esHoy: boolean;
}

export interface PulsoSemana {
  dias: DiaPulso[]; // de lunes a domingo
  total: number; // tachadas esta semana
  fuerte: DiaPulso | null; // el día con más tachadas (si hay al menos 2)
}

export function pulsoSemana(tachadas: Tachada[], racha: RachaAmable, hoy: string): PulsoSemana {
  const cuantas = new Map<string, number>();
  for (const t of tachadas) cuantas.set(t.dia, (cuantas.get(t.dia) ?? 0) + 1);
  const dias = racha.semana.map((d, i) => ({ dia: d.dia, letra: LETRAS[i], n: cuantas.get(d.dia) ?? 0, estado: d.estado, esHoy: d.dia === hoy }));
  const total = dias.reduce((suma, d) => suma + d.n, 0);
  // El primero con más tachadas (si empatan, el más temprano de la semana)
  const fuerte = dias.reduce<DiaPulso | null>((mejor, d) => (d.n > (mejor?.n ?? 1) ? d : mejor), null);
  return { dias, total, fuerte };
}

// Los textos de la cabecera: «ASÍ VA TU SEMANA · 16 – 22 NOV», «Llevas 12 días tachando algo.» y el detalle.
// destacado: la parte que va subrayada con rotulador (dentro de la frase: antes + destacado + despues)
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function textosCabecera(pulso: PulsoSemana, racha: RachaAmable) {
  const lunes = deTextoISO(pulso.dias[0].dia);
  const domingo = deTextoISO(pulso.dias[6].dia);
  const rango =
    lunes.getMonth() === domingo.getMonth()
      ? `${lunes.getDate()} – ${domingo.getDate()} ${MESES_CORTOS[domingo.getMonth()]}`
      : `${lunes.getDate()} ${MESES_CORTOS[lunes.getMonth()]} – ${domingo.getDate()} ${MESES_CORTOS[domingo.getMonth()]}`;

  const titular =
    racha.dias > 0
      ? { antes: 'Llevas ', destacado: `${racha.dias} ${racha.dias === 1 ? 'día' : 'días'}`, despues: ' tachando algo.' }
      : { antes: 'Tacha una tarea y ', destacado: 'empieza tu racha', despues: '.' };

  let detalle = 'Esta semana aún no has tachado nada.';
  if (pulso.total > 0) {
    detalle = `Esta semana, ${pulso.total} ${pulso.total === 1 ? 'tarea tachada' : 'tareas tachadas'}.`;
    const f = pulso.fuerte;
    if (f) detalle += f.esHoy ? ' Hoy está siendo tu día fuerte.' : ` Tu día fuerte fue el ${DIAS_SEMANA[deTextoISO(f.dia).getDay()]}.`;
  }
  return { ojo: `ASÍ VA TU SEMANA · ${rango.toUpperCase()}`, titular, detalle };
}

// Los trazos del dibujo, en un lienzo de ANCHO x ALTO (el SVG lo escala). Sin pantalla: se puede probar.
export const LIENZO_PULSO = { ancho: 430, alto: 84, base: 70 };

export interface TrazosPulso {
  solido: string; // de lunes a hoy
  discontinuo: string; // de hoy al domingo
  punto: { x: number; y: number }; // hoy
  numeros: { x: number; y: number; n: number }[];
  lunas: { x: number; y: number }[];
}

export function trazosPulso(dias: DiaPulso[]): TrazosPulso {
  const { ancho, base } = LIENZO_PULSO;
  const columna = ancho / 7;
  // La altura de cada pico, relativa al día con más tachadas (como poco se compara con 3, para que
  // 1 tarea no parezca un pico enorme)
  const maximo = Math.max(3, ...dias.map((d) => d.n));
  const alto = (n: number) => (n > 0 ? Math.round(10 + (n / maximo) * 34) : 0);
  const r = (x: number) => Math.round(x * 10) / 10;

  const iHoy = dias.findIndex((d) => d.esHoy);
  const hoyEsta = iHoy >= 0;
  const ultimo = hoyEsta ? iHoy : 6; // si hoy no está en esa semana (una semana pasada), la línea llega al domingo
  let solido = `M0 ${base}`;
  const numeros: TrazosPulso['numeros'] = [];
  const lunas: TrazosPulso['lunas'] = [];
  let punto = { x: ancho, y: base };

  dias.forEach((d, i) => {
    const cx = r(columna * (i + 0.5));
    const h = alto(d.n);
    if (i < ultimo || (!hoyEsta && i === ultimo)) {
      if (h) solido += ` L${r(cx - 12)} ${base} L${cx} ${base - h} L${r(cx + 10)} ${base + 8} L${r(cx + 18)} ${base}`;
      if (d.n) numeros.push({ x: cx, y: base - h - 8, n: d.n });
      if (d.estado === 'descanso') lunas.push({ x: cx, y: base - 8 });
    } else if (i === ultimo) {
      solido += h ? ` L${r(cx - 12)} ${base} L${cx} ${base - h}` : ` L${cx} ${base}`;
      punto = { x: cx, y: base - h };
      if (d.n) numeros.push({ x: cx, y: base - h - 14, n: d.n });
    }
  });
  if (!hoyEsta) {
    solido += ` L${ancho} ${base}`;
    return { solido, discontinuo: '', punto: { x: ancho, y: base }, numeros, lunas };
  }
  const discontinuo = `M${punto.x} ${punto.y}` + (punto.y !== base ? ` L${r(punto.x + 12)} ${base}` : '') + ` L${ancho} ${base}`;
  return { solido, discontinuo, punto, numeros, lunas };
}

// ---------- Tu hora de tachar (el mapa de energía) ----------
// A qué hora y qué día de la semana tachas más. El día va completo, de 0 a 24 h, en 8 tramos de 3 horas
// (0–3, 3–6 ... 21–24): se cuenta cuándo tachas de verdad, y eso puede ser a cualquier hora.

export const FRANJAS = [0, 3, 6, 9, 12, 15, 18, 21].map((h) => ({ nombre: `${h}–${h + 3}`, desde: h * 60 }));
export const MINIMO_PARA_MAPA = 5; // con menos tachadas, "tu mejor rato" sería pura casualidad

export interface MapaEnergia {
  celdas: number[][]; // [día 0 = lunes ... 6 = domingo][tramo 0...7] → cuántas tachaste
  totales: number[]; // cuántas tachaste cada día de la semana
  total: number;
  diaFuerte: number | null; // el día de la semana en que más tachas (null si aún hay pocos datos)
  mejor: { dow: number; franja: number; n: number } | null; // la casilla con más tachadas
  otroDia: number | null; // otro día que rinde bien en esa misma franja
}

export const franjaDe = (minuto: number) => Math.min(FRANJAS.length - 1, Math.max(0, Math.floor(minuto / 180)));

export function mapaEnergia(tachadas: Tachada[]): MapaEnergia {
  const celdas = Array.from({ length: 7 }, () => FRANJAS.map(() => 0));
  for (const t of tachadas) celdas[t.dow][franjaDe(t.minuto)]++;
  const totales = celdas.map((fila) => fila.reduce((a, b) => a + b, 0));
  const total = tachadas.length;
  if (total < MINIMO_PARA_MAPA) return { celdas, totales, total, diaFuerte: null, mejor: null, otroDia: null };

  // El día fuerte: el que más tachadas suma (si empatan, el primero de la semana)
  const diaFuerte = totales.indexOf(Math.max(...totales));
  // La mejor casilla: la que más tachadas tiene (si empatan, la primera de la semana y del día)
  let mejor = { dow: 0, franja: 0, n: -1 };
  celdas.forEach((fila, dow) => fila.forEach((n, franja) => n > mejor.n && (mejor = { dow, franja, n })));
  let otroDia: number | null = null;
  celdas.forEach((fila, dow) => {
    if (dow !== mejor.dow && fila[mejor.franja] > 0 && (otroDia === null || fila[mejor.franja] > celdas[otroDia][mejor.franja])) otroDia = dow;
  });
  return { celdas, totales, total, diaFuerte, mejor, otroDia };
}

// El mejor rato de un día de la semana: el tramo de 3 horas en que más tachas (null si ese día no tachas nunca)
export function mejorRato(mapa: MapaEnergia, dow: number) {
  const fila = mapa.celdas[dow];
  const n = Math.max(...fila);
  if (n === 0) return null;
  const franja = fila.indexOf(n);
  return { franja, n, desde: franja * 3, hasta: franja * 3 + 3 };
}

const DIAS_PLURAL = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos'];
const MOMENTOS = ['de madrugada', 'de madrugada', 'a primera hora', 'por la mañana', 'a mediodía', 'por la tarde', 'al caer la tarde', 'por la noche'];

// La frase grande: «Rindes más [los martes por la mañana], de 9 a 12 h.» (el día fuerte)
// o «Los jueves rindes más [por la mañana], de 9 a 12 h.» (otro día que has tocado)
export function fraseHoraDeTachar(mapa: MapaEnergia, dow: number) {
  const rato = mejorRato(mapa, dow);
  if (!rato) return { antes: `Los ${DIAS_PLURAL[dow]} `, destacado: 'aún no has tachado nada', despues: '.' };
  const horas = `, de ${rato.desde} a ${rato.hasta} h.`;
  return dow === mapa.diaFuerte
    ? { antes: 'Rindes más ', destacado: `los ${DIAS_PLURAL[dow]} ${MOMENTOS[rato.franja]}`, despues: horas }
    : { antes: `Los ${DIAS_PLURAL[dow]} rindes más `, destacado: MOMENTOS[rato.franja], despues: horas };
}

// La onda de un día, en un lienzo de 700 x 100 (el SVG la estira a lo ancho). Sube en los tramos en que más tachas;
// cima = el punto más alto (tu mejor rato). Sin pantalla: se puede probar.
export const LIENZO_ONDA = { ancho: 700, alto: 100 };

export function ondaEnergia(fila: number[]) {
  const { ancho, alto } = LIENZO_ONDA;
  const r = (x: number) => Math.round(x * 10) / 10;
  const maximo = Math.max(3, ...fila);
  const puntos = fila.map((n, i) => [r(((i + 0.5) / fila.length) * ancho), r(alto - (n / maximo) * 86)]);
  // Curvas suaves entre un tramo y el siguiente (el punto de control va a mitad de camino)
  let linea = `M0 ${alto} L${r(puntos[0][0] - 30)} ${alto}`;
  puntos.forEach(([x, y], i) => {
    const [px, py] = i ? puntos[i - 1] : [puntos[0][0] - 30, alto];
    const mx = r((px + x) / 2);
    linea += ` C${mx} ${py}, ${mx} ${y}, ${x} ${y}`;
  });
  const [ux, uy] = puntos[puntos.length - 1];
  linea += ` C${r(ux + 30)} ${uy}, ${ancho - 10} ${alto}, ${ancho} ${alto}`;
  const n = Math.max(...fila);
  const cima = n > 0 ? { x: puntos[fila.indexOf(n)][0], y: puntos[fila.indexOf(n)][1], n } : null;
  return { linea, area: `${linea} Z`, cima };
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
      const subtareas = porId.get(a.id)?.subtareas ?? [];
      const pasos = subtareas.length;
      const consejo: ConsejoAtasco = pasos > 0 ? 'pasos' : a.veces_aplazada >= 4 ? 'partir' : 'hueco';
      // El primer paso que falta (para el consejo «Empieza por el primero: …»)
      const primerPaso = subtareas.find((st) => !st.hecha)?.titulo ?? null;
      return { ...a, pasos, consejo, primerPaso };
    });
}

// Las hojas de calendario de una tarea atascada (paso 9.5, «las hojas de calendario arrancadas»):
//  - viejas: los días a los que estaba apuntada y que pasaste a otro (los eventos «movida» hacia más tarde
//    del historial), de la más antigua a la más nueva; como mucho las 5 últimas (ocultas = las que no caben)
//  - actual: el día para el que está ahora (o null si no tiene día)
// Si la moviste hace más de 2 meses, esas fechas ya no están en el historial que se pide: salen las que haya.
export const MAX_HOJAS = 5;

export function hojasAtasco(atascada: Atascada, eventos: EventoRitmo[]) {
  const fechas = [...eventos]
    .filter((e) => e.tipo === 'movida' && e.tarea_id === atascada.id && e.fecha_anterior && e.fecha_nueva && e.fecha_nueva > e.fecha_anterior)
    .sort((a, b) => a.en - b.en)
    .map((e) => e.fecha_anterior as string)
    .filter((f, i, lista) => lista.indexOf(f) === i);
  const viejas = fechas.slice(-MAX_HOJAS);
  return { viejas, ocultas: fechas.length - viejas.length, actual: atascada.fecha_limite };
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

// ---------- Lo que tardas de verdad (bloque «¿Cuánto te equivocas calculando?») ----------
// Por categoría: lo que sueles apuntar (duración prevista) contra lo que tardas de verdad (lo que dices al tachar).
// Solo cuentan las tareas tachadas que tienen las dos cosas. Con menos de 3 por categoría, la cuenta no dice nada.

export const MINIMO_PARA_MARGEN = 3;

export type EstadoTiempo = 'corto' | 'sobra' | 'clavado';

export interface TiempoCategoria {
  clave: string; // id de la categoría; '-' = sin categoría
  nombre: string;
  color: string | null;
  n: number; // cuántas tareas cuentan
  plan: number; // lo que sueles apuntar (media, redondeada a 5 min)
  real: number; // lo que tardas de verdad (media, redondeada a 5 min)
  estado: EstadoTiempo;
}

export interface TiemposDeVerdad {
  listas: TiempoCategoria[]; // las que ya tienen 3 tareas o más: primero donde más te quedas corto
  faltan: { clave: string; nombre: string; color: string | null; n: number }[]; // las que tienen 1 o 2
}

// Redondeo a 5 minutos (como los tiempos que se eligen al crear), nunca menos de 5
const aCinco = (minutos: number) => Math.max(5, Math.round(minutos / 5) * 5);

export function tiemposDeVerdad(tareas: Tarea[]): TiemposDeVerdad {
  const grupos = new Map<string, { clave: string; nombre: string; color: string | null; plan: number; real: number; n: number }>();
  for (const t of tareas) {
    if (t.estado !== 'completada' || !t.duracion_min || !t.minutos_reales) continue;
    const cats = t.categorias?.length ? t.categorias : [{ id: 0, nombre: 'Sin categoría', color: '' }];
    for (const c of cats) {
      const clave = c.id ? String(c.id) : '-';
      const g = grupos.get(clave) ?? { clave, nombre: c.nombre, color: c.color || null, plan: 0, real: 0, n: 0 };
      g.plan += t.duracion_min;
      g.real += t.minutos_reales;
      g.n++;
      grupos.set(clave, g);
    }
  }
  const todos = [...grupos.values()];
  const listas = todos
    .filter((g) => g.n >= MINIMO_PARA_MARGEN)
    .map((g): TiempoCategoria => {
      const plan = aCinco(g.plan / g.n);
      const real = aCinco(g.real / g.n);
      return { clave: g.clave, nombre: g.nombre, color: g.color, n: g.n, plan, real, estado: real > plan ? 'corto' : real < plan ? 'sobra' : 'clavado' };
    })
    .sort((a, b) => b.real - b.plan - (a.real - a.plan) || b.n - a.n || a.nombre.localeCompare(b.nombre));
  const faltan = todos
    .filter((g) => g.n < MINIMO_PARA_MARGEN)
    .map(({ clave, nombre, color, n }) => ({ clave, nombre, color, n }))
    .sort((a, b) => b.n - a.n || a.nombre.localeCompare(b.nombre));
  return { listas, faltan };
}

// El nombre tal y como se escribe en las frases: «#Trabajo» (o «tus tareas sin categoría»)
export const nombreCategoria = (c: { clave: string; nombre: string }) => (c.clave === '-' ? 'tus tareas sin categoría' : `#${c.nombre}`);

// La frase de arriba: «Calculas bien, salvo con [#Trabajo]: ahí tus 30 min son 40 min.»
export function fraseTiempos({ listas }: TiemposDeVerdad) {
  const cortas = listas.filter((c) => c.estado === 'corto');
  const peor = cortas[0];
  if (!listas.length) return { antes: 'Aún no hay ', destacado: 'tiempos suficientes', despues: ' para sacar la cuenta.' };
  if (!peor) return { antes: '', destacado: 'Calculas bien', despues: ': ninguna categoría se te va de tiempo.' };
  const cuenta = `tus ${textoDuracion(peor.plan)} son ${textoDuracion(peor.real)}.`;
  return cortas.length === 1
    ? { antes: 'Calculas bien, salvo con ', destacado: nombreCategoria(peor), despues: `: ahí ${cuenta}` }
    : { antes: 'Donde más te quedas corto es ', destacado: nombreCategoria(peor), despues: `: ${cuenta}` };
}

// «Usar mis tiempos de verdad»: lo que sueles tardar en las categorías de una tarea nueva (la mayor), o null si no se sabe.
// Lo usa el paso 9.8 al crear tareas sin duración.
export function duracionHabitual({ listas }: TiemposDeVerdad, categoriaIds: number[]) {
  const claves = categoriaIds.length ? categoriaIds.map(String) : ['-'];
  const reales = listas.filter((c) => claves.includes(c.clave)).map((c) => c.real);
  return reales.length ? Math.max(...reales) : null;
}

// ---------- La fila de arriba: «las tres preguntas» (paso 9.5, bloque 4) ----------
// 1. «Tu semana, tarea a tarea»: cada tarea de esta semana (de lunes a domingo) es una raya en su día.
// 2. «¿Te cabe lo de hoy?»: lo que te queda por hacer hoy contra el tiempo que queda de día (hasta FIN_DIA).
// 3. «Tu récord»: cuánto te falta para superar tu mejor racha (de lo que se ve en el historial: los últimos 2 meses).

export type EstadoRaya = 'hecha' | 'atrasada' | 'hoy' | 'pendiente';

export interface Raya {
  id: number;
  titulo: string;
  dia: string;
  estado: EstadoRaya;
  ancho: number; // % del ancho del día: más larga cuanto más dura (de 35 a 100)
}

export interface SemanaTareas {
  dias: { dia: string; rayas: Raya[]; mas: number }[]; // de lunes a domingo; "mas" = las que no caben
  total: number;
  hechas: number;
  atrasadas: number;
}

export const MAX_RAYAS = 5; // rayas por día; las demás salen como «+3»

export function semanaDeTareas(tareas: Tarea[], hoy: string, ahora: number): SemanaTareas {
  const { lunes } = semanaDe(hoy);
  const domingo = sumarDias(lunes, 6);
  const deSemana = tareas.filter((t) => {
    const f = t.fecha_limite?.slice(0, 10);
    return !!f && f >= lunes && f <= domingo;
  });
  const estadoDe = (t: Tarea): EstadoRaya => {
    const f = (t.fecha_limite as string).slice(0, 10);
    if (hecha(t)) return 'hecha';
    if (f < hoy || estaAtrasada(t, hoy, ahora)) return 'atrasada';
    return f === hoy ? 'hoy' : 'pendiente';
  };
  const rayas = deSemana.map((t): Raya => ({
    id: t.id,
    titulo: t.titulo,
    dia: (t.fecha_limite as string).slice(0, 10),
    estado: estadoDe(t),
    ancho: Math.round(Math.min(100, 35 + (duracion(t) / 120) * 65)),
  }));
  const inicio = (id: number) => inicioDe(deSemana.find((t) => t.id === id) as Tarea) ?? 24 * 60;
  const dias = [0, 1, 2, 3, 4, 5, 6].map((n) => {
    const dia = sumarDias(lunes, n);
    // Primero las tachadas; luego, por hora (las que no tienen hora, al final)
    const suyas = rayas.filter((r) => r.dia === dia).sort((a, b) => Number(b.estado === 'hecha') - Number(a.estado === 'hecha') || inicio(a.id) - inicio(b.id));
    return { dia, rayas: suyas.slice(0, MAX_RAYAS), mas: Math.max(0, suyas.length - MAX_RAYAS) };
  });
  return {
    dias,
    total: rayas.length,
    hechas: rayas.filter((r) => r.estado === 'hecha').length,
    atrasadas: rayas.filter((r) => r.estado === 'atrasada').length,
  };
}

export function fraseSemana(s: SemanaTareas) {
  if (!s.total) return { antes: 'Esta semana aún ', destacado: 'no tienes tareas', despues: '.' };
  const atras = s.atrasadas === 0 ? '.' : s.atrasadas === 1 ? '; 1 se te ha quedado atrás.' : `; ${s.atrasadas} se te han quedado atrás.`;
  return { antes: 'Llevas ', destacado: `${s.hechas} de ${s.total}`, despues: (s.hechas === 1 ? ' tachada' : ' tachadas') + atras };
}

export interface CabeHoy {
  quedan: number; // tareas de hoy sin tachar
  quedaMin: number; // lo que duran
  hechoMin: number; // lo que duran las que ya has tachado hoy
  diaMin: number; // lo que queda de día (desde ahora, o desde INICIO_DIA si aún no ha empezado, hasta FIN_DIA)
  cabe: boolean;
}

export function cabeHoy(tareas: Tarea[], hoy: string, ahora: number): CabeHoy {
  const deHoy = tareas.filter((t) => esDeHoy(t, hoy));
  const pendientes = deHoy.filter((t) => !hecha(t));
  const quedaMin = pendientes.reduce((suma, t) => suma + duracion(t), 0);
  const diaMin = Math.max(0, FIN_DIA - Math.max(ahora, INICIO_DIA));
  return {
    quedan: pendientes.length,
    quedaMin,
    hechoMin: deHoy.filter(hecha).reduce((suma, t) => suma + duracion(t), 0),
    diaMin,
    cabe: quedaMin <= diaMin,
  };
}

export function fraseCabe(c: CabeHoy) {
  if (!c.quedan) return { respuesta: '', antes: '', destacado: 'Nada pendiente', despues: ' para hoy.' };
  return c.cabe
    ? { respuesta: 'Sí,', antes: ' te sobran ', destacado: textoDuracion(c.diaMin - c.quedaMin), despues: '.' }
    : { respuesta: 'No:', antes: ' te faltan ', destacado: textoDuracion(c.quedaMin - c.diaMin), despues: '.' };
}

export interface RecordRacha {
  actual: number; // tu racha de ahora
  anterior: number; // tu mejor racha antes de la de ahora (0 si no hay ninguna)
}

// La racha de ahora son sus días tachados más recientes; el récord anterior se busca en los días de antes:
// para cada día tachado, la racha que llevabas ese día (con las mismas reglas: 1 descanso por semana).
export function recordRacha(tachadas: Tachada[], racha: RachaAmable): RecordRacha {
  const dias = [...new Set(tachadas.map((t) => t.dia))].sort();
  const inicioActual = racha.dias > 0 ? dias[dias.length - racha.dias] : null;
  const antes = inicioActual ? tachadas.filter((t) => t.dia < inicioActual) : tachadas;
  let anterior = 0;
  for (const dia of new Set(antes.map((t) => t.dia))) anterior = Math.max(anterior, rachaAmable(antes, dia).dias);
  return { actual: racha.dias, anterior };
}

export function fraseRecord({ actual, anterior }: RecordRacha) {
  const dias = (n: number) => (n === 1 ? '1 día' : `${n} días`);
  if (!actual) return { antes: 'Tacha algo hoy para ', destacado: 'empezar una racha', despues: '.' };
  if (!anterior) return { antes: 'Llevas ', destacado: dias(actual), despues: ': es tu mejor racha.' };
  if (actual > anterior) return { antes: '', destacado: '¡Nuevo récord!', despues: ` Llevas ${dias(actual)} seguidos.` };
  if (actual === anterior) return { antes: 'Igualas tu récord: ', destacado: dias(actual), despues: '. Mañana lo superas.' };
  return { antes: 'Te faltan ', destacado: dias(anterior - actual + 1), despues: ` para superar tu récord de ${anterior}.` };
}

// Los últimos 14 días, para la cadena de puntos (el último es hoy)
export type PuntoRacha = 'hecho' | 'descanso' | 'hoy' | 'nada';

export function cadenaRacha(tachadas: Tachada[], racha: RachaAmable, hoy: string): PuntoRacha[] {
  const conTachadas = new Set(tachadas.map((t) => t.dia));
  return Array.from({ length: 14 }, (_, i) => {
    const dia = sumarDias(hoy, i - 13);
    if (conTachadas.has(dia)) return 'hecho';
    if (dia === hoy) return 'hoy';
    return racha.descansos.includes(dia) ? 'descanso' : 'nada';
  });
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
