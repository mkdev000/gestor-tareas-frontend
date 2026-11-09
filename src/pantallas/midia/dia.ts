// pantallas/midia/dia.ts
// Los cálculos de Mi día (Fase 7, paso 7.3), separados del dibujo, como en el prototipo:
//  - qué tareas son de hoy, cuáles van atrasadas y cuánto duran
//  - los huecos libres del día (de 8:00 a 22:00, de 15 en 15 minutos, desde ahora)
//  - "Reorganizar mi día", "Planificar" y "Separar": dónde colocar cada tarea
//  - qué tareas se pisan y cómo ponerlas lado a lado en la línea de tiempo (carriles)
//  - el resumen del día y el texto del briefing
//  - el día libre (paso 7.8): si hoy no tienes nada y qué tareas de los próximos días puedes adelantar
// Son "funciones puras": reciben las tareas, el día y la hora, y devuelven un resultado.
// No piden nada al servidor ni tocan la pantalla, por eso se pueden probar solas (dia.test.ts).
import type { Tarea } from '../useTareas';
import type { Prioridad } from '../tareas/frase';
import { horaConCeros, textoDuracion } from '../tareas/frase';
import { INICIO_DIA, FIN_DIA, minutosDe, textoHora } from '../tareas/pulso';
import { deTextoISO, sumarDias } from '../../utils/dias';

export { INICIO_DIA, FIN_DIA };

// Los minutos van "de 15 en 15" (9:00, 9:15, 9:30...), como en el prototipo
const PASO = 15;
// Al colocar tareas, primero las de prioridad alta; a igual prioridad, primero las más cortas
const ORDEN_PRIORIDAD: Record<Prioridad, number> = {
  alta: 0,
  media: 1,
  baja: 2,
};

// ---------- Datos básicos de una tarea ----------
export const duracion = (t: Tarea) => t.duracion_min ?? 30;
export const hecha = (t: Tarea) => t.estado === 'completada';
export const inicioDe = (t: Tarea) => minutosDe(t.hora_limite);
export const esDeHoy = (t: Tarea, hoy: string) => t.fecha_limite?.slice(0, 10) === hoy;

// Atrasada: es de hoy, no está hecha y su hora de terminar ya ha pasado
export function estaAtrasada(t: Tarea, hoy: string, ahora: number) {
  const inicio = inicioDe(t);
  return !hecha(t) && esDeHoy(t, hoy) && inicio !== null && inicio + duracion(t) <= ahora;
}

// 11:40 → 11:45 (la siguiente marca de 15 minutos; si ya es justa, se queda)
export const redondearArriba = (minutos: number) => Math.ceil(minutos / PASO) * PASO;

// ---------- Huecos libres ----------
export interface Tramo {
  desde: number; // minutos desde las 00:00
  hasta: number;
}

// ¿Cabe una tarea que empieza en "inicio" y dura "dura" sin pisar ningún tramo ocupado?
export function cabe(inicio: number, dura: number, ocupados: Tramo[]) {
  return ocupados.every((o) => inicio + dura <= o.desde || inicio >= o.hasta);
}

// El primer hueco donde cabe, buscando de 15 en 15 desde "desde" hasta las 22:00. null si no hay
export function buscarHueco(dura: number, ocupados: Tramo[], desde: number) {
  for (let inicio = Math.max(desde, INICIO_DIA); inicio + dura <= FIN_DIA; inicio += PASO) {
    if (cabe(inicio, dura, ocupados)) return inicio;
  }
  return null;
}

