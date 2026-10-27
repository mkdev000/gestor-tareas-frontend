// tema/temas.ts
// Los 4 temas de color de Tachit (Fase 4, paso 4.2).
// Los colores NO están aquí: viven en index.css, en los bloques [data-tema="..."].
// Aquí solo está la lista de temas y cómo se guarda el elegido en este dispositivo.

export const TEMAS = [
  { clave: 'nube', nombre: 'Nube', descripcion: 'Lavanda claro · el principal' },
  { clave: 'malva', nombre: 'Malva', descripcion: 'Malva rosado' },
  { clave: 'peonia', nombre: 'Peonía', descripcion: 'Rosa empolvado' },
  { clave: 'cacao', nombre: 'Cacao', descripcion: 'Malva tostado' },
] as const;

// "ClaveTema" solo puede ser 'nube' | 'malva' | 'peonia' | 'cacao': TypeScript no deja escribir otra cosa
export type ClaveTema = (typeof TEMAS)[number]['clave'];

export const TEMA_POR_DEFECTO: ClaveTema = 'nube';

// Nombre con el que se guarda en el navegador (el mismo que lee el script de index.html)
const CLAVE_GUARDADO = 'tachit-tema';

// ¿Es un tema que existe? Sirve para no fiarse de lo que venga del navegador o del servidor
export function esTema(valor: unknown): valor is ClaveTema {
  return TEMAS.some((tema) => tema.clave === valor);
}

export function nombreDelTema(clave: ClaveTema) {
  return TEMAS.find((tema) => tema.clave === clave)?.nombre ?? clave;
}

// El tema guardado en este dispositivo (o Nube si no hay ninguno)
export function leerTemaDelDispositivo(): ClaveTema {
  try {
    const guardado = localStorage.getItem(CLAVE_GUARDADO);
    if (esTema(guardado)) return guardado;
  } catch {
    // Navegación privada o almacenamiento bloqueado: usamos el de por defecto
  }
  return TEMA_POR_DEFECTO;
}

// Pinta la app con el tema: cambia el atributo data-tema de <html> y todo el CSS lo lee al momento
export function aplicarTema(clave: ClaveTema) {
  document.documentElement.dataset.tema = clave;
  try {
    localStorage.setItem(CLAVE_GUARDADO, clave);
  } catch {
    // Si no se puede guardar, el tema se aplica igual (solo no se recordará en este navegador)
  }
}
