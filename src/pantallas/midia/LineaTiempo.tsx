// pantallas/midia/LineaTiempo.tsx
// La línea de tiempo de Mi día (Fase 7, paso 7.5), con el diseño elegido: "la libreta".
//  - Una hoja de libreta de 8:00 a 22:00: margen rojo, un renglón cada media hora y las horas en el margen.
//  - Cada tarea con hora es un bloque "pintado con subrayador" del color de su prioridad, a su hora y
//    tan alto como lo que dura. Las hechas, tachadas con el trazo de Tachit; las que se te pasaron, con
//    borde rojo discontinuo; la que estás haciendo, con el borde marcado.
//  - La raya roja de "ahora" va por detrás de los bloques (no tacha el texto).
//  - Clic en un bloque: se abre la tarea. Clic en un renglón libre: Nueva tarea a esa hora.
//  - Arrastrar un bloque (o una nota suelta) a otra hora: mientras arrastras, el sitio donde caerá se
//    marca con "→ 17:30". Con el teclado: Tab hasta el bloque y Alt + flecha arriba/abajo (15 min).
//  - Si dos tareas se pisan, una notita amarilla lo dice con el botón "Separar".
// Los cálculos (choques, carriles) están en dia.ts; aquí se dibuja y se avisa a la pantalla.
import { useRef, useState, type CSSProperties, type DragEvent, type KeyboardEvent } from 'react';
import type { Tarea } from '../useTareas';
import { FIN_DIA, INICIO_DIA, carriles, choques, duracion, esDeHoy, estaAtrasada, hecha, inicioDe } from './dia';
import { estiloPrioridad } from '../tareas/prioridades';
import { textoHora } from '../tareas/pulso';
import { PastillaIcono } from '../tareas/PastillaIcono';
import { duraArrastrada, empezarArrastre } from './arrastre';

// 52 px por hora (como el prototipo): el día de 8:00 a 22:00 mide 728 px
const PX_HORA = 52;
const PX_MIN = PX_HORA / 60;
const PASO = 15; // al arrastrar o con el teclado, la hora se mueve de 15 en 15 minutos
const alto = (minutos: number) => minutos * PX_MIN;
const arriba = (minuto: number) => (minuto - INICIO_DIA) * PX_MIN;

interface Props {
  tareas: Tarea[];
  hoy: string;
  ahora: number;
  alAbrir: (id: number) => void; // abre la tarea en el editor de Tareas
  alMover: (id: number, minuto: number) => void; // la tarea (o nota suelta) pasa a empezar en "minuto"
  alCrear: (minuto: number) => void; // Nueva tarea a esa hora
  alSeparar: (primeraId: number, segundaId: number) => void;
}