// Coloca las tareas "ids" en los huecos libres de hoy a partir de "desde".
// Respeta las tareas de hoy que ya tienen hora, siguen pendientes y aún no han terminado.
// Devuelve un Map: id → minuto en el que empieza (las que no caben no aparecen).
export function colocarTareas(tareas: Tarea[], ids: number[], desde: number, hoy: string, ahora: number) {
  const mover = new Set(ids);
  const ocupados: Tramo[] = tareas
    .filter((t) => esDeHoy(t, hoy) && !hecha(t) && !mover.has(t.id))
    .flatMap((t) => {
      const inicio = inicioDe(t);
      return inicio !== null && inicio + duracion(t) > ahora ? [{ desde: inicio, hasta: inicio + duracion(t) }] : [];
    });
  const colocadas = new Map<number, number>();
  tareas
    .filter((t) => mover.has(t.id))
    .sort((a, b) => ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad] || duracion(a) - duracion(b))
    .forEach((t) => {
      const inicio = buscarHueco(duracion(t), ocupados, desde);
      if (inicio === null) return;
      colocadas.set(t.id, inicio);
      ocupados.push({ desde: inicio, hasta: inicio + duracion(t) });
    });
  return colocadas;
}

// ---------- Reorganizar · Planificar · Separar ----------
export type Plan =
  | { tipo: 'en-orden' } // no había nada que mover
  | { tipo: 'sin-hueco' } // había que mover, pero no queda hueco hoy
  | { tipo: 'colocadas'; colocadas: Map<number, number>; sinHueco: number[] };

function plan(colocadas: Map<number, number>, ids: number[]): Plan {
  if (colocadas.size === 0) return { tipo: 'sin-hueco' };
  return {
    tipo: 'colocadas',
    colocadas,
    sinHueco: ids.filter((id) => !colocadas.has(id)),
  };
}

// "Reorganizar mi día": las de hoy pendientes que no tienen hora o van atrasadas → a los huecos libres
export function reorganizar(tareas: Tarea[], hoy: string, ahora: number): Plan {
  const ids = tareas.filter((t) => esDeHoy(t, hoy) && !hecha(t) && (inicioDe(t) === null || estaAtrasada(t, hoy, ahora))).map((t) => t.id);
  if (ids.length === 0) return { tipo: 'en-orden' };
  return plan(colocarTareas(tareas, ids, redondearArriba(ahora), hoy, ahora), ids);
}

// "Planificar" (una tarea sin hora): al primer hueco libre desde ahora
export function planificar(tareas: Tarea[], id: number, hoy: string, ahora: number): Plan {
  return plan(colocarTareas(tareas, [id], redondearArriba(ahora), hoy, ahora), [id]);
}

// "Separar" dos tareas que se pisan: la segunda va al siguiente hueco libre después de la primera
export function separar(tareas: Tarea[], primeraId: number, segundaId: number, hoy: string, ahora: number): Plan {
  const primera = tareas.find((t) => t.id === primeraId);
  const inicio = primera ? inicioDe(primera) : null;
  if (!primera || inicio === null) return { tipo: 'sin-hueco' };
  const desde = Math.max(redondearArriba(ahora), inicio + duracion(primera));
  return plan(colocarTareas(tareas, [segundaId], desde, hoy, ahora), [segundaId]);
}

// Lo que se envía a PATCH /api/tareas/horario (paso 7.2): todas quedan para hoy, a su hora nueva
export function aCambiosHorario(colocadas: Map<number, number>, hoy: string) {
  return [...colocadas].map(([id, inicio]) => ({
    id,
    fecha_limite: hoy,
    hora_limite: horaConCeros(inicio),
  }));
}

// ---------- Tareas que se pisan ----------
export interface Choque {
  primera: Tarea;
  segunda: Tarea;
  desde: number; // dónde empieza a pisarse
  hasta: number; // dónde deja de pisarse
}

// Pares de tareas de hoy, con hora y sin hacer, que coinciden en el tiempo
export function choques(tareas: Tarea[], hoy: string): Choque[] {
  const conHora = tareas.filter((t) => esDeHoy(t, hoy) && !hecha(t) && inicioDe(t) !== null).sort((a, b) => inicioDe(a)! - inicioDe(b)!);
  const lista: Choque[] = [];
  for (let i = 0; i < conHora.length; i++) {
    for (let j = i + 1; j < conHora.length; j++) {
      const a = conHora[i];
      const b = conHora[j];
      const desde = Math.max(inicioDe(a)!, inicioDe(b)!);
      const hasta = Math.min(inicioDe(a)! + duracion(a), inicioDe(b)! + duracion(b));
      if (desde < hasta) lista.push({ primera: a, segunda: b, desde, hasta });
    }
  }
  return lista;
}

