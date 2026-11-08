// pantallas/midia/dia.test.ts
// Pruebas de los cálculos de Mi día (paso 7.3). Se lanzan con: npm test
// Cada prueba monta un día inventado (con tareas cotidianas) y comprueba el resultado.
import { describe, expect, it } from 'vitest';
import type { Tarea } from '../useTareas';
import {
  aCambiosHorario,
  buscarHueco,
  carriles,
  choques,
  colocarTareas,
  estaAtrasada,
  fraseDelDia,
  hiloDelDia,
  loImportante,
  planificar,
  redondearArriba,
  reorganizar,
  resumenDelDia,
  separar,
  textoBriefing,
} from './dia';

const HOY = '2026-11-05';
const h = (hora: string) => {
  const [hh, mm] = hora.split(':').map(Number);
  return hh * 60 + mm;
};

// Una tarea de ejemplo: solo hay que decir lo que cambia
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
    fecha_creacion: '2026-11-01 10:00:00',
    duracion_min: 30,
    ...cambios,
  };
}

describe('atrasadas y redondeo', () => {
  it('una tarea de hoy cuya hora de terminar ya pasó va atrasada; si está hecha o es de otro día, no', () => {
    const banco = tarea({ hora_limite: '10:30:00', duracion_min: 30 });
    expect(estaAtrasada(banco, HOY, h('11:00'))).toBe(true);
    expect(estaAtrasada(banco, HOY, h('10:59'))).toBe(false);
    expect(estaAtrasada({ ...banco, estado: 'completada' }, HOY, h('12:00'))).toBe(false);
    expect(estaAtrasada({ ...banco, fecha_limite: '2026-11-06' }, HOY, h('12:00'))).toBe(false);
    expect(estaAtrasada(tarea(), HOY, h('23:00'))).toBe(false); // sin hora, nunca va atrasada
  });

  it('redondea hacia arriba de 15 en 15', () => {
    expect(redondearArriba(h('11:40'))).toBe(h('11:45'));
    expect(redondearArriba(h('11:45'))).toBe(h('11:45'));
    expect(redondearArriba(h('11:46'))).toBe(h('12:00'));
  });
});

describe('huecos libres', () => {
  it('encuentra el primer hueco donde cabe, saltando lo ocupado', () => {
    const ocupados = [{ desde: h('12:00'), hasta: h('13:00') }];
    expect(buscarHueco(60, ocupados, h('11:30'))).toBe(h('13:00')); // de 11:30 a 12:00 no cabe 1 h
    expect(buscarHueco(30, ocupados, h('11:30'))).toBe(h('11:30'));
  });

  it('nunca empieza antes de las 8:00 ni termina después de las 22:00', () => {
    expect(buscarHueco(30, [], h('06:00'))).toBe(h('08:00'));
    expect(buscarHueco(60, [], h('21:15'))).toBeNull();
    expect(buscarHueco(45, [], h('21:15'))).toBe(h('21:15'));
  });

  it('respeta las tareas con hora que siguen pendientes, pero no las hechas ni las que ya pasaron', () => {
    const gimnasio = tarea({ hora_limite: '12:00:00', duracion_min: 60 });
    const hecha = tarea({
      hora_limite: '13:00:00',
      duracion_min: 60,
      estado: 'completada',
    });
    const pan = tarea({ duracion_min: 60 });
    const colocadas = colocarTareas([gimnasio, hecha, pan], [pan.id], h('12:00'), HOY, h('11:00'));
    expect(colocadas.get(pan.id)).toBe(h('13:00')); // la hora de la hecha cuenta como libre
  });
});