// El trazo de Tachit que tacha el título de las tareas hechas
function Tachon() {
  return (
    <svg className="linea-tachon" viewBox="0 0 120 10" preserveAspectRatio="none" aria-hidden="true">
      <path d="M1 5 H96 L104 9 L118 1" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LineaTiempo({ tareas, hoy, ahora, alAbrir, alMover, alCrear, alSeparar }: Props) {
  const lienzo = useRef<HTMLDivElement>(null);
  // Mientras arrastras: a qué minuto caería y cuánto dura lo que arrastras (para dibujar el hueco)
  const [destino, setDestino] = useState<{ minuto: number; dura: number } | null>(null);

  const conHora = tareas.filter((t) => esDeHoy(t, hoy) && inicioDe(t) !== null);
  const lados = carriles(tareas, hoy);
  const pisan = choques(tareas, hoy);
  const enCurso = (t: Tarea) => {
    const inicio = inicioDe(t)!;
    return !hecha(t) && inicio <= ahora && ahora < inicio + duracion(t);
  };

  // De la posición del ratón a un minuto del día (de 15 en 15, sin salirse de 8:00–22:00)
  const minutoEn = (e: DragEvent, dura: number) => {
    const caja = lienzo.current!.getBoundingClientRect();
    const crudo = INICIO_DIA + (e.clientY - caja.top) / PX_MIN - dura / 2; // el ratón, en medio del bloque
    const redondo = Math.round(crudo / PASO) * PASO;
    return Math.min(Math.max(redondo, INICIO_DIA), FIN_DIA - Math.min(dura, FIN_DIA - INICIO_DIA));
  };
  const alArrastrarEncima = (e: DragEvent) => {
    e.preventDefault(); // sin esto el navegador no deja soltar aquí
    e.dataTransfer.dropEffect = 'move';
    const dura = duraArrastrada(e);
    const minuto = minutoEn(e, dura);
    if (destino?.minuto !== minuto) setDestino({ minuto, dura });
  };
  const alSoltar = (e: DragEvent) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData('text/plain'));
    const minuto = minutoEn(e, duraArrastrada(e));
    setDestino(null);
    // Solo se aceptan ids de tareas de verdad (lo que llega al soltar puede venir de fuera de la app)
    if (Number.isInteger(id) && tareas.some((t) => t.id === id)) alMover(id, minuto);
  };
  const alSalir = (e: DragEvent) => {
    if (!lienzo.current?.contains(e.relatedTarget as Node | null)) setDestino(null);
  };

  // Teclado: Alt + flecha arriba/abajo mueve la tarea 15 minutos; Enter o espacio la abre
  const alTeclear = (e: KeyboardEvent, t: Tarea) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      alAbrir(t.id);
    } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const nuevo = inicioDe(t)! + (e.key === 'ArrowUp' ? -PASO : PASO);
      if (nuevo >= INICIO_DIA && nuevo + duracion(t) <= FIN_DIA) alMover(t.id, nuevo);
    }
  };

  const renglones = [];
  for (let m = INICIO_DIA; m < FIN_DIA; m += 30) renglones.push(m);
  const horas = [];
  for (let m = INICIO_DIA; m <= FIN_DIA; m += 60) horas.push(m);

  return (
    <section aria-labelledby="midia-linea" className="midia-carta">
      <div className="mb-3.5 flex items-baseline justify-between gap-3">
        <h2 id="midia-linea" className="text-[17px] font-extrabold">
          Línea de tiempo
        </h2>
        <p id="midia-linea-pista" className="text-[13px] text-[#5b6b7c]">
          Arrastra un bloque para moverlo · haz clic para abrirlo
        </p>
      </div>
      <div
        ref={lienzo}
        className="linea-libreta"
        style={{ height: alto(FIN_DIA - INICIO_DIA) }}
        onDragOver={alArrastrarEncima}
        onDrop={alSoltar}
        onDragLeave={alSalir}
      >
        {/* Los renglones: cada uno es media hora. Con el ratón, pulsar uno libre crea una tarea a esa hora
            (con el teclado se crea con "Nueva tarea", por eso no reciben el foco) */}
        {renglones.map((m) => (
          <div
            key={m}
            aria-hidden="true"
            className={m % 60 === 0 ? 'linea-renglon linea-renglon-hora' : 'linea-renglon'}
            style={{ top: arriba(m) }}
            data-mas={`+ Nueva tarea a las ${textoHora(m)}`}
            onClick={() => alCrear(m)}
          />
        ))}
        {horas.map((m) => (
          <span key={m} aria-hidden="true" className="linea-hora" style={{ top: arriba(m) }}>
            {textoHora(m).padStart(5, '0')}
          </span>
        ))}

        {ahora >= INICIO_DIA && ahora <= FIN_DIA && (
          <div className="linea-ahora" style={{ top: arriba(ahora) }} aria-hidden="true">
            <span>{textoHora(ahora)}</span>
          </div>
        )}

        {conHora.map((t) => {
          const inicio = inicioDe(t)!;
          const dura = duracion(t);
          const p = estiloPrioridad(t.prioridad);
          const atrasada = estaAtrasada(t, hoy, ahora);
          const corto = alto(dura) < 44; // 45 min o menos: en una sola línea
          const lado = lados.get(t.id);
          const estado = hecha(t) ? ' hecha' : atrasada ? ' se te pasó' : '';
          const clase = [
            'linea-bloque',
            corto && 'linea-bloque-corto',
            hecha(t) && 'linea-bloque-hecha',
            atrasada && 'linea-bloque-atrasada',
            enCurso(t) && 'linea-bloque-encurso',
          ]
            .filter(Boolean)
            .join(' ');
          const estilo = {
            '--c': p.color,
            top: arriba(inicio),
            height: Math.max(alto(dura), 18) - 2,
            ...(lado && lado.n > 1
              ? { left: `calc(12px + (100% - 22px) * ${lado.i} / ${lado.n})`, right: 'auto', width: `calc((100% - 22px) / ${lado.n} - 6px)` }
              : {}),
          } as CSSProperties;
          return (
            <div
              key={t.id}
              role="button"
              tabIndex={0}
              draggable
              className={clase}
              style={estilo}
              title="Haz clic para abrir la tarea"
              aria-label={`${t.titulo}, de ${textoHora(inicio)} a ${textoHora(inicio + dura)}${estado ? ',' + estado : ''}. Pulsa Enter para abrirla; Alt y las flechas la mueven 15 minutos.`}
              onClick={() => alAbrir(t.id)}
              onKeyDown={(e) => alTeclear(e, t)}
              onDragStart={(e) => empezarArrastre(e, t.id, dura)}
              onDragEnd={() => setDestino(null)}
            >
              <div className="linea-bloque-titulo">
                <PastillaIcono clave={t.icono} tam={16} radio={5} dibujo={10} />
                <span className="linea-bloque-nombre">
                  {t.titulo}
                  {hecha(t) && <Tachon />}
                </span>
              </div>
              <span className="linea-bloque-dato">
                {textoHora(inicio)}–{textoHora(inicio + dura)}
                {estado && ` ·${estado}`}
              </span>
            </div>
          );
        })}

        {/* Dónde caerá lo que arrastras */}
        {destino && (
          <div className="linea-destino" style={{ top: arriba(destino.minuto), height: alto(destino.dura) }} aria-hidden="true">
            <span>→ {textoHora(destino.minuto)}</span>
          </div>
        )}

        {/* Las notitas de "se pisan", justo encima de donde coinciden */}
        {pisan.map((c) => (
          <div key={`${c.primera.id}-${c.segunda.id}`} role="status" className="linea-pisa" style={{ top: Math.max(0, arriba(c.desde) - 34) }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
            </svg>
            <span>
              Se pisan de {textoHora(c.desde)} a {textoHora(c.hasta)}
              <span className="sr-only">
                : «{c.primera.titulo}» y «{c.segunda.titulo}»
              </span>
            </span>
            <button type="button" onClick={() => alSeparar(c.primera.id, c.segunda.id)}>
              Separar
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default LineaTiempo;
