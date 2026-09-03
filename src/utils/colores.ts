export function colorPorTexto(texto: string): string {
  const colores = ['#4daeea', '#0a1e2f', '#2FB380', '#F5A524', '#FF6B8A'];
  let suma = 0;
  for (let i = 0; i < texto.length; i++) {
    suma += texto.charCodeAt(i);
  }
  return colores[suma % colores.length];
}