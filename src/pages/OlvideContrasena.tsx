// pages/OlvideContrasena.tsx
// "¿Olvidaste tu contraseña?" (Fase 3, paso 9.3): pedir el enlace por email.
// Dos momentos en la misma pantalla:
//  1. 'pedir'   → escribes tu email y pulsas "Enviarme el enlace".
//  2. 'enviado' → "Revisa tu email" + "Tu plan para volver a entrar" (3 pasos) + "Reenviar" con cuenta atrás.
// El servidor responde SIEMPRE lo mismo, exista o no la cuenta: por eso aquí decimos "Si ese email tiene una cuenta…".
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MarcoAcceso from '../components/MarcoAcceso';
import CheckBoton from '../components/CheckBoton';
import { enviar } from '../utils/peticiones';

const ESPERA_REENVIAR = 60; // segundos hasta poder pedir otro enlace (evita pulsar 20 veces)

// Clases que se repiten
const CLASE_ENLACE =
  'rounded font-extrabold text-tachit-acento-fuerte hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento';
const CLASE_BOTON =
  'boton-tachit flex h-12 items-center justify-center gap-1.5 rounded-xl text-base font-extrabold transition-transform focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento enabled:cursor-pointer enabled:bg-tachit-acento-fuerte enabled:text-white disabled:cursor-not-allowed disabled:bg-[#dde3ea] disabled:text-[#5b6b7c]';

// El sobre de Tachit. Con "tachado", su línea de tachar (la del logo, que acaba en check) se dibuja sola.
function Sobre({ tachado = false }: { tachado?: boolean }) {
  return (
    <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-tachit-acento-suave" aria-hidden="true">
      <svg width={tachado ? 44 : 40} height={tachado ? 44 : 40} viewBox="0 0 64 64" fill="none">
        <rect x="8" y="16" width="48" height="34" rx="7" stroke="#0f1f2e" strokeWidth="3.5" />
        <path d="M10 19 L32 35 L54 19" stroke="#0f1f2e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        {tachado && (
          <path className="sobre-tachon" d="M2 34 H44 L50 41 L62 24" stroke="var(--tachit-acento)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </span>
  );
}

