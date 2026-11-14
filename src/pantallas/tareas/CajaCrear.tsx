// pantallas/tareas/CajaCrear.tsx
// La caja para crear tareas escribiendo como hablas (Fase 5, paso 5.3; rediseñada antes de la Fase 9 como una NOTA):
//  1. Escribes «Gimnasio mañana a las 18 #Salud 1h, avísame 10 min antes, cada lunes» y pulsas Enter (o la flechita).
//     Tachit entiende el día, la hora, la duración, el aviso, la repetición y la #categoría.
//  2. La nota es del color del tema, muy clarito (en Cacao, color cacao), y la sujeta un trozo de celo oscuro del tema:
//     ese celo es el botón «Opciones».
//     Al pulsarlo salen debajo las 6 opciones con su dibujo (Cuándo —el día y la hora juntos—, Dura, Aviso, Se repite, Icono y Categoría);
//     cada una abre su panel para cambiarla (lo que eliges gana a lo escrito). Si Tachit ha entendido algo de la frase,
//     el celo lleva un puntito naranja.
//  3. El icono de la lista (al lado de la flecha) abre las subtareas: filas finas debajo de lo que escribes
//     (escribes un paso y Enter). Se guardan junto con la tarea.
//  4. Abajo, «¿Cómo se escribe todo de una vez?» (subrayado con rotulador del color del tema) enseña la frase de ejemplo por colores.
//  5. Si pegas una lista de varias líneas, se crea una tarea por línea.
// Al pulsar el lápiz de una tarea, esta misma nota pasa a "EDITANDO" con los datos de esa tarea
// (al editar no salen las subtareas: se cambian en la propia tarjeta).
import { useEffect, useRef, useState } from 'react';
import type { Tarea, CategoriaDeLista } from '../useTareas';
import { leerFrase, aplicarOpciones, avisoActual, desdeTarea, horaConCeros, OPCIONES_VACIAS, type OpcionesFrase, type Prioridad } from './frase';
import { DibujoIcono } from './PastillaIcono';
import { BotonPrioridad } from './AnilloPrioridad';
import { PanelCuando, PanelDura, PanelAviso, PanelRepite, PanelIcono, PanelCategoria, type Seccion } from './PanelesFrase';
import OpcionesNota from './OpcionesNota';
import { crearTarea, guardarEdicion } from './guardar';

export type ResultadoCaja = { tipo: 'creada'; ids: number[] } | { tipo: 'varias'; ids: number[] } | { tipo: 'editada'; ids: number[]; titulo: string };

interface Props {
  hoy: string;
  categorias: CategoriaDeLista[];
  tareas?: Tarea[]; // para decir cuántas tareas tienes ya el día que eliges en «Cuándo»
  editando: Tarea | null; // la tarea que se está editando (o null para crear)
  pedirFoco?: number; // cambia cada vez que pulsas "Nueva tarea" en el marco
  prioridadPedida?: Prioridad | ''; // con qué prioridad empieza (el atajo de Mi día pide 'alta'; '' = la de siempre)
  horaPedida?: string; // a qué hora empieza ('15:00', desde un renglón libre de Mi día; '' = sin hora)
  fechaPedida?: string; // en qué día ('2026-10-14', desde «+ Añadir tarea este día» del Calendario; '' = el de siempre)
  textoPedido?: string; // lo que ya viene escrito ('Ir al gimnasio', desde una idea del Calendario sin tareas)
  alGuardar: (resultado: ResultadoCaja) => void;
  alError: (mensaje: string) => void;
  alCancelarEdicion: () => void;
  alBorrar: (tarea: Tarea) => void;
}

const EJEMPLO = 'Gimnasio mañana a las 18 #Salud 1h, avísame 10 min antes, cada lunes';
const MAX_SUBTAREAS = 20;
const minutosAhora = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};
const LISTA = 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01';
const FLECHA = 'M5 12h14M13 6l6 6-6 6';
const LAPIZ = 'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.6 7.6M11 11a2 2 0 1 0 0 .01';

