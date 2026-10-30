// pages/Tareas.tsx
// La pantalla de Tareas DENTRO del marco nuevo (Fase 4, paso 4.7).
// Es la lista que ya tenías, sin su barra oscura antigua: ahora para moverse están la barra lateral
// (web) y la barra de abajo (móvil). En la Fase 5 se rehace entera como en el prototipo.
//  - Filtros: Todas · Hoy · Próximas · Recientes (con los botones redondos del paso 4.3)
//  - Categoría: si llegas desde la barra lateral (/tareas?categoria=3), solo se ven las de esa categoría
//  - "Nueva tarea" (cabecera o rombo +): abre el formulario
// "Mi ritmo" (antes "Reportes") y el calendario ya tienen su propia pantalla.
import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import FormularioTarea from '../components/FormularioTarea';
import ListaTareas from '../components/ListaTareas';
import Recientes from '../components/Recientes';
import ChipFiltro from '../componentes/base/ChipFiltro';
import { useTareas, type Tarea } from '../pantallas/useTareas';
import { hoyISO } from '../utils/dias';

type Filtro = 'todas' | 'hoy' | 'proximas' | 'recientes';

const SUBTITULOS: Record<Filtro, string> = {
  todas: 'Todo lo que tienes por hacer, en un solo sitio.',
  hoy: 'Lo que toca resolver antes de que acabe el día.',
  proximas: 'Lo que se acerca, para que no te pille por sorpresa.',
  recientes: 'Las últimas tareas que has añadido.',
};

function Tareas() {
  const { tareas, cargadas, error, alCambiar } = useTareas();
  const location = useLocation();
  const navigate = useNavigate();
  const [parametros] = useSearchParams();
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const nombre = localStorage.getItem('nombre') || 'Usuario';

  // "Nueva tarea" desde el marco: llega un número distinto cada vez que lo pulsas (Date.now()).
  // Recordamos el último que ya atendimos; si llega uno nuevo, el formulario se abre.
  // (Así no hace falta un useEffect que cambie el estado: se calcula al dibujar.)
  const peticionNueva = (location.state as { nuevaTarea?: number } | null)?.nuevaTarea;
  const [peticionAtendida, setPeticionAtendida] = useState<number | undefined>(undefined);
  const mostrarFormulario = formularioAbierto || (peticionNueva !== undefined && peticionNueva !== peticionAtendida);
  const cerrarFormulario = () => {
    setFormularioAbierto(false);
    setPeticionAtendida(peticionNueva);
    // Borramos el aviso del historial: si vuelves atrás a esta pantalla, el formulario no se abre solo
    if (peticionNueva !== undefined) navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
  };

  // Hoy en TU hora (antes se usaba toISOString, que entre las 00:00 y las 02:00 decía "ayer")
  const hoy = hoyISO();
  const dia = (t: Tarea) => (t.fecha_limite ? t.fecha_limite.slice(0, 10) : null);
  const deHoy = tareas.filter((t) => dia(t) === hoy && t.estado !== 'completada');
  const proximas = tareas.filter((t) => {
    const d = dia(t);
    return d !== null && d > hoy;
  });

  // Categoría elegida en la barra lateral (solo números: lo que venga raro en la dirección se ignora)
  const textoCategoria = parametros.get('categoria');
  const idCategoria = textoCategoria && /^\d+$/.test(textoCategoria) ? Number(textoCategoria) : null;
  const nombreCategoria =
    idCategoria === null ? null : tareas.flatMap((t) => t.categorias ?? []).find((c) => c.id === idCategoria)?.nombre ?? 'Categoría';

  const porFiltro: Record<Filtro, Tarea[]> = {
    todas: tareas,
    hoy: deHoy,
    proximas,
    recientes: [...tareas]
      .sort((a, b) => new Date(b.fecha_creacion.replace(' ', 'T')).getTime() - new Date(a.fecha_creacion.replace(' ', 'T')).getTime())
      .slice(0, 5),
  };
  const visibles = porFiltro[filtro].filter((t) => idCategoria === null || t.categorias?.some((c) => c.id === idCategoria));

  const FILTROS: { clave: Filtro; texto: string }[] = [
    { clave: 'todas', texto: 'Todas' },
    { clave: 'hoy', texto: 'Hoy' },
    { clave: 'proximas', texto: 'Próximas' },
    { clave: 'recientes', texto: 'Recientes' },
  ];

  return (
    <div className="flex max-w-[1100px] flex-col gap-4">
      {cargadas && tareas.length === 0 ? (
        // Sin ninguna tarea (el estado vacío bonito se diseña en la Fase 5)
        <div className="mt-12 text-center">
          <p className="mb-2 text-2xl font-extrabold">¡Hola, {nombre}!</p>
          <p className="mb-6 text-[#5b6b7c]">Aún no tienes ninguna tarea añadida.</p>
          <button
            type="button"
            onClick={() => setFormularioAbierto(true)}
            className="boton-principal cursor-pointer rounded-xl border-0 bg-tachit-acento px-6 py-3 font-extrabold text-tachit-sobre-acento"
          >
            Crear mi primera tarea
          </button>
        </div>
      ) : (
        <>
          <div role="group" aria-label="Filtrar tareas" className="flex flex-wrap gap-2">
            {FILTROS.map((f) => (
              <ChipFiltro
                key={f.clave}
                texto={f.texto}
                cantidad={f.clave === 'recientes' ? undefined : porFiltro[f.clave].length}
                activo={filtro === f.clave}
                alPulsar={() => setFiltro(f.clave)}
              />
            ))}
          </div>

          {nombreCategoria && (
            <p className="flex items-center gap-2 text-sm text-[#5b6b7c]">
              Solo la categoría <strong className="text-[#0f1f2e]">{nombreCategoria}</strong>
              <button
                type="button"
                onClick={() => navigate('/tareas')}
                className="cursor-pointer rounded-full border border-[#dde3ea] bg-white px-2.5 py-0.5 text-xs font-bold text-[#33475b] hover:border-tachit-acento-borde"
              >
                Ver todas ✕
              </button>
            </p>
          )}

          <p className="text-sm text-[#5b6b7c]">{SUBTITULOS[filtro]}</p>
          {error && <p className="text-sm text-[#b42318]">{error}</p>}

          {filtro === 'recientes' ? (
            <Recientes tareas={visibles} onCambio={alCambiar} />
          ) : visibles.length > 0 ? (
            <ListaTareas tareas={visibles} onCambio={alCambiar} />
          ) : (
            cargadas && <p className="text-sm text-[#5b6b7c]">No hay tareas aquí.</p>
          )}
        </>
      )}

      {mostrarFormulario && <FormularioTarea onTareaCreada={alCambiar} onCancelar={cerrarFormulario} />}
    </div>
  );
}

export default Tareas;
