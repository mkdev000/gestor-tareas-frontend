// pantallas/tareas/CabeceraTareas.tsx
// La parte de arriba de Tareas en la web (rediseñada antes de la Fase 9), igual que en el prototipo:
//  - una franja con el cielo de AHORA (rosa al amanecer, azul de día, dorado por la tarde, coral al anochecer,
//    azul noche de noche), que se desvanece hacia la derecha; sale y se pone con el sol real de España
//  - tu inicial en una ficha blanca, con el sol (o la luna) asomando por detrás
//  - el saludo según la hora y una frase: «Es martes 29: te quedan 3 tareas por tachar hoy y llevas 7 días seguidos tachando algo.»
//  - a la derecha, la semana (L M X J V S D) con los días en que tachaste algo tachados; al pulsarla, va a Mi ritmo
// En el móvil no sale (allí la pantalla Hoy ya tiene su resumen).
import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Tarea } from '../useTareas';
import { calcularRacha } from '../../utils/racha';
import { deTextoISO, hoyISO } from '../../utils/dias';
import { useCuenta } from '../../marco/useCuenta';
import { astroDe, colorFranja, momentoDe, saludoDe, solEnEspana } from './cieloArriba';
import { textoHora } from './pulso';

const DIA_LARGO = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const NOMBRE_LETRA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const minutosDe = (d: Date) => d.getHours() * 60 + d.getMinutes();

function CabeceraTareas({ tareas }: { tareas: Tarea[] }) {
  const navigate = useNavigate();
  const { nombre, inicial } = useCuenta();
  // La hora de "ahora" se actualiza cada minuto (para el cielo y el saludo)
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const reloj = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(reloj);
  }, []);

  const hoy = hoyISO();
  const fechaHoy = deTextoISO(hoy);
  const minutos = minutosDe(ahora);
  const { sale, pone } = solEnEspana(fechaHoy);
  const franja = colorFranja(minutos, sale, pone);
  const astro = astroDe(minutos, sale, pone);
  const momento = momentoDe(minutos, sale, pone);

  // Lo de hoy y la racha
  const deHoy = tareas.filter((t) => t.fecha_limite?.slice(0, 10) === hoy);
  const quedan = deHoy.filter((t) => t.estado !== 'completada').length;
  const racha = calcularRacha(tareas);
  const hoyTachado = racha.ultimos7[6];
  const dias = `${racha.dias} ${racha.dias === 1 ? 'día seguido' : 'días seguidos'}`;
  const esHoy = `Es ${DIA_LARGO[fechaHoy.getDay()]} ${fechaHoy.getDate()}`;

  // La semana de lunes a domingo; los días pasados salen de los últimos 7 de la racha
  const hoyEnSemana = (fechaHoy.getDay() + 6) % 7; // lunes = 0 ... domingo = 6
  const semana = LETRAS.map((letra, i) => {
    const futuro = i > hoyEnSemana;
    const hecho = !futuro && racha.ultimos7[6 - (hoyEnSemana - i)];
    const esHoyLetra = i === hoyEnSemana;
    const estado = futuro ? 'aún no ha llegado' : hecho ? 'tachaste algo' : esHoyLetra ? 'aún nada' : 'nada tachado';
    return {
      letra,
      hecho,
      futuro,
      esHoy: esHoyLetra,
      titulo: `${esHoyLetra ? 'hoy' : NOMBRE_LETRA[i]}: ${estado}`,
    };
  });
  const tachadosSemana = semana.filter((d) => d.hecho).length;

  // La racha, subrayada a mano en verde
  const marca = (
    <span className="cielo-marca">
      {dias}
      <svg viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
        <path d="M2 5.5 C 30 2.5, 60 6.5, 98 3" />
      </svg>
    </span>
  );
  let frase;
  if (!deHoy.length)
    frase = racha.dias ? (
      <>
        {esHoy} y hoy no tienes nada apuntado. Llevas {marca} tachando algo.
      </>
    ) : (
      <>{esHoy} y hoy no tienes nada apuntado.</>
    );
  else if (!quedan)
    frase = (
      <>
        {esHoy} y hoy ya lo tienes <b>todo tachado</b>
        {racha.dias ? <>. Llevas {marca} tachando algo.</> : '.'}
      </>
    );
  else {
    const cuantas = <b>{`${quedan} ${quedan === 1 ? 'tarea por tachar' : 'tareas por tachar'}`}</b>;
    const inicio = (
      <>
        {esHoy}: te {quedan === 1 ? 'queda' : 'quedan'} {cuantas} hoy
      </>
    );
    if (!racha.dias) frase = <>{inicio}. Tacha una y empieza tu racha.</>;
    else if (hoyTachado)
      frase = (
        <>
          {inicio} y llevas {marca} tachando algo.
        </>
      );
    else
      frase = (
        <>
          {inicio}. Llevas {marca}: <span className="cielo-falta">tacha una y serán {racha.dias + 1}</span>.
        </>
      );
  }

  const estiloFranja = {
    '--cielo': franja.fondo,
    '--fuerza': franja.fuerza,
  } as CSSProperties;
  const estiloAstro = { top: `${3 - astro.alto}px` } as CSSProperties;

  return (
    <section aria-label="Tu día" className="cabecera-cielo" style={estiloFranja}>
      {astro.estrellas && (
        <span aria-hidden="true" className="cielo-estrellas">
          <i style={{ left: '12%', top: '22%' }} />
          <i style={{ left: '30%', top: '58%' }} />
          <i style={{ left: '47%', top: '18%' }} />
          <i style={{ left: '63%', top: '46%' }} />
          <i style={{ left: '78%', top: '20%' }} />
        </span>
      )}
      <span
        className="cielo-ficha"
        role="img"
        aria-label={`${nombre}, ${momento}`}
        title={`Ahora es ${momento}: hoy sale el sol a las ${textoHora(sale)} y se pone a las ${textoHora(pone)}`}
      >
        <span aria-hidden="true" className="cielo-astro" style={estiloAstro}>
          <span className={astro.tipo === 'sol' ? 'cielo-sol' + (astro.bajo ? ' bajo' : '') : 'cielo-luna'} />
        </span>
        <span aria-hidden="true" className="cielo-inicial">
          {inicial}
        </span>
      </span>
      <div className="cielo-texto">
        <h2 className="cielo-saludo">
          {saludoDe(minutos)}, {nombre}
        </h2>
        <p className="cielo-frase">{frase}</p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/ritmo')}
        aria-label={`Esta semana has tachado algo ${tachadosSemana} ${tachadosSemana === 1 ? 'día' : 'días'}. Racha: ${dias}. Ver en Mi ritmo`}
        title="Ver tu racha en Mi ritmo"
        className="cielo-semana"
      >
        <span aria-hidden="true" className="cielo-letras">
          {semana.map((d) => (
            <span key={d.letra} title={d.titulo} className={'cielo-letra' + (d.hecho ? ' hecho' : '') + (d.esHoy ? ' hoy' : '') + (d.futuro ? ' futuro' : '')}>
              {d.letra}
            </span>
          ))}
        </span>
        <span className="cielo-pie">esta semana</span>
      </button>
    </section>
  );
}

export default CabeceraTareas;