// Los mandos del celo: dos rayas con su bolita, que se cambian de lado al abrir las opciones
function Mandos({ abiertas }: { abiertas: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 17h16" />
      <circle cx={abiertas ? 16 : 8} cy="7" r="2.6" fill="#ffffff" />
      <circle cx={abiertas ? 8 : 16} cy="17" r="2.6" fill="#ffffff" />
    </svg>
  );
}

// La explicación de «¿Cómo se escribe todo de una vez?»: la frase de ejemplo con cada parte de su color
function Explicacion() {
  const parte = (texto: string, color: string, fondo: string) => (
    <span className="nota-parte" style={{ color, background: fondo }}>
      {texto}
    </span>
  );
  const leyenda: [string, string][] = [
    ['cuándo', '#3a47b8'],
    ['hora', '#9a5b00'],
    ['categoría', '#1b7a50'],
    ['duración', '#c0306a'],
    ['aviso', '#6d4fc9'],
    ['se repite', '#0e7f87'],
  ];
  return (
    <div className="nota-explicacion aparecer">
      <p>
        Gimnasio {parte('mañana', '#3a47b8', 'rgba(58,71,184,.08)')} {parte('a las 18', '#9a5b00', 'rgba(154,91,0,.08)')}{' '}
        {parte('#Salud', '#1b7a50', 'rgba(27,122,80,.08)')} {parte('1h', '#c0306a', 'rgba(192,48,106,.08)')},{' '}
        {parte('avísame 10 min antes', '#6d4fc9', 'rgba(109,79,201,.08)')}, {parte('cada lunes', '#0e7f87', 'rgba(14,127,135,.08)')}
      </p>
      <ul className="nota-leyenda" aria-label="Qué significa cada color">
        {leyenda.map(([texto, color]) => (
          <li key={texto}>
            <i aria-hidden="true" style={{ background: color }} />
            {texto}
          </li>
        ))}
      </ul>
      <small>
        Lo que no escribas se queda como siempre: hoy, sin hora, 30 min, sin aviso y una sola vez. El icono y las subtareas se ponen con sus botones.
      </small>
    </div>
  );
}

