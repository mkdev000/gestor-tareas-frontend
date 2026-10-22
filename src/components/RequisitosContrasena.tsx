// components/RequisitosContrasena.tsx
// Barra de seguridad y lista de requisitos de la contraseña (✓ en verde si se cumple, ○ si falta).
// La usan "Crear cuenta" y "Elige tu nueva contraseña": al ser el MISMO componente, las dos pantallas
// se ven siempre iguales (si algún día se cambia, cambia en las dos a la vez).
import type { EvaluacionContrasena } from '../utils/contrasena';

function RequisitosContrasena({ id, evaluacion }: { id: string; evaluacion: EvaluacionContrasena }) {
  return (
    <div id={id} className="flex flex-col gap-2.5">
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors duration-300"
            style={{ background: i < evaluacion.puntos ? evaluacion.color : '#e3e8ef' }}
          />
        ))}
      </div>
      <p className="flex justify-between text-[13px]">
        <span className="text-[#5b6b7c]">Seguridad de la contraseña</span>
        <span className="font-bold" style={{ color: evaluacion.color }}>{evaluacion.etiqueta}</span>
      </p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {evaluacion.requisitos.map((r) => (
          <li key={r.id} className={'text-[13px] font-semibold ' + (r.cumplido ? 'text-[#17804f]' : 'text-[#5b6b7c]')}>
            <span aria-hidden="true">{r.cumplido ? '✓' : '○'}</span> {r.texto}
            <span className="sr-only">{r.cumplido ? ' (cumplido)' : ' (pendiente)'}</span>
          </li>
        ))}
      </ul>
      {evaluacion.demasiadoLarga && (
        <p className="text-[13px] font-semibold text-[#c4320a]">La contraseña es demasiado larga (máximo 72 caracteres).</p>
      )}
    </div>
  );
}

export default RequisitosContrasena;
