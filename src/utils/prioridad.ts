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

export function colorPildoraPrioridad(prioridad: string): string {
  switch (prioridad) {
    case 'urgente':
      return 'bg-rosa-suave text-rosa';
    case 'alta':
      return 'bg-ambar-suave text-ambar';
    case 'media':
      return 'bg-azul-suave text-azul';
    default:
      return 'bg-fondo text-muted';
  }
}