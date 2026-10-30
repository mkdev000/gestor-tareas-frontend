// pantallas/useTareas.ts
// Pide tus tareas al servidor y las tiene listas para la pantalla (Fase 4, paso 4.7).
// Lo usan Tareas y Calendario, así ese código no se repite en las dos pantallas.
//  - tareas: la lista
//  - error: un mensaje si no se pudieron cargar
//  - alCambiar(): para llamarla después de crear, completar, editar o borrar una tarea.
//    Vuelve a pedir la lista y toca el "timbre" para que la barra lateral y la de abajo
//    actualicen el anillo de hoy, las categorías y la racha.
import { useCallback, useEffect, useState } from 'react';
import { pedirConSesion } from '../utils/sesion';
import { avisarCambioTareas } from '../utils/avisosTareas';

export interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  proyecto: string;
  fecha_limite: string | null;
  hora_limite: string | null;
  fecha_creacion: string;
  categorias?: { id: number; nombre: string; color: string }[];
}

export function useTareas() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargadas, setCargadas] = useState(false);
  const [error, setError] = useState('');
  // Cambiar este número obliga a volver a pedir la lista (ver el useEffect de abajo)
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        // El cartero lleva el pase y lo renueva solo si ha caducado
        const respuesta = await pedirConSesion('/api/tareas');
        // 401: la sesión ha caducado del todo (el portero, RutaProtegida, ya nos lleva a "Entrar")
        if (!activo || respuesta.status === 401) return;
        if (!respuesta.ok) {
          setError('No se pudieron cargar las tareas');
          return;
        }
        const datos: Tarea[] = await respuesta.json();
        if (!activo) return;
        setTareas(Array.isArray(datos) ? datos : []);
        setError('');
        setCargadas(true);
      } catch {
        if (activo) setError('No se pudo conectar con el servidor');
      }
    };
    cargar();
    // Si la pantalla se cierra antes de que llegue la respuesta, no tocamos nada
    return () => {
      activo = false;
    };
  }, [version]);

  const alCambiar = useCallback(() => {
    setVersion((v) => v + 1);
    avisarCambioTareas();
  }, []);

  return { tareas, cargadas, error, alCambiar };
}
