// pantallas/tareas/RelojHora.tsx
// El reloj para elegir la hora (Fase 8, paso 8.3), en la hoja de crear del móvil:
//  - la hora en dos fichitas grandes (como un reloj de mesa), con una flecha arriba y otra abajo:
//    la hora va de 1 en 1 y los minutos de 15 en 15 (y dan la vuelta al reloj: de 23 a 0)
//  - mientras no eliges hora, las fichas salen en gris con una hora propuesta; al tocar una flecha
//    (o la propia ficha) se pone esa hora
//  - detrás, el cielo de esa hora (cielo.ts): de noche oscuro con la luna, al mediodía azul con el sol...
//  - si choca con otra tarea, las fichas se ponen en rojo
// La cifra que cambia "gira" un instante: cambiamos la clase entre gira-a y gira-b para que la animación vuelva a empezar.
import { useState, type CSSProperties } from 'react';
import { cieloDe } from './cielo';
import { DibujoIcono } from './PastillaIcono';

const dosCifras = (n: number) => String(n).padStart(2, '0');
const vuelta = (minutos: number) => ((minutos % 1440) + 1440) % 1440;

const ICONO_MOMENTO = {
  sol: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4',
  sale: 'M4 18h16M7 18a5 5 0 0 1 10 0M12 8v2M5.6 11.6l1.4 1.4M18.4 11.6L17 13',
  luna: 'M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z',
};

interface Props {
  inicio: number | null; // la hora elegida, en minutos desde las 0:00 (null = sin hora)
  propuesta: number; // la hora que se ve en gris mientras no eliges
  choca: boolean;
  alPoner: (minutos: number) => void;
}

function RelojHora({ inicio, propuesta, choca, alPoner }: Props) {
  const [giro, setGiro] = useState<{ cual: 'h' | 'm' | ''; n: number }>({ cual: '', n: 0 });
  const valor = inicio ?? vuelta(Math.round(propuesta / 15) * 15);
  const cielo = inicio !== null ? cieloDe(inicio) : null;

  // Sin hora: la primera flecha que toques pone la hora propuesta; después, mueve
  const mover = (cual: 'h' | 'm', cuanto: number) => {
    setGiro((g) => ({ cual, n: g.n + 1 }));
    alPoner(inicio === null ? valor : vuelta(inicio + cuanto));
  };

  const claseFicha = (cual: 'h' | 'm') =>
    'reloj-ficha' + (inicio === null ? ' apagada' : choca ? ' choca' : '') + (giro.cual === cual ? (giro.n % 2 ? ' gira-a' : ' gira-b') : '');
  const claseCielo =
    'reloj-cielo' +
    (cielo ? ' con-momento' : '') +
    (cielo?.oscuro ? ' oscuro' : '') +
    (cielo?.arribaOscuro ? ' arriba-oscuro' : '') +
    (cielo?.estrellas ? ' estrellas' : '') +
    (choca ? ' choca' : '');
  const estiloCielo = cielo
    ? ({ background: `linear-gradient(180deg, ${cielo.arriba}, ${cielo.abajo})`, '--reloj-hueco': cielo.arriba } as CSSProperties)
    : undefined;
  const tomar = inicio === null ? 'Poner esta hora' : 'Hora elegida';

  const flecha = (cual: 'h' | 'm', cuanto: number, texto: string) => (
    <button type="button" onClick={() => mover(cual, cuanto)} aria-label={texto} className={'reloj-flecha' + (cuanto > 0 ? ' arriba' : '')}>
      <DibujoIcono trazo={cuanto > 0 ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} tam={22} grosor={2.6} />
    </button>
  );

  return (
    <div role="group" aria-label="Hora" className={claseCielo} style={estiloCielo}>
      <span className="reloj-estrellas" aria-hidden="true" />
      {cielo && <span className={'reloj-astro ' + cielo.astro} style={{ left: `${cielo.x}%`, top: `${cielo.y}%` }} aria-hidden="true" />}
      <div className="reloj-col">
        {flecha('h', 60, 'Una hora más')}
        <button
          type="button"
          onClick={() => alPoner(valor)}
          aria-label={`${tomar}: ${Math.floor(valor / 60)}:${dosCifras(valor % 60)}`}
          className={claseFicha('h')}
        >
          <span>{dosCifras(Math.floor(valor / 60))}</span>
        </button>
        {flecha('h', -60, 'Una hora menos')}
      </div>
      <span className="reloj-dos" aria-hidden="true">
        :
      </span>
      <div className="reloj-col">
        {flecha('m', 15, '15 minutos después')}
        <button
          type="button"
          onClick={() => alPoner(valor)}
          aria-label={`${tomar}: ${Math.floor(valor / 60)}:${dosCifras(valor % 60)}`}
          className={claseFicha('m')}
        >
          <span>{dosCifras(valor % 60)}</span>
        </button>
        {flecha('m', -15, '15 minutos antes')}
      </div>
      {cielo && (
        <span className="reloj-momento">
          <DibujoIcono trazo={ICONO_MOMENTO[cielo.icono]} tam={16} grosor={2.2} />
          {cielo.momento}
        </span>
      )}
    </div>
  );
}

export default RelojHora;
