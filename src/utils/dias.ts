// utils/dias.ts
// Fechas "de calendario" (sin hora) en TU zona horaria (Fase 4, paso 4.5).
// Ojo: new Date().toISOString() da la fecha en hora de Londres (UTC). En España, entre las 00:00
// y las 02:00 todavía diría "ayer". Por eso aquí se construye la fecha con getFullYear(), getMonth()
// y getDate(), que sí usan la hora de tu ordenador.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const dosCifras = (n: number) => String(n).padStart(2, '0');

// Date → "2026-10-29" (el mismo formato que usa la base de datos)
export function aTextoISO(fecha: Date) {
  return `${fecha.getFullYear()}-${dosCifras(fecha.getMonth() + 1)}-${dosCifras(fecha.getDate())}`;
}

// "2026-10-29" → Date a las 00:00 de ese día en tu hora
export function deTextoISO(texto: string) {
  const [anio, mes, dia] = texto.slice(0, 10).split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

export function hoyISO() {
  return aTextoISO(new Date());
}

export function sumarDias(texto: string, dias: number) {
  const fecha = deTextoISO(texto);
  fecha.setDate(fecha.getDate() + dias);
  return aTextoISO(fecha);
}

// Lunes y domingo de la semana de ese día (en España la semana empieza en lunes)
export function semanaDe(texto: string) {
  // getDay(): 0 = domingo, 1 = lunes... → cuántos días hay que retroceder hasta el lunes
  const retroceso = (deTextoISO(texto).getDay() + 6) % 7;
  const lunes = sumarDias(texto, -retroceso);
  return { lunes, domingo: sumarDias(lunes, 6) };
}

// "Jueves, 29 de octubre" (la fecha de la cabecera)
export function fechaLarga(texto: string) {
  const fecha = deTextoISO(texto);
  const frase = `${DIAS[fecha.getDay()]}, ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
  return frase.charAt(0).toUpperCase() + frase.slice(1);
}
