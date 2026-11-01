// pantallas/tareas/HojaCrearMovil.tsx
// La hoja para crear (o editar) una tarea en el MÓVIL (Fase 5, paso 5.6), igual que en el prototipo móvil.
// Sube desde abajo al pulsar el rombo + o al tocar una tarea. De arriba abajo:
//  1. El logo de Tachit (y "EDITANDO" + papelera si estás editando, o "Limpiar" si has elegido opciones)
//  2. El panel abierto (CUÁNDO, CUÁNTO DURA, AVISO, SE REPITE, ICONO o CATEGORÍA), si hay alguno
//  3. La caja para escribir la frase, con el botón de subtareas; debajo, "QUEDARÁ ASÍ" con el resumen
//     (o, si aún no has escrito nada, dos ejemplos para probar)
//  4. La barra de herramientas: Categoría + 5 iconos que abren los paneles, y el botón de enviar (rombo)
// La frase se lee con las mismas funciones que en la web (frase.ts) y se guarda igual (guardar.ts).
import { useState } from 'react';
import HojaInferior from '../../componentes/base/HojaInferior';
import LogoTachit from '../../components/LogoTachit';
import type { Tarea, CategoriaDeLista } from '../useTareas';
import {
  leerFrase, aplicarOpciones, avisoActual, desdeTarea, normalizar, textoDia, textoDuracion, textoAviso, textoRepeticion, textoHora,
  horaConCeros, OPCIONES_VACIAS, type OpcionesFrase,
} from './frase';
import { ICONOS_TAREA } from './iconosTarea';
import { DibujoIcono } from './PastillaIcono';
import { PanelCuandoHoja, PanelDuraHoja, PanelAvisoHoja, PanelRepiteHoja, PanelIconoHoja, PanelCategoriaHoja } from './PanelesHoja';
import { crearTarea, guardarEdicion, sincronizarSubtareas } from './guardar';

type Seccion = 'cuando' | 'dura' | 'aviso' | 'repite' | 'icono' | 'categoria';

const EJEMPLOS = ['Dentista el jueves a las 17:30 #Salud avísame', 'Regar las plantas cada lunes a las 9 #Casa 15 min'];

// Título y colores de la etiqueta de cada panel (como en el prototipo)
const PANEL: Record<Seccion, { titulo: string; color: string; fondo: string }> = {
  cuando: { titulo: 'CUÁNDO', color: 'var(--tachit-acento-fuerte)', fondo: 'var(--tachit-acento-suave)' },
  dura: { titulo: 'CUÁNTO DURA', color: '#b83a70', fondo: '#fdebf1' },
  aviso: { titulo: 'AVISO', color: '#5a3fb8', fondo: '#efeafc' },
  repite: { titulo: 'SE REPITE', color: '#0e6f78', fondo: '#e0f3f4' },
  icono: { titulo: 'ICONO', color: '#3d4f66', fondo: '#e6ebf1' },
  categoria: { titulo: 'CATEGORÍA', color: '#33475b', fondo: '#e6ebf1' },
};

