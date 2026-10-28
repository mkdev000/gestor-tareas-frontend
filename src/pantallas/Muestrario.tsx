// pantallas/Muestrario.tsx
// Página de prueba con todos los componentes base (Fase 4, paso 4.3), para compararlos con el prototipo.
// Cada columna lleva su propio data-tema, así se ven los 4 temas a la vez.
// SOLO existe en tu ordenador (npm run dev): en App.tsx la ruta está dentro de "import.meta.env.DEV",
// así que en la web publicada no aparece.
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import Boton from '../componentes/base/Boton';
import Chip from '../componentes/base/Chip';
import ChipFiltro from '../componentes/base/ChipFiltro';
import Interruptor from '../componentes/base/Interruptor';
import Panel from '../componentes/base/Panel';
import HojaInferior from '../componentes/base/HojaInferior';
import AvisoFlotante, { type DatosAviso } from '../componentes/base/AvisoFlotante';
import { TEMAS } from '../tema/temas';

// Colores de categoría y de prioridad del prototipo
const CATEGORIAS = [
  { nombre: 'Trabajo', color: '#17699e' },
  { nombre: 'iLerna', color: '#6d4fc9' },
  { nombre: 'Casa', color: '#1b7a50' },
  { nombre: 'Compras', color: '#9a5b00' },
  { nombre: 'Salud', color: '#b83a70' },
  { nombre: 'Running', color: '#0e6f78' },
];
const PRIORIDADES = [
  { nombre: 'Alta', color: '#a84a0a', fondo: '#fdeee3' },
  { nombre: 'Media', color: '#17699e', fondo: '#e6f3fd' },
  { nombre: 'Baja', color: '#4b5a6c', fondo: '#eef1f5' },
];
const FILTROS = [
  { clave: 'todas', texto: 'Todas', cantidad: 12 },
  { clave: 'hoy', texto: 'Hoy', cantidad: 4 },
  { clave: 'proximas', texto: 'Próximas', cantidad: 6 },
  { clave: 'atrasadas', texto: 'Atrasadas', cantidad: 2, color: '#b42318' },
];

function ColumnaTema({ clave, nombre }: { clave: string; nombre: string }) {
  const [filtro, setFiltro] = useState('todas');
  const [avisos, setAvisos] = useState(true);
  const [briefing, setBriefing] = useState(false);

  return (
    <div data-tema={clave} className="flex flex-col gap-4 rounded-2xl bg-tachit-fondo p-4">
      <p className="text-sm font-extrabold">Tema {nombre}</p>

      <Panel titulo="Botones">
        <div className="flex flex-wrap items-center gap-3">
          <Boton conMas>Nueva tarea</Boton>
          <Boton>Guardar</Boton>
          <Boton variante="suave">Probar una notificación</Boton>
          <Boton variante="borde">Ver subtareas</Boton>
          <Boton disabled>Desactivado</Boton>
        </div>
      </Panel>

      <Panel titulo="Chips" subtitulo="Categorías y prioridades">
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.map((c) => (
            <Chip key={c.nombre} color={c.color}>
              #{c.nombre}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {PRIORIDADES.map((p) => (
            <Chip key={p.nombre} color={p.color} fondo={p.fondo}>
              {p.nombre}
            </Chip>
          ))}
        </div>
      </Panel>

      <Panel titulo="Filtros">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <ChipFiltro key={f.clave} texto={f.texto} cantidad={f.cantidad} color={f.color} activo={filtro === f.clave} alPulsar={() => setFiltro(f.clave)} />
          ))}
        </div>
      </Panel>

      <Panel titulo="Interruptores">
        <div className="flex items-center justify-between gap-4 text-sm font-semibold">
          <span>Avisos de tareas</span>
          <Interruptor activo={avisos} alCambiar={setAvisos} etiqueta="Avisos de tareas" />
        </div>
        <div className="flex items-center justify-between gap-4 text-sm font-semibold">
          <span>Briefing de la mañana</span>
          <Interruptor activo={briefing} alCambiar={setBriefing} etiqueta="Briefing de la mañana" />
        </div>
      </Panel>
    </div>
  );
}

function Muestrario() {
  const [aviso, setAviso] = useState<DatosAviso | null>(null);
  const cerrarAviso = useCallback(() => setAviso(null), []);
  const [hojaAbierta, setHojaAbierta] = useState(false);

  return (
    <div className="min-h-screen bg-white font-jakarta text-[#0f1f2e]">
      <main className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-8 sm:px-8">
        <Link to="/ajustes" className="text-sm font-bold text-tachit-acento-fuerte hover:underline">
          ← Ir a Ajustes
        </Link>
        <div>
          <h1 className="text-xl font-extrabold tracking-[-0.3px]">Muestrario de componentes</h1>
          <p className="text-sm text-[#5b6b7c]">Solo existe en tu ordenador. Sirve para comparar cada pieza con el prototipo en los 4 temas.</p>
        </div>

        <Panel titulo="Aviso y hoja inferior" subtitulo="Usan el tema que tengas elegido en Ajustes">
          <div className="flex flex-wrap gap-3">
            <Boton variante="suave" onClick={() => setAviso({ titulo: 'Tarea guardada', texto: 'Así se ve el aviso flotante de Tachit.' })}>
              Mostrar un aviso
            </Boton>
            <Boton variante="suave" onClick={() => setHojaAbierta(true)}>
              Abrir la hoja inferior
            </Boton>
          </div>
        </Panel>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {TEMAS.map((t) => (
            <ColumnaTema key={t.clave} clave={t.clave} nombre={t.nombre} />
          ))}
        </div>
      </main>

      <HojaInferior abierta={hojaAbierta} alCerrar={() => setHojaAbierta(false)} etiqueta="Ejemplo de hoja inferior">
        <p className="px-1 text-[15px] font-extrabold">Hoja inferior de ejemplo</p>
        <p className="px-1 text-sm text-[#33475b]">En el móvil, aquí irá el formulario para crear una tarea (Fase 6). Ciérrala con la rayita, tocando fuera o con Escape.</p>
        <Boton conMas onClick={() => setHojaAbierta(false)}>
          Nueva tarea
        </Boton>
      </HojaInferior>

      {aviso && <AvisoFlotante aviso={aviso} alCerrar={cerrarAviso} />}
    </div>
  );
}

export default Muestrario;
