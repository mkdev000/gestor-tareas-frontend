export function tiempoRelativo(fechaCreacion: string): string {
  const ahora = new Date();
  const creada = new Date(fechaCreacion.replace(' ', 'T'));
  const diffMs = ahora.getTime() - creada.getTime();
  const diffMinutos = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMinutos / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffMinutos < 1) return 'ahora mismo';
  if (diffMinutos < 60) return `hace ${diffMinutos} min`;
  if (diffHoras < 24) return `hace ${diffHoras} h`;
  if (diffDias === 1) return 'ayer';
  if (diffDias < 7) return `hace ${diffDias} días`;
  return creada.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}