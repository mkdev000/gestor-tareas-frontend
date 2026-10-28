// utils/sesion.ts
// La sesión del usuario en el navegador (Fase 3, paso 10.3.2).
//
// Hay dos pases (ver tareas/sesiones.js en el backend):
//  - El pase CORTO (15 minutos) vive SOLO aquí, en la memoria de la app (una variable).
//    Nunca en localStorage: allí cualquier código JavaScript de la página podría leerlo.
//  - El pase de RENOVACIÓN (30 días) está en una cookie httpOnly que este código NO puede leer
//    (ni falta que hace): el navegador la manda sola a /api/auth/renovar gracias a credentials: 'include'.
//
// "pedirConSesion" es el cartero de la app: lleva el pase corto en cada petición y, si el servidor
// responde que ha caducado, pide uno nuevo y repite la petición, sin que el usuario note nada.
import { API_URL } from '../config';

export interface DatosSesion {
  token?: string;
  nombre?: string;
}

type ResultadoRenovar = 'ok' | 'caducada' | 'sin-conexion';

let paseCorto: string | null = null;
// Si varias peticiones descubren a la vez que el pase ha caducado, solo se pide UNO nuevo:
// todas esperan a la misma renovación (si no, gastaríamos varios pases de renovación a la vez).
let renovacionEnCurso: Promise<ResultadoRenovar> | null = null;
// Quién quiere enterarse de que la sesión ha caducado del todo (por ejemplo, para ir a "Entrar")
const avisosCaducada = new Set<() => void>();

// ¿Hay un pase corto en memoria? (si no, hay que pedir uno con la cookie antes de usar la app)
export function haySesion() {
  return paseCorto !== null;
}

// Guarda la sesión al entrar o al renovar
export function guardarSesion(datos: DatosSesion) {
  paseCorto = datos.token || null;
  if (datos.nombre) localStorage.setItem('nombre', datos.nombre); // el nombre no es secreto: solo para saludar
  localStorage.removeItem('token'); // limpieza: antes el pase se guardaba aquí
}

function olvidarSesion() {
  paseCorto = null;
  localStorage.removeItem('token');
  localStorage.removeItem('nombre');
}

// Pide un pase corto nuevo con la cookie del pase de renovación
export function renovarSesion(): Promise<ResultadoRenovar> {
  if (!renovacionEnCurso) {
    renovacionEnCurso = (async (): Promise<ResultadoRenovar> => {
      try {
        const respuesta = await fetch(`${API_URL}/api/auth/renovar`, { method: 'POST', credentials: 'include' });
        if (!respuesta.ok) {
          olvidarSesion();
          return 'caducada';
        }
        const datos: DatosSesion = await respuesta.json();
        guardarSesion(datos);
        return paseCorto ? 'ok' : 'caducada';
      } catch {
        // Sin internet o el servidor no contesta: NO cerramos la sesión, solo avisamos del fallo
        return 'sin-conexion';
      } finally {
        renovacionEnCurso = null;
      }
    })();
  }
  return renovacionEnCurso;
}

// Para que una pantalla se entere de que la sesión ha caducado. Devuelve la función para dejar de escuchar.
export function alCaducarSesion(funcion: () => void) {
  avisosCaducada.add(funcion);
  return () => {
    avisosCaducada.delete(funcion);
  };
}

function sesionCaducada() {
  avisosCaducada.forEach((funcion) => funcion());
  return new Response(JSON.stringify({ mensaje: 'Tu sesión ha caducado. Vuelve a entrar.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

// El cartero: hace una petición a la API con el pase corto y lo renueva si hace falta.
// Se usa igual que fetch, pero con la ruta ("/api/tareas") en lugar de la dirección completa.
export async function pedirConSesion(ruta: string, opciones: RequestInit & { headers?: Record<string, string> } = {}) {
  // Al abrir o recargar la página, la memoria está vacía: primero pedimos un pase con la cookie
  if (!paseCorto) {
    const resultado = await renovarSesion();
    if (resultado === 'caducada') return sesionCaducada();
    if (resultado === 'sin-conexion') throw new TypeError('No se pudo conectar con el servidor');
  }

  const hacerPeticion = () =>
    fetch(`${API_URL}${ruta}`, { ...opciones, headers: { ...opciones.headers, Authorization: `Bearer ${paseCorto}` } });

  let respuesta = await hacerPeticion();

  // 401 = el pase corto ha caducado (es normal: dura 15 minutos). Pedimos otro y repetimos UNA vez.
  if (respuesta.status === 401) {
    const resultado = await renovarSesion();
    if (resultado === 'caducada') return sesionCaducada();
    if (resultado === 'sin-conexion') throw new TypeError('No se pudo conectar con el servidor');
    respuesta = await hacerPeticion();
    // Si ni con un pase recién hecho nos deja pasar, algo va mal: cerramos la sesión del todo
    // (también la cookie, para no entrar y salir en bucle) y volvemos a "Entrar"
    if (respuesta.status === 401) {
      await cerrarSesion();
      return sesionCaducada();
    }
  }
  return respuesta;
}

// Cerrar sesión DE VERDAD: el servidor anula el pase de renovación y aquí se olvida todo
export async function cerrarSesion() {
  olvidarSesion();
  try {
    await fetch(`${API_URL}/api/auth/cerrar-sesion`, { method: 'POST', credentials: 'include' });
  } catch {
    // Sin conexión: aquí ya no queda nada guardado; el pase de renovación caducará solo
  }
}
