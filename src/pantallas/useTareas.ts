// pantallas/useTareas.ts
// Pide tus tareas al servidor y las tiene listas para la pantalla (Fase 4, paso 4.7).
// Lo usan Tareas y Calendario, así ese código no se repite en las dos pantallas.
//  - tareas: la lista
//  - error: un mensaje si no se pudieron cargar
//  - categorias: todas tus categorías (para los filtros #Casa, #Salud... de Tareas, paso 5.4)
//  - cambiarLocal(): cambia la lista en pantalla AL MOMENTO, sin esperar al servidor (al tachar una
//    tarea se ve tachada enseguida). Después, alCambiar() trae la lista de verdad del servidor.
//  - alCambiar(): para llamarla después de crear, completar, editar o borrar una tarea.
//    Vuelve a pedir la lista y toca el "timbre" para que la barra lateral y la de abajo
//    actualicen el anillo de hoy, las categorías y la racha.
import { useCallback, useEffect, useState } from 'react';
import { pedirConSesion } from '../utils/sesion';
import { avisarCambioTareas } from '../utils/avisosTareas';
import type { Prioridad } from './tareas/frase';

export interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  // Solo baja, media o alta: 'urgente' y 'proyecto' se quitaron en la Fase 6 (migración 016 del backend)
  prioridad: Prioridad;
  fecha_limite: string | null;
  hora_limite: string | null;
  fecha_creacion: string;
  categorias?: { id: number; nombre: string; color: string }[];
  // Campos de Tachit (Fase 2). Los usan el "Pulso del día" (5.2) y la tarjeta de tarea (5.4)
  duracion_min?: number;
  aviso_min?: number | null;
  repeticion?: 'diaria' | 'semanal' | 'mensual' | null;
  dias_semana?: number[] | null;
  icono?: string | null;
  subtareas?: { id: number; uuid: string; titulo: string; hecha: boolean; orden: number }[];
}

export interface CategoriaDeLista {
  id: number;
  nombre: string;
  color: string;
}

export function useTareas() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDeLista[]>([]);
  const [cargadas, setCargadas] = useState(false);
  const [error, setError] = useState('');
  // Cambiar este número obliga a volver a pedir la lista (ver el useEffect de abajo)
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        // El cartero lleva el pase y lo renueva solo si ha caducado.
        // Las dos peticiones a la vez (Promise.all): tarda lo mismo que una
        const [respuesta, respuestaCategorias] = await Promise.all([pedirConSesion('/api/tareas'), pedirConSesion('/api/categorias')]);
        // 401: la sesión ha caducado del todo (el portero, RutaProtegida, ya nos lleva a "Entrar")
        if (!activo || respuesta.status === 401) return;
        if (!respuesta.ok) {
          setError('No se pudieron cargar las tareas');
          return;
        }
        const datos: Tarea[] = await respuesta.json();
        const datosCategorias: CategoriaDeLista[] = respuestaCategorias.ok ? await respuestaCategorias.json() : [];
        if (!activo) return;
        setTareas(Array.isArray(datos) ? datos : []);
        setCategorias(Array.isArray(datosCategorias) ? datosCategorias : []);
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

  const cambiarLocal = useCallback((cambio: (lista: Tarea[]) => Tarea[]) => setTareas(cambio), []);

  return { tareas, categorias, cargadas, error, alCambiar, cambiarLocal };
}