// Un paso de "Tu plan para volver a entrar" (el hecho sale marcado y tachado, como una tarea)
function PasoPlan({ titulo, pista, hecho = false }: { titulo: string; pista?: string; hecho?: boolean }) {
  return (
    <li className={'paso-plan flex items-start gap-3 py-2' + (hecho ? ' hecho' : '')}>
      <span className="bola-paso" aria-hidden="true">
        {hecho && (
          <svg width="12" height="12" viewBox="0 0 24 24">
            <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <div>
        <p className="titulo-paso text-[14.5px] font-bold">
          {titulo}
          <span className="sr-only">{hecho ? ' (hecho)' : ' (pendiente)'}</span>
        </p>
        {pista && <p className="mt-0.5 text-[13px] text-[#5b6b7c]">{pista}</p>}
      </div>
    </li>
  );
}

function OlvideContrasena() {
  const estado = (useLocation().state ?? {}) as { email?: string };
  const [email, setEmail] = useState(estado.email ?? '');
  const [fase, setFase] = useState<'pedir' | 'enviado'>('pedir');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [segundos, setSegundos] = useState(0);

  // Cuenta atrás de "Reenviar en 0:59…": baja 1 cada segundo hasta llegar a 0
  useEffect(() => {
    if (segundos <= 0) return;
    const temporizador = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(temporizador); // al salir de la pantalla, se para
  }, [segundos]);

  // Pide el enlace al servidor (se usa al enviar el formulario y al pulsar "Reenviar")
  const pedirEnlace = async () => {
    setError('');
    setAviso('');
    setEnviando(true);
    try {
      const respuesta = await enviar('/api/auth/olvide-contrasena', { email });
      if (!respuesta.ok) {
        setError(respuesta.datos.mensaje || 'No se ha podido enviar el enlace. Inténtalo de nuevo.');
        return false;
      }
      setFase('enviado');
      setSegundos(ESPERA_REENVIAR);
      return true;
    } catch {
      setError('No se pudo conectar con el servidor');
      return false;
    } finally {
      setEnviando(false);
    }
  };

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enviando) await pedirEnlace();
  };

  const reenviar = async () => {
    if (segundos > 0 || enviando) return;
    if (await pedirEnlace()) setAviso('Te hemos enviado otro enlace. Usa siempre el último: los anteriores ya no sirven.');
  };

  const estiloCampo =
    'h-[46px] w-full rounded-[10px] border border-[#cfd8e3] bg-white px-[14px] text-[15px] text-[#0f1f2e] font-normal focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento';

  return (
    <MarcoAcceso>
      {fase === 'pedir' ? (
        <div key="pedir" className="entrada-suave flex flex-col gap-5">
          <Link
            to="/login"
            state={{ email }}
            replace
            className="enlace-volver inline-flex items-center gap-1.5 self-start rounded px-0.5 py-1 text-[13.5px] font-bold text-tachit-acento-fuerte focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento"
          >
            <svg className="flecha-volver" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
            Volver a entrar
          </Link>

          <Sobre />

          <div>
            <h2 className="text-[28px] font-extrabold tracking-[-0.5px]">¿Olvidaste tu contraseña?</h2>
            <p className="mt-1.5 text-[15px] leading-normal text-[#5b6b7c]">
              Le pasa a cualquiera. Escribe tu email y te enviamos un enlace para elegir una nueva.
            </p>
          </div>

          <form onSubmit={manejarSubmit} className="flex flex-col gap-5">
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="kevin@ejemplo.com"
                maxLength={150}
                required
                className={estiloCampo}
              />
            </label>

            {error && (
              <p role="alert" className="text-sm font-semibold text-[#c4320a]">{error}</p>
            )}

            <button type="submit" disabled={enviando} className={CLASE_BOTON}>
              {enviando ? 'Enviando…' : 'Enviarme el enlace'}
              <CheckBoton />
            </button>
          </form>

          <p className="border-t border-[#dde3ea] pt-[18px] text-center text-[14.5px] text-[#5b6b7c]">
            ¿Te has acordado?{' '}
            <Link to="/login" state={{ email }} replace className={CLASE_ENLACE}>
              Inicia sesión
            </Link>
          </p>
        </div>
      ) : (
        <div key="enviado" className="entrada-suave flex flex-col gap-5">
          <Sobre tachado />

          <div role="status">
            <h2 className="text-[28px] font-extrabold tracking-[-0.5px]">Revisa tu email</h2>
            <p className="mt-1.5 text-[15px] leading-normal text-[#5b6b7c]">
              Si <b className="font-bold break-all text-[#0f1f2e]">{email.trim().toLowerCase()}</b> tiene una cuenta en Tachit, ya te hemos enviado el enlace.
            </p>
          </div>

          {/* "Tu plan para volver a entrar": un guiño al "plan de hoy" del panel */}
          <section aria-label="Tu plan para volver a entrar" className="rounded-2xl border border-[#e3e8ef] bg-white px-[18px] pt-[18px] pb-4 shadow-[0_1px_2px_rgba(27,37,89,0.05)]">
            <div className="mb-3.5 flex items-center justify-between">
              <p className="text-[14.5px] font-extrabold">Tu plan para volver a entrar</p>
              <p className="text-[12.5px] font-bold text-tachit-acento-fuerte">1 de 3</p>
            </div>
            <div className="mb-4 h-[5px] overflow-hidden rounded-full bg-tachit-acento/18" aria-hidden="true">
              <span className="block h-full w-1/3 rounded-full bg-tachit-acento" />
            </div>
            <ol>
              <PasoPlan titulo="Pedir el enlace" hecho />
              <PasoPlan titulo="Abrir el email de Tachit" pista="Si no lo ves, mira en spam o promociones." />
              <PasoPlan titulo="Elegir tu contraseña nueva" pista="El enlace caduca en 30 minutos y solo vale una vez." />
            </ol>
          </section>

          {error && (
            <p role="alert" className="text-sm font-semibold text-[#c4320a]">{error}</p>
          )}
          {aviso && (
            <p role="status" className="rounded-[10px] bg-tachit-acento-suave px-3.5 py-2.5 text-sm font-semibold text-tachit-acento-fuerte">{aviso}</p>
          )}

          <p className="text-center text-[13.5px] text-[#5b6b7c]">
            ¿No te llega?{' '}
            <button
              type="button"
              onClick={reenviar}
              disabled={segundos > 0 || enviando}
              className="rounded font-bold tabular-nums text-tachit-acento-fuerte enabled:cursor-pointer enabled:hover:underline disabled:text-[#8a96a3] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento"
            >
              {segundos > 0 ? `Reenviar en 0:${String(segundos).padStart(2, '0')}` : enviando ? 'Enviando…' : 'Reenviar el enlace'}
            </button>
          </p>

          <p className="border-t border-[#dde3ea] pt-[18px] text-center text-[14.5px] text-[#5b6b7c]">
            ¿Ya la recuerdas?{' '}
            <Link to="/login" state={{ email }} replace className={CLASE_ENLACE}>
              Inicia sesión
            </Link>
          </p>
        </div>
      )}
    </MarcoAcceso>
  );
}

export default OlvideContrasena;
