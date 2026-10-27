// tema/contextoTema.ts
// El "contexto" del tema: una caja compartida que cualquier pantalla puede abrir con useTema()
// para saber qué tema hay y cambiarlo, sin tener que pasarlo de componente en componente.
import { createContext, useContext } from 'react';
import type { ClaveTema } from './temas';

export interface ValorTema {
  tema: ClaveTema;
  // Cambia el tema al momento y lo guarda en tu cuenta. Devuelve true si se guardó en el servidor.
  cambiarTema: (nuevo: ClaveTema) => Promise<boolean>;
  // Trae de tu cuenta el tema que elegiste (por ejemplo, en otro dispositivo)
  cargarTemaDeLaCuenta: () => Promise<void>;
}

export const ContextoTema = createContext<ValorTema | null>(null);

export function useTema() {
  const valor = useContext(ContextoTema);
  if (!valor) throw new Error('useTema tiene que usarse dentro de <ProveedorTema>');
  return valor;
}