describe('Reorganizar mi día', () => {
  it('coloca las atrasadas y las sin hora en los huecos libres, primero las de prioridad alta', () => {
    const banco = tarea({
      titulo: 'Llamar al banco',
      hora_limite: '10:30:00',
      duracion_min: 30,
      prioridad: 'media',
    }); // atrasada
    const regalo = tarea({
      titulo: 'Comprar el regalo',
      duracion_min: 45,
      prioridad: 'baja',
    });
    const presupuesto = tarea({
      titulo: 'Enviar el presupuesto',
      duracion_min: 60,
      prioridad: 'alta',
    });
    const dentista = tarea({
      titulo: 'Dentista',
      hora_limite: '12:00:00',
      duracion_min: 60,
    }); // fija
    const plan = reorganizar([banco, regalo, presupuesto, dentista], HOY, h('11:40'));
    expect(plan.tipo).toBe('colocadas');
    if (plan.tipo !== 'colocadas') return;
    // ahora 11:40 → desde 11:45. La alta (1 h) no cabe antes del dentista: va a las 13:00
    expect(plan.colocadas.get(presupuesto.id)).toBe(h('13:00'));
    expect(plan.colocadas.get(banco.id)).toBe(h('14:00')); // después, la media
    expect(plan.colocadas.get(regalo.id)).toBe(h('14:30')); // y al final, la baja
    expect(plan.colocadas.has(dentista.id)).toBe(false); // la que ya tenía hora no se toca
    expect(plan.sinHueco).toEqual([]);
  });

  it('a igual prioridad, primero la más corta (así caben más en los huecos pequeños)', () => {
    const larga = tarea({ duracion_min: 60 });
    const corta = tarea({ duracion_min: 15 });
    const plan = reorganizar([larga, corta], HOY, h('09:00'));
    if (plan.tipo !== 'colocadas') throw new Error('debería colocar');
    expect(plan.colocadas.get(corta.id)).toBe(h('09:00'));
    expect(plan.colocadas.get(larga.id)).toBe(h('09:15'));
  });

  it('si no hay nada que mover, dice que el día ya está en orden', () => {
    expect(reorganizar([tarea({ hora_limite: '18:00:00' })], HOY, h('09:00')).tipo).toBe('en-orden');
    expect(reorganizar([tarea({ fecha_limite: '2026-11-06' })], HOY, h('09:00')).tipo).toBe('en-orden'); // de mañana
  });

  it('si ya no queda hueco hoy, lo dice; y si caben algunas, dice cuáles no', () => {
    expect(reorganizar([tarea({ duracion_min: 60 })], HOY, h('21:30')).tipo).toBe('sin-hueco');
    const corta = tarea({ duracion_min: 30 });
    const larga = tarea({ duracion_min: 60 });
    const plan = reorganizar([corta, larga], HOY, h('21:20'));
    if (plan.tipo !== 'colocadas') throw new Error('debería colocar');
    expect(plan.colocadas.get(corta.id)).toBe(h('21:30'));
    expect(plan.sinHueco).toEqual([larga.id]);
  });
});

describe('Planificar y Separar', () => {
  it('Planificar pone una tarea sin hora en el primer hueco desde ahora', () => {
    const fija = tarea({ hora_limite: '10:00:00', duracion_min: 60 });
    const regalo = tarea({ duracion_min: 45 });
    const plan = planificar([fija, regalo], regalo.id, HOY, h('09:50'));
    if (plan.tipo !== 'colocadas') throw new Error('debería colocar');
    expect(plan.colocadas.get(regalo.id)).toBe(h('11:00'));
  });

  it('Separar mueve la segunda justo después de la primera (al siguiente hueco libre)', () => {
    const a = tarea({ hora_limite: '17:00:00', duracion_min: 60 });
    const b = tarea({ hora_limite: '17:30:00', duracion_min: 30 });
    const c = tarea({ hora_limite: '18:00:00', duracion_min: 30 }); // ocupa 18:00–18:30
    const plan = separar([a, b, c], a.id, b.id, HOY, h('12:00'));
    if (plan.tipo !== 'colocadas') throw new Error('debería colocar');
    expect(plan.colocadas.get(b.id)).toBe(h('18:30'));
  });
});

describe('tareas que se pisan', () => {
  it('encuentra los choques entre tareas pendientes con hora y dónde se pisan', () => {
    const a = tarea({
      titulo: 'Gimnasio',
      hora_limite: '19:00:00',
      duracion_min: 60,
    });
    const b = tarea({
      titulo: 'Cena',
      hora_limite: '19:30:00',
      duracion_min: 60,
    });
    const c = tarea({
      titulo: 'Basura',
      hora_limite: '20:15:00',
      duracion_min: 15,
    }); // se pisa con la cena
    const hecha = tarea({ hora_limite: '19:00:00', estado: 'completada' });
    const lista = choques([a, b, c, hecha], HOY);
    expect(lista).toHaveLength(2);
    expect([lista[0].primera.id, lista[0].segunda.id, lista[0].desde, lista[0].hasta]).toEqual([a.id, b.id, h('19:30'), h('20:00')]);
    expect([lista[1].primera.id, lista[1].segunda.id]).toEqual([b.id, c.id]);
  });

  it('una que termina justo cuando empieza la otra NO se pisa', () => {
    expect(choques([tarea({ hora_limite: '09:00:00' }), tarea({ hora_limite: '09:30:00' })], HOY)).toEqual([]);
  });

  it('carriles: las que coinciden se ponen lado a lado; las sueltas no llevan carril', () => {
    const a = tarea({ hora_limite: '09:00:00', duracion_min: 60 });
    const b = tarea({ hora_limite: '09:30:00', duracion_min: 60 });
    const c = tarea({ hora_limite: '10:00:00', duracion_min: 30 }); // empieza cuando a termina: carril de a
    const sola = tarea({ hora_limite: '15:00:00' });
    const mapa = carriles([a, b, c, sola], HOY);
    expect(mapa.get(a.id)).toEqual({ i: 0, n: 2 });
    expect(mapa.get(b.id)).toEqual({ i: 1, n: 2 });
    expect(mapa.get(c.id)).toEqual({ i: 0, n: 2 });
    expect(mapa.has(sola.id)).toBe(false);
  });
});

