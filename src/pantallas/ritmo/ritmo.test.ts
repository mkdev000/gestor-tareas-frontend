// pantallas/ritmo/ritmo.test.ts
// Pruebas de los cálculos de Mi ritmo (paso 9.3). Se lanzan con: npm test
// Las horas se crean con new Date(año, mes, día, hora), que es TU hora: así las pruebas dan lo mismo
// en cualquier zona horaria. Ojo: en new Date los meses empiezan en 0 (10 = noviembre).
import { describe, expect, it } from 'vitest';
import type { Tarea } from '../useTareas';
import {
  consejosAtasco,
  estaCerrada,
  franjaDe,
  hechasEnSemana,
  leerHistorial,
  mapaEnergia,
  margenTiempos,
  nivelCasilla,
  pendientesParaElLunes,
  progresoPor,
  rachaAmable,
  tachadasDe,
  type EventoRitmo,
} from './ritmo';

// Lunes 16 de noviembre de 2026
const HOY = '2026-11-16';
const en = (dia: number, hora = 10, minuto = 0, mes = 10) => new Date(2026, mes, dia, hora, minuto).getTime();
const tacha = (tarea_id: number | null, momento: number): EventoRitmo => ({
  tipo: 'completada',
  tarea_id,
  en: momento,
  fecha_anterior: null,
  fecha_nueva: null,
});
const destacha = (tarea_id: number, momento: number): EventoRitmo => ({ tipo: 'reabierta', tarea_id, en: momento, fecha_anterior: null, fecha_nueva: null });

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
    fecha_creacion: '2026-11-01 09:00:00',
    ...cambios,
  };
}

// Días tachados (de noviembre) → tachadas, una por día a las 10:00
const tachadasLosDias = (...dias: number[]) => tachadasDe(dias.map((d, i) => tacha(100 + i, en(d))));

describe('leerHistorial: no se fía de lo que llega', () => {
  it('se queda con lo que tiene la forma correcta y descarta lo demás', () => {
    const h = leerHistorial({
      desde: '2026-09-21',
      hasta: HOY,
      eventos: [
        { tipo: 'completada', tarea_id: 4, en: en(16, 9), fecha_anterior: null, fecha_nueva: null },
        { tipo: 'completada', tarea_id: 3, en: en(15, 9), fecha_anterior: 'ayer', fecha_nueva: '2026-11-16' },
        { tipo: 'hackeada', tarea_id: 5, en: en(16) },
        { tipo: 'completada', tarea_id: '5', en: en(16) },
        { tipo: 'completada', tarea_id: 6, en: 'mañana' },
        'basura',
      ],
      atascadas: [{ id: 7, titulo: 'Llamar al dentista', veces_aplazada: 3, fecha_limite: '2026-11-17', prioridad: 'alta' }, { id: 'x' }],
      cierres: [{ semana_inicio: '2026-11-09', completadas: 12, pasadas_al_lunes: 2, foco_categoria_id: '9' }],
    });
    expect(h).not.toBeNull();
    expect(h!.eventos.map((e) => e.tarea_id)).toEqual([3, 4]); // ordenados por hora
    expect(h!.eventos[0].fecha_anterior).toBeNull(); // "ayer" no es una fecha
    expect(h!.atascadas).toHaveLength(1);
    expect(h!.cierres[0].foco_categoria_id).toBeNull();
    expect(h!.recortado).toBe(false);
  });

  it('si la respuesta entera no vale, devuelve null', () => {
    expect(leerHistorial(null)).toBeNull();
    expect(leerHistorial([])).toBeNull();
    expect(leerHistorial({ desde: '2026-02-30', hasta: HOY })).toBeNull();
    expect(leerHistorial({ desde: '2026-11-01', hasta: HOY })?.eventos).toEqual([]);
  });
});

describe('tachadasDe: el día de verdad en que la tachaste', () => {
  it('tachada, destachada y vuelta a tachar cuenta una vez: la última', () => {
    const t = tachadasDe([tacha(1, en(14, 9)), destacha(1, en(14, 10)), tacha(1, en(15, 18, 30))]);
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ tarea_id: 1, dia: '2026-11-15', minuto: 18 * 60 + 30, dow: 6 }); // domingo
  });

  it('tachada y destachada no cuenta; las de tareas borradas sí', () => {
    const t = tachadasDe([tacha(1, en(14)), destacha(1, en(14, 11)), tacha(null, en(13)), tacha(null, en(13, 12))]);
    expect(t.map((x) => x.dia)).toEqual(['2026-11-13', '2026-11-13']);
  });

  it('el orden de llegada no importa y "movida" no cuenta', () => {
    const t = tachadasDe([
      tacha(2, en(16, 8)),
      destacha(2, en(16, 7)),
      { tipo: 'movida', tarea_id: 2, en: en(16, 9), fecha_anterior: '2026-11-16', fecha_nueva: '2026-11-17' },
    ]);
    expect(t).toHaveLength(1);
  });
});

