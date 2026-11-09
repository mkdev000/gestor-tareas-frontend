// marco/DiaEspecial.tsx
// «Hoy es un día especial» (Fase 7, paso 7.7), igual que el prototipo, en la web y en el móvil.
// Si hoy tienes una tarea con el icono de tarta sin tachar, al abrir Tachit cae confeti y sale una
// tarjeta con la tarea y su hora, para que no se te pase felicitar. Botones: «Cerrar» y «Ver en el calendario».
// Sale UNA vez al día (lo elegiste tú): al cerrarla se apunta la fecha en este navegador
// (localStorage) y no vuelve a salir hasta el día siguiente, aunque recargues o cambies de pantalla.
// Se pone en el marco (MarcoApp), así sale en cualquier pantalla a la que llegues primero.
import { useRef, useState, type CSSProperties } from 'react';
import { useDialogo } from '../componentes/base/useDialogo';
import { DibujoIcono } from '../pantallas/tareas/PastillaIcono';
import { ICONOS_TAREA } from '../pantallas/tareas/iconosTarea';
import { minutosDe, textoHora } from '../pantallas/tareas/pulso';
import { hoyISO } from '../utils/dias';
import type { DiaEspecialHoy } from './useResumenBarra';

const CLAVE = 'dia-especial-visto'; // guarda el último día en que la cerraste ("2026-11-09")

// 34 trocitos de confeti, como el prototipo: cada uno con su sitio, tamaño, color, velocidad y retraso
const COLORES = ['#ff8fb8', '#f4b52f', '#4daeeb', '#7c5cd6', '#3fbf85', '#ff7a59'];
const CONFETI: CSSProperties[] = Array.from({ length: 34 }, (_, i) => {
  const ancho = 6 + ((i * 7) % 6);
  return {
    left: `${(i * 37) % 100}%`,
    width: ancho,
    height: i % 3 === 0 ? ancho : Math.round(ancho * 1.8),
    borderRadius: i % 4 === 0 ? 999 : 2,
    background: COLORES[i % COLORES.length],
    animationDuration: `${2.2 + (i % 5) * 0.35}s`,
    animationDelay: `${(i % 9) * 0.12}s`,
  };
});

// localStorage puede fallar (modo privado, almacenamiento bloqueado): entonces la tarjeta sale igual
function leerVisto() {
  try {
    return localStorage.getItem(CLAVE) ?? '';
  } catch {
    return '';
  }
}
function guardarVisto(dia: string) {
  try {
    localStorage.setItem(CLAVE, dia);
  } catch {
    // sin almacenamiento: no pasa nada, solo que mañana no se acordará
  }
}

interface Props {
  especial: DiaEspecialHoy | null; // la tarea de hoy con tarta (la calcula useResumenBarra)
  alVerCalendario: (dia: string) => void;
}

function DiaEspecial({ especial, alVerCalendario }: Props) {
  const hoy = hoyISO();
  // El día en que la cerraste por última vez. Se compara con HOY (no con un sí/no), así a medianoche
  // vuelve a poder salir sin recargar la página
  const [vistoEl, setVistoEl] = useState(leerVisto);
  const abierto = especial !== null && vistoEl !== hoy;
  const ventana = useRef<HTMLDivElement>(null);

  const cerrar = () => {
    guardarVisto(hoy);
    setVistoEl(hoy);
  };
  // Escape cierra, el tabulador no se sale de la tarjeta y la página de detrás no se mueve
  useDialogo(abierto, ventana, cerrar);

  if (!abierto) return null;
  const minuto = minutosDe(especial.hora);
  const tarta = ICONOS_TAREA.tarta;

  return (
    <div className="especial">
      <div className="especial-fondo" onClick={cerrar} aria-hidden="true" />
      <div className="especial-confeti" aria-hidden="true">
        {CONFETI.map((estilo, i) => (
          <span key={i} style={estilo} />
        ))}
      </div>
      <div ref={ventana} role="dialog" aria-modal="true" aria-label="Día especial" aria-describedby="especial-texto" tabIndex={-1} className="especial-tarjeta">
        <span className="especial-icono" aria-hidden="true">
          <span>
            <DibujoIcono trazo={tarta.trazo} tam={36} grosor={1.8} />
          </span>
        </span>
        <span className="especial-etiqueta">HOY ES UN DÍA ESPECIAL</span>
        <p className="especial-titulo">{especial.titulo}</p>
        <p className="especial-hora">{minuto === null ? 'Hoy' : `Hoy a las ${textoHora(minuto)}`}</p>
        <p id="especial-texto" className="especial-texto">
          Que no se te pase: hoy toca felicitar.
        </p>
        <div className="especial-botones">
          <button type="button" className="especial-cerrar" onClick={cerrar}>
            Cerrar
          </button>
          <button
            type="button"
            className="especial-ir"
            onClick={() => {
              cerrar();
              alVerCalendario(hoy);
            }}
          >
            Ver en el calendario
          </button>
        </div>
      </div>
    </div>
  );
}

export default DiaEspecial;
