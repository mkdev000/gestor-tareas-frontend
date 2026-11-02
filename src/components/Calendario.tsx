import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colorPorEstado } from '../utils/estado';
import { hoyISO } from '../utils/dias';
import type { Tarea } from '../pantallas/useTareas';
import { estiloPrioridad } from '../pantallas/tareas/prioridades';
import { alternarCompletada, borrarTarea } from '../pantallas/tareas/guardar';

// Calendario antiguo (se rehace como el prototipo en la Fase 8).
// Fase 6, paso 6.4: ya no tiene su propio formulario. El lápiz abre la tarea en el editor nuevo
// de Tareas (la caja de crear en la web, la hoja de abajo en el móvil), como hace el prototipo.

interface Props {
  tareas: Tarea[];
  onCambio: () => void;
}

const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const nombresMeses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function Calendario({ tareas, onCambio }: Props) {
  const ahora = new Date();
  const [anio, setAnio] = useState(ahora.getFullYear());
  const [mes, setMes] = useState(ahora.getMonth());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(
    `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
  );
  const navigate = useNavigate();

  // Hoy en TU hora (antes con toISOString, que entre las 00:00 y las 02:00 decía "ayer") (paso 4.7)
  const hoyTexto = hoyISO();

  const irMesAnterior = () => {
    if (mes === 0) {
      setMes(11);
      setAnio(anio - 1);
    } else {
      setMes(mes - 1);
    }
  };

  const irMesSiguiente = () => {
    if (mes === 11) {
      setMes(0);
      setAnio(anio + 1);
    } else {
      setMes(mes + 1);
    }
  };

  const diasEnElMes = new Date(anio, mes + 1, 0).getDate();
  const primerDiaSemana = (new Date(anio, mes, 1).getDay() + 6) % 7; // 0 = Lunes

  const celdas: (number | null)[] = [
    ...Array(primerDiaSemana).fill(null),
    ...Array.from({ length: diasEnElMes }, (_, i) => i + 1),
  ];

  const tareasPorFecha = (fecha: string) =>
    tareas.filter((t) => t.fecha_limite && t.fecha_limite.slice(0, 10) === fecha);

  const construirFecha = (dia: number) =>
    `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

  // Las mismas funciones que usa Tareas (guardar.ts): así una tarea que se repite crea la siguiente
  // también al completarla desde aquí, y se envían solo los campos que entiende el servidor
  const borrar = async (id: number) => {
    try {
      await borrarTarea(id);
      onCambio();
    } catch (err) {
      console.error(err);
    }
  };

  const completarODesmarcar = async (tarea: Tarea) => {
    try {
      await alternarCompletada(tarea);
      onCambio();
    } catch (err) {
      console.error(err);
    }
  };

  // Abre el editor nuevo de Tareas con esta tarea (vez: un número nuevo cada vez, por si la abres dos veces)
  const editar = (id: number) => navigate('/tareas', { state: { editarTarea: { id, vez: Date.now() } } });

  const tareasDelDiaSeleccionado = diaSeleccionado ? tareasPorFecha(diaSeleccionado) : [];

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        {/* h2: el título principal (h1) de la pantalla ya lo pone el marco (paso 4.7) */}
        <h2 className="font-bold text-xl text-marino">
          {nombresMeses[mes]} {anio}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={irMesAnterior}
            aria-label="Mes anterior"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-muted hover:bg-fondo transition cursor-pointer"
          >
            ‹
          </button>
          <button
            onClick={irMesSiguiente}
            aria-label="Mes siguiente"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-muted hover:bg-fondo transition cursor-pointer"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1">
        {diasSemana.map((d) => (
          <div key={d} className="text-center text-[11px] font-bold text-muted uppercase pb-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-6">
        {celdas.map((dia, i) => {
          if (dia === null) return <div key={`vacio-${i}`} />;

          const fecha = construirFecha(dia);
          const tareasDelDia = tareasPorFecha(fecha);
          const esHoy = fecha === hoyTexto;
          const seleccionado = fecha === diaSeleccionado;

          return (
            <button
              key={fecha}
              onClick={() => setDiaSeleccionado(fecha)}
              className={`min-h-16 rounded-lg border p-1.5 text-left transition cursor-pointer ${
                seleccionado
                  ? 'border-azul bg-azul-suave'
                  : esHoy
                  ? 'border-azul'
                  : 'border-gray-200 hover:bg-fondo'
              }`}
            >
              <span className={`text-xs font-bold ${esHoy ? 'text-azul' : 'text-texto'}`}>
                {dia}
              </span>
              <div className="flex flex-wrap gap-0.5 mt-1">
                {tareasDelDia.slice(0, 4).map((t) => (
                  <span
                    key={t.id}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: estiloPrioridad(t.prioridad).color }}
                  ></span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {diaSeleccionado && (
        <div className="border border-gray-200 rounded-xl p-5">
          <h3 className="font-bold text-sm text-marino mb-3">
            Tareas del {diaSeleccionado.split('-').reverse().join('/')}
          </h3>

          {tareasDelDiaSeleccionado.length === 0 ? (
            <p className="text-xs text-muted">No hay tareas para este día.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {tareasDelDiaSeleccionado.map((tarea) => {
                const completada = tarea.estado === 'completada';
                return (
                  <div key={tarea.id} className="flex items-center gap-2.5 border border-gray-100 rounded-lg px-3 py-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: estiloPrioridad(tarea.prioridad).color }}></span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold text-texto ${completada ? 'line-through text-muted' : ''}`}>
                        {tarea.titulo}
                      </p>
                      {/* Antes salía el "proyecto"; ahora son categorías (paso 6.3) */}
                      {(tarea.categorias ?? []).length > 0 && (
                        <p className="text-xs text-muted">{(tarea.categorias ?? []).map((c) => `#${c.nombre}`).join(' ')}</p>
                      )}
                    </div>
                    <button
                      onClick={() => completarODesmarcar(tarea)}
                      className={`text-xs font-bold rounded-full px-2.5 py-1 cursor-pointer transition ${colorPorEstado(tarea.estado)}`}
                    >
                      {completada ? 'Completada' : 'Pendiente'}
                    </button>
                    <button
                      onClick={() => editar(tarea.id)}
                      aria-label={`Editar: ${tarea.titulo}`}
                      title="Editar tarea"
                      className="text-muted hover:text-azul hover:bg-azul-suave p-1.5 rounded-md transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => borrar(tarea.id)}
                      aria-label={`Borrar: ${tarea.titulo}`}
                      title="Borrar tarea"
                      className="text-muted hover:text-rosa hover:bg-rosa-suave p-1.5 rounded-md transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6h12z" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default Calendario;