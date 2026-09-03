export function colorPorEstado(estado: string): string {
  switch (estado) {
    case 'en_progreso':
      return 'bg-azul-suave text-azul';
    case 'en_pausa':
      return 'bg-ambar-suave text-ambar';
    case 'completada':
      return 'bg-verde-suave text-verde';
    default:
      return 'bg-fondo text-muted';
  }
}