describe('rachaAmable', () => {
  it('sin tachar nunca: 0', () => {
    const r = rachaAmable([], HOY);
    expect(r.dias).toBe(0);
    expect(r.semana.map((d) => d.estado)).toEqual(['hoy', 'futuro', 'futuro', 'futuro', 'futuro', 'futuro', 'futuro']);
  });

  it('días seguidos hasta hoy', () => {
    const r = rachaAmable(tachadasLosDias(13, 14, 15, 16), HOY);
    expect(r.dias).toBe(4);
    expect(r.hoyHecho).toBe(true);
    expect(r.descansos).toEqual([]);
  });

  it('hoy aún sin tachar no la rompe: cuenta hasta ayer', () => {
    const r = rachaAmable(tachadasLosDias(14, 15), HOY);
    expect(r.dias).toBe(2);
    expect(r.hoyHecho).toBe(false);
  });

  it('un día sin tachar en la semana es tu descanso: no la rompe ni suma', () => {
    // Semana del 9 al 15: todo menos el miércoles 11
    const r = rachaAmable(tachadasLosDias(9, 10, 12, 13, 14, 15, 16), HOY);
    expect(r.dias).toBe(7);
    expect(r.descansos).toEqual(['2026-11-11']);
  });

  it('dos días sin tachar en la misma semana sí la rompen', () => {
    // Faltan el 11 y el 12: la racha empieza el 13
    const r = rachaAmable(tachadasLosDias(9, 10, 13, 14, 15, 16), HOY);
    expect(r.dias).toBe(4);
    expect(r.descansos).toEqual([]);
  });

  it('un descanso por semana: en semanas distintas, cada una tiene el suyo', () => {
    // Falta el miércoles 4 (semana del 2) y el miércoles 11 (semana del 9)
    const r = rachaAmable(tachadasLosDias(2, 3, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15), HOY);
    expect(r.dias).toBe(12);
    expect(r.descansos).toEqual(['2026-11-04', '2026-11-11']);
  });

  it('ayer sin tachar y hoy tampoco: ayer es el descanso de su semana', () => {
    const r = rachaAmable(tachadasLosDias(12, 13, 14), HOY);
    expect(r.dias).toBe(3);
    expect(r.descansos).toEqual(['2026-11-15']);
  });

  it('un descanso antes del primer día de la racha no cuenta', () => {
    // Solo el 15: el 14 no ha "salvado" nada
    const r = rachaAmable(tachadasLosDias(15), HOY);
    expect(r.dias).toBe(1);
    expect(r.descansos).toEqual([]);
  });

  it('la semana de lunes a domingo con su estado', () => {
    // Hoy miércoles 18: el lunes tachado, el martes no (descanso), hoy aún no
    const r = rachaAmable(tachadasLosDias(13, 14, 15, 16), '2026-11-18');
    expect(r.dias).toBe(4);
    expect(r.semana.map((d) => d.estado)).toEqual(['hecho', 'descanso', 'hoy', 'futuro', 'futuro', 'futuro', 'futuro']);
  });
});

describe('mapaEnergia', () => {
  it('con pocas tachadas no se inventa tu mejor franja', () => {
    const m = mapaEnergia(tachadasLosDias(14, 15));
    expect(m.total).toBe(2);
    expect(m.mejor).toBeNull();
  });

  it('encuentra la casilla con más tachadas y otro día que rinde bien a esa hora', () => {
    const t = tachadasDe([
      tacha(1, en(9, 11)), // lunes 10–13
      tacha(2, en(9, 12, 30)), // lunes 10–13
      tacha(3, en(9, 17)), // lunes 16–20
      tacha(4, en(11, 10, 15)), // miércoles 10–13
      tacha(5, en(14, 21)), // sábado 20–22
      tacha(6, en(14, 23, 30)), // sábado de noche → cuenta en 20–22
    ]);
    const m = mapaEnergia(t);
    expect(m.total).toBe(6);
    expect(m.mejor).toEqual({ dow: 0, franja: 1, n: 2 });
    expect(m.otroDia).toBe(2); // miércoles
    expect(m.celdas[5][4]).toBe(2);
  });

  it('franjas y niveles', () => {
    expect([franjaDe(6 * 60), franjaDe(10 * 60), franjaDe(15 * 60 + 59), franjaDe(16 * 60), franjaDe(23 * 60)]).toEqual([0, 1, 2, 3, 4]);
    expect([nivelCasilla(0, 6), nivelCasilla(1, 6), nivelCasilla(3, 6), nivelCasilla(6, 6), nivelCasilla(2, 0)]).toEqual([0, 1, 2, 4, 0]);
  });
});

