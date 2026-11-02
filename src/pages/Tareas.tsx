// pages/Tareas.tsx
// La pantalla de Tareas, igual que en el prototipo (Fase 5):
//  1. Arriba (web): el saludo y el "Pulso del día" (paso 5.2)
//  2. La caja para crear escribiendo como hablas, con la frase de colores y sus paneles (paso 5.3)
//  3. Los filtros: Hoy · Próximo · Todas · Completadas · #categorías, y el buscador (paso 5.4)
//  4. Las tarjetas de tarea con sus subtareas (pasos 5.4 y 5.5)
// En el móvil (paso 5.6), como en el prototipo móvil: filtros que se deslizan de lado, tarjetas que se
// deslizan con el dedo (derecha = completar, izquierda = borrar, tocar = editar) y, para crear o editar,
// la hoja que sube desde abajo (HojaCrearMovil) en lugar de la caja de la web.
// La pantalla guarda "qué se ve" (filtro, búsqueda, qué tarjeta está abierta...);
// lo que se habla con el servidor está en pantallas/tareas/guardar.ts.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import ChipFiltro from '../componentes/base/ChipFiltro';
import AvisoFlotante, { type DatosAviso } from '../componentes/base/AvisoFlotante';
import CabeceraTareas from '../pantallas/tareas/CabeceraTareas';
import CajaCrear, { type ResultadoCaja } from '../pantallas/tareas/CajaCrear';
import TarjetaTarea from '../pantallas/tareas/TarjetaTarea';
import TarjetaMovil from '../pantallas/tareas/TarjetaMovil';
import HojaCrearMovil, { type ResultadoHoja } from '../pantallas/tareas/HojaCrearMovil';
import EstadoVacio from '../pantallas/tareas/EstadoVacio';
import { useEsWeb } from '../utils/useEsWeb';
import { useTareas, type Tarea } from '../pantallas/useTareas';
import { alternarCompletada, borrarTarea, crearSubtarea, marcarSubtarea } from '../pantallas/tareas/guardar';
import { normalizar, textoDia } from '../pantallas/tareas/frase';
import { minutosDe } from '../pantallas/tareas/pulso';
import { hoyISO } from '../utils/dias';

type Filtro = 'hoy' | 'proximo' | 'todas' | 'hechas';

const FILTROS: { clave: Filtro; texto: string }[] = [
  { clave: 'hoy', texto: 'Hoy' },
  { clave: 'proximo', texto: 'Próximo' },
  { clave: 'todas', texto: 'Todas' },
  { clave: 'hechas', texto: 'Completadas' },
];

const minutosAhora = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

