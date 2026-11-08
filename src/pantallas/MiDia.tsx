// pantallas/MiDia.tsx
// Mi día: la pantalla a la que llegas al entrar (Fase 7).
// Web (paso 7.4), igual que el prototipo: arriba "Así va tu día" (con la nota pegada y "Reorganizar mi día");
// a la derecha las "Notas sueltas" (tareas de hoy sin hora, con su botón "A las 12:30") y el "Resumen del día" (el hilo, la frase y ahora / después).
// A la izquierda, la línea de tiempo "la libreta" (paso 7.5). El móvil ("Hoy") llega en el 7.6.
// Los cálculos están en midia/dia.ts (con sus pruebas); aquí se guarda y se dibuja.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvisoFlotante, { type DatosAviso } from '../componentes/base/AvisoFlotante';
import PantallaProvisional from './PantallaProvisional';
import BriefingDia, { type EstadoReorganizar } from './midia/BriefingDia';
import { ResumenDia, SinHoraAsignada } from './midia/PanelesDia';
import LineaTiempo from './midia/LineaTiempo';
import { useTareas, type Tarea } from './useTareas';
import {
  aCambiosHorario,
  choques,
  hiloDelDia,
  inicioDe,
  loImportante,
  planificar,
  separar,
  reorganizar,
  resumenDelDia,
  textoBriefing,
  type Plan,
} from './midia/dia';
import { cambiarHorario } from './tareas/guardar';
import { horaConCeros } from './tareas/frase';
import { textoHora } from './tareas/pulso';
import { hoyISO } from '../utils/dias';
import { useEsWeb } from '../utils/useEsWeb';

// El botón se queda en "Reorganizando…" al menos este rato (para que se vean los bloques ordenarse)
// y luego enseña "✓ Listo" un momento, igual que el prototipo
const MIN_TRABAJANDO_MS = 700;
const LISTO_MS = 1600;
const esperar = (ms: number) => new Promise((fin) => setTimeout(fin, ms));

const minutosAhora = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

