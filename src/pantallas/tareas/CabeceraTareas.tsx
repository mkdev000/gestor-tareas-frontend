// pantallas/tareas/CabeceraTareas.tsx
// La parte de arriba de Tareas en la web (Fase 5, paso 5.2), igual que en el prototipo:
//  - el saludo ("Hola, Kevin") con tu inicial y cómo vas hoy
//  - la tarjeta "Pulso del día": el anillo de lo hecho hoy, lo que toca ahora (o lo siguiente),
//    la franja del día de 8 a 22 h con tus tareas, y la racha de la semana (lleva a Mi ritmo)
// En el móvil no sale: en el prototipo móvil, el pulso está en la pantalla Hoy (Fase 7).
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Tarea } from '../useTareas';
import { calcularPulso } from './pulso';
import { calcularRacha } from '../../utils/racha';
import { sumarDias, hoyISO, deTextoISO } from '../../utils/dias';

const PERIMETRO = 163.4; // 2 · π · 26 (el radio del anillo)
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

// Lleva la vista a una tarea de la lista (las tarjetas tienen id="tarea-123", paso 5.4)
function irATarea(id: number) {
  const tarjeta = document.getElementById(`tarea-${id}`);
  if (!tarjeta) return;
  tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' });
  tarjeta.focus({ preventScroll: true });
}

// alIrATarea: la pantalla de Tareas pone el filtro "Hoy", abre la tarea y la resalta antes de ir a ella
function CabeceraTareas({ tareas, alIrATarea = irATarea }: { tareas: Tarea[]; alIrATarea?: (id: number) => void }) {
  const navigate = useNavigate();
  // La hora de "ahora" se actualiza cada minuto (para la rayita roja y "lo que toca ahora")
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const reloj = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(reloj);
  }, []);

  const pulso = calcularPulso(tareas, ahora);
  const racha = calcularRacha(tareas);
  const nombre = localStorage.getItem('nombre') || 'Tú';
  const inicial = nombre.trim().charAt(0).toUpperCase() || 'T';
  const hoy = hoyISO();

  return (
    <section aria-label="Pulso del día" className="hidden flex-col gap-5 lg:flex xl:flex-row xl:items-center">
      {/* Saludo */}
      <div className="flex shrink-0 items-center gap-3.5">
        <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7c5cd6] text-xl font-extrabold text-white">
          {inicial}
        </span>
        <div>
          <p className="text-2xl font-extrabold tracking-[-0.4px]">Hola, {nombre}</p>
          <p className="text-sm text-[#5b6b7c]">{pulso.saludo}</p>
        </div>
      </div>

      {/* Pulso del día */}
      <div className="flex min-w-0 grow items-center gap-[22px] rounded-2xl border border-[#e3e8ef] bg-white px-5 py-3">
        {/* Anillo: se llena con las hechas de hoy */}
        <div className="relative h-[60px] w-[60px] shrink-0" role="img" aria-label={`${pulso.hechas} de ${pulso.total} tareas de hoy hechas`}>
          <svg width="60" height="60" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#e8edf3" strokeWidth="7" />
            <circle
              className="pulso-anillo"
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="#17804f"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${pulso.total ? (pulso.hechas / pulso.total) * PERIMETRO : 0} 164`}
              transform="rotate(-90 32 32)"
            />
          </svg>
          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-[#0f1f2e]">
            {pulso.hechas}/{pulso.total}
          </span>
        </div>

        {/* Cómo vas y lo que toca */}
        <div className="w-[210px] min-w-0 shrink-0">
          <p className="text-[15px] font-extrabold">{pulso.titulo}</p>
          {pulso.siguiente ? (
            <button type="button" onClick={() => alIrATarea(pulso.siguiente!.id)} className="pulso-siguiente">
              {pulso.siguiente.texto}
            </button>
          ) : (
            <p className="mt-0.5 truncate text-[13px] text-[#5b6b7c]">No queda nada programado hoy</p>
          )}
        </div>

        {/* La franja del día, de 8:00 a 22:00 */}
        <div className="min-w-0 grow">
          <div className="relative h-[22px] rounded-md bg-[#f1f4f8]">
            {pulso.segmentos.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => alIrATarea(s.id)}
                title={`${s.inicio} · ${s.titulo} (pulsa para ir)`}
                aria-label={`Ir a ${s.titulo}, a las ${s.inicio}`}
                className="absolute top-1 bottom-1 cursor-pointer rounded border-0 p-0"
                style={{ left: `${s.izquierda}%`, width: `${s.ancho}%`, background: s.color, opacity: s.apagado ? 0.75 : 1 }}
              />
            ))}
            {pulso.ahora !== null && (
              <span aria-hidden="true" className="absolute -top-1 -bottom-1 w-0.5 rounded-sm bg-[#c4320a]" style={{ left: `${pulso.ahora}%` }} />
            )}
          </div>
          <div className="mt-[5px] flex justify-between text-[11px] text-[#5b6b7c]">
            <span>8:00</span>
            <span>tu día de un vistazo</span>
            <span>22:00</span>
          </div>
        </div>

        {/* La racha: lleva a Mi ritmo */}
        <button
          type="button"
          onClick={() => navigate('/ritmo')}
          aria-label={`${racha.dias} días de racha. Ver la racha en Mi ritmo`}
          className="flex shrink-0 cursor-pointer flex-col items-end gap-1.5 border-0 bg-transparent py-0 pr-0 pl-[18px] font-jakarta"
          style={{ borderLeft: '1px solid #edf1f5' }}
        >
          <span className="text-[13px] text-[#5b6b7c]">
            <strong className="text-xl text-[#0f1f2e]">{racha.dias}</strong> {racha.dias === 1 ? 'día de racha' : 'días de racha'}
          </span>
          <span className="flex gap-1" aria-hidden="true">
            {racha.ultimos7.map((hizo, i) => {
              const dia = sumarDias(hoy, i - 6);
              const esHoy = i === 6;
              const nombreDia = esHoy ? 'hoy' : DIAS_CORTOS[deTextoISO(dia).getDay()];
              return (
                <span
                  key={dia}
                  title={`${nombreDia}: ${hizo ? 'completado' : esHoy ? 'pendiente' : 'sin tareas hechas'}`}
                  className={'pulso-dia' + (hizo ? ' hecho' : esHoy ? ' hoy' : '')}
                />
              );
            })}
          </span>
        </button>
      </div>
    </section>
  );
}

export default CabeceraTareas;
