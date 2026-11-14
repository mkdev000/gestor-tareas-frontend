// pantallas/tareas/OpcionesNota.tsx
// Las 7 opciones de la nota de crear (rediseño de Tareas web, antes de la Fase 9), como en el prototipo:
// cada una es una tarjetita con su dibujo y lo que vale ahora:
//   Cuándo (una ficha del calendario) · Hora (dos fichas con el cielo de esa hora) · Dura (una barrita que se llena)
//   Aviso · Se repite · Icono (con su color) · Categoría
// Al pulsar una se abre su panel debajo (los de PanelesFrase.tsx). Salen al pulsar el celo «Opciones».
import type { CSSProperties, ReactNode } from 'react';
import { deTextoISO } from '../../utils/dias';
import { avisoActual, horaConCeros, textoAviso, textoDia, textoDuracion, textoRepeticion, type FraseLeida, type OpcionesFrase } from './frase';
import { ICONOS_TAREA } from './iconosTarea';
import { DibujoIcono } from './PastillaIcono';
import { cieloDe } from './cielo';
import type { Seccion } from './PanelesFrase';

const DIA_CORTO = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const TRAZO = {
  aviso: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  repite: 'M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3',
  icono: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z',
  categoria: 'M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01',
};

interface Opcion {
  clave: Seccion;
  nombre: string;
  valor: string;
  puesta: boolean; // la has elegido tú o la ha entendido de la frase (borde del color del tema)
  dibujo: ReactNode;
}

// Lo que vale cada opción ahora mismo (lo elegido gana a lo escrito; si no hay nada, lo de siempre)
function opcionesDeLaNota(op: OpcionesFrase, crudo: FraseLeida, fin: FraseLeida, hayBorrador: boolean, hoy: string): Opcion[] {
  const fecha = op.fecha || fin.fecha || hoy;
  const ficha = deTextoISO(fecha);
  const aviso = avisoActual(op, fin);
  const duracion = fin.duracion || 30;
  const icono = op.icono ? ICONOS_TAREA[op.icono] : undefined;
  const categoria = op.categoria === '-' ? '' : op.categoria || fin.categorias[0] || '';
  const cielo = fin.inicio !== null ? cieloDe(fin.inicio) : null;
  const hora = fin.inicio !== null ? horaConCeros(fin.inicio) : '';
  const pastilla = (trazo: string, color: string, fondo: string) => (
    <span className="nota-dib" style={{ color, background: fondo }}>
      <DibujoIcono trazo={trazo} tam={18} />
    </span>
  );
  return [
    {
      clave: 'cuando',
      nombre: 'Cuándo',
      valor: textoDia(fecha, hoy),
      puesta: !!(op.fecha || (hayBorrador && crudo.fecha)),
      dibujo: (
        <span className="nota-ficha">
          <small>{fecha === hoy ? 'HOY' : DIA_CORTO[ficha.getDay()]}</small>
          <b>{ficha.getDate()}</b>
        </span>
      ),
    },
    {
      clave: 'hora',
      nombre: 'Hora',
      valor: hora || 'Sin hora',
      puesta: !!hora,
      dibujo: (
        <span
          className="nota-reloj"
          style={
            cielo
              ? {
                  background: `linear-gradient(180deg, ${cielo.arriba}, ${cielo.abajo})`,
                }
              : undefined
          }
        >
          <i>{hora ? hora.slice(0, 2) : '--'}</i>
          <i>{hora ? hora.slice(3, 5) : '--'}</i>
        </span>
      ),
    },
    {
      clave: 'dura',
      nombre: 'Dura',
      valor: textoDuracion(duracion),
      puesta: !!(op.duracion || crudo.duracion),
      dibujo: (
        <span className="nota-dib nota-dib-vacio">
          <span className="nota-arena">
            <i style={{ width: `${Math.min(100, (duracion / 120) * 100)}%` }} />
          </span>
        </span>
      ),
    },
    {
      clave: 'aviso',
      nombre: 'Aviso',
      valor: aviso.indice > 0 ? (aviso.valor === '0' ? 'A la hora' : textoAviso(Number(aviso.valor))) : 'No',
      puesta: aviso.indice > 0,
      dibujo: pastilla(TRAZO.aviso, '#6d4fc9', '#efeafc'),
    },
    {
      clave: 'repite',
      nombre: 'Se repite',
      valor: fin.repeticion ? textoRepeticion(fin.repeticion, fin.dias) : 'Una vez',
      puesta: !!fin.repeticion,
      dibujo: pastilla(TRAZO.repite, '#0e6f78', '#e0f3f4'),
    },
    {
      clave: 'icono',
      nombre: 'Icono',
      valor: icono ? icono.nombre : 'Ninguno',
      puesta: !!icono,
      dibujo: icono ? pastilla(icono.trazo, icono.color, icono.fondo) : pastilla(TRAZO.icono, '#5b6b7c', '#f1f4f9'),
    },
    {
      clave: 'categoria',
      nombre: 'Categoría',
      valor: categoria ? `#${categoria}` : 'Ninguna',
      puesta: !!categoria,
      dibujo: pastilla(TRAZO.categoria, '#1b7a50', '#e3f3ea'),
    },
  ];
}

interface Props {
  op: OpcionesFrase;
  crudo: FraseLeida; // lo que dice la frase sola
  fin: FraseLeida; // la frase + lo elegido
  hayBorrador: boolean;
  hoy: string;
  seccion: Seccion | null; // el panel abierto
  alAbrir: (s: Seccion) => void;
}

function OpcionesNota({ op, crudo, fin, hayBorrador, hoy, seccion, alAbrir }: Props) {
  const opciones = opcionesDeLaNota(op, crudo, fin, hayBorrador, hoy);
  return (
    <div role="group" aria-label="Opciones de la tarea" className="nota-opciones">
      {opciones.map((o, i) => {
        const abierta = seccion === o.clave;
        return (
          <button
            key={o.clave}
            type="button"
            aria-expanded={abierta}
            aria-label={`${o.nombre}: ${o.valor}${abierta ? '' : ' (pulsa para cambiarlo)'}`}
            onClick={() => alAbrir(o.clave)}
            className={'nota-opcion' + (o.puesta ? ' puesta' : '') + (abierta ? ' abierta' : '')}
            style={{ '--i': i } as CSSProperties}
          >
            <span aria-hidden="true">{o.dibujo}</span>
            <span className="nota-opcion-texto" aria-hidden="true">
              <small>{o.nombre}</small>
              <b>{o.valor}</b>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default OpcionesNota;