// Carriles: si dos bloques coinciden, en la línea de tiempo se ponen lado a lado.
// Devuelve, para cada tarea que comparte hueco, en qué carril va (i) y cuántos carriles hay (n).
export function carriles(tareas: Tarea[], hoy: string) {
  const conHora = tareas.filter((t) => esDeHoy(t, hoy) && inicioDe(t) !== null).sort((a, b) => inicioDe(a)! - inicioDe(b)!);
  const resultado = new Map<number, { i: number; n: number }>();
  // 1) Grupos de tareas que se solapan entre sí (una detrás de otra, sin hueco en medio)
  const grupos: Tarea[][] = [];
  let finGrupo = -1;
  for (const t of conHora) {
    if (grupos.length === 0 || inicioDe(t)! >= finGrupo) grupos.push([]);
    grupos[grupos.length - 1].push(t);
    finGrupo = Math.max(finGrupo, inicioDe(t)! + duracion(t));
  }
  // 2) Dentro de cada grupo, cada tarea va al primer carril que ya esté libre a su hora
  for (const grupo of grupos) {
    if (grupo.length < 2) continue;
    const finCarril: number[] = [];
    for (const t of grupo) {
      let i = finCarril.findIndex((fin) => fin <= inicioDe(t)!);
      if (i < 0) i = finCarril.push(0) - 1;
      finCarril[i] = inicioDe(t)! + duracion(t);
      resultado.set(t.id, { i, n: 0 });
    }
    for (const t of grupo) resultado.get(t.id)!.n = finCarril.length;
  }
  return resultado;
}

// ---------- Resumen del día y briefing ----------
export interface Resumen {
  planificado: number; // minutos de las tareas de hoy que tienen hora (hechas o no)
  libre: number; // minutos libres que quedan hoy hasta las 22:00
  atrasadas: Tarea[];
  completadas: number;
  clave: Tarea[]; // las de prioridad alta que quedan por hacer
  claveHechas: Tarea[]; // las de prioridad alta que ya has terminado hoy
  sinHora: Tarea[]; // las de hoy pendientes sin hora (para "Sin hora asignada")
}

export function resumenDelDia(tareas: Tarea[], hoy: string, ahora: number): Resumen {
  const deHoy = tareas.filter((t) => esDeHoy(t, hoy));
  const pendientes = deHoy.filter((t) => !hecha(t));
  const desde = Math.min(Math.max(ahora, INICIO_DIA), FIN_DIA); // antes de las 8 cuenta desde las 8
  // Lo que queda ocupado desde ahora por las pendientes con hora (solo la parte que aún no ha pasado)
  const ocupado = pendientes.reduce((suma, t) => {
    const inicio = inicioDe(t);
    if (inicio === null) return suma;
    const empieza = Math.max(inicio, desde);
    const termina = Math.min(inicio + duracion(t), FIN_DIA);
    return suma + Math.max(0, termina - empieza);
  }, 0);
  return {
    planificado: deHoy.filter((t) => inicioDe(t) !== null).reduce((suma, t) => suma + duracion(t), 0),
    libre: Math.max(0, FIN_DIA - desde - ocupado),
    atrasadas: deHoy.filter((t) => estaAtrasada(t, hoy, ahora)),
    completadas: deHoy.filter(hecha).length,
    clave: pendientes.filter((t) => t.prioridad === 'alta'),
    claveHechas: deHoy.filter((t) => hecha(t) && t.prioridad === 'alta'),
    sinHora: pendientes.filter((t) => inicioDe(t) === null),
  };
}

