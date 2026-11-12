// pantallas/Calendario.tsx
// Calendario (Fase 8, paso 8.3): en la web, el mes con «la ficha» como en el prototipo:
//  - arriba: ‹ Noviembre 2026 › para cambiar de mes y, a la derecha, «Hoy» para volver a hoy
//  - "Noviembre: 4 de 11 tachadas" con su barra
//  - cada día es una ficha (CasillaMes.tsx): el número se va tachando según tachas sus tareas
//  - a la derecha, la página de libreta del día elegido (PaginaDia.tsx), donde puedes tachar,
//    abrir una tarea o «+ Añadir tarea este día»
// Los cálculos (qué días se ven, qué tareas tiene cada uno, qué está atrasado...) están en calendario/calendario.ts.
// En el móvil (paso 8.5), la misma ficha en pequeño (calendario/MesMovil.tsx) y la página del día debajo.
// La vista «Semana» llega en el paso 8.4.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AvisoFlotante, { type DatosAviso } from '../componentes/base/AvisoFlotante';
import { useTareas, type Tarea } from './useTareas';
import { alternarCompletada } from './tareas/guardar';
import { textoDia } from './tareas/frase';
import { DibujoIcono } from './tareas/PastillaIcono';
import CasillaMes from './calendario/CasillaMes';
import PaginaDia from './calendario/PaginaDia';
import MesMovil from './calendario/MesMovil';
import { cuadriculaMes, estadoEnCalendario, mesVecino, primeroDeMes, tachadoDelMes, tareasDelDia, tareasPorDia, tituloMes } from './calendario/calendario';
import { esFechaValida, hoyISO } from '../utils/dias';
import { useEsWeb } from '../utils/useEsWeb';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const minutosAhora = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

