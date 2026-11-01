// pantallas/tareas/CajaCrear.tsx
// La caja para crear tareas escribiendo como hablas (Fase 5, paso 5.3), igual que en el prototipo:
//  1. Escribes: "Dentista el jueves a las 17:30 #Salud avísame" y pulsas Enter (o "Añadir").
//  2. Debajo, Tachit te enseña lo que ha entendido como una frase de colores:
//     "Dentista #Salud se guarda para [el jueves] [a las 17:30], dura [30 min], con [aviso 10 min antes] y [una sola vez]"
//  3. Si tocas una parte de colores, se abre su panel para cambiarla (lo que eliges gana a lo escrito).
//  4. Si pegas una lista de varias líneas, se crea una tarea por línea.
// Al pulsar el lápiz de una tarea, esta misma caja pasa a "EDITANDO" con los datos de esa tarea.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Tarea, CategoriaDeLista } from '../useTareas';
import {
  leerFrase, aplicarOpciones, avisoActual, desdeTarea, normalizar, textoDia, textoDuracion, textoAviso, textoRepeticion, horaConCeros,
  OPCIONES_VACIAS, type OpcionesFrase,
} from './frase';
import { ICONOS_TAREA } from './iconosTarea';
import { DibujoIcono } from './PastillaIcono';
import { PanelCuando, PanelHora, PanelDura, PanelAviso, PanelRepite, PanelIcono, type Seccion } from './PanelesFrase';
import { crearTarea, guardarEdicion } from './guardar';

// Ejemplos de "Prueba con:" (de la vida diaria) y la lista de 4 líneas del botón "Pegar"
const EJEMPLOS = ['Dentista el jueves a las 17:30 #Salud avísame', 'Regar las plantas cada lunes a las 9 #Casa 15 min'];
const LISTA_DE_EJEMPLO = [
  'Comprar pan y leche mañana #Casa',
  'Renovar el DNI el viernes a las 10 #Personal',
  'Limpiar la cocina hoy 30 min #Casa',
  'Pagar el seguro del coche el día 3 #Personal',
];

export type ResultadoCaja =
  | { tipo: 'creada'; ids: number[] }
  | { tipo: 'varias'; ids: number[] }
  | { tipo: 'editada'; ids: number[]; titulo: string };

interface Props {
  hoy: string;
  categorias: CategoriaDeLista[];
  editando: Tarea | null; // la tarea que se está editando (o null para crear)
  pedirFoco?: number; // cambia cada vez que pulsas "Nueva tarea" en el marco
  alGuardar: (resultado: ResultadoCaja) => void;
  alError: (mensaje: string) => void;
  alCancelarEdicion: () => void;
  alBorrar: (tarea: Tarea) => void;
}

// Las palabras de colores de la frase (como wTok en el prototipo)
function Ficha({ etiqueta, puesta, abierta, color, fondo, linea, alPulsar, icono }: {
  etiqueta: string; puesta: boolean; abierta: boolean; color: string; fondo: string; linea: string; alPulsar: () => void; icono?: string;
}) {
  const estilo: CSSProperties = abierta
    ? { color, fontWeight: 800, background: `linear-gradient(transparent 52%, ${fondo} 52%)`, boxShadow: `inset 0 -2px 0 ${color}` }
    : puesta
      ? { color, fontWeight: 800, boxShadow: `inset 0 -2px 0 ${color}` }
      : { color, fontWeight: 700, borderBottom: `2px dotted ${linea}`, borderRadius: 0 };
  return (
    <button type="button" aria-expanded={abierta} onClick={alPulsar} className="frase-ficha" style={estilo}>
      {icono && <DibujoIcono trazo={icono} tam={15} />}
      {etiqueta}
    </button>
  );
}

