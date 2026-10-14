// utils/contrasena.ts
// Comprueba los 4 requisitos de contraseña del prototipo mientras el usuario escribe.
// OJO: esto es solo para AYUDAR al usuario (barra de fuerza y lista de requisitos).
// La comprobación de verdad la hace SIEMPRE el servidor (Zod en el backend), con las mismas reglas.

export interface Requisito {
  id: string;
  texto: string;
  cumplido: boolean;
}

export interface EvaluacionContrasena {
  requisitos: Requisito[];
  puntos: number;            // cuántos requisitos cumple (0 a 4)
  etiqueta: string;          // "Muy débil", "Débil"... o "Sin contraseña"
  color: string;             // color de la barra y de la etiqueta
  demasiadoLarga: boolean;   // más de 72 bytes (bcrypt ignoraría el resto)
  valida: boolean;           // cumple todo: se puede crear la cuenta
}

const ETIQUETAS = ['Muy débil', 'Débil', 'Aceptable', 'Casi fuerte', 'Fuerte'];
// Los colores del prototipo: rojo, rojo, ámbar, el color fuerte del tema y verde
const COLORES = ['#c4320a', '#c4320a', '#b86e00', 'var(--tachit-acento-fuerte)', '#17804f'];
const GRIS = '#5b6b7c';
const MAXIMO_BYTES = 72;

export function evaluarContrasena(contrasena: string): EvaluacionContrasena {
  // Las mismas expresiones regulares que usa el backend (tareas/validacion/esquemas.js):
  // \p{Lu} = cualquier letra mayúscula (también Á, Ñ...), \p{N} = cualquier número,
  // [^\p{L}\p{N}\s] = cualquier cosa que no sea letra, número ni espacio (un símbolo).
  const requisitos: Requisito[] = [
    { id: 'largo', texto: '8 caracteres o más', cumplido: contrasena.length >= 8 },
    { id: 'mayuscula', texto: 'Una mayúscula', cumplido: /\p{Lu}/u.test(contrasena) },
    { id: 'numero', texto: 'Un número', cumplido: /\p{N}/u.test(contrasena) },
    { id: 'simbolo', texto: 'Un símbolo (!@#…)', cumplido: /[^\p{L}\p{N}\s]/u.test(contrasena) },
  ];

  const puntos = requisitos.filter((r) => r.cumplido).length;
  // TextEncoder cuenta BYTES (una "ñ" o un emoji ocupan más de 1 byte), igual que el servidor
  const demasiadoLarga = new TextEncoder().encode(contrasena).length > MAXIMO_BYTES;
  const vacia = contrasena.length === 0;

  return {
    requisitos,
    puntos,
    etiqueta: vacia ? 'Sin contraseña' : ETIQUETAS[puntos],
    color: vacia ? GRIS : COLORES[puntos],
    demasiadoLarga,
    valida: puntos === requisitos.length && !demasiadoLarga,
  };
}