function PantallaCalendario() {
  const esWeb = useEsWeb();
  const navigate = useNavigate();
  const location = useLocation();
  const { tareas, error, alCambiar, cambiarLocal } = useTareas();
  const hoy = hoyISO();
  const [ahora, setAhora] = useState(minutosAhora);
  const [mes, setMes] = useState(() => primeroDeMes(hoy)); // el día 1 del mes que se ve
  const [elegido, setElegido] = useState(hoy); // el día cuya página sale a la derecha
  const [aviso, setAviso] = useState<DatosAviso | null>(null);
  const tachando = useRef(new Set<number>()); // tareas que se están tachando (evita el doble clic)
  const cerrarAviso = useCallback(() => setAviso(null), []);

  // La hora avanza cada minuto: así lo atrasado se recalcula solo
  useEffect(() => {
    const reloj = setInterval(() => setAhora(minutosAhora()), 60_000);
    return () => clearInterval(reloj);
  }, []);

  // «Ver en el calendario» (el aviso del día especial) llega con { dia: '2026-10-14' }: se abre ese día.
  // Solo una fecha que exista de verdad; se atiende una vez (mientras se dibuja) y después se borra de la dirección
  const pedido = location.state as { dia?: unknown } | null;
  const [ultimoPedido, setUltimoPedido] = useState<typeof pedido>(null);
  if (pedido && pedido !== ultimoPedido) {
    setUltimoPedido(pedido);
    if (esFechaValida(pedido.dia)) {
      setElegido(pedido.dia);
      setMes(primeroDeMes(pedido.dia));
    }
  }
  useEffect(() => {
    if (pedido) navigate(location.pathname + location.search, { replace: true, state: null });
  }, [pedido, navigate, location.pathname, location.search]);

  // Tachar desde la página del día: se ve al momento y después se guarda (igual que en Tareas y Mi día)
  const alTachar = async (t: Tarea) => {
    if (tachando.current.has(t.id)) return;
    tachando.current.add(t.id);
    cambiarLocal((lista) => lista.map((x) => (x.id === t.id ? { ...x, estado: x.estado === 'completada' ? 'pendiente' : 'completada' } : x)));
    try {
      const siguiente = await alternarCompletada(t);
      if (siguiente) setAviso({ titulo: 'Tarea recurrente completada', texto: `Se ha creado la siguiente para ${textoDia(siguiente, hoy).toLowerCase()}.` });
    } catch (e) {
      setAviso({ titulo: 'No se pudo guardar', texto: e instanceof Error ? e.message : 'No se pudo completar la tarea' });
    } finally {
      tachando.current.delete(t.id);
      alCambiar();
    }
  };
  const alAbrir = (id: number) => navigate('/tareas', { state: { editarTarea: { id, vez: Date.now() } } });
  const alAnadir = () => navigate('/tareas', { state: { nuevaTarea: Date.now(), fecha: elegido } });

  const dias = cuadriculaMes(mes, hoy);
  const porDia = tareasPorDia(
    tareas,
    dias.map((d) => d.fecha),
  );
  const estadoDe = (t: Tarea) => estadoEnCalendario(t, hoy, ahora);
  const delMes = tachadoDelMes(tareas, mes);
  const nombreMes = tituloMes(mes).split(' ')[0];
  const irAHoy = () => {
    setMes(primeroDeMes(hoy));
    setElegido(hoy);
  };
  const pagina = (
    <PaginaDia fecha={elegido} tareas={tareasDelDia(tareas, elegido)} estadoDe={estadoDe} alTachar={alTachar} alAbrir={alAbrir} alAnadir={alAnadir} />
  );

  // Móvil: el mes en pequeño y, debajo, la página del día. Si tocas un día gris (de otro mes), se pasa a ese mes
  if (!esWeb)
    return (
      <div className="flex flex-col gap-4">
        {error && <p className="text-sm text-[#b42318]">{error}</p>}
        <MesMovil
          mes={mes}
          dias={dias}
          porDia={porDia}
          elegido={elegido}
          tachado={delMes}
          estadoDe={estadoDe}
          alElegir={(fecha) => {
            setElegido(fecha);
            if (primeroDeMes(fecha) !== mes) setMes(primeroDeMes(fecha));
          }}
          alMover={(cuanto) => setMes(mesVecino(mes, cuanto))}
        />
        {pagina}
        {aviso && <AvisoFlotante aviso={aviso} alCerrar={cerrarAviso} />}
      </div>
    );

  return (
    <div className="flex items-start gap-5">
      <div className="cal-hoja">
        {error && <p className="mb-3 text-sm text-[#b42318]">{error}</p>}
        <div className="cal-cabecera">
          <button type="button" onClick={() => setMes(mesVecino(mes, -1))} aria-label="Mes anterior" className="cal-flecha">
            <DibujoIcono trazo="M15 6l-6 6 6 6" tam={18} grosor={2.4} />
          </button>
          <h2 aria-live="polite" className="cal-titulo">
            {tituloMes(mes)}
          </h2>
          <button type="button" onClick={() => setMes(mesVecino(mes, 1))} aria-label="Mes siguiente" className="cal-flecha">
            <DibujoIcono trazo="M9 6l6 6-6 6" tam={18} grosor={2.4} />
          </button>
          <span className="grow" />
          <button type="button" onClick={irAHoy} className="cal-hoy">
            Hoy
          </button>
        </div>

        <div className="cal-progreso">
          <span>{`${nombreMes}: ${delMes.hechas} de ${delMes.total} tachadas`}</span>
          <div className="cal-barra" aria-hidden="true">
            <i style={{ width: `${delMes.parte * 100}%` }} />
          </div>
        </div>

        <div className="cal-rejilla mb-1.5" aria-hidden="true">
          {DIAS_SEMANA.map((d) => (
            <span key={d} className="cal-dia-semana">
              {d}
            </span>
          ))}
        </div>
        <div className="cal-rejilla">
          {dias.map((d) => (
            <CasillaMes key={d.fecha} dia={d} tareas={porDia.get(d.fecha) ?? []} elegido={d.fecha === elegido} estadoDe={estadoDe} alElegir={setElegido} />
          ))}
        </div>

        <div className="cal-leyenda">
          <span>
            <i className="pendiente" />
            Pendiente
          </span>
          <span>
            <i className="hecha" />
            Hecha
          </span>
          <span>
            <i className="atrasada" />
            Atrasada
          </span>
        </div>
      </div>

      <div className="sticky top-4 w-[330px] shrink-0">{pagina}</div>

      {aviso && <AvisoFlotante aviso={aviso} alCerrar={cerrarAviso} />}
    </div>
  );
}

export default PantallaCalendario;
