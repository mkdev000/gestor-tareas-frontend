// pantallas/ritmo/useRitmo.ts
// Pide tu historial a GET /api/ritmo (paso 9.2) y lo deja listo para Mi ritmo (paso 9.4).
//  - Pide las últimas 9 semanas (lo que necesitan la racha, el mapa de energía y la semana de arriba).
//  - Lo que llega se revisa con leerHistorial (nunca se usa sin mirarlo).
//  - Si alguna pantalla toca el "timbre" de las tareas (al tachar, crear o borrar), se vuelve a pedir.
import { useEffect, useState } from 'react';
import { pedirConSesion } from '../../utils/sesion';
import { alCambiarTareas } from '../../utils/avisosTareas';
import { hoyISO, sumarDias } from '../../utils/dias';
import { leerHistorial, type HistorialRitmo } from './ritmo';

const DIAS_DE_HISTORIAL = 62;

export function useRitmo() {
  const [historial, setHistorial] = useState<HistorialRitmo | null>(null);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  // El timbre: cuando cambian las tareas, se vuelve a pedir el historial
  useEffect(() => alCambiarTareas(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const hoy = hoyISO();
        // Las fechas van en la URL; URLSearchParams las escribe bien (sin trucos con el texto)
        const consulta = new URLSearchParams({ desde: sumarDias(hoy, -DIAS_DE_HISTORIAL), hasta: hoy });
        const respuesta = await pedirConSesion(`/api/ritmo?${consulta}`);
        // 401: la sesión ha caducado del todo (el portero, RutaProtegida, ya nos lleva a "Entrar")
        if (!activo || respuesta.status === 401) return;
        if (!respuesta.ok) throw new Error();
        const leido = leerHistorial(await respuesta.json().catch(() => null));
        if (!leido) throw new Error();
        if (!activo) return;
        setHistorial(leido);
        setError('');
      } catch {
        if (activo) setError('No se pudo cargar tu ritmo. Revisa la conexión e inténtalo de nuevo.');
      }
    };
    cargar();
    // Si sales de la pantalla antes de que llegue la respuesta, no se toca nada
    return () => {
      activo = false;
    };
  }, [version]);

  return { historial, error };
}
