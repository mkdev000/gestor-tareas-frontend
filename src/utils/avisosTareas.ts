// utils/avisosTareas.ts
// Un "timbre" para avisar de que las tareas han cambiado (Fase 4, paso 4.5).
// Cuando una pantalla crea, completa o borra una tarea, toca el timbre (avisarCambioTareas)
// y la barra lateral, que lo está escuchando, vuelve a pedir sus datos (el anillo y las categorías).
// Así la barra no tiene que saber nada de cómo funciona cada pantalla.

const oyentes = new Set<() => void>();

export function avisarCambioTareas() {
  oyentes.forEach((oyente) => oyente());
}

// Devuelve la función para dejar de escuchar (igual que alCaducarSesion en sesion.ts)
export function alCambiarTareas(oyente: () => void) {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}