// Los 5 botones de la barra de herramientas: su dibujo y su color cuando están puestos
const HERRAMIENTAS: { clave: Seccion; nombre: string; trazo: string; color: string }[] = [
  { clave: 'cuando', nombre: 'Cuándo · A qué hora', trazo: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4', color: 'var(--tachit-acento)' },
  { clave: 'dura', nombre: 'Cuánto dura', trazo: 'M6.5 3h11M6.5 21h11M7.5 3c0 5.5 9 5.5 9 9s-9 3.5-9 9M16.5 3c0 5.5-9 5.5-9 9s9 3.5 9 9', color: '#e0567a' },
  { clave: 'aviso', nombre: 'Aviso', trazo: 'M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 20.5a2 2 0 0 0 4 0', color: '#6d4fc9' },
  { clave: 'repite', nombre: 'Se repite', trazo: 'M17 2.5l3 3-3 3M4 11.5v-2a4 4 0 0 1 4-4h12M7 21.5l-3-3 3-3M20 12.5v2a4 4 0 0 1-4 4H4', color: '#12a3b0' },
  { clave: 'icono', nombre: 'Icono', trazo: 'M12 3l2.3 5.4 5.7.5-4.3 3.8 1.3 5.7L12 15.4l-5 3 1.3-5.7L4 8.9l5.7-.5z', color: '#3d4f66' },
];

export type ResultadoHoja = { tipo: 'creada' | 'editada'; id: number; titulo: string; texto: string } | { tipo: 'varias'; ids: number[] };

interface Props {
  hoy: string;
  ahora: number;
  tareas: Tarea[];
  categorias: CategoriaDeLista[];
  editando: Tarea | null;
  alCerrar: () => void;
  alGuardar: (resultado: ResultadoHoja) => void;
  alError: (mensaje: string) => void;
  alBorrar: (tarea: Tarea) => void;
}

function HojaCrearMovil({ hoy, ahora, tareas, categorias, editando, alCerrar, alGuardar, alError, alBorrar }: Props) {
  // La hoja se crea de nuevo cada vez que se abre (la pantalla le cambia la "key"), así empieza limpia
  const [inicial] = useState(() => (editando ? desdeTarea(editando) : { borrador: '', op: OPCIONES_VACIAS }));
  const [borrador, setBorrador] = useState(inicial.borrador);
  const [op, setOp] = useState<OpcionesFrase>(inicial.op);
  const [seccion, setSeccion] = useState<Seccion | null>(null);
  const [semana, setSemana] = useState(0);
  const [subtareas, setSubtareas] = useState<string[]>(() => (editando?.subtareas ?? []).map((s) => s.titulo));
  const [subBorrador, setSubBorrador] = useState('');
  const [subAbierto, setSubAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (cambio: Partial<OpcionesFrase>) => setOp((o) => ({ ...o, ...cambio }));
  const abrir = (s: Seccion) => setSeccion((actual) => (actual === s ? null : s));

  const hayBorrador = !!borrador.trim();
  const crudo = leerFrase(borrador, hoy);
  const fin = aplicarOpciones(crudo, op, hoy);
  const horaFin = fin.inicio !== null ? horaConCeros(fin.inicio) : '';
  const duracion = fin.duracion || 30;
  const aviso = avisoActual(op, fin);
  const hayOpciones = !!(op.fecha || op.hora || op.aviso !== 'nada' || op.dias.length || op.mensual || op.duracion || op.icono);

  // ¿Qué herramientas están "puestas"? (salen en su color, con un puntito)
  const puesta: Record<Seccion, boolean> = {
    cuando: !!(op.fecha || (hayBorrador && crudo.fecha)),
    dura: !!(op.duracion || crudo.duracion),
    aviso: aviso.indice > 0,
    repite: !!fin.repeticion,
    icono: !!op.icono,
    categoria: fin.categorias.length > 0,
  };
  const numeroDia = Number((op.fecha || (hayBorrador && crudo.fecha) || hoy).slice(8, 10));

  const textoAvisoCorto = aviso.indice > 0 ? (aviso.valor === '0' ? 'A la hora' : textoAviso(Number(aviso.valor))) : 'Sin aviso';
  const resumen = [
    op.fecha ? textoDia(op.fecha, hoy) : fin.fecha ? textoDia(fin.fecha, hoy) : 'Hoy',
    horaFin ? `${horaFin}–${textoHora((fin.inicio! + duracion) % 1440)}` : `sin hora · ${textoDuracion(duracion)}`,
    aviso.indice > 0 ? `aviso ${aviso.valor === '0' ? 'a la hora' : textoAviso(Number(aviso.valor)).toLowerCase()}` : 'sin aviso',
    fin.repeticion ? textoRepeticion(fin.repeticion, fin.dias).toLowerCase() : 'una vez',
  ].join(' · ');

  const leyenda: Record<Seccion, string> = {
    cuando: `${op.fecha ? textoDia(op.fecha, hoy) : hayBorrador && crudo.fecha ? textoDia(crudo.fecha, hoy) : 'Hoy'} · ${horaFin || 'Sin hora'}`,
    dura: textoDuracion(duracion),
    aviso: textoAvisoCorto,
    repite: fin.repeticion ? textoRepeticion(fin.repeticion, fin.dias) : 'Una vez',
    icono: op.icono ? ICONOS_TAREA[op.icono].nombre : 'Sin icono',
    categoria: fin.categorias.length ? fin.categorias.map((n) => `#${n}`).join(' ') : 'Sin categoría',
  };

  // ---------- Subtareas ----------
  const anadirSubtarea = () => {
    const titulo = subBorrador.trim().slice(0, 150);
    if (!titulo) return;
    setSubtareas((lista) => [...lista, titulo]);
    setSubBorrador('');
    setSubAbierto(true);
  };

  // ---------- Guardar ----------
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
        await sincronizarSubtareas(editando, subtareas);
        alGuardar({ tipo: 'editada', id: editando.id, titulo: 'Tarea actualizada', texto: fin.titulo });
      } else {
        const id = await crearTarea(fin, hoy, categorias, subtareas);
        const fecha = fin.fecha || hoy;
        alGuardar({ tipo: 'creada', id, titulo: 'Tarea creada', texto: `${fin.titulo} · ${textoDia(fecha, hoy)}${fin.inicio !== null ? ` ${textoHora(fin.inicio)}` : ''}` });
      }
    } catch (error) {
      alError(error instanceof Error ? error.message : 'No se pudo guardar la tarea');
      setGuardando(false);
    }
  };

  // Pegar una lista de varias líneas: una tarea por línea
  const alPegar = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (editando) return;
    const lineas = e.clipboardData
      .getData('text')
      .split(/\r?\n/)
      .map((l) => l.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter(Boolean);
    if (lineas.length < 2) return;
    e.preventDefault();
    setGuardando(true);
    const ids: number[] = [];
    try {
      for (const linea of lineas) {
        const p = leerFrase(linea, hoy);
        if (p.titulo) ids.push(await crearTarea(p, hoy, categorias));
      }
    } catch (error) {
      alError(error instanceof Error ? error.message : 'No se pudieron crear todas las tareas');
    }
    setGuardando(false);
    if (ids.length) alGuardar({ tipo: 'varias', ids });
  };

  const propsPanel = { op, cambiar, crudo, fin, hayBorrador, hoy };
  const etiquetaCategoria = fin.categorias.length ? `#${fin.categorias[0]}${fin.categorias.length > 1 ? ` +${fin.categorias.length - 1}` : ''}` : 'Categoría';
  const colorCategoria = fin.categorias.length
    ? (categorias.find((c) => normalizar(c.nombre) === normalizar(fin.categorias[0]))?.color ?? 'var(--tachit-acento)')
    : 'var(--tachit-acento-borde)';

  return (
    <HojaInferior abierta alCerrar={alCerrar} etiqueta={editando ? 'Editar tarea' : 'Nueva tarea'}>
      {/* 1. Arriba: logo y acciones */}
      <div className="flex min-h-[30px] items-center gap-2 px-1">
        <span className="flex shrink-0 text-[#0f1f2e]">
          <LogoTachit ancho={86} colorCheck="var(--tachit-acento)" />
        </span>
        {editando && <span className="rounded-md bg-[#ffe6a8] px-2 py-1 text-[10px] font-extrabold tracking-[1.4px] text-[#7a4a00]">EDITANDO</span>}
        <span className="grow" />
        {hayOpciones && !editando && (
          <button type="button" onClick={() => setOp(OPCIONES_VACIAS)} className="hoja-limpiar">
            Limpiar
          </button>
        )}
        {editando && (
          <button type="button" onClick={() => alBorrar(editando)} aria-label="Borrar tarea" className="hoja-borrar">
            <DibujoIcono trazo="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" tam={16} grosor={2.2} />
          </button>
        )}
      </div>

      {/* 2. El panel abierto */}
      {seccion && (
        <div className="hoja-panel aparecer sin-barra">
          <div className="flex items-center gap-2">
            <span className="shrink-0 rounded-[7px] px-[9px] py-[5px] text-[11px] font-extrabold tracking-[1.4px]" style={{ color: PANEL[seccion].color, background: PANEL[seccion].fondo }}>
              {PANEL[seccion].titulo}
            </span>
            <span className="min-w-0 grow truncate text-right text-[13px] font-bold text-[#33475b]">{leyenda[seccion]}</span>
            <button type="button" onClick={() => setSeccion(null)} aria-label="Plegar" className="hoja-plegar">
              <DibujoIcono trazo="M6 9l6 6 6-6" tam={14} grosor={2.6} />
            </button>
          </div>
          {seccion === 'cuando' && (
            <PanelCuandoHoja {...propsPanel} semana={semana} setSemana={setSemana} tareas={tareas} editandoId={editando?.id ?? null} ahora={ahora} />
          )}
          {seccion === 'dura' && <PanelDuraHoja {...propsPanel} />}
          {seccion === 'aviso' && <PanelAvisoHoja {...propsPanel} />}
          {seccion === 'repite' && <PanelRepiteHoja {...propsPanel} />}
          {seccion === 'icono' && <PanelIconoHoja {...propsPanel} />}
          {seccion === 'categoria' && <PanelCategoriaHoja {...propsPanel} categorias={categorias} borrador={borrador} setBorrador={setBorrador} />}
        </div>
      )}

      {/* 3. La caja para escribir */}
      <div className="hoja-caja">
        <div className="flex items-center gap-1.5">
          <input
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
            aria-label="Escribe la tarea"
            enterKeyHint="send"
            placeholder="Gimnasio mañana a las 18 #Salud"
            className="hoja-input"
          />
          <button
            type="button"
            onClick={() => setSubAbierto((a) => !a)}
            aria-label="Añadir subtarea"
            aria-expanded={subAbierto}
            title="Añadir subtarea"
            className={'hoja-sub-boton' + (subAbierto ? ' abierto' : '')}
          >
            <DibujoIcono trazo="M6 4v9a3 3 0 0 0 3 3h3M6 9h6M15 9h5M15 16h5" tam={20} grosor={2.2} />
            {subtareas.length > 0 && <span className="hoja-sub-cuenta">{subtareas.length}</span>}
          </button>
        </div>

        {(subAbierto || subtareas.length > 0) && (
          <div className="relative mt-[-2px] mr-2 mb-0.5 ml-0.5 flex flex-col pl-[22px]">
            <span aria-hidden="true" className="hoja-arbol-tronco" />
            {subtareas.map((titulo, i) => (
              <div key={`${titulo}-${i}`} className="relative flex h-[34px] items-center gap-[9px]">
                <span aria-hidden="true" className="hoja-arbol-rama top-4" />
                <span aria-hidden="true" className="hoja-arbol-rombo lleno" />
                <span className="min-w-0 grow truncate text-sm font-semibold text-[#0f1f2e]">{titulo}</span>
                <button type="button" onClick={() => setSubtareas((l) => l.filter((_, k) => k !== i))} aria-label={`Quitar subtarea: ${titulo}`} className="hoja-sub-quitar">
                  ×
                </button>
              </div>
            ))}
            {subAbierto && (
              <div className="relative flex h-[38px] items-center gap-[9px]">
                <span aria-hidden="true" className="hoja-arbol-rama top-[18px]" />
                <span aria-hidden="true" className="hoja-arbol-rombo" />
                <input
                  value={subBorrador}
                  onChange={(e) => setSubBorrador(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      anadirSubtarea();
                    }
                  }}
                  maxLength={150}
                  aria-label="Escribe una subtarea"
                  // En el móvil no hay tecla "Enter" a la vista: se añade con el botón + (o con la tecla del teclado)
                  placeholder="Escribe una subtarea"
                  enterKeyHint="done"
                  className="hoja-sub-input"
                />
                <button type="button" onClick={anadirSubtarea} disabled={!subBorrador.trim()} aria-label="Añadir subtarea" className="hoja-sub-mas">
                  +
                </button>
              </div>
            )}
          </div>
        )}

        {hayBorrador ? (
          <div className="flex min-w-0 items-baseline gap-1.5 pr-2">
            <span className="shrink-0 text-[9px] font-extrabold tracking-[1.4px] text-tachit-acento-fuerte">QUEDARÁ ASÍ</span>
            <span className="truncate text-xs font-semibold text-[#5b6b7c]">{resumen}</span>
          </div>
        ) : (
          <div className="sin-barra -ml-0.5 flex gap-1.5 overflow-x-auto pr-2">
            {EJEMPLOS.map((ejemplo) => (
              <button key={ejemplo} type="button" onClick={() => setBorrador(ejemplo)} className="hoja-ejemplo">
                {ejemplo}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Barra de herramientas y botón de enviar */}
      <div className="flex items-center gap-1">
        <div className="hoja-herramientas sin-barra">
          <button
            type="button"
            onClick={() => abrir('categoria')}
            aria-label="Categoría"
            aria-expanded={seccion === 'categoria'}
            className={'hoja-chip-categoria' + (seccion === 'categoria' ? ' abierta' : fin.categorias.length ? ' puesta' : '')}
            style={fin.categorias.length && seccion !== 'categoria' ? { borderColor: colorCategoria } : undefined}
          >
            <span className="h-2 w-2 shrink-0 rotate-45 rounded-[3px]" style={{ background: colorCategoria }} />
            <span className="truncate">{etiquetaCategoria}</span>
          </button>
          {HERRAMIENTAS.map((h) => {
            const abierta = seccion === h.clave;
            const marcada = puesta[h.clave] || (h.clave === 'cuando' && !!horaFin);
            return (
              <button
                key={h.clave}
                type="button"
                onClick={() => abrir(h.clave)}
                aria-label={h.nombre}
                aria-expanded={abierta}
                className="hoja-herramienta"
                style={
                  abierta
                    ? { background: '#ffffff', color: h.color, boxShadow: `inset 0 0 0 2px ${h.color}` }
                    : marcada
                      ? { background: '#ffffff', color: h.color }
                      : undefined
                }
              >
                <DibujoIcono trazo={h.trazo} tam={22} grosor={2} />
                {h.clave === 'cuando' && <span className="hoja-herramienta-numero">{numeroDia}</span>}
                {(h.clave === 'cuando' ? !!horaFin : marcada) && <span className="hoja-herramienta-punto" style={{ background: h.color }} />}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={enviar}
          disabled={!hayBorrador || guardando}
          aria-label={hayBorrador ? (editando ? 'Guardar cambios' : 'Añadir tarea') : 'Escribe la tarea para añadirla'}
          className="hoja-enviar"
        >
          <span className="flex -rotate-45">
            <DibujoIcono trazo={editando ? 'M5 12.5l4.5 4.5L19 7.5' : 'M12 19V5M5.5 11.5L12 5l6.5 6.5'} tam={22} grosor={3} />
          </span>
        </button>
      </div>
    </HojaInferior>
  );
}

export default HojaCrearMovil;
