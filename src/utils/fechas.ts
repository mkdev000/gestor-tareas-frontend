const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatearFecha(fecha: string | null): string | null {
  if (!fecha) return null;
  const soloFecha = fecha.slice(0, 10); // "YYYY-MM-DD"
  const [, mes, dia] = soloFecha.split('-');
  return `${parseInt(dia)} ${meses[parseInt(mes) - 1]}`;
}