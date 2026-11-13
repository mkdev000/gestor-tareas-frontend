// pantallas/calendario/calendario.ts
// Los cálculos del Calendario (Fase 8, paso 8.2), separados del dibujo, como en Mi día:
//  - la cuadrícula del mes (empieza en lunes, con los días del mes anterior y siguiente en gris)
//  - los 7 días de una semana
//  - qué tareas tiene cada día, en orden de hora (las que no tienen hora, al final)
//  - el estado de cada tarea en el calendario: pendiente, hecha o atrasada
//  - lo que cabe en una casilla del mes ("+3 más") y los títulos ("Septiembre 2026", "28 sep – 4 oct 2026")
//  - (paso 8.3, «la ficha») cuánto llevas tachado de cada día y del mes
//  - (paso 8.4) lo tachado de la semana y qué vista se pide en la dirección (?vista=semana)
//  - (paso 8.6) si lo que miras está libre y cuál es tu próxima tarea; el texto de las ideas que llega de fuera
// Son "funciones puras" (reciben datos y devuelven un resultado), así se prueban solas
// (calendario.test.ts) y sirven igual aunque más adelante cambiemos el aspecto del Calendario.
import type { Tarea } from '../useTareas';
import { duracion, esDeHoy, hecha, inicioDe } from '../midia/dia';
import { aTextoISO, deTextoISO, fechaLarga, semanaDe, sumarDias } from '../../utils/dias';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// ---------- Días ----------
export interface DiaCalendario {
  fecha: string; // "2026-09-29"
  numero: number; // 29
  delMes: boolean; // false = es del mes anterior o del siguiente (se pinta en gris)
  esHoy: boolean;
}

const diaDe = (fecha: string, hoy: string, mes: number | null): DiaCalendario => {
  const d = deTextoISO(fecha);
  return { fecha, numero: d.getDate(), delMes: mes === null || d.getMonth() === mes, esHoy: fecha === hoy };
};

// El primer día del mes de una fecha: "2026-09-29" → "2026-09-01"
export const primeroDeMes = (fecha: string) => `${fecha.slice(0, 7)}-01`;

// La cuadrícula del mes: semanas completas de lunes a domingo (5 o 6 filas, 35 o 42 días)
export function cuadriculaMes(fecha: string, hoy: string): DiaCalendario[] {
  const primero = primeroDeMes(fecha);
  const mes = deTextoISO(primero).getMonth();
  const { lunes } = semanaDe(primero); // la cuadrícula empieza el lunes de la semana del día 1
  const d = deTextoISO(primero);
  const diasDelMes = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const antes = (d.getDay() + 6) % 7; // días del mes anterior que se ven delante
  const total = Math.ceil((antes + diasDelMes) / 7) * 7;
  return Array.from({ length: total }, (_, i) => diaDe(sumarDias(lunes, i), hoy, mes));
}

// Los 7 días (de lunes a domingo) de la semana de una fecha
export function semanaCompleta(fecha: string, hoy: string): DiaCalendario[] {
  const { lunes } = semanaDe(fecha);
  return Array.from({ length: 7 }, (_, i) => diaDe(sumarDias(lunes, i), hoy, null));
}

// Moverse con ‹ y ›: un mes entero (siempre al día 1) o una semana entera
export function mesVecino(fecha: string, cuanto: number) {
  const d = deTextoISO(primeroDeMes(fecha));
  return aTextoISO(new Date(d.getFullYear(), d.getMonth() + cuanto, 1));
}
export const semanaVecina = (fecha: string, cuanto: number) => sumarDias(fecha, cuanto * 7);

// ---------- Tareas de cada día ----------
const fechaDe = (t: Tarea) => t.fecha_limite?.slice(0, 10) ?? null;

// Las tareas de un día, en orden de hora; las que no tienen hora van al final
export function tareasDelDia(tareas: Tarea[], fecha: string): Tarea[] {
  return tareas.filter((t) => fechaDe(t) === fecha).sort((a, b) => (inicioDe(a) ?? 9999) - (inicioDe(b) ?? 9999));
}

// Todas las tareas de varios días de una vez (para no recorrer la lista 42 veces): fecha → tareas
export function tareasPorDia(tareas: Tarea[], fechas: string[]): Map<string, Tarea[]> {
  const mapa = new Map<string, Tarea[]>(fechas.map((f) => [f, []]));
  for (const t of tareas) {
    const f = fechaDe(t);
    if (f !== null) mapa.get(f)?.push(t);
  }
  for (const lista of mapa.values()) lista.sort((a, b) => (inicioDe(a) ?? 9999) - (inicioDe(b) ?? 9999));
  return mapa;
}

// ---------- Estado de una tarea en el calendario ----------
export type EstadoCalendario = 'pendiente' | 'hecha' | 'atrasada';

// Atrasada = sin hacer y ya se le pasó el momento:
//  - de un día anterior a hoy (tenga hora o no: si era para ayer, ya se pasó)
//  - de hoy, con hora, y ya ha terminado su tiempo (igual que en Mi día)
export function estadoEnCalendario(t: Tarea, hoy: string, ahora: number): EstadoCalendario {
  if (hecha(t)) return 'hecha';
  const f = fechaDe(t);
  if (f !== null && f < hoy) return 'atrasada';
  const inicio = inicioDe(t);
  if (esDeHoy(t, hoy) && inicio !== null && inicio + duracion(t) <= ahora) return 'atrasada';
  return 'pendiente';
}

