// marco/useResumenBarra.ts
// Los datos que enseñan la barra lateral (paso 4.5) y la barra de abajo + el menú del móvil (paso 4.6):
//  - el anillo de hoy (en "Tareas"): cuántas te quedan pendientes y cuántas has hecho hoy
//  - "Categorías · esta semana": de lunes a domingo, cuántas tareas de cada categoría has hecho
//  - la racha (menú del móvil): cuántos días seguidos has tachado algo y los últimos 7 días
// Se pide UNA vez en el marco (MarcoApp) y se pasa a las tres piezas, así no se repiten peticiones.
// Es un "hook" propio: una función que empieza por "use" y que puede usar otros hooks de React
// (useState, useEffect). Así la barra solo se preocupa de dibujar, y aquí se piden y se cuentan los datos.
import { useEffect, useState } from 'react';
import { pedirConSesion } from '../utils/sesion';
import { alCambiarTareas } from '../utils/avisosTareas';
import { hoyISO, semanaDe, sumarDias } from '../utils/dias';

// Solo lo que la barra necesita de cada tarea y de cada categoría (la API manda más campos)
interface TareaApi {
  estado: string;
  fecha_limite: string | null;
  categorias?: { id: number }[];
}
interface CategoriaApi {
  id: number;
  nombre: string;
  color: string;
}

export interface ResumenCategoria {
  id: number;
  nombre: string;
  color: string;
  total: number; // tareas de esta semana con esta categoría
  hechas: number; // de esas, las completadas
}

export interface ResumenBarra {
  pendientes: number;
  hechasHoy: number;
  categorias: ResumenCategoria[];
  racha: number; // días seguidos (hasta hoy o hasta ayer) con alguna tarea tachada
  ultimos7: boolean[]; // de hace 6 días a hoy: ¿tachaste algo ese día?
}

const VACIO: ResumenBarra = { pendientes: 0, hechasHoy: 0, categorias: [], racha: 0, ultimos7: Array(7).fill(false) };

// Cuenta todo a partir de las tareas y categorías que manda el servidor
function calcularResumen(tareas: TareaApi[], categorias: CategoriaApi[]): ResumenBarra {
  const hoy = hoyISO();
  const { lunes, domingo } = semanaDe(hoy);
  // dateStrings en el backend: la fecha llega como "2026-10-29" (texto), se compara como texto sin problema
  const dia = (tarea: TareaApi) => (tarea.fecha_limite ? tarea.fecha_limite.slice(0, 10) : null);
  const hecha = (tarea: TareaApi) => tarea.estado === 'completada';

  const pendientes = tareas.filter((t) => !hecha(t)).length;
  const hechasHoy = tareas.filter((t) => hecha(t) && dia(t) === hoy).length;

  const deEstaSemana = tareas.filter((t) => {
    const d = dia(t);
    return d !== null && d >= lunes && d <= domingo;
  });

  const resumenCategorias = categorias.map((categoria) => {
    const suyas = deEstaSemana.filter((t) => t.categorias?.some((c) => c.id === categoria.id));
    return {
      id: categoria.id,
      nombre: categoria.nombre,
      color: categoria.color,
      total: suyas.length,
      hechas: suyas.filter(hecha).length,
    };
  });

  // La racha. De momento se cuenta con la FECHA de las tareas completadas; en la Fase 9 (Mi ritmo)
  // se contará con el historial (tarea_eventos), que sabe el día exacto en que las tachaste.
  const diasConHechas = new Set(tareas.filter(hecha).map(dia).filter((d): d is string => d !== null));
  const ultimos7 = [6, 5, 4, 3, 2, 1, 0].map((n) => diasConHechas.has(sumarDias(hoy, -n)));
  // Si hoy aún no has tachado nada, la racha no se rompe: se cuenta desde ayer
  let cursor = diasConHechas.has(hoy) ? hoy : sumarDias(hoy, -1);
  let racha = 0;
  while (diasConHechas.has(cursor)) {
    racha++;
    cursor = sumarDias(cursor, -1);
  }

  return { pendientes, hechasHoy, categorias: resumenCategorias, racha, ultimos7 };
}

export function useResumenBarra(): ResumenBarra {
  const [resumen, setResumen] = useState<ResumenBarra>(VACIO);

  useEffect(() => {
    let activo = true;
    // Si se piden datos dos veces seguidas, solo vale la respuesta de la ÚLTIMA petición
    // (si no, una respuesta lenta y vieja podría pisar a una nueva)
    let turno = 0;

    const cargar = async () => {
      const miTurno = ++turno;
      try {
        // Las dos peticiones a la vez (Promise.all), no una detrás de otra: tarda la mitad
        const [respuestaTareas, respuestaCategorias] = await Promise.all([
          pedirConSesion('/api/tareas'),
          pedirConSesion('/api/categorias'),
        ]);
        // Si algo falla (sesión caducada, error del servidor...), la barra se queda como estaba.
        // De la sesión caducada ya se encarga el portero (RutaProtegida).
        if (!respuestaTareas.ok || !respuestaCategorias.ok) return;
        const tareas: TareaApi[] = await respuestaTareas.json();
        const categorias: CategoriaApi[] = await respuestaCategorias.json();
        if (activo && miTurno === turno && Array.isArray(tareas) && Array.isArray(categorias)) {
          setResumen(calcularResumen(tareas, categorias));
        }
      } catch {
        // Sin conexión: se queda lo último que se cargó (el aviso "Sin conexión" llega en la Fase 12)
      }
    };

    cargar();
    // Volver a cargar cuando una pantalla avise de que las tareas cambiaron,
    // y cuando vuelves a esta pestaña (por si cambiaste algo desde el móvil)
    const dejarDeEscuchar = alCambiarTareas(cargar);
    window.addEventListener('focus', cargar);
    return () => {
      activo = false;
      dejarDeEscuchar();
      window.removeEventListener('focus', cargar);
    };
  }, []);

  return resumen;
}
