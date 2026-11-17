// pantallas/MiRitmo.tsx
// Mi ritmo (Fase 9). Lo que hay ahora (paso 9.4):
//  - arriba, «Así va tu semana» con el pulso de la semana (CabeceraRitmo)
//  - si aún tienes menos de 5 tareas tachadas: la nota «Mi ritmo se escribe tachando» (RitmoVacio)
//  - si ya tienes más: los bloques (tu mapa de energía, lo que se te atasca, el cierre de semana...)
//    llegan en el paso 9.5; de momento sale un aviso.
// Los datos: tu historial (useRitmo → GET /api/ritmo) y tus tareas (useTareas). Los cálculos, en ritmo.ts.
import { useMemo } from 'react';
import { useTareas } from './useTareas';
import { useRitmo } from './ritmo/useRitmo';
import { MINIMO_PARA_MAPA, pulsoSemana, rachaAmable, tachadasDe } from './ritmo/ritmo';
import { hoyISO } from '../utils/dias';
import { useEsWeb } from '../utils/useEsWeb';
import CabeceraRitmo from './ritmo/CabeceraRitmo';
import RitmoVacio from './ritmo/RitmoVacio';

function MiRitmo() {
  const esWeb = useEsWeb();
  const { tareas, error: errorTareas } = useTareas();
  const { historial, error } = useRitmo();
  const hoy = hoyISO();

  const datos = useMemo(() => {
    if (!historial) return null;
    const tachadas = tachadasDe(historial.eventos);
    const racha = rachaAmable(tachadas, hoy);
    return { tachadas, racha, pulso: pulsoSemana(tachadas, racha, hoy) };
  }, [historial, hoy]);

  const conTiempo = tareas.filter((t) => t.estado === 'completada' && t.minutos_reales).length;
  const fallo = error || errorTareas;

  return (
    <div className="flex max-w-[1180px] flex-col gap-5">
      {fallo && (
        <p role="alert" className="text-sm text-[#b42318]">
          {fallo}
        </p>
      )}
      {!datos && !fallo && <p className="text-sm text-[#5b6b7c]">Cargando tu ritmo…</p>}
      {datos && (
        <>
          <CabeceraRitmo pulso={datos.pulso} racha={datos.racha} />
          {datos.tachadas.length < MINIMO_PARA_MAPA ? (
            <RitmoVacio hechas={datos.tachadas.length} conTiempo={conTiempo} textoIr={esWeb ? 'Ir a Mi día' : 'Ir a Hoy'} />
          ) : (
            <p className="text-sm text-[#5b6b7c]">
              Los bloques de Mi ritmo (tu mapa de energía, lo que se te atasca y el cierre de semana) llegan en el paso 9.5.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default MiRitmo;
