// pantallas/tareas/cieloArriba.ts
// El cielo de la parte de arriba de Tareas en la web (rediseño antes de la Fase 9):
//  - a qué hora sale y se pone el sol HOY en España (para que los colores vayan con el día de verdad),
//  - el color de la franja según la hora de ahora (rosa al amanecer, azul de día, dorado y naranja por la tarde,
//    coral y violeta al ponerse el sol y azul noche después),
//  - si se ve el sol o la luna y cuánto asoma el sol por detrás de tu inicial,
//  - el saludo (buenos días, buenas tardes, buenas noches).
// Son "funciones puras": reciben la fecha o los minutos y devuelven el resultado, así se prueban solas
// (cieloArriba.test.ts) sin dibujar nada.

type Rgb = [number, number, number];

// ---------- Salida y puesta del sol ----------
// Último domingo de un mes (ahí cambia la hora en España: marzo → verano, octubre → invierno)
function ultimoDomingo(anio: number, mes: number) {
  const ultimoDia = new Date(Date.UTC(anio, mes + 1, 0));
  return ultimoDia.getUTCDate() - ultimoDia.getUTCDay();
}

// ¿Esa fecha está en horario de verano (UTC+2) en España peninsular?
export function esHorarioDeVerano(fecha: Date) {
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth();
  const dia = fecha.getDate();
  if (mes > 2 && mes < 9) return true; // de abril a septiembre
  if (mes === 2) return dia >= ultimoDomingo(anio, 2); // marzo, desde su último domingo
  if (mes === 9) return dia < ultimoDomingo(anio, 9); // octubre, hasta su último domingo
  return false;
}

// A qué minuto del día (hora de España) sale y se pone el sol, en Madrid (el centro de la península).
// Fórmula aproximada de la NOAA (la agencia del clima de EE. UU.): falla 1 o 2 minutos, más que suficiente.
// No pide la ubicación de nadie: siempre calcula para Madrid. (Elegir otro país: Fase 13, idiomas.)
const LATITUD = 40.42;
const LONGITUD = -3.7;
export function solEnEspana(fecha: Date): { sale: number; pone: number } {
  const anio = fecha.getFullYear();
  const diaDelAnio = Math.round((Date.UTC(anio, fecha.getMonth(), fecha.getDate()) - Date.UTC(anio, 0, 1)) / 86_400_000) + 1;
  const g = ((2 * Math.PI) / 365) * (diaDelAnio - 1);
  const rad = Math.PI / 180;
  // Cuánto se adelanta o se retrasa el sol ese día (minutos) y lo inclinado que está (declinación)
  const ecuacion = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const declinacion =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);
  // Ángulo del sol al salir (90,833° cuenta con que la luz se curva al entrar en el aire)
  const angulo = Math.acos(Math.cos(90.833 * rad) / (Math.cos(LATITUD * rad) * Math.cos(declinacion)) - Math.tan(LATITUD * rad) * Math.tan(declinacion)) / rad;
  const desfase = esHorarioDeVerano(fecha) ? 120 : 60;
  return {
    sale: Math.round(720 - 4 * (LONGITUD + angulo) - ecuacion + desfase),
    pone: Math.round(720 - 4 * (LONGITUD - angulo) - ecuacion + desfase),
  };
}

