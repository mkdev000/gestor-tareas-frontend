// utils/peticiones.ts
// Envía datos al servidor (POST con JSON) y devuelve la respuesta ya leída.
// Si el servidor no devuelve JSON (por ejemplo, una página de error), no rompemos la pantalla.
import { API_URL } from '../config';

export interface RespuestaServidor {
  mensaje?: string;
  token?: string;
  nombre?: string;
  nuevo?: boolean; // Google: true si la cuenta se acaba de crear
  unida?: boolean; // Google: true si Google se acaba de unir a una cuenta que ya existía
}

export async function enviar(ruta: string, cuerpo: object) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  const datos: RespuestaServidor = await respuesta.json().catch(() => ({}));
  return { ok: respuesta.ok, estado: respuesta.status, datos };
}
