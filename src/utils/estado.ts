export function colorPorEstado(estado: string): string {
  switch (estado) {
    case 'completada':
      return 'bg-verde-suave text-verde';
    default:
      return 'bg-ambar-suave text-ambar';
  }
}