describe('resumen del día y briefing', () => {
  const dia = () => [
    tarea({
      titulo: 'Revisar el correo',
      hora_limite: '09:00:00',
      duracion_min: 60,
      estado: 'completada',
    }),
    tarea({
      titulo: 'Llamar al fontanero',
      hora_limite: '10:30:00',
      duracion_min: 30,
    }), // atrasada a las 11:40
    tarea({
      titulo: 'Preparar la presentación',
      hora_limite: '11:00:00',
      duracion_min: 90,
      prioridad: 'alta',
    }), // en curso
    tarea({
      titulo: 'Enviar el presupuesto',
      hora_limite: '17:00:00',
      duracion_min: 90,
      prioridad: 'alta',
    }),
    tarea({ titulo: 'Comprar el regalo', duracion_min: 45, prioridad: 'baja' }), // sin hora
    tarea({
      titulo: 'Mañana',
      fecha_limite: '2026-11-06',
      hora_limite: '10:00:00',
    }), // no es de hoy
  ];

  it('cuenta lo planificado, lo libre, las atrasadas, las completadas, las clave y las sin hora', () => {
    const r = resumenDelDia(dia(), HOY, h('11:40'));
    expect(r.planificado).toBe(60 + 30 + 90 + 90);
    // de 11:40 a 22:00 = 620 min; ocupado: lo que queda de la presentación (11:40–12:30 = 50) + presupuesto (90)
    expect(r.libre).toBe(620 - 50 - 90);
    expect(r.atrasadas.map((t) => t.titulo)).toEqual(['Llamar al fontanero']);
    expect(r.completadas).toBe(1);
    expect(r.clave.map((t) => t.titulo)).toEqual(['Preparar la presentación', 'Enviar el presupuesto']);
    expect(r.sinHora.map((t) => t.titulo)).toEqual(['Comprar el regalo']);
  });

  it('antes de las 8:00 cuenta desde las 8:00, y después de las 22:00 no queda tiempo libre', () => {
    expect(resumenDelDia([], HOY, h('06:00')).libre).toBe(14 * 60);
    expect(resumenDelDia([], HOY, h('23:00')).libre).toBe(0);
  });

  it('el briefing dice el saludo, las tareas clave, el tiempo libre y las atrasadas (en singular o plural)', () => {
    const b = textoBriefing(resumenDelDia(dia(), HOY, h('11:40')), 'Ana', h('11:40'));
    expect(b.titular).toBe('Buenos días, Ana. Hoy tienes 2 tareas clave.');
    expect(b.detalle).toBe('Te quedan unas 8 h libres y 1 tarea atrasada.');
    const tarde = textoBriefing(resumenDelDia([tarea({ prioridad: 'alta', titulo: 'Pagar la luz' })], HOY, h('16:00')), 'Ana', h('16:00'));
    expect(tarde.titular).toBe('Buenas tardes, Ana. Hoy tienes 1 tarea clave.');
    expect(tarde.detalle).toBe('Te quedan unas 6 h libres.');
    expect(textoBriefing(resumenDelDia([], HOY, h('22:30')), 'Ana', h('22:30')).titular).toBe('Buenas noches, Ana. Hoy no tienes tareas urgentes.');
  });

  it('lo importante de hoy: las tareas clave por orden de hora (las que no tienen hora, al final) y como mucho 3', () => {
    const r = resumenDelDia(
      [...dia(), tarea({ titulo: 'Pagar el seguro', prioridad: 'alta' }), tarea({ titulo: 'Recoger el paquete', hora_limite: '13:00:00', prioridad: 'alta' })],
      HOY,
      h('11:40'),
    );
    const nota = loImportante(r);
    expect(nota.estado).toBe('pendientes');
    expect(nota.tareas.map((t) => `${t.hora} ${t.titulo}`)).toEqual([
      '11:00 Preparar la presentación',
      '13:00 Recoger el paquete',
      '17:00 Enviar el presupuesto',
    ]);
    expect(loImportante(resumenDelDia([tarea({ titulo: 'Pagar el seguro', prioridad: 'alta' })], HOY, h('11:40'))).tareas[0].hora).toBe('sin hora');
  });

  it('lo importante de hoy: si ya has terminado las clave salen tachadas, y si no hay ninguna la nota queda vacía', () => {
    const hechas = loImportante(
      resumenDelDia(
        [
          tarea({ titulo: 'Enviar el presupuesto', hora_limite: '17:00:00', prioridad: 'alta', estado: 'completada' }),
          tarea({ titulo: 'Preparar la presentación', hora_limite: '11:00:00', prioridad: 'alta', estado: 'completada' }),
          tarea({ titulo: 'Comprar pan', prioridad: 'baja' }),
        ],
        HOY,
        h('18:00'),
      ),
    );
    expect(hechas.estado).toBe('hechas');
    expect(hechas.tareas.map((t) => t.titulo)).toEqual(['Preparar la presentación', 'Enviar el presupuesto']);
    // Una clave pendiente gana: la nota enseña lo que queda por hacer, no lo hecho
    const mezcla = loImportante(
      resumenDelDia([tarea({ titulo: 'Hecha', prioridad: 'alta', estado: 'completada' }), tarea({ titulo: 'Pendiente', prioridad: 'alta' })], HOY, h('18:00')),
    );
    expect(mezcla).toEqual({ estado: 'pendientes', tareas: [expect.objectContaining({ titulo: 'Pendiente' })] });
    // Una clave terminada de otro día no cuenta
    const vacia = loImportante(
      resumenDelDia([tarea({ titulo: 'Ayer', fecha_limite: '2026-11-04', prioridad: 'alta', estado: 'completada' })], HOY, h('18:00')),
    );
    expect(vacia).toEqual({ estado: 'vacia', tareas: [] });
  });
});

