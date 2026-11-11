// pantallas/tareas/cielo.ts
// El cielo de cada hora (Fase 8, paso 8.3): el fondo del recuadro de la HORA al crear una tarea en el móvil.
// Detrás de las fichas del reloj se pinta el cielo de esa hora: de madrugada casi negro con estrellas,
// el amanecer rosado, el mediodía azul intenso, el atardecer naranja y morado, la noche azul oscuro...
// Es una "función pura" (recibe los minutos del día y devuelve los colores y dónde va el sol o la luna),
// así se prueba sola (cielo.test.ts) sin dibujar nada.

type Rgb = [number, number, number];

// Los puntos del día: [minuto, color de arriba, color de abajo]. Entre dos puntos, el color se mezcla poco a poco
// (por eso al subir la hora de 15 en 15 se ve cómo amanece o anochece).
const PUNTOS: [number, Rgb, Rgb][] = [
  [0, [7, 11, 31], [21, 29, 63]], // medianoche: casi negro azulado
  [300, [11, 18, 48], [31, 42, 85]], // 5:00 madrugada
  [390, [47, 58, 115], [217, 135, 154]], // 6:30 primera luz: azul y rosa
  [450, [111, 134, 199], [246, 185, 138]], // 7:30 amanecer: lavanda y naranja suave
  [540, [142, 201, 242], [227, 242, 252]], // 9:00 mañana: azul clarito
  [720, [59, 158, 232], [174, 219, 248]], // 12:00 mediodía: azul intenso
  [900, [85, 166, 228], [207, 232, 246]], // 15:00 primera tarde
  [1050, [121, 176, 222], [251, 220, 168]], // 17:30 tarde dorada
  [1140, [143, 147, 200], [247, 183, 126]], // 19:00 el sol ya baja
  [1185, [91, 74, 154], [242, 143, 92]], // 19:45 atardecer: morado y naranja
  [1260, [38, 43, 99], [154, 83, 120]], // 21:00 anochecer: azul y malva
  [1320, [14, 21, 56], [35, 44, 92]], // 22:00 noche
  [1440, [7, 11, 31], [21, 29, 63]], // vuelta a medianoche
];

export type Momento = 'de madrugada' | 'amanecer' | 'de la mañana' | 'mediodía' | 'de la tarde' | 'atardecer' | 'de la noche';
export type IconoMomento = 'sol' | 'sale' | 'luna';

export interface Cielo {
  arriba: string; // "rgb(59,158,232)"
  abajo: string;
  oscuro: boolean; // cielo oscuro → flechas y textos en blanco
  arribaOscuro: boolean; // solo la parte de arriba es oscura (atardecer) → las flechas de arriba en blanco
  estrellas: boolean;
  astro: 'sol' | 'luna';
  x: number; // dónde va el sol o la luna, en % del ancho...
  y: number; // ...y del alto
  momento: Momento;
  icono: IconoMomento;
}

const rgb = (c: Rgb) => `rgb(${c.join(',')})`;

// Lo clara que es una luz (0 = negro, 1 = blanco), con la fórmula de contraste de las pautas de accesibilidad (WCAG)
export function luminosidad(c: Rgb) {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Los colores del cielo a esa hora (minutos desde las 0:00)
export function coloresCielo(minutos: number): [Rgb, Rgb] {
  const m = ((Math.round(minutos) % 1440) + 1440) % 1440;
  for (let i = 0; i < PUNTOS.length - 1; i++) {
    const [m0, a0, b0] = PUNTOS[i];
    const [m1, a1, b1] = PUNTOS[i + 1];
    if (m >= m0 && m <= m1) {
      const t = (m - m0) / (m1 - m0);
      const mezcla = (x: Rgb, y: Rgb) => x.map((v, k) => Math.round(v + (y[k] - v) * t)) as Rgb;
      return [mezcla(a0, a1), mezcla(b0, b1)];
    }
  }
  return [PUNTOS[0][1], PUNTOS[0][2]];
}

export function momentoDelDia(minutos: number): [Momento, IconoMomento] {
  const m = ((minutos % 1440) + 1440) % 1440;
  if (m < 390) return ['de madrugada', 'luna'];
  if (m < 510) return ['amanecer', 'sale'];
  if (m < 720) return ['de la mañana', 'sol'];
  if (m < 900) return ['mediodía', 'sol'];
  if (m < 1140) return ['de la tarde', 'sol'];
  if (m < 1260) return ['atardecer', 'sale'];
  return ['de la noche', 'luna'];
}

export function cieloDe(minutos: number): Cielo {
  const m = ((Math.round(minutos) % 1440) + 1440) % 1440;
  const [a, b] = coloresCielo(m);
  // El sol recorre el cielo en un arco de 7:00 a 21:00; la luna, de 21:00 a 7:00
  const deDia = m >= 420 && m < 1260;
  const t = Math.min(1, deDia ? (m - 420) / 840 : ((m - 1260 + 1440) % 1440) / 600);
  const [momento, icono] = momentoDelDia(m);
  return {
    arriba: rgb(a),
    abajo: rgb(b),
    oscuro: (luminosidad(a) + luminosidad(b)) / 2 < 0.4,
    arribaOscuro: luminosidad(a) < 0.3,
    estrellas: m < 375 || m >= 1290,
    astro: deDia ? 'sol' : 'luna',
    x: Math.round(8 + t * 84),
    y: Math.round(2 + (1 - Math.sin(t * Math.PI)) * 34),
    momento,
    icono,
  };
}
