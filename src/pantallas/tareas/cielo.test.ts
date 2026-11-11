// pantallas/tareas/cielo.test.ts
// Pruebas del cielo de cada hora (paso 8.3). Se lanzan con: npm test
import { describe, expect, it } from 'vitest';
import { cieloDe, coloresCielo, momentoDelDia } from './cielo';

const h = (hora: number, min = 0) => hora * 60 + min;

describe('el cielo de cada hora', () => {
  it('en los puntos marcados da justo su color', () => {
    expect(coloresCielo(h(12))).toEqual([
      [59, 158, 232],
      [174, 219, 248],
    ]);
    expect(cieloDe(0).arriba).toBe('rgb(7,11,31)');
  });

  it('entre dos puntos mezcla poco a poco (a mitad de camino, a mitad de color)', () => {
    // De 9:00 (142,201,242) a 12:00 (59,158,232): a las 10:30, la mitad
    expect(coloresCielo(h(10, 30))[0]).toEqual([101, 180, 237]);
  });

  it('da la vuelta al reloj: las 24:00 son las 0:00 y los minutos negativos cuentan hacia atrás', () => {
    expect(cieloDe(1440)).toEqual(cieloDe(0));
    expect(cieloDe(-60)).toEqual(cieloDe(h(23)));
  });

  it('de noche es oscuro, con estrellas y luna; al mediodía claro, con el sol arriba', () => {
    const noche = cieloDe(h(3));
    expect(noche).toMatchObject({ oscuro: true, estrellas: true, astro: 'luna', momento: 'de madrugada', icono: 'luna' });
    const mediodia = cieloDe(h(14));
    expect(mediodia).toMatchObject({ oscuro: false, estrellas: false, astro: 'sol', momento: 'mediodía', icono: 'sol', x: 50, y: 2 });
  });

  it('al amanecer solo la parte de arriba sigue oscura (las flechas de arriba van en blanco)', () => {
    expect(cieloDe(h(7, 30))).toMatchObject({ oscuro: false, arribaOscuro: true, momento: 'amanecer' });
    expect(cieloDe(h(19, 45))).toMatchObject({ oscuro: true, momento: 'atardecer' });
  });

  it('el momento del día cambia en su hora', () => {
    expect([h(6, 29), h(6, 30), h(8, 30), h(12), h(15), h(19), h(21)].map((m) => momentoDelDia(m)[0])).toEqual([
      'de madrugada',
      'amanecer',
      'de la mañana',
      'mediodía',
      'de la tarde',
      'atardecer',
      'de la noche',
    ]);
  });
});
