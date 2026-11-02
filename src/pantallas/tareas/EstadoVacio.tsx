// pantallas/tareas/EstadoVacio.tsx
// Lo que ves en Tareas cuando aún no tienes ninguna tarea (Fase 5, paso 5.7), igual que en el prototipo:
// "la tarjeta que se escribe sola". Arriba, el antetítulo y la frase ("Lo que apuntes hoy, mañana estará
// tachado.", con el trazo de Tachit); debajo, una tarjeta donde se va escribiendo una tarea de ejemplo,
// palabra a palabra. Los datos que Tachit entiende (día, hora, duración, #categoría) se marcan, "saltan"
// a unos chips de abajo ("Tachit entiende: Viernes · 17:00 · # Salud") y el título queda limpio.
// Cada 8 segundos cambia de ejemplo (son 5, de la vida diaria). Toda la tarjeta es el botón "Crear mi primera tarea".
//
// La animación es solo CSS (index.css, clases .vacio-*). React solo cambia de ejemplo: al cambiar la "key",
// la tarjeta se dibuja de nuevo y la animación empieza otra vez desde el principio.
// Si tu sistema tiene activado "reducir movimiento", no se mueve nada: se ve el primer ejemplo ya entendido.
import { useEffect, useState } from 'react';

type Icono = 'dia' | 'hora' | 'dura' | 'categoria';

interface Ejemplo {
  titulo: string; // lo que queda como título
  datos: string[]; // lo que se escribe después y Tachit reconoce ("el viernes", "a las 17"...)
  chips: { icono: Icono; texto: string; neutro?: boolean }[]; // lo que sale en "Tachit entiende:"
}

// Ejemplos REALES: lo que no escribes, Tachit no se lo inventa (sin día → hoy; sin hora → "Sin hora")
const EJEMPLOS: Ejemplo[] = [
  {
    titulo: 'Pedir cita en el dentista',
    datos: ['el viernes', 'a las 17', '#Salud'],
    chips: [{ icono: 'dia', texto: 'Viernes' }, { icono: 'hora', texto: '17:00' }, { icono: 'categoria', texto: 'Salud' }],
  },
  {
    titulo: 'Comprar pan y leche',
    datos: ['hoy', '#Casa'],
    chips: [{ icono: 'dia', texto: 'Hoy' }, { icono: 'hora', texto: 'Sin hora', neutro: true }, { icono: 'categoria', texto: 'Casa' }],
  },
  {
    titulo: 'Salir a correr',
    datos: ['mañana', 'a las 7:30', '30 min'],
    chips: [{ icono: 'dia', texto: 'Mañana' }, { icono: 'hora', texto: '7:30' }, { icono: 'dura', texto: '30 min' }],
  },
  {
    titulo: 'Llamar a mamá',
    datos: ['el domingo'],
    chips: [{ icono: 'dia', texto: 'Domingo' }, { icono: 'hora', texto: 'Sin hora', neutro: true }],
  },
  {
    titulo: 'Pagar el recibo de la luz',
    datos: [],
    chips: [{ icono: 'dia', texto: 'Hoy', neutro: true }, { icono: 'hora', texto: 'Sin hora', neutro: true }],
  },
];

const DURACION_MS = 8000; // lo que dura cada ejemplo (igual que la animación .vacio-* de index.css)
const PASO_PALABRA = 0.16; // segundos entre palabra y palabra
const PASO_DATO = 0.22;

const TRAZOS: Record<Exclude<Icono, 'categoria'>, string> = {
  dia: 'M3.5 10h17M8 3v4M16 3v4M7.5 5h9a4 4 0 0 1 4 4v7.5a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4z',
  hora: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  dura: 'M12 5a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 9v4M9 2h6',
};

const sinMovimiento = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function EstadoVacio({ alCrear }: { alCrear: () => void }) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (sinMovimiento()) return; // con "reducir movimiento" se queda quieto en el primer ejemplo
    const reloj = setInterval(() => setIndice((i) => (i + 1) % EJEMPLOS.length), DURACION_MS);
    return () => clearInterval(reloj);
  }, []);

  const ejemplo = EJEMPLOS[indice];
  const palabras = ejemplo.titulo.split(' ');
  const finTitulo = palabras.length * PASO_PALABRA;
  const inicioChips = Math.max(1.3, finTitulo + ejemplo.datos.length * PASO_DATO);

  return (
    <div className="vacio-caja">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-3 text-center">
        <span className="vacio-ante">Hoja en blanco, día por estrenar</span>
        <p className="vacio-frase">
          Lo que apuntes hoy,{' '}
          <em>
            mañana estará tachado.
            <svg viewBox="0 0 120 10" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 5 H96 L104 9 L118 1" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </em>
        </p>
        <p className="vacio-sub">
          Escribe la tarea tal como la dirías, con el día, la hora o una <b>#categoría</b>. Tachit reconoce cada dato y lo organiza automáticamente.
        </p>

        <div className="box-border w-full px-1.5 pt-2.5">
          <button type="button" className="vacio-tarjeta" onClick={alCrear} aria-label="Crear mi primera tarea">
            {/* key={indice}: al cambiar de ejemplo, React la dibuja de nuevo y la animación vuelve a empezar */}
            <span key={indice} className="flex flex-col gap-2.5" aria-hidden="true">
              <span className="vacio-fila">
                <span className="vacio-circulo" />
                <span className="vacio-texto">
                  {palabras.map((p, i) => (
                    <span key={`p${i}`} className="vacio-palabra" style={{ animationDelay: `${(i * PASO_PALABRA).toFixed(2)}s` }}>
                      {p}{' '}
                    </span>
                  ))}
                  {ejemplo.datos.map((d, i) => (
                    <span key={`d${i}`} className="vacio-dato" style={{ animationDelay: `${(finTitulo + i * PASO_DATO).toFixed(2)}s` }}>
                      {d}{' '}
                    </span>
                  ))}
                </span>
              </span>
              <span className="vacio-meta">
                <span className="font-bold" style={{ animationDelay: `${inicioChips.toFixed(2)}s` }}>
                  Tachit entiende:
                </span>
                {ejemplo.chips.map((c, i) => (
                  <span key={c.texto + i} className={'vacio-chip' + (c.neutro ? ' neutro' : '')} style={{ animationDelay: `${(inicioChips + 0.1 * (i + 1)).toFixed(2)}s` }}>
                    {c.icono === 'categoria' ? (
                      '#'
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d={TRAZOS[c.icono]} />
                      </svg>
                    )}
                    {c.icono === 'categoria' ? `\u00a0${c.texto}` : c.texto}
                  </span>
                ))}
              </span>
            </span>
            <span className="vacio-crear">
              <span className="vacio-rombo" aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              Crear mi primera tarea
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default EstadoVacio;