// Lo que cabe en una casilla del mes: hasta "cuantas" renglones. Si hay más, el último hueco es
// para el aviso "+3 más" (así nunca se sale de la casilla): con 4 huecos y 6 tareas → 3 tareas y "+3 más"
export function casilla(tareasDelDia: Tarea[], cuantas = 4) {
  if (tareasDelDia.length <= cuantas) return { visibles: tareasDelDia, mas: 0 };
  return { visibles: tareasDelDia.slice(0, cuantas - 1), mas: tareasDelDia.length - (cuantas - 1) };
}

// ---------- Lo tachado (paso 8.3, «la ficha») ----------
// De cada día: cuántas has tachado de cuántas. "parte" va de 0 a 1 y dice cuánto del número del día
// se ha tachado ya (con 2 de 4, medio trazo); "completo" = todas tachadas (el número sale con su ✓).
export function resumenTachado(tareasDelDia: Tarea[]) {
  const total = tareasDelDia.length;
  const hechas = tareasDelDia.filter(hecha).length;
  return { hechas, total, parte: total ? hechas / total : 0, completo: total > 0 && hechas === total };
}

// Del mes de una fecha: "Septiembre: 4 de 11 tachadas" (todas las tareas con fecha de ese mes)
export function tachadoDelMes(tareas: Tarea[], fecha: string) {
  const mes = fecha.slice(0, 7);
  return resumenTachado(tareas.filter((t) => fechaDe(t)?.slice(0, 7) === mes));
}

// De la semana (de lunes a domingo) de una fecha: "Esta semana: 5 de 14 tachadas"
export function tachadoDeLaSemana(tareas: Tarea[], fecha: string) {
  const { lunes, domingo } = semanaDe(fecha);
  return resumenTachado(
    tareas.filter((t) => {
      const f = fechaDe(t);
      return f !== null && f >= lunes && f <= domingo;
    }),
  );
}

// ---------- Libre (paso 8.6) ----------
// Los días que se están mirando: el mes entero (del 1 al último) o la semana (de lunes a domingo)
export function rangoVisible(fecha: string, semana: boolean) {
  if (semana) {
    const { lunes, domingo } = semanaDe(fecha);
    return { desde: lunes, hasta: domingo };
  }
  const desde = primeroDeMes(fecha);
  return { desde, hasta: sumarDias(mesVecino(desde, 1), -1) };
}

// ¿Hay alguna tarea (hecha o no) entre esos dos días?
export const hayTareasEntre = (tareas: Tarea[], desde: string, hasta: string) =>
  tareas.some((t) => {
    const f = fechaDe(t);
    return f !== null && f >= desde && f <= hasta;
  });

// La próxima tarea SIN HACER después de un día (la más cercana; si hay varias ese día, la de antes)
export function proximaDespues(tareas: Tarea[], fecha: string): Tarea | null {
  const siguientes = tareas.filter((t) => !hecha(t) && (fechaDe(t) ?? '') > fecha);
  siguientes.sort((a, b) => {
    const fa = fechaDe(a) ?? '';
    const fb = fechaDe(b) ?? '';
    return fa < fb ? -1 : fa > fb ? 1 : (inicioDe(a) ?? 9999) - (inicioDe(b) ?? 9999);
  });
  return siguientes[0] ?? null;
}

// "Diciembre está libre. Tu próxima tarea es el lunes 11 de enero." (o "Esta semana está libre.")
export function textoLibre(fecha: string, semana: boolean, proxima: Tarea | null) {
  const inicio = semana ? 'Esta semana está libre.' : `${tituloMes(fecha).split(' ')[0]} está libre.`;
  if (!proxima) return inicio;
  const dia = fechaLarga(fechaDe(proxima) ?? '').replace(',', '');
  return `${inicio} Tu próxima tarea es el ${dia.charAt(0).toLowerCase() + dia.slice(1)}.`;
}

// El texto de una idea que llega de otra pantalla (en location.state) no se da por bueno sin mirarlo:
// solo texto normal, sin saltos de línea ni caracteres raros, y no más largo que un título de tarea
export function textoPedidoValido(texto: unknown): texto is string {
  if (typeof texto !== 'string' || !texto.trim() || texto.length > 120 || /[<>]/.test(texto)) return false;
  // Sin caracteres de control (saltos de línea, tabuladores...): todos los códigos desde el espacio (32), y no el 127
  return [...texto].every((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127);
}

// ---------- La vista: Mes o Semana ----------
// Se guarda en la dirección (/calendario?vista=semana): así al recargar sigues en la misma vista y el botón
// «atrás» del navegador funciona. Lo que llega en la dirección no se da por bueno: si no es "semana", es "mes".
export type VistaCalendario = 'mes' | 'semana';
export const vistaDeLaDireccion = (valor: string | null): VistaCalendario => (valor === 'semana' ? 'semana' : 'mes');

// ---------- Textos ----------
// "Septiembre 2026"
export function tituloMes(fecha: string) {
  const d = deTextoISO(fecha);
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

// "28 sep – 4 oct 2026" (o "5 – 11 oct 2026" si los dos extremos son del mismo mes)
export function tituloSemana(fecha: string) {
  const { lunes, domingo } = semanaDe(fecha);
  const a = deTextoISO(lunes);
  const b = deTextoISO(domingo);
  const fin = `${b.getDate()} ${MESES_CORTOS[b.getMonth()]} ${b.getFullYear()}`;
  if (a.getMonth() === b.getMonth()) return `${a.getDate()} – ${fin}`;
  const anio = a.getFullYear() !== b.getFullYear() ? ` ${a.getFullYear()}` : '';
  return `${a.getDate()} ${MESES_CORTOS[a.getMonth()]}${anio} – ${fin}`;
}

// "Martes, 29 de septiembre" (el título del día elegido)
export const tituloDia = (fecha: string) => fechaLarga(fecha);
