// pantallas/ritmo/useAjusteEnergia.ts
// El interruptor «Lo importante, a tu mejor hora» de «Tu hora de tachar» (Fase 9, paso 9.5).
// Se guarda en tu cuenta (ajuste energia_al_reorganizar, migración 008), así vale igual en la web y en el móvil:
//  - al abrir: GET /api/ajustes
//  - al pulsarlo: se cambia al momento y se manda PATCH /api/ajustes; si el servidor dice que no, vuelve como estaba
// Lo usa «Reorganizar mi día» en el paso 9.8.
import { useEffect, useState } from 'react';
import { pedirConSesion } from '../../utils/sesion';

export function useAjusteEnergia() {
  const [activo, setActivo] = useState(false);
  const [listo, setListo] = useState(false); // ya sabemos lo que tienes guardado
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const respuesta = await pedirConSesion('/api/ajustes');
        if (!respuesta.ok) return;
        const datos: { energia_al_reorganizar?: unknown } = await respuesta.json();
        if (vivo) setActivo(datos.energia_al_reorganizar === true);
      } catch {
        // Sin conexión: se queda apagado hasta que se pueda leer
      } finally {
        if (vivo) setListo(true);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  // Devuelve true si se ha guardado y false si no (para avisar)
  const cambiar = async (nuevo: boolean) => {
    setActivo(nuevo);
    setGuardando(true);
    try {
      const respuesta = await pedirConSesion('/api/ajustes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ energia_al_reorganizar: nuevo }),
      });
      if (!respuesta.ok) throw new Error();
      return true;
    } catch {
      setActivo(!nuevo);
      return false;
    } finally {
      setGuardando(false);
    }
  };

  return { activo, listo, guardando, cambiar };
}