// "Buenos días" hasta las 14:00, "Buenas tardes" hasta las 21:00 y "Buenas noches" después
export function saludoSegunHora(ahora: number) {
  if (ahora >= 6 * 60 && ahora < 14 * 60) return 'Buenos días';
  if (ahora >= 14 * 60 && ahora < 21 * 60) return 'Buenas tardes';
  return 'Buenas noches';
}

// Los textos de "Así va tu día" (antes "Briefing de hoy"), como en el prototipo:
// "Buenos días, Ana. Hoy tienes 2 tareas clave." + "Te quedan unas 5 h libres y 1 tarea atrasada."
// (Las tareas clave ya no van en la frase: salen en la nota pegada, ver loImportante)
export function textoBriefing(r: Resumen, nombre: string, ahora: number, diaLibre = false) {
  const n = r.clave.length;
  const titular = `${saludoSegunHora(ahora)}${nombre ? `, ${nombre}` : ''}. ${
    diaLibre ? 'Hoy tienes el día libre.' : n === 0 ? 'Hoy no tienes tareas urgentes.' : n === 1 ? 'Hoy tienes 1 tarea clave.' : `Hoy tienes ${n} tareas clave.`
  }`;
  const libre = r.libre > 0 ? `Te quedan unas ${textoDuracion(r.libre)} libres` : 'No te queda tiempo libre hoy';
  const atrasadas = r.atrasadas.length === 0 ? '.' : r.atrasadas.length === 1 ? ' y 1 tarea atrasada.' : ` y ${r.atrasadas.length} tareas atrasadas.`;
  return { titular, detalle: libre + atrasadas };
}

// La nota pegada "Lo importante de hoy" (paso 7.4). Tiene tres formas:
//  - 'pendientes': las tareas clave que te quedan por hacer
//  - 'hechas': ya no te queda ninguna, pero hoy sí tenías (salen tachadas)
//  - 'vacia': hoy no tienes ninguna tarea clave ("Nada urgente por ahora" y el atajo)
// Van en orden de hora (las que no tienen hora, al final) y como mucho 3, para que la nota no crezca demasiado.
export type EstadoNota = 'pendientes' | 'hechas' | 'vacia';

export function loImportante(r: Resumen): { estado: EstadoNota; tareas: { id: number; titulo: string; hora: string }[] } {
  const estado: EstadoNota = r.clave.length ? 'pendientes' : r.claveHechas.length ? 'hechas' : 'vacia';
  const lista = estado === 'pendientes' ? r.clave : r.claveHechas;
  const tareas = [...lista]
    .sort((a, b) => (inicioDe(a) ?? 9999) - (inicioDe(b) ?? 9999))
    .slice(0, 3)
    .map((t) => {
      const inicio = inicioDe(t);
      return { id: t.id, titulo: t.titulo, hora: inicio === null ? 'sin hora' : textoHora(inicio) };
    });
  return { estado, tareas };
}

// ---------- Resumen del día: el hilo (paso 7.4) ----------
// Cada tarea de hoy es un puntito en un hilo de 8:00 a 22:00, en su hora; las que no tienen hora van
// al final, en su zona. Cada puntito dice cómo está: hecha (se tacha), atrasada (roja), en curso
// (borde gordo), pendiente o sin hora. "x" es la posición en % del ancho del hilo.
export type EstadoPunto = 'hecha' | 'atrasada' | 'encurso' | 'pendiente' | 'sinhora';

export interface PuntoHilo {
  id: number;
  titulo: string;
  inicio: number | null;
  estado: EstadoPunto;
  x: number;
}

// Las tareas con hora ocupan del 2 % al 84 % del hilo; del 88 % en adelante, las que no tienen hora
export const posicionEnHilo = (minutos: number) => 2 + ((Math.min(Math.max(minutos, INICIO_DIA), FIN_DIA) - INICIO_DIA) / (FIN_DIA - INICIO_DIA)) * 82;