describe('consejosAtasco', () => {
  it('pasos si ya la tienes partida, partir si la has movido mucho, si no un hueco hoy', () => {
    const conPasos = tarea({ subtareas: [{ id: 1, uuid: 'a', titulo: 'Sacar la ropa', hecha: false, orden: 0 }] });
    const grande = tarea();
    const normal = tarea();
    const hecha = tarea({ estado: 'completada' });
    const base = { titulo: 'x', fecha_limite: null, prioridad: 'media' };
    const r = consejosAtasco(
      [
        { ...base, id: conPasos.id, veces_aplazada: 5 },
        { ...base, id: grande.id, veces_aplazada: 4 },
        { ...base, id: normal.id, veces_aplazada: 2 },
        { ...base, id: hecha.id, veces_aplazada: 3 },
      ],
      [conPasos, grande, normal, hecha],
    );
    expect(r.map((a) => a.consejo)).toEqual(['pasos', 'partir', 'hueco']);
    expect(r[0].pasos).toBe(1);
  });
});

describe('progresoPor', () => {
  const salud = { id: 1, nombre: 'Salud', color: '#1b7a50' };
  const casa = { id: 2, nombre: 'Casa', color: '#9a5b00' };
  const tareas = [
    tarea({ fecha_limite: '2026-11-16', estado: 'completada', prioridad: 'alta', categorias: [salud] }),
    tarea({ fecha_limite: '2026-11-17', prioridad: 'alta', categorias: [salud, casa] }),
    tarea({ fecha_limite: '2026-11-18', estado: 'completada', prioridad: 'baja' }),
    tarea({ fecha_limite: '2026-11-30', estado: 'completada', categorias: [casa] }), // fuera de la semana
    tarea({ fecha_limite: null }), // sin día
  ];

  it('por categoría: cada una con sus hechas y su total; "Sin categoría" al final', () => {
    expect(progresoPor(tareas, '2026-11-16', '2026-11-22', 'categoria')).toEqual([
      { clave: '1', nombre: 'Salud', color: '#1b7a50', hechas: 1, total: 2 },
      { clave: '2', nombre: 'Casa', color: '#9a5b00', hechas: 0, total: 1 },
      { clave: '-', nombre: 'Sin categoría', color: null, hechas: 1, total: 1 },
    ]);
  });

  it('por prioridad: de alta a baja, solo las que hay', () => {
    expect(progresoPor(tareas, '2026-11-16', '2026-11-22', 'prioridad').map((p) => [p.nombre, p.hechas, p.total])).toEqual([
      ['Alta', 1, 2],
      ['Baja', 1, 1],
    ]);
  });
});

describe('margenTiempos', () => {
  it('compara lo previsto con lo real por categoría, con 3 tareas como mínimo', () => {
    const estudio = { id: 3, nombre: 'Estudio', color: '#6d4fc9' };
    const hecha = (plan: number, real: number, cats = [estudio]) => tarea({ estado: 'completada', duracion_min: plan, minutos_reales: real, categorias: cats });
    const r = margenTiempos([
      hecha(60, 80),
      hecha(30, 40),
      hecha(30, 30),
      hecha(30, 20, []),
      hecha(30, 30, []),
      tarea({ estado: 'pendiente', duracion_min: 30, minutos_reales: 90, categorias: [estudio] }), // sin tachar: no cuenta
      tarea({ estado: 'completada', duracion_min: 30, minutos_reales: null, categorias: [estudio] }), // sin tiempo real
    ]);
    expect(r).toEqual([{ clave: '3', nombre: 'Estudio', color: '#6d4fc9', plan: 120, real: 150, porcentaje: 25, n: 3 }]);
  });
});

describe('cierre de semana', () => {
  it('cuenta las tachadas de la semana por el día real', () => {
    const t = tachadasDe([tacha(1, en(8, 22)), tacha(2, en(9, 9)), tacha(3, en(15, 23, 59)), tacha(4, en(16, 0, 1))]);
    expect(hechasEnSemana(t, '2026-11-09')).toBe(2);
  });

  it('pendientes para el lunes: las de esa semana o de antes, por día y hora', () => {
    const a = tarea({ fecha_limite: '2026-11-13', hora_limite: '18:00:00' });
    const b = tarea({ fecha_limite: '2026-11-02' });
    const c = tarea({ fecha_limite: '2026-11-13', hora_limite: '09:00:00' });
    const tareas = [a, b, c, tarea({ fecha_limite: '2026-11-12', estado: 'completada' }), tarea({ fecha_limite: '2026-11-16' }), tarea({ fecha_limite: null })];
    expect(pendientesParaElLunes(tareas, '2026-11-09').map((t) => t.id)).toEqual([b.id, c.id, a.id]);
  });

  it('sabe si una semana ya está cerrada', () => {
    const cierres = [{ semana_inicio: '2026-11-09', completadas: 3, pasadas_al_lunes: 1, foco_categoria_id: null }];
    expect(estaCerrada(cierres, '2026-11-09')).toBe(true);
    expect(estaCerrada(cierres, '2026-11-16')).toBe(false);
  });
});
