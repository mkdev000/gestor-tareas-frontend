// pantallas/MiRitmo.tsx
// Mi ritmo (Fase 9). Lo que hay ahora:
//  - arriba, «Así va tu semana» con el pulso de la semana (CabeceraRitmo, paso 9.4)
//  - si aún tienes menos de 5 tareas tachadas: la nota «Mi ritmo se escribe tachando» (RitmoVacio, paso 9.4)
//  - si ya tienes más: «Tu hora de tachar» (HoraDeTachar, paso 9.5); los demás bloques (lo que se te atasca,
//    cuánto te equivocas calculando, el cierre de semana...) llegan en los siguientes pasos.
// Los datos: tu historial (useRitmo → GET /api/ritmo) y tus tareas (useTareas). Los cálculos, en ritmo.ts.
import { useCallback, useMemo, useState } from 'react';
import { useTareas } from './useTareas';
import { useRitmo } from './ritmo/useRitmo';
import { useAjusteEnergia } from './ritmo/useAjusteEnergia';
import { MINIMO_PARA_MAPA, mapaEnergia, pulsoSemana, rachaAmable, tachadasDe } from './ritmo/ritmo';
import { hoyISO } from '../utils/dias';
import { useEsWeb } from '../utils/useEsWeb';
import AvisoFlotante, { type DatosAviso } from '../componentes/base/AvisoFlotante';
import CabeceraRitmo from './ritmo/CabeceraRitmo';
import RitmoVacio from './ritmo/RitmoVacio';
import HoraDeTachar from './ritmo/HoraDeTachar';

function MiRitmo() {
  const esWeb = useEsWeb();
  const { tareas, error: errorTareas } = useTareas();
  const { historial, error } = useRitmo();
  const energia = useAjusteEnergia();
  const [aviso, setAviso] = useState<DatosAviso | null>(null);
  const cerrarAviso = useCallback(() => setAviso(null), []);
  const hoy = hoyISO();

  const datos = useMemo(() => {
    if (!historial) return null;
    const tachadas = tachadasDe(historial.eventos);
    const racha = rachaAmable(tachadas, hoy);
    return { tachadas, racha, pulso: pulsoSemana(tachadas, racha, hoy), mapa: mapaEnergia(tachadas) };
  }, [historial, hoy]);

  const conTiempo = tareas.filter((t) => t.estado === 'completada' && t.minutos_reales).length;
  const fallo = error || errorTareas;

  // El interruptor «Lo importante, a tu mejor hora»: se guarda en tu cuenta y avisa de lo que pasará al reorganizar
  const cambiarEnergia = async (nuevo: boolean) => {
    const guardado = await energia.cambiar(nuevo);
    if (!guardado) setAviso({ titulo: 'No se pudo guardar', texto: 'Revisa la conexión e inténtalo de nuevo.' });
    else if (nuevo) setAviso({ titulo: 'Lo importante, a tu mejor hora', texto: 'Al reorganizar tu día, tus tareas importantes irán a tu mejor rato.' });
    else setAviso({ titulo: 'Reorganizar como siempre', texto: 'Al reorganizar tu día, Tachit usará el primer hueco libre.' });
  };

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
            <>
              <div className="ritmo-rejilla">
                <HoraDeTachar
                  mapa={datos.mapa}
                  reorganizar={{ activo: energia.activo, disponible: energia.listo && !energia.guardando, alCambiar: cambiarEnergia }}
                />
              </div>
              <p className="text-sm text-[#5b6b7c]">
                Los demás bloques (lo que se te atasca, cuánto te equivocas calculando y el cierre de semana) llegan en los siguientes pasos.
              </p>
            </>
          )}
        </>
      )}
      {aviso && <AvisoFlotante aviso={aviso} alCerrar={cerrarAviso} />}
    </div>
  );
}

export default MiRitmo;