export function hiloDelDia(tareas: Tarea[], hoy: string, ahora: number) {
  const deHoy = tareas.filter((t) => esDeHoy(t, hoy)).sort((a, b) => (inicioDe(a) ?? 9999) - (inicioDe(b) ?? 9999));
  const enCurso = (t: Tarea) => {
    const inicio = inicioDe(t);
    return !hecha(t) && inicio !== null && inicio <= ahora && ahora < inicio + duracion(t);
  };
  let sinHora = 0;
  const puntos: PuntoHilo[] = deHoy.map((t) => {
    const inicio = inicioDe(t);
    const estado: EstadoPunto = hecha(t)
      ? 'hecha'
      : inicio === null
        ? 'sinhora'
        : estaAtrasada(t, hoy, ahora)
          ? 'atrasada'
          : enCurso(t)
            ? 'encurso'
            : 'pendiente';
    // Las sin hora se colocan desde la derecha, un poco separadas (como mucho hasta el 89 %)
    const x = inicio === null ? Math.max(89, 95 - sinHora++ * 3) : posicionEnHilo(inicio);
    return { id: t.id, titulo: t.titulo, inicio, estado, x };
  });
  const ahoraT = deHoy.find(enCurso) ?? null;
  const despues = deHoy.filter((t) => !hecha(t) && (inicioDe(t) ?? -1) > ahora).sort((a, b) => (inicioDe(a) ?? 0) - (inicioDe(b) ?? 0))[0] ?? null;
  return {
    puntos,
    ahora: posicionEnHilo(ahora),
    total: deHoy.length,
    hechas: deHoy.filter(hecha).length,
    // Lo que estás haciendo (y hasta qué hora) y lo siguiente con hora
    enCurso: ahoraT ? { titulo: ahoraT.titulo, hasta: textoHora((inicioDe(ahoraT) ?? 0) + duracion(ahoraT)) } : null,
    despues: despues ? { titulo: despues.titulo, hora: textoHora(inicioDe(despues) ?? 0) } : null,
  };
}

// La frase del resumen: "Te quedan unas 7 h libres y llevas 1 de 6 tachadas." (la parte de lo
// atrasado, con su botón, la dibuja la pantalla)
export function fraseDelDia(libre: number, hechas: number, total: number) {
  const libres = libre > 0 ? `Te quedan unas ${textoDuracion(libre)} libres` : 'No te queda tiempo libre hoy';
  if (total === 0) return `Hoy aún no tienes tareas. ${libres}.`;
  if (hechas === total) return `¡Has tachado todo lo de hoy! ${libres}.`;
  return `${libres} y llevas ${hechas} de ${total} tachadas.`;
}

// ---------- Día libre (paso 7.8) ----------
// Hoy no tienes ninguna tarea: ni con hora, ni sin hora, ni ya hecha
export const esDiaLibre = (tareas: Tarea[], hoy: string) => !tareas.some((t) => esDeHoy(t, hoy));

export interface Proxima {
  id: number;
  titulo: string;
  dia: string; // "Mañana" o "Jue 12"
  hora: string; // "10:00" o "sin hora"
}

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// «¿Adelantas algo?»: las tareas pendientes más cercanas de los próximos días (como mucho 3),
// por día y, dentro del mismo día, por hora (las que no tienen hora, al final de su día)
export function proximasTareas(tareas: Tarea[], hoy: string, cuantas = 3): Proxima[] {
  const manana = sumarDias(hoy, 1);
  const fecha = (t: Tarea) => t.fecha_limite?.slice(0, 10) ?? '';
  return tareas
    .filter((t) => !hecha(t) && fecha(t) > hoy)
    .sort((a, b) => fecha(a).localeCompare(fecha(b)) || (inicioDe(a) ?? 9999) - (inicioDe(b) ?? 9999))
    .slice(0, cuantas)
    .map((t) => {
      const inicio = inicioDe(t);
      const dia = deTextoISO(fecha(t));
      return {
        id: t.id,
        titulo: t.titulo,
        dia: fecha(t) === manana ? 'Mañana' : `${DIAS_CORTOS[dia.getDay()]} ${dia.getDate()}`,
        hora: inicio === null ? 'sin hora' : textoHora(inicio),
      };
    });
}
