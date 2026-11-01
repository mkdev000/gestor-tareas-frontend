// pantallas/tareas/guardar.ts
// Todo lo que la pantalla de Tareas le pide al servidor (Fase 5, pasos 5.3 a 5.5):
// crear, editar, completar y borrar tareas, sus categorías y sus subtareas.
// La pantalla solo llama a estas funciones; aquí está el "cómo" (rutas, métodos y qué datos van).
// Si el servidor dice que no, se lanza un error con SU mensaje (por ejemplo, el de Zod), y la pantalla lo enseña.
import { pedirConSesion } from '../../utils/sesion';
import { deTextoISO, hoyISO } from '../../utils/dias';
import type { Tarea } from '../useTareas';
import { normalizar, siguienteFecha, horaConCeros, type FraseLeida, type Repeticion } from './frase';

export interface Categoria {
  id: number;
  nombre: string;
  color: string;
}

async function pedir<T = unknown>(ruta: string, metodo: string, cuerpo?: unknown): Promise<T> {
  const respuesta = await pedirConSesion(ruta, {
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
export async function crearTarea(p: FraseLeida, hoy: string, categorias: Categoria[]) {
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
  return id;
}

// ---------- Editar ----------
// El PUT del servidor necesita TODOS los campos básicos (si falta la descripción, la borraría),
// por eso se parte de la tarea tal y como está y se cambian solo los campos que toquen.
type Cambios = Partial<{
  titulo: string;
  estado: string;
  prioridad: string;
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
    proyecto: t.proyecto || null,
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
// Si la tarea se repite, al completarla se crea la siguiente (con sus categorías y subtareas sin marcar)
// y la completada deja de repetirse, igual que en el prototipo. Devuelve la fecha de la siguiente.
export async function alternarCompletada(t: Tarea): Promise<string | null> {
  const completar = t.estado !== 'completada';
  if (!completar || !t.repeticion) {
    await cambiarTarea(t, { estado: completar ? 'completada' : 'pendiente' });
    return null;
  }
  const fecha = t.fecha_limite ? t.fecha_limite.slice(0, 10) : null;
  const siguiente = siguienteFecha(fecha ?? hoyISO(), t.repeticion, t.dias_semana ?? null);
  await cambiarTarea(t, { estado: 'completada', repeticion: null, dias_semana: null });
  const { id } = await pedir<{ id: number }>('/api/tareas', 'POST', {
    ...cuerpoCompleto(t, { estado: 'pendiente', fecha_limite: siguiente }),
  });
  const ids = (t.categorias ?? []).map((c) => c.id);
  if (ids.length) await guardarCategorias(id, ids);
  for (const s of t.subtareas ?? []) await crearSubtarea(id, s.titulo);
  return siguiente;
}

// ---------- Borrar ----------
export function borrarTarea(id: number) {
  return pedir(`/api/tareas/${id}`, 'DELETE');
}

// ---------- Subtareas ----------
export function crearSubtarea(tareaId: number, titulo: string) {
  return pedir('/api/subtareas', 'POST', { tarea_id: tareaId, titulo: titulo.trim().slice(0, 150) });
}

export function marcarSubtarea(id: number, hecha: boolean) {
  return pedir(`/api/subtareas/${id}`, 'PATCH', { hecha });
}
