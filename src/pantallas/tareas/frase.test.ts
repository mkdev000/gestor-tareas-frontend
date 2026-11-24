// pantallas/tareas/frase.test.ts
// Pruebas del lector de frases: lo que entiende Tachit al escribir una tarea. Se lanzan con: npm test
import { describe, expect, it } from 'vitest';
import { aplicarOpciones, leerFrase, quitarLoCargado, OPCIONES_VACIAS } from './frase';

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

describe('el día con su mes', () => {
  it('«el 1 de diciembre», «20 dic», «el 5 de enero de 2027» y «1/12»', () => {
    const r = leerFrase('Comprar regalo abuela el 1 de diciembre', HOY);
    expect(r.titulo).toBe('Comprar regalo abuela');
    expect(r.fecha).toBe('2026-12-01');
    expect(leerFrase('Cena 20 dic', HOY).fecha).toBe('2026-12-20');
    expect(leerFrase('Revisión el día 5 de enero de 2027', HOY).fecha).toBe('2027-01-05');
    expect(leerFrase('Cita el 1/12', HOY).fecha).toBe('2026-12-01');
    expect(leerFrase('Cita el 3/2/2027', HOY).fecha).toBe('2027-02-03');
  });
  it('si ya ha pasado este año, el del año que viene; y el mes sin ese día, su último día', () => {
    expect(leerFrase('Feria el 10 de octubre', HOY).fecha).toBe('2027-10-10');
    expect(leerFrase('Pagar el 31 de noviembre', HOY).fecha).toBe('2026-11-30');
  });
  it('«el 3» solo sigue funcionando como antes', () => {
    expect(leerFrase('Dentista el 20', HOY).fecha).toBe('2026-11-20');
  });
});

describe('al editar, lo escrito gana a lo que venía cargado', () => {
  const cargado = { ...OPCIONES_VACIAS, fecha: HOY, hora: '10:00', prioridad: 'media' as const };
  it('escribes otra fecha y vale la escrita, no la de la tarea', () => {
    const p = leerFrase('Comprar regalo abuela el 1 de diciembre', HOY);
    expect(aplicarOpciones(p, quitarLoCargado(cargado, cargado, p), HOY).fecha).toBe('2026-12-01');
    expect(aplicarOpciones(p, quitarLoCargado(cargado, cargado, p), HOY).inicio).toBe(10 * 60); // la hora no la has tocado: se queda
  });
  it('si cambias la fecha en las opciones después, gana la de las opciones', () => {
    const p = leerFrase('Comprar regalo abuela el 1 de diciembre', HOY);
    const elegida = { ...cargado, fecha: '2026-12-24' };
    expect(aplicarOpciones(p, quitarLoCargado(elegida, cargado, p), HOY).fecha).toBe('2026-12-24');
  });
});
