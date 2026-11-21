// pantallas/MiRitmo.tsx
// Mi ritmo (Fase 9). Lo que hay ahora:
//  - arriba, «Así va tu semana» con el pulso de la semana (CabeceraRitmo, paso 9.4)
//  - si aún tienes menos de 5 tareas tachadas: la nota «Mi ritmo se escribe tachando» (RitmoVacio, paso 9.4)
//  - si ya tienes más (paso 9.5): la fila de «las tres preguntas» (TresPreguntas), «Tu hora de tachar» (HoraDeTachar),
//    «Lo que se te atasca» (LoQueSeAtasca) y «Lo que tardas de verdad» (LoQueTardas); los demás bloques llegan después.
// Los datos: tu historial (useRitmo → GET /api/ritmo) y tus tareas (useTareas). Los cálculos, en ritmo.ts.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTareas } from './useTareas';
import { useRitmo } from './ritmo/useRitmo';
import { useAjustesRitmo } from './ritmo/useAjustesRitmo';
import {
  MINIMO_PARA_MAPA,
  cabeHoy,
  cadenaRacha,
  consejosAtasco,
  mapaEnergia,
  pulsoSemana,
  rachaAmable,
  recordRacha,
  semanaDeTareas,
  tachadasDe,
  tiemposDeVerdad,
} from './ritmo/ritmo';
import { aCambiosHorario, reorganizar } from './midia/dia';
import { borrarTarea, cambiarHorario, crearSubtarea, desatascarTarea } from './tareas/guardar';
import { hoyISO } from '../utils/dias';
import { useEsWeb } from '../utils/useEsWeb';
import AvisoFlotante, { type DatosAviso } from '../componentes/base/AvisoFlotante';
import CabeceraRitmo from './ritmo/CabeceraRitmo';
import RitmoVacio from './ritmo/RitmoVacio';
import HoraDeTachar from './ritmo/HoraDeTachar';
import LoQueSeAtasca, { type AccionesAtasco, type AtascadaConConsejo } from './ritmo/LoQueSeAtasca';
import LoQueTardas from './ritmo/LoQueTardas';
import TresPreguntas from './ritmo/TresPreguntas';

// «Partirla en pasos»: 3 pasos pequeños; el primero, de solo 15 minutos (como en el prototipo)
const PASOS = ['Empezar: solo 15 minutos', 'Avanzar lo principal', 'Repasar y cerrar'];
const DESHACER_MS = 5000;

const minutosAhora = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

