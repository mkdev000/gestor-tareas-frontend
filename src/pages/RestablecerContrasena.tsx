// pages/RestablecerContrasena.tsx
// La página que abre el enlace del email (Fase 3, paso 9.3): /restablecer-contrasena#token=…
// Tres momentos:
//  'nueva'    → "Elige tu nueva contraseña" (ojo, barra de seguridad y requisitos, igual que "Crear cuenta").
//  'lista'    → "¡Listo! Contraseña nueva" y botón para entrar.
//  'caducado' → "Este enlace ya no sirve" (caducado, ya usado o mal copiado) y botón para pedir otro.
//
// SEGURIDAD: el código del enlace va después de "#", así que nunca viaja al servidor de la web.
// Nada más abrir la página lo guardamos en memoria y lo BORRAMOS de la barra de direcciones,
// para que no se quede en el historial del navegador ni se vea si compartes pantalla.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MarcoAcceso from '../components/MarcoAcceso';
import CampoContrasena from '../components/CampoContrasena';
import RequisitosContrasena from '../components/RequisitosContrasena';
import CheckBoton from '../components/CheckBoton';
import { evaluarContrasena } from '../utils/contrasena';
import { enviar } from '../utils/peticiones';

// El mismo formato que acepta el backend: letras, números, - y _ (entre 20 y 100)
const FORMATO_CODIGO = /^[A-Za-z0-9_-]{20,100}$/;

// Lee el código de "#token=…" (o null si no hay o tiene un formato raro)
function leerCodigoDelEnlace(): string | null {
  const codigo = new URLSearchParams(window.location.hash.slice(1)).get('token');
  return codigo && FORMATO_CODIGO.test(codigo) ? codigo : null;
}

const CLASE_BOTON =
  'boton-tachit flex h-12 items-center justify-center gap-1.5 rounded-xl text-base font-extrabold transition-transform focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento enabled:cursor-pointer enabled:bg-tachit-acento-fuerte enabled:text-white disabled:cursor-not-allowed disabled:bg-[#dde3ea] disabled:text-[#5b6b7c]';

function RestablecerContrasena() {
  const navigate = useNavigate();
  // El código se lee UNA vez, al abrir la página
  const [codigo] = useState(leerCodigoDelEnlace);
  const [fase, setFase] = useState<'nueva' | 'lista' | 'caducado'>(codigo ? 'nueva' : 'caducado');
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  // Borramos "#token=…" de la barra de direcciones (sin recargar la página)
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(window.history.state, '', window.location.pathname);
    }
  }, []);

  const evaluacion = evaluarContrasena(contrasena);
  const botonDesactivado = enviando || !evaluacion.valida;
  let textoBoton = evaluacion.valida ? 'Guardar contraseña' : 'Completa los requisitos';
  if (enviando) textoBoton = 'Guardando…';

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (botonDesactivado || !codigo) return;
    setError('');
    setEnviando(true);
    try {
      const respuesta = await enviar('/api/auth/restablecer-contrasena', { token: codigo, contrasena });
      if (respuesta.ok) {
        setFase('lista');
        return;
      }
      // 400 con "enlace": caducado, ya usado o inventado → pantalla de "ya no sirve"
      if (respuesta.estado === 400 && /enlace/i.test(respuesta.datos.mensaje ?? '')) {
        setFase('caducado');
        return;
      }
      setError(respuesta.datos.mensaje || 'No se ha podido cambiar la contraseña. Inténtalo de nuevo.');
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <MarcoAcceso>
      {fase === 'nueva' && (
        <div key="nueva" className="entrada-suave flex flex-col gap-5">
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-tachit-acento-suave px-2.5 py-1.5 text-[12.5px] font-bold text-tachit-acento-fuerte">
            <span className="inline-flex gap-[3px]" aria-hidden="true">
              <span className="h-1 w-3.5 rounded bg-tachit-acento" />
              <span className="h-1 w-3.5 rounded bg-tachit-acento" />
              <span className="h-1 w-3.5 rounded bg-tachit-acento opacity-35" />
            </span>
            Último paso · 3 de 3
          </span>

          <div>
            <h2 className="text-[28px] font-extrabold tracking-[-0.5px]">Elige tu nueva contraseña</h2>
            <p className="mt-1.5 text-[15px] text-[#5b6b7c]">Fácil de recordar para ti, difícil de adivinar para los demás.</p>
          </div>

          <form onSubmit={manejarSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contrasena-nueva" className="text-sm font-semibold">Contraseña nueva</label>
              <CampoContrasena
                id="contrasena-nueva"
                valor={contrasena}
                alCambiar={setContrasena}
                autoComplete="new-password"
                placeholder="Escribe tu contraseña nueva"
                describidoPor="requisitos-contrasena-nueva"
              />
            </div>

            {/* Los mismos requisitos que en "Crear cuenta" (es el mismo componente) */}
            <RequisitosContrasena id="requisitos-contrasena-nueva" evaluacion={evaluacion} />

            {error && (
              <p role="alert" className="text-sm font-semibold text-[#c4320a]">{error}</p>
            )}

            <button type="submit" disabled={botonDesactivado} className={CLASE_BOTON}>
              {textoBoton}
              <CheckBoton />
            </button>
          </form>
        </div>
      )}

      {fase === 'lista' && (
        <div key="lista" className="entrada-suave flex flex-col gap-5" role="status">
          <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-tachit-acento-suave" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24">
              <path className="sello-check" d="M4 12.5l5 5L20 6.5" fill="none" stroke="var(--tachit-acento-fuerte)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <h2 className="text-[28px] font-extrabold tracking-[-0.5px]">¡Listo! Contraseña nueva</h2>
            <p className="mt-1.5 text-[15px] leading-normal text-[#5b6b7c]">
              Ya puedes entrar con ella. Por seguridad, el enlace que usaste ha dejado de funcionar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true, state: { aviso: 'Contraseña cambiada. Ya puedes entrar con tu contraseña nueva.' } })}
            className={CLASE_BOTON}
          >
            Entrar en Tachit
            <CheckBoton />
          </button>
        </div>
      )}

      {fase === 'caducado' && (
        <div key="caducado" className="entrada-suave flex flex-col gap-5">
          <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#eef1f5]" aria-hidden="true">
            <svg width="38" height="38" viewBox="0 0 64 64" fill="none">
              <rect x="8" y="16" width="48" height="34" rx="7" stroke="#8a96a3" strokeWidth="3.5" />
              <path d="M10 19 L32 35 L54 19" stroke="#8a96a3" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="50" cy="46" r="11" fill="#eef1f5" stroke="#8a96a3" strokeWidth="3.5" />
              <path d="M50 40 V46 L54 49" stroke="#8a96a3" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <h2 className="text-[28px] font-extrabold tracking-[-0.5px]">Este enlace ya no sirve</h2>
            <p className="mt-1.5 text-[15px] leading-normal text-[#5b6b7c]">
              Los enlaces caducan a los 30 minutos y solo se pueden usar una vez. Pide uno nuevo y llegará en unos segundos.
            </p>
          </div>
          <button type="button" onClick={() => navigate('/olvide-contrasena', { replace: true })} className={CLASE_BOTON}>
            Pedir un enlace nuevo
            <CheckBoton />
          </button>
          <p className="border-t border-[#dde3ea] pt-[18px] text-center text-[14.5px] text-[#5b6b7c]">
            ¿Ya la recuerdas?{' '}
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="cursor-pointer rounded font-extrabold text-tachit-acento-fuerte hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      )}
    </MarcoAcceso>
  );
}

export default RestablecerContrasena;
