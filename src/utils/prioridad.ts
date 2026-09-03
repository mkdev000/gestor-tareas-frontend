export function colorBarraPrioridad(prioridad: string): string {
  switch (prioridad) {
    case 'urgente':
      return 'bg-rosa';
    case 'alta':
      return 'bg-ambar';
    case 'media':
      return 'bg-azul';
    default:
      return 'bg-muted';
  }
}