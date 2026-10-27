// tema/ProveedorTema.tsx
// Envuelve toda la app (en main.tsx) y guarda el tema elegido.
//  - Al cambiarlo: se pinta al momento, se guarda en este navegador y se manda a tu cuenta (PATCH /api/ajustes).
//  - Al entrar: se pide a tu cuenta (GET /api/ajustes), para que en el móvil y en la web salga el mismo.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ContextoTema, type ValorTema } from './contextoTema';
import { aplicarTema, esTema, leerTemaDelDispositivo, type ClaveTema } from './temas';
import { pedirConSesion } from '../utils/sesion';

function ProveedorTema({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<ClaveTema>(leerTemaDelDispositivo);
  // Cuenta las veces que la persona cambia el tema: si cambia mientras llega el de la cuenta, gana lo que eligió
  const cambiosHechos = useRef(0);
  // Fila de guardados: si pulsas varios temas seguidos, se mandan en orden y el último es el que se queda
  const filaDeGuardados = useRef<Promise<unknown>>(Promise.resolve());

  // Cada vez que cambia el tema, se pinta en la página
  useEffect(() => {
    aplicarTema(tema);
  }, [tema]);

  const cambiarTema = useCallback(async (nuevo: ClaveTema) => {
    cambiosHechos.current += 1;
    setTema(nuevo);

    const guardar = filaDeGuardados.current.then(() =>
      pedirConSesion('/api/ajustes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: nuevo }),
      }),
    );
    // Aunque un guardado falle, la fila sigue para los siguientes
    filaDeGuardados.current = guardar.catch(() => undefined);

    try {
      const respuesta = await guardar;
      return respuesta.ok;
    } catch {
      return false; // sin conexión: el tema se queda en este dispositivo
    }
  }, []);

  const cargarTemaDeLaCuenta = useCallback(async () => {
    const cambiosAlEmpezar = cambiosHechos.current;
    try {
      const respuesta = await pedirConSesion('/api/ajustes');
      if (!respuesta.ok) return;
      const datos: { tema?: unknown } = await respuesta.json();
      // Solo lo usamos si es un tema válido y si la persona no ha elegido otro mientras tanto
      if (esTema(datos.tema) && cambiosHechos.current === cambiosAlEmpezar) setTema(datos.tema);
    } catch {
      // Sin conexión: nos quedamos con el tema de este dispositivo
    }
  }, []);

  const valor = useMemo<ValorTema>(() => ({ tema, cambiarTema, cargarTemaDeLaCuenta }), [tema, cambiarTema, cargarTemaDeLaCuenta]);

  return <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>;
}

export default ProveedorTema;