function CajaCrear({
  hoy,
  categorias,
  tareas = [],
  editando,
  pedirFoco,
  prioridadPedida = '',
  horaPedida = '',
  fechaPedida = '',
  textoPedido = '',
  alGuardar,
  alError,
  alCancelarEdicion,
  alBorrar,
}: Props) {
  // Si llega una tarea para editar, la caja empieza con sus datos (la pantalla cambia la "key" al editar,
  // así React crea la caja de nuevo y no hace falta copiar datos con un useEffect)
  const [inicial] = useState(() =>
    editando
      ? desdeTarea(editando)
      : {
          borrador: textoPedido,
          op: {
            ...OPCIONES_VACIAS,
            prioridad: prioridadPedida,
            hora: horaPedida,
            fecha: fechaPedida,
          },
        },
  );
  const [borrador, setBorrador] = useState(inicial.borrador);
  const [op, setOp] = useState<OpcionesFrase>(inicial.op);
  // Si la caja ya estaba abierta y llega otro "Nueva tarea" que pide una prioridad, se pone esa
  // (se ajusta mientras se dibuja, comparando con el último pedido, sin useEffect)
  const [ultimoFoco, setUltimoFoco] = useState(pedirFoco);
  if (pedirFoco !== ultimoFoco) {
    setUltimoFoco(pedirFoco);
    if (!editando && (prioridadPedida || horaPedida || fechaPedida))
      setOp((o) => ({
        ...o,
        ...(prioridadPedida ? { prioridad: prioridadPedida } : {}),
        ...(horaPedida ? { hora: horaPedida } : {}),
        ...(fechaPedida ? { fecha: fechaPedida } : {}),
      }));
    // El texto de una idea solo se pone si la caja está vacía (para no borrar lo que estuvieras escribiendo)
    if (!editando && textoPedido && !borrador.trim()) setBorrador(textoPedido);
  }
  const [seccion, setSeccion] = useState<Seccion | null>(null);
  const [opcionesAbiertas, setOpcionesAbiertas] = useState(false);
  const [explicacion, setExplicacion] = useState(false);
  const [subtareas, setSubtareas] = useState<string[]>([]);
  const [subAbiertas, setSubAbiertas] = useState(false);
  const [subBorrador, setSubBorrador] = useState('');
  const [guardando, setGuardando] = useState(false);
  const campo = useRef<HTMLInputElement>(null);
  const campoSub = useRef<HTMLInputElement>(null);

  // Llevar la vista a la caja y poner el cursor en ella (al editar o al pulsar "Nueva tarea")
  const idEditando = editando?.id;
  useEffect(() => {
    if (idEditando === undefined && pedirFoco === undefined) return;
    const c = campo.current;
    if (!c) return;
    c.scrollIntoView({ behavior: 'smooth', block: 'center' });
    c.focus({ preventScroll: true });
  }, [idEditando, pedirFoco]);

  const cambiar = (cambio: Partial<OpcionesFrase>) => setOp((o) => ({ ...o, ...cambio }));
  const abrir = (s: Seccion) => setSeccion((actual) => (actual === s ? null : s));
  const cerrar = () => setSeccion(null);

  const hayBorrador = !!borrador.trim();
  const crudo = leerFrase(borrador, hoy);
  const fin = aplicarOpciones(crudo, op, hoy);
  const horaFin = fin.inicio !== null ? horaConCeros(fin.inicio) : '';
  const prioridadActual = op.prioridad || crudo.prioridad || 'media';
  const hayOpciones = !!(op.fecha || op.hora || op.aviso !== 'nada' || op.dias.length || op.mensual || op.icono || op.duracion || op.categoria);
  // Cuántas opciones tienen algo (elegido o entendido de la frase): si hay alguna, el celo lleva un puntito
  const cambiadas = [
    op.fecha || (hayBorrador && crudo.fecha),
    horaFin,
    op.duracion || crudo.duracion,
    avisoActual(op, fin).indice > 0,
    fin.repeticion,
    op.icono,
    op.categoria === '-' ? '' : op.categoria || fin.categorias[0],
  ].filter(Boolean).length;
  const verSubtareas = !editando && (subAbiertas || subtareas.length > 0);

  const limpiar = () => setOp(OPCIONES_VACIAS);

  // ---------- Subtareas (solo al crear) ----------
  const abrirSubtareas = () => {
    const abrirlas = !subAbiertas;
    setSubAbiertas(abrirlas);
    if (abrirlas) setTimeout(() => campoSub.current?.focus(), 30);
  };
  const anadirSubtarea = () => {
    const titulo = subBorrador.trim().slice(0, 150);
    if (!titulo || subtareas.length >= MAX_SUBTAREAS) return;
    setSubtareas((lista) => [...lista, titulo]);
    setSubBorrador('');
  };

  // Guardar (o guardar los cambios, si estás editando)
  const enviar = async () => {
    if (guardando || !hayBorrador) return;
    if (!fin.titulo) {
      alError('Falta el título: escribe qué tienes que hacer.');
      return;
    }
    setGuardando(true);
    try {
      if (editando) {
        await guardarEdicion(editando, fin, categorias);
        alGuardar({ tipo: 'editada', ids: [editando.id], titulo: fin.titulo });
        return; // la pantalla cierra el modo edición (y esta caja se vuelve a crear vacía)
      }
      const id = await crearTarea(fin, hoy, categorias, subtareas);
      setBorrador('');
      setOp(OPCIONES_VACIAS);
      setSubtareas([]);
      setSubAbiertas(false);
      setSubBorrador('');
      setSeccion(null);
      alGuardar({ tipo: 'creada', ids: [id] });
    } catch (error) {
      alError(error instanceof Error ? error.message : 'No se pudo guardar la tarea');
    } finally {
      setGuardando(false);
    }
  };

  // Crear varias de golpe (una por línea), solo con lo que diga cada frase
  const crearVarias = async (lineas: string[]) => {
    setGuardando(true);
    const ids: number[] = [];
    try {
      for (const linea of lineas) {
        const p = leerFrase(linea, hoy);
        if (p.titulo) ids.push(await crearTarea(p, hoy, categorias));
      }
    } catch (error) {
      alError(error instanceof Error ? error.message : 'No se pudieron crear todas las tareas');
    } finally {
      setGuardando(false);
      if (ids.length) alGuardar({ tipo: 'varias', ids });
    }
  };

  // Pegar una lista: si tiene más de una línea, se crea una tarea por línea
  // (se quitan los guiones, puntos y números del principio: "- Comprar pan", "1. Llamar")
  const alPegar = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (editando) return;
    const texto = e.clipboardData.getData('text');
    const lineas = texto
      .split(/\r?\n/)
      .map((l) => l.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter(Boolean);
    if (lineas.length > 1) {
      e.preventDefault();
      crearVarias(lineas);
    }
  };

  const propsPanel = {
    op,
    cambiar,
    crudo,
    fin,
    hayBorrador,
    hoy,
    alCerrar: cerrar,
  };
  const tareasDelDia = (fecha: string) => tareas.filter((t) => t.fecha_limite?.slice(0, 10) === fecha && t.id !== editando?.id).length;
  const textoGuardar = editando ? 'Guardar los cambios (o pulsa Enter)' : 'Guardar la tarea (o pulsa Enter)';

  return (
    <div className="flex flex-col gap-2.5">
      <section aria-label={editando ? 'Editar tarea' : 'Nueva tarea'} className={'nota-crear' + (editando ? ' editando' : '')}>
        {/* El celo que sujeta la nota es el botón «Opciones» */}
        <button
          type="button"
          onClick={() => {
            setOpcionesAbiertas((a) => !a);
            setSeccion(null);
          }}
          aria-expanded={opcionesAbiertas}
          aria-label={'Opciones: cuándo, hora, duración, aviso, se repite, icono y categoría' + (cambiadas ? ` (${cambiadas} con algo puesto)` : '')}
          title="Opciones"
          className={'nota-celo' + (opcionesAbiertas ? ' abierto' : '')}
        >
          <Mandos abiertas={opcionesAbiertas} />
          Opciones
          {!opcionesAbiertas && cambiadas > 0 && <span aria-hidden="true" className="nota-celo-punto" />}
        </button>

        {/* Aviso de "EDITANDO" (con Borrar y Cancelar) */}
        {editando && (
          <div className="aparecer flex items-center gap-3 rounded-xl border border-dashed border-[#f0c46a] bg-[#fff8e6] py-2 pr-2 pl-3">
            <span className="flex text-[#9a5b00]">
              <DibujoIcono trazo={LAPIZ} tam={18} grosor={2} />
            </span>
            <span className="rounded-md bg-[#ffe6a8] px-2 py-1 text-[10px] font-extrabold tracking-[1.4px] text-[#7a4a00]">EDITANDO</span>
            <span className="min-w-0 grow truncate text-[13px] text-[#7a4a00]">{editando.titulo}</span>
            <button type="button" onClick={() => alBorrar(editando)} className="editando-borrar">
              Borrar
            </button>
            <button type="button" onClick={alCancelarEdicion} className="editando-cancelar">
              Cancelar
            </button>
          </div>
        )}

        {/* La línea para escribir: prioridad, la frase, subtareas y guardar */}
        <div className="flex items-center gap-2">
          {/* La prioridad con un toque (paso 6.2): media → alta → baja → media */}
          <BotonPrioridad prioridad={prioridadActual} alCambiar={(prioridad) => cambiar({ prioridad })} />
          <input
            id="tachit-nueva-tarea"
            ref={campo}
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                enviar();
              }
            }}
            onPaste={alPegar}
            maxLength={300}
            autoComplete="off"
            aria-label="Nueva tarea en lenguaje natural"
            placeholder={EJEMPLO}
            className="h-[38px] min-w-0 grow border-0 bg-transparent font-jakarta text-[15.5px] text-[#0f1f2e] outline-none placeholder:text-[#8193a5]"
          />
          {!editando && (
            <button
              type="button"
              onClick={abrirSubtareas}
              aria-expanded={verSubtareas}
              aria-label={subtareas.length ? `Subtareas: ${subtareas.length}` : 'Añadir subtareas'}
              title="Subtareas"
              className={'nota-icono' + (verSubtareas ? ' activo' : '')}
            >
              <DibujoIcono trazo={LISTA} tam={18} />
              {subtareas.length > 0 && (
                <span aria-hidden="true" className="nota-icono-cuenta">
                  {subtareas.length}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={enviar}
            disabled={guardando}
            aria-label={textoGuardar}
            title={textoGuardar}
            className={'nota-guardar' + (hayBorrador ? '' : ' vacia')}
          >
            <DibujoIcono trazo={FLECHA} tam={16} grosor={2.6} />
          </button>
        </div>

        {/* Las subtareas: filas finas debajo de lo que escribes */}
        {verSubtareas && (
          <div className="nota-subtareas">
            {subtareas.length > 0 && (
              <ol>
                {subtareas.map((titulo, i) => (
                  <li key={`${i}-${titulo}`}>
                    <span aria-hidden="true" className="nota-casilla" />
                    <span className="min-w-0 grow truncate">{titulo}</span>
                    <button
                      type="button"
                      onClick={() => setSubtareas((lista) => lista.filter((_, k) => k !== i))}
                      aria-label={`Quitar «${titulo}»`}
                      className="nota-subtarea-quitar"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ol>
            )}
            {subtareas.length < MAX_SUBTAREAS && (
              <label className="nota-subtarea-nueva">
                <span aria-hidden="true" className="nota-casilla" />
                <input
                  ref={campoSub}
                  value={subBorrador}
                  onChange={(e) => setSubBorrador(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      anadirSubtarea();
                    } else if (e.key === 'Escape') {
                      setSubAbiertas(false);
                      campo.current?.focus();
                    }
                  }}
                  maxLength={150}
                  autoComplete="off"
                  aria-label="Añadir subtarea (escríbela y pulsa Enter)"
                  placeholder={subtareas.length ? 'Otro paso…' : 'Primer paso…'}
                />
              </label>
            )}
          </div>
        )}

        {/* Abajo, dentro de la nota: la ayuda subrayada con rotulador del color del tema */}
        <div className="nota-pie">
          <button type="button" onClick={() => setExplicacion((v) => !v)} aria-expanded={explicacion} className="nota-ayuda">
            {explicacion ? 'Ocultar la explicación' : '¿Cómo se escribe todo de una vez?'}
          </button>
          {hayOpciones && (
            <button type="button" onClick={limpiar} className="nota-quitar">
              Quitar opciones
            </button>
          )}
        </div>
      </section>

      {/* Las 6 opciones con su dibujo y, debajo, el panel de la que esté abierta */}
      {opcionesAbiertas && <OpcionesNota op={op} crudo={crudo} fin={fin} hayBorrador={hayBorrador} hoy={hoy} seccion={seccion} alAbrir={abrir} />}
      {opcionesAbiertas && seccion === 'cuando' && <PanelCuando {...propsPanel} ahora={minutosAhora()} tareasDelDia={tareasDelDia} />}
      {opcionesAbiertas && seccion === 'dura' && <PanelDura {...propsPanel} />}
      {opcionesAbiertas && seccion === 'aviso' && <PanelAviso {...propsPanel} />}
      {opcionesAbiertas && seccion === 'repite' && <PanelRepite {...propsPanel} />}
      {opcionesAbiertas && seccion === 'icono' && <PanelIcono {...propsPanel} />}
      {opcionesAbiertas && seccion === 'categoria' && <PanelCategoria {...propsPanel} categorias={categorias} />}

      {explicacion && <Explicacion />}
    </div>
  );
}

export default CajaCrear;
