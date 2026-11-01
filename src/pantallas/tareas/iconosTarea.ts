// pantallas/tareas/iconosTarea.ts
// Los 10 iconos propios de Tachit para las tareas (Fase 5, paso 5.4), los mismos del prototipo:
// un dibujo de línea dentro de una pastilla de color. Son los mismos 10 nombres que acepta el servidor
// (ICONOS en validacion/esquemas.js del backend), así nunca se guarda un icono que no existe.

export interface IconoDeTarea {
  nombre: string; // lo que se lee ("Tarta")
  color: string; // color del dibujo
  fondo: string; // color de la pastilla
  trazo: string; // el dibujo (atributo "d" de un <path> SVG)
}

export const ICONOS_TAREA: Record<string, IconoDeTarea> = {
  tarta: { nombre: 'Tarta', color: '#c2416b', fondo: '#fde6ee', trazo: 'M4 21h16M5 21v-6.5A2.5 2.5 0 0 1 7.5 12h9a2.5 2.5 0 0 1 2.5 2.5V21M5 16.5c1.2.9 2.6.9 3.5 0s2.3-.9 3.5 0 2.3.9 3.5 0 2.3-.9 3.5 0M12 12V8.5M12 6c.9-.8.9-1.8 0-3-.9 1.2-.9 2.2 0 3z' },
  regalo: { nombre: 'Regalo', color: '#b4531f', fondo: '#fdeadd', trazo: 'M4 11h16v9.5H4zM3 7.5h18V11H3zM12 7.5v13M12 7.5C10.8 4.5 7 4 7 6s3.4 1.5 5 1.5zM12 7.5c1.2-3 5-3.5 5-1.5s-3.4 1.5-5 1.5z' },
  medico: { nombre: 'Médico', color: '#c03a3a', fondo: '#fde7e7', trazo: 'M12 20.5s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2zM9.2 12.6h5.6M12 9.8v5.6' },
  viaje: { nombre: 'Viaje', color: '#2563a8', fondo: '#e3eefb', trazo: 'M3 15.5l18-7.5M3 15.5l4 1.5 1.5 4 2.5-3.5M9.5 14.5L21 8l-6.5 11.5-3-3.2M3 15.5L5.5 9l4 3.5' },
  estudio: { nombre: 'Estudio', color: '#5b47b8', fondo: '#ece8fb', trazo: 'M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7.5h6M9 11h4' },
  deporte: { nombre: 'Deporte', color: '#14806a', fondo: '#ddf4ee', trazo: 'M6.5 7.5v9M3.5 10v4M17.5 7.5v9M20.5 10v4M6.5 12h11' },
  compras: { nombre: 'Compras', color: '#8a6200', fondo: '#fbf0d4', trazo: 'M3 4h2.2l2.3 10.5h10.3l2.2-7.5H6.4M9.5 19.5a1 1 0 1 0 0 .01M16.5 19.5a1 1 0 1 0 0 .01' },
  hogar: { nombre: 'Casa', color: '#9a5b00', fondo: '#fff1d6', trazo: 'M3.5 11L12 4.5l8.5 6.5M5.5 9.5V20h13V9.5M10 20v-5.5h4V20' },
  trabajo: { nombre: 'Trabajo', color: '#3d4f66', fondo: '#e6ebf1', trazo: 'M3.5 8h17v11.5h-17zM8.5 8V5.5h7V8M3.5 13h17M11 13v2h2v-2' },
  llamada: { nombre: 'Llamada', color: '#0e6f78', fondo: '#e0f3f4', trazo: 'M5.5 4h3.3l1.7 4.3-2.1 1.3a11 11 0 0 0 6 6l1.3-2.1 4.3 1.7v3.3a2 2 0 0 1-2.2 2A16 16 0 0 1 3.5 6.2 2 2 0 0 1 5.5 4z' },
};

export const CLAVES_ICONO = Object.keys(ICONOS_TAREA);

// "Sin icono": un círculo tachado
export const SIN_ICONO: IconoDeTarea = { nombre: 'Sin icono', color: '#5b6b7c', fondo: '#eef1f5', trazo: 'M18.4 5.6L5.6 18.4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' };
