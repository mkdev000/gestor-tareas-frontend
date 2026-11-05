// pantallas/MiDia.tsx
// Mi día: la pantalla a la que llegas al entrar (Fase 7).
// Web (paso 7.4), igual que el prototipo: arriba "Así va tu día" (con la nota pegada y "Reorganizar mi día");
// a la derecha "Sin hora asignada" (con Planificar) y el "Resumen del día".
// La línea de tiempo de la izquierda llega en el paso 7.5 y el móvil ("Hoy") en el 7.6.
// Los cálculos están en midia/dia.ts (con sus pruebas); aquí se guarda y se dibuja.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvisoFlotante, { type DatosAviso } from '../componentes/base/AvisoFlotante';
import PantallaProvisional from './PantallaProvisional';
import BriefingDia, { type EstadoReorganizar } from './midia/BriefingDia';
import { ResumenDia, SinHoraAsignada } from './midia/PanelesDia';
import { useTareas, type Tarea } from './useTareas';
import { aCambiosHorario, loImportante, planificar, reorganizar, resumenDelDia, textoBriefing, type Plan } from './midia/dia';
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
    const plan = planificar(tareas, t.id, hoy, minutosAhora());
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

  // El móvil ("Hoy", con la agenda vertical) se construye en el paso 7.6
  if (!esWeb) return <PantallaProvisional fase={7} />;

  return (
    <div className="flex flex-col gap-5">
      {error && <p className="text-sm text-[#b42318]">{error}</p>}
      <BriefingDia titular={titular} detalle={detalle} nota={nota} alAnadirImportante={alAnadirImportante} estado={estadoReorg} alReorganizar={alReorganizar} />
      <div className="flex items-start gap-5">
        {/* Aquí irá la línea de tiempo (paso 7.5) */}
        <div className="min-w-0 grow" />
        <div className="flex w-[340px] shrink-0 flex-col gap-4">
          <SinHoraAsignada tareas={resumen.sinHora} planificando={planificando} alPlanificar={alPlanificar} />
          <ResumenDia resumen={resumen} />
        </div>
      </div>
      {aviso && <AvisoFlotante aviso={aviso} alCerrar={cerrarAviso} />}
    </div>
  );
}

export default MiDia;