function MiDia() {
  const esWeb = useEsWeb();
  const navigate = useNavigate();
  const { tareas, error, alCambiar, cambiarLocal } = useTareas();
  const [ahora, setAhora] = useState(minutosAhora);
  const [aviso, setAviso] = useState<DatosAviso | null>(null);
  const [estadoReorg, setEstadoReorg] = useState<EstadoReorganizar>(''); // mientras no es '', el botón no se puede pulsar
  const vivo = useRef(true); // si sales de Mi día a mitad, no se toca el estado de una pantalla que ya no está
  const [planificando, setPlanificando] = useState<number | null>(null);

  // La hora avanza cada minuto: así las atrasadas y el tiempo libre se recalculan solos
  useEffect(() => {
    const reloj = setInterval(() => setAhora(minutosAhora()), 60_000);
    return () => clearInterval(reloj);
  }, []);
  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);
  const cerrarAviso = useCallback(() => setAviso(null), []);

  const hoy = hoyISO();
  const resumen = resumenDelDia(tareas, hoy, ahora);
  const nombre = localStorage.getItem('nombre') || '';
  const { titular, detalle } = textoBriefing(resumen, nombre, ahora);
  const nota = loImportante(resumen);
  const hilo = hiloDelDia(tareas, hoy, ahora);
  // Para cada nota suelta, la hora a la que la pondría su botón (lo mismo que hará al pulsarlo)
  const huecos = new Map(
    resumen.sinHora.map((t) => {
      const plan = planificar(tareas, t.id, hoy, ahora);
      return [t.id, plan.tipo === 'colocadas' ? (plan.colocadas.get(t.id) ?? null) : null] as const;
    }),
  );
  // El atajo de la nota vacía: abre "Nueva tarea" (en Tareas) ya con prioridad alta; la fecha, hoy, es la de siempre
  const alAnadirImportante = () => navigate('/tareas', { state: { nuevaTarea: Date.now(), prioridad: 'alta' } });

  // Guarda un plan (Reorganizar o Planificar): se ve al momento y después se guarda en el servidor
  // con UNA sola petición (PATCH /api/tareas/horario, paso 7.2). Devuelve false si falla.
  const guardarPlan = async (plan: Extract<Plan, { tipo: 'colocadas' }>) => {
    cambiarLocal((lista) =>
      lista.map((t) =>
        plan.colocadas.has(t.id)
          ? {
              ...t,
              fecha_limite: hoy,
              hora_limite: `${horaConCeros(plan.colocadas.get(t.id)!)}:00`,
            }
          : t,
      ),
    );
    try {
      await cambiarHorario(aCambiosHorario(plan.colocadas, hoy));
      return true;
    } catch (e) {
      setAviso({
        titulo: 'No se pudo guardar',
        texto: e instanceof Error ? e.message : 'No se pudo cambiar el horario',
      });
      return false;
    } finally {
      alCambiar();
    }
  };

  const alReorganizar = async () => {
    if (estadoReorg !== '') return;
    const empiezo = Date.now();
    setEstadoReorg('trabajando');
    const plan = reorganizar(tareas, hoy, minutosAhora());
    let aviso: DatosAviso | null = null;
    let bien = true;
    if (plan.tipo === 'en-orden') aviso = { titulo: 'Tu día ya está en orden', texto: 'No hay tareas atrasadas ni sin hora.' };
    else if (plan.tipo === 'sin-hueco') {
      aviso = { titulo: 'No queda hueco hoy', texto: 'Mueve alguna tarea a mañana.' };
      bien = false;
    } else {
      const n = plan.colocadas.size;
      bien = await guardarPlan(plan); // si falla, guardarPlan ya enseña su aviso
      if (bien)
        aviso = {
          titulo: 'Día reorganizado',
          texto: n === 1 ? '1 tarea recolocada en los huecos libres, por prioridad.' : `${n} tareas recolocadas en los huecos libres, por prioridad.`,
        };
    }
    await esperar(Math.max(0, MIN_TRABAJANDO_MS - (Date.now() - empiezo)));
    if (!vivo.current) return;
    if (aviso) setAviso(aviso);
    if (!bien) return setEstadoReorg('');
    setEstadoReorg('listo');
    await esperar(LISTO_MS);
    if (vivo.current) setEstadoReorg('');
  };

  const alPlanificar = async (t: Tarea) => {
    if (planificando !== null) return;
    const plan = planificar(tareas, t.id, hoy, ahora); // la misma hora que dice el botón
    if (plan.tipo !== 'colocadas')
      return setAviso({
        titulo: 'No queda hueco hoy',
        texto: 'Prueba a moverla a mañana.',
      });
    setPlanificando(t.id);
    if (await guardarPlan(plan))
      setAviso({
        titulo: 'Tarea planificada',
        texto: `Colocada a las ${textoHora(plan.colocadas.get(t.id)!)}.`,
      });
    setPlanificando(null);
  };

  // ---------- La línea de tiempo (paso 7.5) ----------
  // Abrir una tarea: el editor de Tareas (como el lápiz del Calendario)
  const alAbrir = (id: number) => navigate('/tareas', { state: { editarTarea: { id, vez: Date.now() } } });
  // Un renglón libre: Nueva tarea con hoy y esa hora ya puestas
  const alCrear = (minuto: number) => navigate('/tareas', { state: { nuevaTarea: Date.now(), hora: horaConCeros(minuto) } });

  // Mover una tarea (arrastrándola o con Alt + flechas) o poner una nota suelta en la línea
  const alMover = async (id: number, minuto: number) => {
    const t = tareas.find((x) => x.id === id);
    if (!t || (inicioDe(t) === minuto && t.fecha_limite?.slice(0, 10) === hoy)) return; // no ha cambiado
    const despues = tareas.map((x) => (x.id === id ? { ...x, fecha_limite: hoy, hora_limite: `${horaConCeros(minuto)}:00` } : x));
    if (!(await guardarPlan({ tipo: 'colocadas', colocadas: new Map([[id, minuto]]), sinHueco: [] }))) return;
    const pisa = choques(despues, hoy).find((c) => c.primera.id === id || c.segunda.id === id);
    if (pisa) {
      const otra = pisa.primera.id === id ? pisa.segunda : pisa.primera;
      setAviso({ titulo: 'Ojo: se pisan', texto: `«${t.titulo}» coincide con «${otra.titulo}». Pulsa Separar si no era a propósito.` });
    } else setAviso({ titulo: 'Tarea movida', texto: `«${t.titulo}» ahora es a las ${textoHora(minuto)}.` });
  };

  // "Separar" (notita de se pisan): la segunda va justo después de la primera, al siguiente hueco libre
  const alSeparar = async (primeraId: number, segundaId: number) => {
    const plan = separar(tareas, primeraId, segundaId, hoy, ahora);
    if (plan.tipo !== 'colocadas') return setAviso({ titulo: 'No queda hueco hoy', texto: 'Prueba a mover una de las dos a mañana.' });
    const segunda = tareas.find((t) => t.id === segundaId);
    if (await guardarPlan(plan))
      setAviso({ titulo: 'Tareas separadas', texto: `«${segunda?.titulo ?? 'La tarea'}» ahora es a las ${textoHora(plan.colocadas.get(segundaId)!)}.` });
  };

  // "Recolocar" del Resumen del día: si solo se te pasó una, va a su primer hueco libre;
  // si se te pasaron varias, es lo mismo que "Reorganizar mi día"
  const alRecolocar = async () => {
    if (resumen.atrasadas.length !== 1) return alReorganizar();
    const t = resumen.atrasadas[0];
    if (planificando !== null) return;
    const plan = planificar(tareas, t.id, hoy, ahora);
    if (plan.tipo !== 'colocadas')
      return setAviso({
        titulo: 'No queda hueco hoy',
        texto: 'Prueba a moverla a mañana.',
      });
    setPlanificando(t.id);
    if (await guardarPlan(plan))
      setAviso({
        titulo: 'Tarea recolocada',
        texto: `«${t.titulo}» ahora es a las ${textoHora(plan.colocadas.get(t.id)!)}.`,
      });
    setPlanificando(null);
  };

  // El móvil ("Hoy", con la agenda vertical) se construye en el paso 7.6
  if (!esWeb) return <PantallaProvisional fase={7} />;

  return (
    <div className="flex flex-col gap-5">
      {error && <p className="text-sm text-[#b42318]">{error}</p>}
      <BriefingDia titular={titular} detalle={detalle} nota={nota} alAnadirImportante={alAnadirImportante} estado={estadoReorg} alReorganizar={alReorganizar} />
      <div className="flex items-start gap-5">
        <div className="min-w-0 grow">
          <LineaTiempo tareas={tareas} hoy={hoy} ahora={ahora} alAbrir={alAbrir} alMover={alMover} alCrear={alCrear} alSeparar={alSeparar} />
        </div>
        <div className="flex w-[340px] shrink-0 flex-col gap-4">
          <SinHoraAsignada tareas={resumen.sinHora} huecos={huecos} planificando={planificando} alPlanificar={alPlanificar} />
          <ResumenDia resumen={resumen} hilo={hilo} recolocando={planificando !== null || estadoReorg !== ''} alRecolocar={alRecolocar} />
        </div>
      </div>
      {aviso && <AvisoFlotante aviso={aviso} alCerrar={cerrarAviso} />}
    </div>
  );
}

export default MiDia;