function CajaCrear({ hoy, categorias, editando, pedirFoco, alGuardar, alError, alCancelarEdicion, alBorrar }: Props) {
  // Si llega una tarea para editar, la caja empieza con sus datos (la pantalla cambia la "key" al editar,
  // así React crea la caja de nuevo y no hace falta copiar datos con un useEffect)
  const [inicial] = useState(() => (editando ? desdeTarea(editando) : { borrador: '', op: OPCIONES_VACIAS }));
  const [borrador, setBorrador] = useState(inicial.borrador);
  const [op, setOp] = useState<OpcionesFrase>(inicial.op);
  const [seccion, setSeccion] = useState<Seccion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const campo = useRef<HTMLInputElement>(null);

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
  const duracion = fin.duracion || 30;
  const aviso = avisoActual(op, fin);
  const hayOpciones = !!(op.fecha || op.hora || op.aviso !== 'nada' || op.dias.length || op.mensual || op.icono);
  const colorCategoria = (nombre: string) => categorias.find((c) => normalizar(c.nombre) === normalizar(nombre))?.color ?? '#4b5a6c';

  const limpiar = () => setOp(OPCIONES_VACIAS);

  // Añadir (o Guardar, si estás editando)
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
      const id = await crearTarea(fin, hoy, categorias);
      setBorrador('');
      setOp(OPCIONES_VACIAS);
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
    const lineas = texto.split(/\r?\n/).map((l) => l.replace(/^[-*•\d.)\s]+/, '').trim()).filter(Boolean);
    if (lineas.length > 1) {
      e.preventDefault();
      crearVarias(lineas);
    }
  };

  const propsPanel = { op, cambiar, crudo, fin, hayBorrador, hoy, alCerrar: cerrar };
  const icono = op.icono ? ICONOS_TAREA[op.icono] : undefined;

  return (
    <section aria-label={editando ? 'Editar tarea' : 'Nueva tarea'} className={'caja-crear' + (editando ? ' editando' : '')}>
      {/* Aviso de "EDITANDO" (con Borrar y Cancelar) */}
      {editando && (
        <div className="aparecer flex items-center gap-3 rounded-xl border border-dashed border-[#f0c46a] bg-[#fff8e6] py-2 pr-2 pl-3">
          <span className="flex text-[#9a5b00]">
            <DibujoIcono trazo="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.6 7.6M11 11a2 2 0 1 0 0 .01" tam={18} grosor={2} />
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

      {/* La línea para escribir */}
      <div className="flex items-center gap-2.5">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--tachit-acento-fuerte)" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
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
          placeholder="Escribe una tarea: “Gimnasio mañana a las 18 #Salud 1h”"
          className="h-11 min-w-0 grow border-0 bg-transparent font-jakarta text-base text-[#0f1f2e] outline-none placeholder:text-[#8193a5]"
        />
        <kbd className="hidden rounded-md border border-[#dde3ea] px-2 py-[3px] font-jakarta text-xs text-[#5b6b7c] lg:inline">Enter</kbd>
        <button type="button" onClick={enviar} disabled={guardando} className="caja-crear-boton">
          {editando ? 'Guardar' : 'Añadir'}
        </button>
      </div>

      {/* La frase de colores: lo que Tachit ha entendido */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 px-1 pt-3.5 pb-1 text-base leading-[1.6] text-[#5b6b7c]">
        <span className="text-base font-extrabold" style={{ color: hayBorrador ? '#0f1f2e' : '#9aa7b5' }}>
          {hayBorrador ? `“${fin.titulo || 'Falta el título'}”` : 'Tu tarea'}
        </span>
        {hayBorrador &&
          fin.categorias.map((nombre) => (
            <span
              key={nombre}
              className="rounded-lg px-[9px] py-[3px] text-sm font-extrabold"
              style={{ background: `${colorCategoria(nombre)}14`, color: colorCategoria(nombre) }}
            >
              #{nombre}
            </span>
          ))}
        <span>se guarda para</span>
        <Ficha
          etiqueta={(op.fecha ? textoDia(op.fecha, hoy) : fin.fecha ? textoDia(fin.fecha, hoy) : 'hoy').toLowerCase()}
          puesta={!!(op.fecha || (hayBorrador && crudo.fecha))}
          abierta={seccion === 'cuando'}
          color="var(--tachit-acento-fuerte)"
          fondo="var(--tachit-acento-suave)"
          linea="var(--tachit-acento-borde)"
          alPulsar={() => abrir('cuando')}
        />
        <Ficha
          etiqueta={horaFin ? `a las ${horaFin}` : 'sin hora'}
          puesta={!!horaFin}
          abierta={seccion === 'hora'}
          color="#9a5b00"
          fondo="#fff1d6"
          linea="#e8c98a"
          alPulsar={() => abrir('hora')}
        />
        <span className="-ml-1">, dura</span>
        <Ficha
          etiqueta={textoDuracion(duracion)}
          puesta={!!(op.duracion || crudo.duracion)}
          abierta={seccion === 'dura'}
          color="#b83a70"
          fondo="#fdebf1"
          linea="#eeb6ca"
          alPulsar={() => abrir('dura')}
        />
        <span className="-ml-1">, con</span>
        <Ficha
          etiqueta={aviso.indice > 0 ? (aviso.valor === '0' ? 'aviso a la hora' : `aviso ${textoAviso(Number(aviso.valor)).toLowerCase()}`) : 'sin aviso'}
          puesta={aviso.indice > 0}
          abierta={seccion === 'aviso'}
          color="#5a3fb8"
          fondo="#efeafc"
          linea="#c9bdf0"
          alPulsar={() => abrir('aviso')}
        />
        <span>y</span>
        <Ficha
          etiqueta={fin.repeticion ? textoRepeticion(fin.repeticion, fin.dias).toLowerCase() : 'una sola vez'}
          puesta={!!fin.repeticion}
          abierta={seccion === 'repite'}
          color="#0e6f78"
          fondo="#e0f3f4"
          linea="#a8d6da"
          alPulsar={() => abrir('repite')}
        />
        <span aria-hidden="true" className="mx-1.5 h-[22px] w-px bg-[#e3e8ef]" />
        <Ficha
          etiqueta={icono ? icono.nombre : '+ icono'}
          icono={icono?.trazo}
          puesta={!!icono}
          abierta={seccion === 'icono'}
          color="#3d4f66"
          fondo="#e6ebf1"
          linea="#c3ccd8"
          alPulsar={() => abrir('icono')}
        />
        {hayOpciones && (
          <button type="button" onClick={limpiar} className="caja-crear-limpiar">
            Limpiar
          </button>
        )}
      </div>
      <p className="px-1 text-xs text-[#8193a5]">Toca cualquier parte coloreada de la frase para cambiarla.</p>

      {seccion === 'cuando' && <PanelCuando {...propsPanel} />}
      {seccion === 'hora' && <PanelHora {...propsPanel} horaFin={horaFin} />}
      {seccion === 'dura' && <PanelDura {...propsPanel} />}
      {seccion === 'aviso' && <PanelAviso {...propsPanel} />}
      {seccion === 'repite' && <PanelRepite {...propsPanel} />}
      {seccion === 'icono' && <PanelIcono {...propsPanel} />}

      {/* Sin nada escrito: ejemplos para probar */}
      {!hayBorrador && !editando && (
        <div className="flex flex-wrap items-center gap-2 border-t border-[#edf1f5] pt-2.5">
          <span className="mr-1 text-[13px] text-[#5b6b7c]">Prueba con:</span>
          {EJEMPLOS.map((ejemplo) => (
            <button
              key={ejemplo}
              type="button"
              onClick={() => {
                setBorrador(ejemplo);
                campo.current?.focus();
              }}
              className="caja-crear-ejemplo"
            >
              {ejemplo}
            </button>
          ))}
          <button type="button" onClick={() => crearVarias(LISTA_DE_EJEMPLO)} disabled={guardando} className="caja-crear-pegar">
            Pegar una lista de 4 líneas
          </button>
        </div>
      )}
    </section>
  );
}

export default CajaCrear;
