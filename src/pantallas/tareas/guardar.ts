// pantallas/tareas/guardar.ts
// Todo lo que la pantalla de Tareas le pide al servidor (Fase 5, pasos 5.3 a 5.5):
// crear, editar, completar y borrar tareas, sus categorías y sus subtareas.
// La pantalla solo llama a estas funciones; aquí está el "cómo" (rutas, métodos y qué datos van).
// Si el servidor dice que no, se lanza un error con SU mensaje (por ejemplo, el de Zod), y la pantalla lo enseña.
import { pedirConSesion } from '../../utils/sesion';
import { deTextoISO, hoyISO } from '../../utils/dias';
import type { Tarea } from '../useTareas';
import { normalizar, horaConCeros, type FraseLeida, type Prioridad, type Repeticion } from './frase';

export interface Categoria {
  id: number;
  nombre: string;
  color: string;
}

async function pedir<T = unknown>(ruta: string, metodo: string, cuerpo?: unknown, extra: RequestInit = {}): Promise<T> {
  const respuesta = await pedirConSesion(ruta, {
    ...extra,
    method: metodo,
    headers: cuerpo === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error((datos as { mensaje?: string }).mensaje || 'No se pudo guardar el cambio');
  return datos as T;
}

// El servidor no deja "semanal" sin días: si no hay, se usa el día de la semana de la fecha
function diasParaGuardar(repeticion: Repeticion | null, dias: number[] | null, fecha: string | null) {
  if (repeticion !== 'semanal') return null;
  if (dias && dias.length) return dias;
  return [(fecha ? deTextoISO(fecha) : new Date()).getDay()];
}

// ---------- Categorías ----------
// Convierte nombres ("Casa", "salud") en ids. Las que no existen se crean
// (el servidor reutiliza la que ya tengas aunque cambien mayúsculas o tildes).
export async function idsDeCategorias(nombres: string[], existentes: Categoria[]) {
  const lista = [...existentes]; // copia: no tocamos la lista de la pantalla
  const ids: number[] = [];
  // Una detrás de otra (no a la vez): así cada nueva coge el siguiente color de la paleta
  for (const nombre of nombres.slice(0, 10)) {
    const ya = lista.find((c) => normalizar(c.nombre) === normalizar(nombre));
    if (ya) {
      ids.push(ya.id);
      continue;
    }
    const { categoria } = await pedir<{ categoria: Categoria }>('/api/categorias', 'POST', { nombre: nombre.replace(/_/g, ' ') });
    lista.push(categoria);
    ids.push(categoria.id);
  }
  return [...new Set(ids)];
}

function guardarCategorias(tareaId: number, ids: number[]) {
  return pedir(`/api/tareas/${tareaId}/categorias`, 'PUT', { ids });
}

// ---------- Crear ----------
// Recibe la frase ya leída (y con los paneles aplicados). Devuelve el id de la tarea nueva.
// subtareas: los títulos de las subtareas escritas en la hoja del móvil (en la web, ninguna)
export async function crearTarea(p: FraseLeida, hoy: string, categorias: Categoria[], subtareas: string[] = []) {
  const fecha = p.fecha || hoy;
  const { id } = await pedir<{ id: number }>('/api/tareas', 'POST', {
    titulo: p.titulo,
    estado: 'pendiente',
    prioridad: p.prioridad || 'media',
    fecha_limite: fecha,
    hora_limite: p.inicio !== null ? horaConCeros(p.inicio) : null,
    duracion_min: p.duracion || 30,
    aviso_min: p.aviso,
    repeticion: p.repeticion,
    dias_semana: diasParaGuardar(p.repeticion, p.dias, fecha),
    icono: p.icono,
  });
  if (p.categorias.length) await guardarCategorias(id, await idsDeCategorias(p.categorias, categorias));
  for (const titulo of subtareas) await crearSubtarea(id, titulo);
  return id;
}

// ---------- Editar ----------
// El PUT del servidor necesita TODOS los campos básicos (si falta la descripción, la borraría),
// por eso se parte de la tarea tal y como está y se cambian solo los campos que toquen.
type Cambios = Partial<{
  titulo: string;
  estado: string;
  prioridad: Prioridad;
  fecha_limite: string | null;
  hora_limite: string | null;
  duracion_min: number;
  aviso_min: number | null;
  repeticion: Repeticion | null;
  dias_semana: number[] | null;
  icono: string | null;
}>;

function cuerpoCompleto(t: Tarea, cambios: Cambios) {
  const base = {
    titulo: t.titulo,
    descripcion: t.descripcion || null,
    estado: t.estado,
    prioridad: t.prioridad,
    fecha_limite: t.fecha_limite ? t.fecha_limite.slice(0, 10) : null,
    hora_limite: t.hora_limite ? t.hora_limite.slice(0, 5) : null,
    duracion_min: t.duracion_min ?? 30,
    aviso_min: t.aviso_min ?? null,
    repeticion: t.repeticion ?? null,
    dias_semana: t.dias_semana ?? null,
    icono: t.icono ?? null,
  };
  const final = { ...base, ...cambios };
  final.dias_semana = diasParaGuardar(final.repeticion, final.dias_semana, final.fecha_limite);
  return final;
}

export function cambiarTarea(t: Tarea, cambios: Cambios) {
  return pedir(`/api/tareas/${t.id}`, 'PUT', cuerpoCompleto(t, cambios));
}

// Guardar lo que has cambiado en la caja de crear (modo "Editando")
export async function guardarEdicion(t: Tarea, p: FraseLeida, categorias: Categoria[]) {
  await cambiarTarea(t, {
    titulo: p.titulo,
    prioridad: p.prioridad || t.prioridad,
    fecha_limite: p.fecha || (t.fecha_limite ? t.fecha_limite.slice(0, 10) : null),
    hora_limite: p.inicio !== null ? horaConCeros(p.inicio) : null,
    duracion_min: p.duracion || t.duracion_min || 30,
    aviso_min: p.aviso,
    repeticion: p.repeticion,
    dias_semana: p.dias,
    icono: p.icono,
  });
  await guardarCategorias(t.id, await idsDeCategorias(p.categorias, categorias));
}

// ---------- Completar ----------
// Una sola petición pequeña (PATCH, paso 6.5): solo dice "completada" o "pendiente".
// Si la tarea se repite, el SERVIDOR crea la siguiente (con sus categorías y subtareas sin marcar)
// en la misma transacción: o se guarda todo o nada. Antes eran 3 o más peticiones desde aquí y,
// si se cortaba internet a mitad, la tarea quedaba completada pero sin la siguiente.
// "hoy" va por si la tarea que se repite no tiene fecha (el servidor está en otra zona horaria).
// Devuelve la fecha de la siguiente vez, o null.
export async function alternarCompletada(t: Tarea): Promise<string | null> {
  const estado = t.estado === 'completada' ? 'pendiente' : 'completada';
  const { siguiente } = await pedir<{ siguiente: { id: number; fecha_limite: string } | null }>(
    `/api/tareas/${t.id}/estado`,
    'PATCH',
    { estado, hoy: hoyISO() },
  );
  return siguiente ? siguiente.fecha_limite : null;
}

// ---------- Cambiar el día y la hora de varias tareas a la vez (Fase 7, paso 7.2) ----------
// Lo usan "Reorganizar mi día" y "Planificar" (y, en el paso 7.5, "Separar" y arrastrar en la línea de tiempo).
// Una sola petición: el servidor las mueve todas o ninguna.
export function cambiarHorario(cambios: { id: number; fecha_limite: string; hora_limite: string }[]) {
  return pedir('/api/tareas/horario', 'PATCH', { cambios });
}

// ---------- Borrar ----------
// keepalive (paso 6.6): el navegador termina de enviar el borrado aunque cierres la pestaña justo
// en ese momento (la tarea se borra de verdad a los 5 s de pulsar la papelera, o al salir)
export function borrarTarea(id: number) {
  return pedir(`/api/tareas/${id}`, 'DELETE', undefined, { keepalive: true });
}

// ---------- Subtareas ----------
export function crearSubtarea(tareaId: number, titulo: string) {
  return pedir('/api/subtareas', 'POST', { tarea_id: tareaId, titulo: titulo.trim().slice(0, 150) });
}

export function marcarSubtarea(id: number, hecha: boolean) {
  return pedir(`/api/subtareas/${id}`, 'PATCH', { hecha });
}

export function borrarSubtarea(id: number) {
  return pedir(`/api/subtareas/${id}`, 'DELETE');
}

// Hoja del móvil al editar: deja las subtareas de la tarea igual que la lista de títulos de la hoja.
// Las que siguen se quedan como están (con su marca de hecha), las quitadas se borran y las nuevas se crean.
export async function sincronizarSubtareas(t: Tarea, titulos: string[]) {
  const actuales = [...(t.subtareas ?? [])];
  for (const titulo of titulos) {
    const i = actuales.findIndex((s) => s.titulo === titulo);
    if (i >= 0) actuales.splice(i, 1); // ya existía: se queda
    else await crearSubtarea(t.id, titulo);
  }
  for (const sobrante of actuales) await borrarSubtarea(sobrante.id);
}
