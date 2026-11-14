// pantallas/tareas/frase.test.ts
// Pruebas del lector de frases: lo que entiende Tachit al escribir una tarea. Se lanzan con: npm test
import { describe, expect, it } from 'vitest';
import { leerFrase } from './frase';

const HOY = '2026-11-14'; // sábado

describe('la frase de ejemplo de la nota', () => {
  it('entiende todo de una vez, también con comas', () => {
    const r = leerFrase('Gimnasio mañana a las 18 #Salud 1h, avísame 10 min antes, cada lunes', HOY);
    expect(r.titulo).toBe('Gimnasio');
    expect(r.inicio).toBe(18 * 60);
    expect(r.duracion).toBe(60);
    expect(r.aviso).toBe(10);
    expect(r.categorias).toEqual(['Salud']);
    expect(r.repeticion).toBe('semanal');
    expect(r.dias).toEqual([1]);
  });
});

describe('el aviso', () => {
  it('con su tiempo: 1 h antes, 1 día antes, a la hora', () => {
    expect(leerFrase('Dentista el jueves a las 17 avísame 1 h antes', HOY).aviso).toBe(60);
    expect(leerFrase('Pagar la luz recuérdamelo 1 día antes', HOY).aviso).toBe(1440);
    expect(leerFrase('Llamar a mamá avísame a la hora', HOY).aviso).toBe(0);
    expect(leerFrase('Regar las plantas 10 min antes', HOY).aviso).toBe(10);
  });
  it('sin decir cuándo, 10 minutos antes; y no se confunde con la duración', () => {
    const r = leerFrase('Revisión en el dentista avísame 45 min', HOY);
    expect(r.aviso).toBe(10);
    expect(r.duracion).toBe(45);
  });
});

describe('las comas', () => {
  it('se quedan dentro del título y no sobran al quitar los datos', () => {
    expect(leerFrase('Comprar pan, leche y huevos hoy', HOY).titulo).toBe('Comprar pan, leche y huevos');
    expect(leerFrase('Correr, mañana, 30 min', HOY).titulo).toBe('Correr');
  });
});
