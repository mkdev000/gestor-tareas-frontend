// pantallas/calendario/calendario.test.ts
// Pruebas de los cálculos del Calendario (pasos 8.2 y 8.3). Se lanzan con: npm test
import { describe, expect, it } from 'vitest';
import type { Tarea } from '../useTareas';
import {
  casilla,
  resumenTachado,
  tachadoDelMes,
  tachadoDeLaSemana,
  vistaDeLaDireccion,
  cuadriculaMes,
  estadoEnCalendario,
  mesVecino,
  primeroDeMes,
  semanaCompleta,
  semanaVecina,
  tareasDelDia,
  tareasPorDia,
  textoCuantas,
  tituloDia,
  tituloMes,
  tituloSemana,
} from './calendario';
import { esFechaValida } from '../../utils/dias';

const HOY = '2026-09-29'; // martes, como en el prototipo
const h = (hora: string) => {
  const [hh, mm] = hora.split(':').map(Number);
  return hh * 60 + mm;
};

let siguienteId = 1;
function tarea(cambios: Partial<Tarea> = {}): Tarea {
  return {
    id: siguienteId++,
    titulo: 'Tarea',
    descripcion: '',
    estado: 'pendiente',
    prioridad: 'media',
    fecha_limite: HOY,
    hora_limite: null,
    fecha_creacion: '2026-09-01 10:00:00',
    duracion_min: 30,
    ...cambios,
  };
}

describe('la cuadrícula del mes y la semana', () => {
  it('septiembre de 2026 empieza el lunes 31 de agosto y ocupa 5 semanas', () => {
    const dias = cuadriculaMes('2026-09-15', HOY);
    expect(dias).toHaveLength(35);
    expect(dias[0]).toEqual({ fecha: '2026-08-31', numero: 31, delMes: false, esHoy: false });
    expect(dias[1].fecha).toBe('2026-09-01');
    expect(dias[34]).toEqual({ fecha: '2026-10-04', numero: 4, delMes: false, esHoy: false });
    expect(dias.find((d) => d.esHoy)?.fecha).toBe(HOY);
  });

  it('un mes que necesita 6 semanas (agosto de 2026 empieza en sábado)', () => {
    const dias = cuadriculaMes('2026-08-01', HOY);
    expect(dias).toHaveLength(42);
    expect(dias[0].fecha).toBe('2026-07-27');
    expect(dias[5]).toMatchObject({ fecha: '2026-08-01', delMes: true });
  });

  it('febrero de 2027 empieza en lunes: 4 semanas justas', () => {
    const dias = cuadriculaMes('2027-02-10', HOY);
    expect(dias).toHaveLength(28);
    expect(dias[0].fecha).toBe('2027-02-01');
  });

  it('la semana va de lunes a domingo', () => {
    expect(semanaCompleta(HOY, HOY).map((d) => d.fecha)).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]);
    expect(semanaCompleta('2026-10-04', HOY)[0].fecha).toBe('2026-09-28'); // un domingo es de la semana que empezó el lunes anterior
  });

  it('‹ y › mueven un mes (siempre al día 1, también cambiando de año) o una semana', () => {
    expect(primeroDeMes('2026-09-29')).toBe('2026-09-01');
    expect(mesVecino('2026-09-29', 1)).toBe('2026-10-01');
    expect(mesVecino('2026-01-31', -1)).toBe('2025-12-01');
    expect(mesVecino('2026-12-15', 1)).toBe('2027-01-01');
    expect(semanaVecina('2026-09-29', 1)).toBe('2026-10-06');
    expect(semanaVecina('2026-09-29', -1)).toBe('2026-09-22');
  });
});

describe('las tareas de cada día', () => {
  it('por orden de hora, y las que no tienen hora al final', () => {
    const lista = [
      tarea({ titulo: 'Comprar el regalo' }),
      tarea({ titulo: 'Ir al gimnasio', hora_limite: '19:00:00' }),
      tarea({ titulo: 'Revisar el correo', hora_limite: '09:00:00' }),
      tarea({ titulo: 'Otro día', fecha_limite: '2026-09-30' }),
      tarea({ titulo: 'Sin fecha', fecha_limite: null }),
    ];
    expect(tareasDelDia(lista, HOY).map((t) => t.titulo)).toEqual(['Revisar el correo', 'Ir al gimnasio', 'Comprar el regalo']);
    const mapa = tareasPorDia(lista, [HOY, '2026-09-30', '2026-10-01']);
    expect(mapa.get(HOY)!.map((t) => t.titulo)).toEqual(['Revisar el correo', 'Ir al gimnasio', 'Comprar el regalo']);
    expect(mapa.get('2026-09-30')!.map((t) => t.titulo)).toEqual(['Otro día']);
    expect(mapa.get('2026-10-01')).toEqual([]);
  });

  it('en una casilla del mes caben 4 renglones; si hay más, 3 tareas y «+N más»', () => {
    const ocho = Array.from({ length: 8 }, () => tarea());
    expect(casilla(ocho.slice(0, 4))).toMatchObject({ mas: 0 });
    expect(casilla(ocho.slice(0, 4)).visibles).toHaveLength(4);
    expect(casilla(ocho).visibles).toHaveLength(3);
    expect(casilla(ocho).mas).toBe(5);
    expect(casilla(ocho, 2)).toMatchObject({ mas: 7 });
    expect(casilla(ocho.slice(0, 1)).mas).toBe(0);
  });
});