// ---------- El color de la franja ----------
// Los puntos del día, colocados alrededor de la salida (sale) y la puesta (pone) del sol:
// [minuto, color de la izquierda, color del centro, fuerza (lo opaca que se ve)]
type Punto = [number, Rgb, Rgb, number];
const NOCHE: [Rgb, Rgb, number] = [[44, 56, 132], [96, 78, 160], 0.3];
function puntosDelDia(sale: number, pone: number): Punto[] {
  return [
    [0, ...NOCHE],
    [sale - 75, ...NOCHE],
    [sale - 15, [150, 128, 214], [255, 168, 160], 0.36], // primera luz: lila y rosa
    [sale + 35, [255, 160, 170], [255, 208, 156], 0.42], // amanecer: rosa y melocotón
    [sale + 100, [142, 201, 242], [227, 242, 252], 0.26], // mañana: azul clarito
    [Math.round((sale + pone) / 2), [59, 158, 232], [174, 219, 248], 0.22], // mediodía
    [pone - 170, [85, 166, 228], [207, 232, 246], 0.22],
    [pone - 80, [255, 196, 120], [255, 226, 176], 0.4], // tarde: dorado
    [pone - 25, [255, 150, 100], [255, 196, 150], 0.42], // el sol baja: naranja
    [pone + 15, [232, 112, 118], [156, 112, 200], 0.38], // anochecer: coral y violeta
    [pone + 55, [96, 84, 176], [196, 116, 156], 0.33],
    [pone + 100, ...NOCHE],
    [1440, ...NOCHE],
  ];
}

const mezcla = (a: Rgb, b: Rgb, t: number): Rgb => [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * t)) as Rgb;

// El degradado de la franja y su fuerza a esa hora (entre dos puntos, el color se mezcla poco a poco).
// Se devuelve en rgb(), nunca con #, para que no lo cambie ningún tema.
export function colorFranja(minutos: number, sale: number, pone: number): { fondo: string; fuerza: number } {
  const m = Math.min(1440, Math.max(0, minutos));
  const puntos = puntosDelDia(sale, pone);
  for (let i = 0; i < puntos.length - 1; i++) {
    const [m0, izq0, centro0, f0] = puntos[i];
    const [m1, izq1, centro1, f1] = puntos[i + 1];
    if (m >= m0 && m <= m1) {
      const t = m1 === m0 ? 0 : (m - m0) / (m1 - m0);
      const izq = mezcla(izq0, izq1, t);
      const centro = mezcla(centro0, centro1, t);
      return {
        fondo: `linear-gradient(100deg, rgb(${izq.join(',')}) 0%, rgb(${centro.join(',')}) 55%)`,
        fuerza: Math.round((f0 + (f1 - f0) * t) * 1000) / 1000,
      };
    }
  }
  return { fondo: 'none', fuerza: 0 };
}

// ---------- El sol o la luna, asomando por detrás de tu inicial ----------
export interface Astro {
  tipo: 'sol' | 'luna';
  bajo: boolean; // el sol cerca de salir o de ponerse: más naranja
  alto: number; // cuántos píxeles asoma por encima de la inicial (de 0 a 10; a mediodía, 10)
  estrellas: boolean; // de noche cerrada salen unas estrellitas en la franja
}
export function astroDe(minutos: number, sale: number, pone: number): Astro {
  if (minutos >= sale && minutos <= pone) {
    const t = (minutos - sale) / (pone - sale);
    return {
      tipo: 'sol',
      bajo: t < 0.08 || t > 0.85,
      alto: Math.round(Math.sin(Math.PI * t) * 10),
      estrellas: false,
    };
  }
  return {
    tipo: 'luna',
    bajo: false,
    alto: 0,
    estrellas: minutos > pone + 30 || minutos < sale - 30,
  };
}

// Cómo es ese momento del día, en palabras (para el texto que lee el lector de pantalla y el "title")
export function momentoDe(minutos: number, sale: number, pone: number) {
  if (minutos < sale - 60) return 'de madrugada';
  if (minutos < sale + 60) return 'amaneciendo';
  if (minutos < 14 * 60) return 'por la mañana';
  if (minutos < pone - 60) return 'por la tarde';
  if (minutos < pone + 40) return 'anocheciendo';
  return 'de noche';
}

// El saludo como se dice en España: buenos días hasta las 14:00 (la hora de comer), buenas tardes hasta las 21:00
export function saludoDe(minutos: number) {
  if (minutos < 6 * 60) return 'Buenas noches';
  if (minutos < 14 * 60) return 'Buenos días';
  if (minutos < 21 * 60) return 'Buenas tardes';
  return 'Buenas noches';
}