describe('resumen del día: el hilo y la frase', () => {
  const dia = () => [
    tarea({ titulo: 'Revisar el correo', hora_limite: '09:00:00', duracion_min: 60, estado: 'completada' }),
    tarea({ titulo: 'Llamar al banco', hora_limite: '10:30:00', duracion_min: 30 }), // atrasada a las 11:40
    tarea({ titulo: 'Preparar la presentación', hora_limite: '11:00:00', duracion_min: 90 }), // en curso
    tarea({ titulo: 'Revisión en el dentista', hora_limite: '17:00:00', duracion_min: 90 }),
    tarea({ titulo: 'Comprar el regalo', duracion_min: 45 }), // sin hora
    tarea({ titulo: 'Mañana', fecha_limite: '2026-11-06', hora_limite: '10:00:00' }), // no es de hoy
  ];

  it('pone cada tarea de hoy en su hora y con su estado; las sin hora, al final', () => {
    const hilo = hiloDelDia(dia(), HOY, h('11:40'));
    expect(hilo.puntos.map((p) => `${p.titulo}:${p.estado}`)).toEqual([
      'Revisar el correo:hecha',
      'Llamar al banco:atrasada',
      'Preparar la presentación:encurso',
      'Revisión en el dentista:pendiente',
      'Comprar el regalo:sinhora',
    ]);
    expect(hilo.puntos[0].x).toBeCloseTo(2 + (60 / 840) * 82); // las 9:00 en el hilo de 8 a 22
    expect(hilo.puntos[4].x).toBe(95);
    expect(hilo.total).toBe(5);
    expect(hilo.hechas).toBe(1);
  });

  it('dice qué toca ahora (y hasta cuándo) y qué viene después', () => {
    const hilo = hiloDelDia(dia(), HOY, h('11:40'));
    expect(hilo.enCurso).toEqual({ titulo: 'Preparar la presentación', hasta: '12:30' });
    expect(hilo.despues).toEqual({ titulo: 'Revisión en el dentista', hora: '17:00' });
    const tarde = hiloDelDia(dia(), HOY, h('19:00'));
    expect(tarde.enCurso).toBeNull();
    expect(tarde.despues).toBeNull();
  });

  it('la frase cuenta lo libre y lo tachado (y los casos de ninguna tarea o todo hecho)', () => {
    expect(fraseDelDia(420, 1, 6)).toBe('Te quedan unas 7 h libres y llevas 1 de 6 tachadas.');
    expect(fraseDelDia(0, 6, 6)).toBe('¡Has tachado todo lo de hoy! No te queda tiempo libre hoy.');
    expect(fraseDelDia(600, 0, 0)).toBe('Hoy aún no tienes tareas. Te quedan unas 10 h libres.');
  });
});

describe('lo que se envía al servidor', () => {
  it('convierte las colocadas en los cambios de PATCH /api/tareas/horario (horas con dos cifras)', () => {
    expect(
      aCambiosHorario(
        new Map([
          [4, h('9:15')],
          [7, h('14:00')],
        ]),
        HOY,
      ),
    ).toEqual([
      { id: 4, fecha_limite: HOY, hora_limite: '09:15' },
      { id: 7, fecha_limite: HOY, hora_limite: '14:00' },
    ]);
  });
});