function MiRitmo() {
  const esWeb = useEsWeb();
  const navigate = useNavigate();
  const { tareas, error: errorTareas, alCambiar } = useTareas();
  const { historial, error } = useRitmo();
  const { energia, tiempos: usarTiempos } = useAjustesRitmo();
  const [aviso, setAviso] = useState<DatosAviso | null>(null);
  const cerrarAviso = useCallback(() => setAviso(null), []);
  const [ocupadas, setOcupadas] = useState<number[]>([]);
  const [enPapelera, setEnPapelera] = useState<number[]>([]);
  const papelera = useRef<{ tarea: AtascadaConConsejo; reloj: ReturnType<typeof setTimeout> } | null>(null);
  const [ahora, setAhora] = useState(minutosAhora);
  const [reorganizando, setReorganizando] = useState(false);
  const hoy = hoyISO();

  // La hora avanza cada minuto: así «¿Te cabe lo de hoy?» se recalcula solo
  useEffect(() => {
    const reloj = setInterval(() => setAhora(minutosAhora()), 60_000);
    return () => clearInterval(reloj);
  }, []);

  const datos = useMemo(() => {
    if (!historial) return null;
    const tachadas = tachadasDe(historial.eventos);
    const racha = rachaAmable(tachadas, hoy);
    return {
      tachadas,
      racha,
      pulso: pulsoSemana(tachadas, racha, hoy),
      mapa: mapaEnergia(tachadas),
      record: recordRacha(tachadas, racha),
      cadena: cadenaRacha(tachadas, racha, hoy),
    };
  }, [historial, hoy]);

  // Las atascadas, con su consejo (las que están en la papelera no se ven)
  const atascadas = useMemo(
    () => (historial ? consejosAtasco(historial.atascadas, tareas).filter((a) => !enPapelera.includes(a.id)) : []),
    [historial, tareas, enPapelera],
  );

  const conTiempo = tareas.filter((t) => t.estado === 'completada' && t.minutos_reales).length;
  const tiempos = useMemo(() => tiemposDeVerdad(tareas), [tareas]);
  const semana = useMemo(() => semanaDeTareas(tareas, hoy, ahora), [tareas, hoy, ahora]);
  const cabe = useMemo(() => cabeHoy(tareas, hoy, ahora), [tareas, hoy, ahora]);
  const fallo = error || errorTareas;

  // El interruptor «Lo importante, a tu mejor hora»: se guarda en tu cuenta y avisa de lo que pasará al reorganizar
  const cambiarEnergia = async (nuevo: boolean) => {
    const guardado = await energia.cambiar(nuevo);
    if (!guardado) setAviso({ titulo: 'No se pudo guardar', texto: 'Revisa la conexión e inténtalo de nuevo.' });
    else if (nuevo) setAviso({ titulo: 'Lo importante, a tu mejor hora', texto: 'Al reorganizar tu día, tus tareas importantes irán a tu mejor rato.' });
    else setAviso({ titulo: 'Reorganizar como siempre', texto: 'Al reorganizar tu día, Tachit usará el primer hueco libre.' });
  };

  // El interruptor «Usar mis tiempos de verdad»: igual, se guarda en tu cuenta y avisa de lo que pasará al crear tareas
  const cambiarTiempos = async (nuevo: boolean) => {
    const guardado = await usarTiempos.cambiar(nuevo);
    if (!guardado) setAviso({ titulo: 'No se pudo guardar', texto: 'Revisa la conexión e inténtalo de nuevo.' });
    else if (nuevo) setAviso({ titulo: 'Usar mis tiempos de verdad', texto: 'Las tareas nuevas sin duración se crearán con lo que sueles tardar.' });
    else setAviso({ titulo: 'Duración de siempre', texto: 'Las tareas nuevas sin duración vuelven a 30 min.' });
  };

  // «¿Te cabe lo de hoy?» → «Reorganizar mi día»: lo mismo que en Mi día (las de hoy sin hora o atrasadas, a los huecos libres),
  // guardado con una sola petición (PATCH /api/tareas/horario)
  const alReorganizar = async () => {
    if (reorganizando) return;
    setReorganizando(true);
    try {
      const plan = reorganizar(tareas, hoy, minutosAhora());
      if (plan.tipo === 'en-orden') setAviso({ titulo: 'Nada que recolocar', texto: 'Para que te quepa, pasa alguna tarea a mañana.' });
      else if (plan.tipo === 'sin-hueco') setAviso({ titulo: 'No queda hueco hoy', texto: 'Mueve alguna tarea a mañana.' });
      else {
        await cambiarHorario(aCambiosHorario(plan.colocadas, hoy));
        const n = plan.colocadas.size;
        setAviso({
          titulo: 'Día reorganizado',
          texto: n === 1 ? '1 tarea recolocada en los huecos libres, por prioridad.' : `${n} tareas recolocadas en los huecos libres, por prioridad.`,
        });
      }
    } catch (e) {
      setAviso({ titulo: 'No se pudo guardar', texto: e instanceof Error ? e.message : 'No se pudo cambiar el horario' });
    } finally {
      setReorganizando(false);
      alCambiar();
    }
  };

  const irATarea = (id: number) => navigate('/tareas', { state: { editarTarea: { id, vez: Date.now() } } });

  // ---------- «Lo que se te atasca»: lo que hace cada botón ----------
  // Mientras una tarea tiene una acción en marcha, sus botones se desactivan (nada de dobles clics).
  // Al terminar se vuelve a pedir todo (alCambiar toca el "timbre" y también recarga el historial).
  const conTarea = async (id: number, trabajo: () => Promise<void>) => {
    if (ocupadas.includes(id)) return;
    setOcupadas((ids) => [...ids, id]);
    try {
      await trabajo();
    } catch (e) {
      setAviso({ titulo: 'No se pudo guardar', texto: e instanceof Error ? e.message : 'Inténtalo otra vez en un momento.' });
    } finally {
      setOcupadas((ids) => ids.filter((x) => x !== id));
      alCambiar();
    }
  };

  // «Ya no la hago»: se borra con «Deshacer» (como en Tareas): de verdad a los 5 s, si borras otra o si te vas
  const vaciarPapelera = useCallback(async () => {
    const p = papelera.current;
    if (!p) return;
    clearTimeout(p.reloj);
    papelera.current = null;
    try {
      await borrarTarea(p.tarea.id);
    } catch (e) {
      setEnPapelera((ids) => ids.filter((id) => id !== p.tarea.id));
      setAviso({ titulo: 'No se pudo borrar', texto: e instanceof Error ? e.message : 'No se pudo borrar la tarea' });
    } finally {
      alCambiar();
    }
  }, [alCambiar]);
  const vaciarAlSalir = useRef(vaciarPapelera);
  useEffect(() => {
    vaciarAlSalir.current = vaciarPapelera;
  });
  useEffect(() => {
    const alCerrarPestana = () => void vaciarAlSalir.current();
    window.addEventListener('pagehide', alCerrarPestana);
    return () => {
      window.removeEventListener('pagehide', alCerrarPestana);
      void vaciarAlSalir.current();
    };
  }, []);

  const deshacerBorrado = () => {
    const p = papelera.current;
    if (!p) return;
    clearTimeout(p.reloj);
    papelera.current = null;
    setEnPapelera((ids) => ids.filter((id) => id !== p.tarea.id));
    setAviso({ titulo: 'Tarea recuperada', texto: `“${p.tarea.titulo}” vuelve a estar donde la dejaste.` });
  };

  const acciones: AccionesAtasco = {
    hoy: (a) =>
      void conTarea(a.id, async () => {
        await desatascarTarea(a.id);
        setAviso({ titulo: 'Para hoy', texto: `«${a.titulo}» ya está en tu día. Búscale un hueco en Notas sueltas.` });
      }),
    partir: (a) =>
      void conTarea(a.id, async () => {
        for (const paso of PASOS) await crearSubtarea(a.id, paso);
        setAviso({ titulo: 'Partida en 3 pasos', texto: `El primero de «${a.titulo}» dura solo 15 minutos.` });
      }),
    verPasos: (a) => irATarea(a.id),
    soltar: (a) => {
      if (ocupadas.includes(a.id) || enPapelera.includes(a.id)) return;
      void vaciarPapelera(); // si ya había otra en la papelera, esa se borra ya (solo se deshace la última)
      setEnPapelera((ids) => [...ids, a.id]);
      papelera.current = { tarea: a, reloj: setTimeout(() => void vaciarAlSalir.current(), DESHACER_MS) };
      setAviso({ titulo: 'Tarea eliminada', texto: `“${a.titulo}”`, deshacer: deshacerBorrado, duracionMs: DESHACER_MS });
    },
  };

  return (
    <div className="flex max-w-[1180px] flex-col gap-5">
      {fallo && (
        <p role="alert" className="text-sm text-[#b42318]">
          {fallo}
        </p>
      )}
      {!datos && !fallo && <p className="text-sm text-[#5b6b7c]">Cargando tu ritmo…</p>}
      {datos && historial && (
        <>
          <CabeceraRitmo pulso={datos.pulso} racha={datos.racha} />
          {datos.tachadas.length < MINIMO_PARA_MAPA ? (
            <RitmoVacio hechas={datos.tachadas.length} conTiempo={conTiempo} textoIr={esWeb ? 'Ir a Mi día' : 'Ir a Hoy'} />
          ) : (
            <>
              <TresPreguntas
                semana={semana}
                cabe={cabe}
                ahora={ahora}
                record={datos.record}
                racha={datos.racha}
                cadena={datos.cadena}
                hoy={hoy}
                irATarea={irATarea}
                reorganizar={{ ocupado: reorganizando, alPulsar: () => void alReorganizar() }}
              />
              <div className="ritmo-rejilla">
                <HoraDeTachar mapa={datos.mapa} reorganizar={{ activo: energia.activo, disponible: energia.disponible, alCambiar: cambiarEnergia }} />
                <div className="ritmo-hueco" aria-hidden="true" />
                <LoQueSeAtasca atascadas={atascadas} eventos={historial.eventos} hoy={hoy} ocupadas={ocupadas} acciones={acciones} />
                <LoQueTardas tiempos={tiempos} usar={{ activo: usarTiempos.activo, disponible: usarTiempos.disponible, alCambiar: cambiarTiempos }} />
              </div>
              <p className="text-sm text-[#5b6b7c]">Los demás bloques (el progreso por categoría y el cierre de semana) llegan en los siguientes pasos.</p>
            </>
          )}
        </>
      )}
      {aviso && <AvisoFlotante aviso={aviso} alCerrar={cerrarAviso} />}
    </div>
  );
}

export default MiRitmo;
