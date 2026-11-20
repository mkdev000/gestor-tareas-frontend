// pantallas/ritmo/useAjustesRitmo.ts
// Los dos interruptores de Mi ritmo (Fase 9, paso 9.5). Se guardan en tu cuenta (migración 008), así valen igual en la web y en el móvil:
//  - «Lo importante, a tu mejor hora» (Tu hora de tachar) → ajuste energia_al_reorganizar
//  - «Usar mis tiempos de verdad» (Lo que tardas de verdad) → ajuste corregir_tiempos
// Cómo funciona:
//  - al abrir: un solo GET /api/ajustes para los dos
//  - al pulsar uno: cambia al momento y se manda PATCH /api/ajustes solo con ese; si el servidor dice que no, vuelve como estaba
// Los usa el paso 9.8 (al reorganizar y al crear tareas sin duración).
import { useEffect, useState } from 'react';
import { pedirConSesion } from '../../utils/sesion';

type Campo = 'energia_al_reorganizar' | 'corregir_tiempos';

export interface Interruptor {
  activo: boolean;
  disponible: boolean; // ya se sabe lo que tienes guardado y no se está guardando
  cambiar: (nuevo: boolean) => Promise<boolean>; // true si se ha guardado, false si no (para avisar)
}

export function useAjustesRitmo(): Record<'energia' | 'tiempos', Interruptor> {
  const [valores, setValores] = useState<Record<Campo, boolean>>({ energia_al_reorganizar: false, corregir_tiempos: false });
  const [listo, setListo] = useState(false);
  const [guardando, setGuardando] = useState<Campo[]>([]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const respuesta = await pedirConSesion('/api/ajustes');
        if (!respuesta.ok) return;
        const datos: Partial<Record<Campo, unknown>> = await respuesta.json();
        // Solo vale true de verdad (si llega otra cosa, apagado)
        if (vivo) setValores({ energia_al_reorganizar: datos.energia_al_reorganizar === true, corregir_tiempos: datos.corregir_tiempos === true });
      } catch {
        // Sin conexión: se quedan apagados hasta que se puedan leer
      } finally {
        if (vivo) setListo(true);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const cambiar = async (campo: Campo, nuevo: boolean) => {
    setValores((v) => ({ ...v, [campo]: nuevo }));
    setGuardando((g) => [...g, campo]);
    try {
      const respuesta = await pedirConSesion('/api/ajustes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [campo]: nuevo }),
      });
      if (!respuesta.ok) throw new Error();
      return true;
    } catch {
      setValores((v) => ({ ...v, [campo]: !nuevo }));
      return false;
    } finally {
      setGuardando((g) => g.filter((x) => x !== campo));
    }
  };

  const interruptor = (campo: Campo): Interruptor => ({
    activo: valores[campo],
    disponible: listo && !guardando.includes(campo),
    cambiar: (nuevo) => cambiar(campo, nuevo),
  });

  return { energia: interruptor('energia_al_reorganizar'), tiempos: interruptor('corregir_tiempos') };
}