function Tareas() {
  const { tareas, categorias, cargadas, error, alCambiar, cambiarLocal } = useTareas();
  const location = useLocation();
  const [parametros, setParametros] = useSearchParams();
  const [filtro, setFiltro] = useState<Filtro>('hoy');
  const [busqueda, setBusqueda] = useState('');
  const [abiertas, setAbiertas] = useState<Record<number, boolean>>({});
  const [resaltadas, setResaltadas] = useState<number[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [aviso, setAviso] = useState<DatosAviso | null>(null);
  const [focoLocal, setFocoLocal] = useState<number | undefined>(undefined);
  const [creandoPrimera, setCreandoPrimera] = useState(false);
  const [ahora, setAhora] = useState(minutosAhora);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ocupadas = useRef(new Set<number>()); // tareas que se están guardando (evita dobles clics)
  const esWeb = useEsWeb();
  const [cajaCerradaEn, setCajaCerradaEn] = useState<number | undefined>(undefined);

  // La hora avanza cada minuto (para saber qué tareas van "atrasadas")
  useEffect(() => {
    const reloj = setInterval(() => setAhora(minutosAhora()), 60_000);
    return () => {
      clearInterval(reloj);
      clearTimeout(temporizador.current);
    };
  }, []);

  const hoy = hoyISO();
  const cerrarAviso = useCallback(() => setAviso(null), []);
  const avisar = (titulo: string, texto: string) => setAviso({ titulo, texto });
  const avisarError = (texto: string) => setAviso({ titulo: 'No se pudo guardar', texto });

  // "Nueva tarea" desde el marco (botón de la barra o rombo +): llega un número nuevo cada vez
  const peticionNueva = (location.state as { nuevaTarea?: number } | null)?.nuevaTarea;
  const pedirFoco = focoLocal ?? peticionNueva;

  // "Editar" desde otra pantalla (el lápiz del Calendario, paso 6.4): llega { id, vez }.
  // Se atiende UNA vez por cada "vez" nueva. Se hace mientras se dibuja (sin useEffect), comparando
  // con la última que ya atendimos: es la forma que recomienda React para reaccionar a un dato nuevo.
  const peticionEditar = (location.state as { editarTarea?: { id: number; vez: number } } | null)?.editarTarea;
  const [edicionAtendida, setEdicionAtendida] = useState<number | undefined>(undefined);
  if (peticionEditar && peticionEditar.vez !== edicionAtendida) {
    setEdicionAtendida(peticionEditar.vez);
    setEditandoId(peticionEditar.id);
  }

  // Resaltar unas tarjetas un momento (las recién creadas, o a la que saltas desde el pulso)
  const resaltar = (ids: number[]) => {
    clearTimeout(temporizador.current);
    setResaltadas(ids);
    temporizador.current = setTimeout(() => setResaltadas([]), 2600);
  };

  // ---------- Filtros ----------
  // La categoría va en la dirección (/tareas?categoria=3), así funciona el enlace de la barra lateral
  const textoCategoria = parametros.get('categoria');
  const idCategoria = textoCategoria && /^\d+$/.test(textoCategoria) ? Number(textoCategoria) : null;

  const dia = (t: Tarea) => (t.fecha_limite ? t.fecha_limite.slice(0, 10) : null);
  const hecha = (t: Tarea) => t.estado === 'completada';
  const cumple = (t: Tarea, f: Filtro) => {
    const d = dia(t);
    if (f === 'hoy') return d === hoy;
    if (f === 'proximo') return d !== null && d > hoy && !hecha(t);
    if (f === 'hechas') return hecha(t);
    return true;
  };
  const deCategoria = (t: Tarea, id: number) => (t.categorias ?? []).some((c) => c.id === id);

  const elegirFiltro = (f: Filtro) => {
    setFiltro(f);
    if (idCategoria !== null) setParametros({}, { replace: true });
  };
  const elegirCategoria = (id: number) => setParametros({ categoria: String(id) }, { replace: true });

  const q = normalizar(busqueda);
  const visibles = tareas
    .filter((t) => (idCategoria !== null ? deCategoria(t, idCategoria) : cumple(t, filtro)))
    .filter((t) => !q || normalizar(t.titulo).includes(q))
    // Orden: las hechas al final; después por día y por hora (sin día o sin hora, al final)
    .sort((a, b) => {
      const porHecha = Number(hecha(a)) - Number(hecha(b));
      if (porHecha) return porHecha;
      const da = dia(a) ?? '9999';
      const db = dia(b) ?? '9999';
      if (da !== db) return da < db ? -1 : 1;
      return (minutosDe(a.hora_limite) ?? 9999) - (minutosDe(b.hora_limite) ?? 9999);
    });

  const editando = editandoId !== null ? (tareas.find((t) => t.id === editandoId) ?? null) : null;
  // Móvil: la hoja de crear está abierta si editas una tarea o si has pulsado "+" y aún no la has cerrado
  // (se calcula al dibujar: así no hace falta un useEffect que cambie el estado)
  const hojaAbierta = !esWeb && (editando !== null || (pedirFoco !== undefined && pedirFoco !== cajaCerradaEn));
  const cerrarHoja = () => {
    if (editando) setEditandoId(null);
    else setCajaCerradaEn(pedirFoco);
    // Si cierras la hoja sin crear la primera tarea, vuelve el estado vacío
    if (tareas.length === 0) setCreandoPrimera(false);
  };
  const alGuardarHoja = (r: ResultadoHoja) => {
    if (r.tipo === 'varias') {
      avisar('Pegado múltiple', r.ids.length === 1 ? '1 tarea creada.' : `${r.ids.length} tareas creadas, una por línea.`);
      elegirFiltro('todas');
      resaltar(r.ids);
    } else {
      avisar(r.titulo, r.texto);
      resaltar([r.id]);
    }
    setEditandoId(null);
    setCajaCerradaEn(pedirFoco);
    setCreandoPrimera(false);
    alCambiar();
  };

  // ---------- Acciones ----------
  const alGuardarCaja = (r: ResultadoCaja) => {
    if (r.tipo === 'creada') avisar('Tarea creada', 'Fecha, hora y categoría detectadas en tu frase.');
    if (r.tipo === 'varias') {
      avisar('Pegado múltiple', r.ids.length === 1 ? '1 tarea creada.' : `${r.ids.length} tareas creadas, una por línea.`);
      elegirFiltro('todas');
    }
    if (r.tipo === 'editada') {
      avisar('Tarea actualizada', r.titulo);
      setEditandoId(null);
    }
    setCreandoPrimera(false);
    resaltar(r.ids);
    alCambiar();
  };

  const completar = async (t: Tarea) => {
    if (ocupadas.current.has(t.id)) return;
    ocupadas.current.add(t.id);
    // Se ve tachada al momento; si el servidor dice que no, se vuelve a cargar la lista de verdad
    cambiarLocal((lista) => lista.map((x) => (x.id === t.id ? { ...x, estado: hecha(x) ? 'pendiente' : 'completada' } : x)));
    try {
      const siguiente = await alternarCompletada(t);
      if (siguiente) avisar('Tarea recurrente completada', `Se ha creado la siguiente para ${textoDia(siguiente, hoy).toLowerCase()}.`);
    } catch (e) {
      avisarError(e instanceof Error ? e.message : 'No se pudo completar la tarea');
    } finally {
      ocupadas.current.delete(t.id);
      alCambiar();
    }
  };

  const borrar = async (t: Tarea) => {
    if (ocupadas.current.has(t.id)) return;
    ocupadas.current.add(t.id);
    if (editandoId === t.id) setEditandoId(null);
    cambiarLocal((lista) => lista.filter((x) => x.id !== t.id));
    try {
      await borrarTarea(t.id);
      avisar('Tarea eliminada', `“${t.titulo}”`);
    } catch (e) {
      avisarError(e instanceof Error ? e.message : 'No se pudo borrar la tarea');
    } finally {
      ocupadas.current.delete(t.id);
      alCambiar();
    }
  };

  const marcarSub = async (t: Tarea, id: number, valor: boolean) => {
    cambiarLocal((lista) =>
      lista.map((x) => (x.id !== t.id ? x : { ...x, subtareas: (x.subtareas ?? []).map((s) => (s.id === id ? { ...s, hecha: valor } : s)) })),
    );
    try {
      await marcarSubtarea(id, valor);
    } catch (e) {
      avisarError(e instanceof Error ? e.message : 'No se pudo guardar la subtarea');
    } finally {
      alCambiar();
    }
  };

  const anadirSub = async (t: Tarea, titulo: string) => {
    try {
      await crearSubtarea(t.id, titulo);
      alCambiar();
      return true;
    } catch (e) {
      avisarError(e instanceof Error ? e.message : 'No se pudo añadir la subtarea');
      return false;
    }
  };

  // Desde el pulso: filtro "Hoy", sin búsqueda, abre sus subtareas, la resalta y va hasta ella
  const irATarea = (id: number) => {
    const t = tareas.find((x) => x.id === id);
    if (!t) return;
    setFiltro(dia(t) === hoy ? 'hoy' : 'todas');
    setBusqueda('');
    if (idCategoria !== null) setParametros({}, { replace: true });
    if (t.subtareas?.length) setAbiertas((a) => ({ ...a, [id]: true }));
    resaltar([id]);
    setTimeout(() => {
      const tarjeta = document.getElementById(`tarea-${id}`);
      tarjeta?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      tarjeta?.focus({ preventScroll: true });
    }, 60);
  };

  const sinTareas = cargadas && tareas.length === 0 && !creandoPrimera;

  return (
    <div className="flex flex-col gap-5">
      {sinTareas ? (
        // Sin ninguna tarea: "la tarjeta que se escribe sola" (paso 5.7).
        // "Crear mi primera tarea" abre la caja de crear (web) o la hoja de abajo (móvil)
        <EstadoVacio
          alCrear={() => {
            setCreandoPrimera(true);
            setFocoLocal(Date.now());
          }}
        />
      ) : (
        <>
          <CabeceraTareas tareas={tareas} alIrATarea={irATarea} />

          {/* Web: la caja de crear escribiendo. En el móvil se crea con la hoja de abajo (al final de la pantalla) */}
          {esWeb && (
            <CajaCrear
              key={editando ? `editar-${editando.id}` : 'nueva'}
              hoy={hoy}
              categorias={categorias}
              editando={editando}
              pedirFoco={pedirFoco}
              alGuardar={alGuardarCaja}
              alError={avisarError}
              alCancelarEdicion={() => setEditandoId(null)}
              alBorrar={borrar}
            />
          )}

          {/* Móvil: filtros que se deslizan de lado (sin contadores) y la pista de los gestos */}
          <div className="relative -mx-5 lg:hidden">
            <div role="group" aria-label="Filtrar tareas" className="sin-barra flex gap-2 overflow-x-auto px-5 pb-1">
              {FILTROS.map((f) => (
                <button
                  key={f.clave}
                  type="button"
                  aria-pressed={idCategoria === null && filtro === f.clave}
                  onClick={() => elegirFiltro(f.clave)}
                  className="filtro-movil"
                >
                  {f.clave === 'hechas' ? 'Hechas' : f.texto}
                </button>
              ))}
              {categorias.map((c) => (
                <button key={c.id} type="button" aria-pressed={idCategoria === c.id} onClick={() => elegirCategoria(c.id)} className="filtro-movil">
                  #{c.nombre}
                </button>
              ))}
              <span aria-hidden="true" className="w-6 shrink-0" />
            </div>
            <span aria-hidden="true" className="filtro-movil-degradado" />
          </div>
          <p className="flex items-center gap-2 text-xs text-[#5b6b7c] lg:hidden">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
            Toca una tarea para editarla · desliza a la derecha para completar, a la izquierda para borrar
          </p>

          {/* Web: filtros y buscador */}
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            <div role="group" aria-label="Filtrar tareas" className="flex flex-wrap items-center gap-2">
              {FILTROS.map((f) => (
                <ChipFiltro
                  key={f.clave}
                  texto={f.texto}
                  cantidad={tareas.filter((t) => cumple(t, f.clave)).length}
                  activo={idCategoria === null && filtro === f.clave}
                  alPulsar={() => elegirFiltro(f.clave)}
                />
              ))}
              {categorias.map((c) => (
                <ChipFiltro
                  key={c.id}
                  texto={`#${c.nombre}`}
                  color={c.color}
                  cantidad={tareas.filter((t) => deCategoria(t, c.id)).length}
                  activo={idCategoria === c.id}
                  alPulsar={() => elegirCategoria(c.id)}
                />
              ))}
            </div>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              maxLength={100}
              aria-label="Buscar tareas"
              placeholder="Buscar por título…"
              className="tareas-buscar"
            />
          </div>

          {error && <p className="text-sm text-[#b42318]">{error}</p>}

          {/* La lista */}
          <div className="flex flex-col gap-2.5">
            {visibles.map((t) =>
              esWeb ? (
                <TarjetaTarea
                  key={t.id}
                  tarea={t}
                  hoy={hoy}
                  ahora={ahora}
                  abierta={!!abiertas[t.id]}
                  resaltada={resaltadas.includes(t.id)}
                  editandose={editandoId === t.id}
                  alCompletar={() => completar(t)}
                  alAbrir={() => setAbiertas((a) => ({ ...a, [t.id]: !a[t.id] }))}
                  alEditar={() => setEditandoId(t.id)}
                  alBorrar={() => borrar(t)}
                  alMarcarSubtarea={(id, valor) => marcarSub(t, id, valor)}
                  alAnadirSubtarea={(titulo) => anadirSub(t, titulo)}
                />
              ) : (
                <TarjetaMovil
                  key={t.id}
                  tarea={t}
                  hoy={hoy}
                  ahora={ahora}
                  resaltada={resaltadas.includes(t.id)}
                  alCompletar={() => completar(t)}
                  alBorrar={() => borrar(t)}
                  alEditar={() => setEditandoId(t.id)}
                />
              ),
            )}
            {cargadas &&
              visibles.length === 0 &&
              (esWeb ? (
                <p className="rounded-xl border border-dashed border-[#cfd8e3] bg-white p-10 text-center text-[#5b6b7c]">
                  No hay tareas en esta vista.
                </p>
              ) : (
                <p className="rounded-2xl border border-dashed border-[#cfd8e3] p-8 text-center text-[#5b6b7c]">No hay tareas aquí.</p>
              ))}
          </div>
        </>
      )}

      {hojaAbierta && (
        <HojaCrearMovil
          key={editando ? `editar-${editando.id}` : `nueva-${pedirFoco}`}
          hoy={hoy}
          ahora={ahora}
          tareas={tareas}
          categorias={categorias}
          editando={editando}
          alCerrar={cerrarHoja}
          alGuardar={alGuardarHoja}
          alError={avisarError}
          alBorrar={borrar}
        />
      )}

      {aviso && <AvisoFlotante aviso={aviso} alCerrar={cerrarAviso} />}
    </div>
  );
}

export default Tareas;
