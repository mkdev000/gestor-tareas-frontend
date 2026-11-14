// pantallas/tareas/cieloArriba.test.ts
// Pruebas del cielo de arriba de Tareas (web). Se lanzan con: npm test
import { describe, expect, it } from 'vitest';
import { astroDe, colorFranja, esHorarioDeVerano, saludoDe, solEnEspana } from './cieloArriba';

const h = (hora: number, min = 0) => hora * 60 + min;
const cerca = (valor: number, esperado: number, margen = 4) => expect(Math.abs(valor - esperado)).toBeLessThanOrEqual(margen);

describe('la salida y la puesta del sol en España (Madrid)', () => {
  it('el día más largo del año: sale sobre las 6:44 y se pone sobre las 21:48', () => {
    const { sale, pone } = solEnEspana(new Date(2026, 5, 21));
    cerca(sale, h(6, 44));
    cerca(pone, h(21, 48));
  });

  it('el día más corto: sale sobre las 8:34 y se pone sobre las 17:51', () => {
    const { sale, pone } = solEnEspana(new Date(2026, 11, 21));
    cerca(sale, h(8, 34));
    cerca(pone, h(17, 51));
  });

  it('el cambio de hora (último domingo de marzo) adelanta una hora la salida del sol', () => {
    // En 2026, el último domingo de marzo es el 29
    expect(esHorarioDeVerano(new Date(2026, 2, 28))).toBe(false);
    expect(esHorarioDeVerano(new Date(2026, 2, 29))).toBe(true);
    expect(esHorarioDeVerano(new Date(2026, 9, 24))).toBe(true);
    expect(esHorarioDeVerano(new Date(2026, 9, 25))).toBe(false);
    const antes = solEnEspana(new Date(2026, 2, 28)).sale;
    const despues = solEnEspana(new Date(2026, 2, 29)).sale;
    cerca(despues - antes, 60, 3);
  });
});

describe('el color de la franja', () => {
  const sale = h(8),
    pone = h(18);

  it('siempre en rgb() (sin #, para que ningún tema lo cambie)', () => {
    for (let m = 0; m <= 1440; m += 30) expect(colorFranja(m, sale, pone).fondo).not.toContain('#');
  });

  it('de noche es azul noche y al mediodía azul de día', () => {
    expect(colorFranja(h(2), sale, pone).fondo).toContain('rgb(44,56,132)');
    expect(colorFranja(h(13), sale, pone).fondo).toContain('rgb(59,158,232)');
  });

  it('al amanecer y al atardecer se nota más que a mediodía', () => {
    const mediodia = colorFranja(h(13), sale, pone).fuerza;
    expect(colorFranja(sale + 35, sale, pone).fuerza).toBeGreaterThan(mediodia);
    expect(colorFranja(pone - 25, sale, pone).fuerza).toBeGreaterThan(mediodia);
  });
});

describe('el sol o la luna', () => {
  const sale = h(8),
    pone = h(18);
  it('de día sale el sol, más alto a mediodía; de noche, la luna con estrellas', () => {
    expect(astroDe(h(13), sale, pone)).toEqual({
      tipo: 'sol',
      bajo: false,
      alto: 10,
      estrellas: false,
    });
    expect(astroDe(sale + 10, sale, pone).bajo).toBe(true);
    expect(astroDe(h(23), sale, pone)).toMatchObject({
      tipo: 'luna',
      estrellas: true,
    });
    expect(astroDe(pone + 10, sale, pone)).toMatchObject({
      tipo: 'luna',
      estrellas: false,
    });
  });
});

describe('el saludo', () => {
  it('como en España: días hasta las 14:00, tardes hasta las 21:00', () => {
    expect(saludoDe(h(5, 59))).toBe('Buenas noches');
    expect(saludoDe(h(9))).toBe('Buenos días');
    expect(saludoDe(h(13, 59))).toBe('Buenos días');
    expect(saludoDe(h(14))).toBe('Buenas tardes');
    expect(saludoDe(h(21))).toBe('Buenas noches');
  });
});