describe('lo tachado (la ficha)', () => {
  it('de un día: cuántas de cuántas, qué parte del número se tacha y si está completo', () => {
    const dia = [tarea({ estado: 'completada' }), tarea(), tarea({ estado: 'completada' }), tarea()];
    expect(resumenTachado(dia)).toEqual({ hechas: 2, total: 4, parte: 0.5, completo: false });
    expect(resumenTachado(dia.filter((t) => t.estado === 'completada'))).toMatchObject({ parte: 1, completo: true });
    expect(resumenTachado([])).toEqual({ hechas: 0, total: 0, parte: 0, completo: false });
  });

  it('del mes: solo las tareas con fecha de ese mes', () => {
    const lista = [
      tarea({ fecha_limite: '2026-09-02', estado: 'completada' }),
      tarea({ fecha_limite: '2026-09-29' }),
      tarea({ fecha_limite: '2026-10-01', estado: 'completada' }),
      tarea({ fecha_limite: null }),
    ];
    expect(tachadoDelMes(lista, '2026-09-15')).toMatchObject({ hechas: 1, total: 2 });
    expect(tachadoDelMes(lista, '2026-11-01')).toMatchObject({ hechas: 0, total: 0 });
  });
});

describe('el estado de cada tarea', () => {
  it('hecha, pendiente o atrasada', () => {
    expect(estadoEnCalendario(tarea({ estado: 'completada', fecha_limite: '2026-09-20' }), HOY, h('11:40'))).toBe('hecha');
    // De un día que ya pasó, sin hacer: atrasada (con hora o sin hora)
    expect(estadoEnCalendario(tarea({ fecha_limite: '2026-09-28', hora_limite: '18:00:00' }), HOY, h('11:40'))).toBe('atrasada');
    expect(estadoEnCalendario(tarea({ fecha_limite: '2026-09-28' }), HOY, h('11:40'))).toBe('atrasada');
    // De hoy: atrasada solo si tenía hora y ya terminó
    expect(estadoEnCalendario(tarea({ hora_limite: '10:30:00', duracion_min: 30 }), HOY, h('11:40'))).toBe('atrasada');
    expect(estadoEnCalendario(tarea({ hora_limite: '11:30:00', duracion_min: 30 }), HOY, h('11:40'))).toBe('pendiente');
    expect(estadoEnCalendario(tarea(), HOY, h('23:00'))).toBe('pendiente');
    // De un día que aún no ha llegado: pendiente
    expect(estadoEnCalendario(tarea({ fecha_limite: '2026-10-02', hora_limite: '08:00:00' }), HOY, h('11:40'))).toBe('pendiente');
  });
});

describe('los textos', () => {
  it('el mes, la semana, el día y el número de elementos', () => {
    expect(tituloMes('2026-09-29')).toBe('Septiembre 2026');
    expect(tituloSemana(HOY)).toBe('28 sep – 4 oct 2026');
    expect(tituloSemana('2026-10-07')).toBe('5 – 11 oct 2026');
    expect(tituloSemana('2026-12-30')).toBe('28 dic 2026 – 3 ene 2027');
    expect(tituloDia(HOY)).toBe('Martes, 29 de septiembre');
    expect(textoCuantas(8)).toBe('8 elementos');
    expect(textoCuantas(1)).toBe('1 elemento');
    expect(textoCuantas(3, 'tarea', 'tareas')).toBe('3 tareas');
  });
});

describe('la semana (paso 8.4)', () => {
  it('lo tachado de la semana: de lunes a domingo de esa fecha', () => {
    const lista = [
      tarea({ fecha_limite: '2026-09-28', estado: 'completada' }), // lunes
      tarea({ fecha_limite: '2026-10-04' }), // domingo de la misma semana
      tarea({ fecha_limite: '2026-10-05', estado: 'completada' }), // lunes de la siguiente
      tarea({ fecha_limite: '2026-09-27' }), // domingo de la anterior
    ];
    expect(tachadoDeLaSemana(lista, HOY)).toMatchObject({ hechas: 1, total: 2 });
  });

  it('la vista de la dirección: solo "semana" es semana; cualquier otra cosa, mes', () => {
    expect(vistaDeLaDireccion('semana')).toBe('semana');
    expect(vistaDeLaDireccion('mes')).toBe('mes');
    expect(vistaDeLaDireccion(null)).toBe('mes');
    expect(vistaDeLaDireccion('<script>')).toBe('mes');
  });
});

describe('las fechas que llegan de otra pantalla', () => {
  it('solo valen las que existen de verdad', () => {
    expect(esFechaValida('2026-10-14')).toBe(true);
    expect(esFechaValida('2028-02-29')).toBe(true); // año bisiesto
    expect(esFechaValida('2026-02-30')).toBe(false);
    expect(esFechaValida('2026-13-01')).toBe(false);
    expect(esFechaValida('14/10/2026')).toBe(false);
    expect(esFechaValida(undefined)).toBe(false);
    expect(esFechaValida(20261014)).toBe(false);
  });
});
