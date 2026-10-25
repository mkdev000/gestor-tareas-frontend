// pages/Acceso.tsx
// Pantalla de acceso de Tachit: a la izquierda el panel de bienvenida y a la derecha el formulario.
// Primero sale "Entrar"; abajo, "¿No tienes cuenta? Regístrate" lleva a "Crear cuenta" (y al revés).
// La usan Login.tsx (modo "entrar") y Registro.tsx (modo "registro").
// "Continuar con Google" abre la ventanita de Google y manda el código al backend (paso 8.3).
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MarcoAcceso from '../components/MarcoAcceso';
import CampoContrasena from '../components/CampoContrasena';
import RequisitosContrasena from '../components/RequisitosContrasena';
import { enviar, type RespuestaServidor } from '../utils/peticiones';
import { guardarSesion, renovarSesion } from '../utils/sesion';
import { evaluarContrasena } from '../utils/contrasena';
import { GOOGLE_CLIENT_ID, cargarGoogle, crearClienteGoogle, type ClienteCodigoGoogle } from '../utils/google';
import type { DatosAviso } from '../components/AvisoFlotante';

type Modo = 'entrar' | 'registro';

// Lo que puede venir de la otra pestaña o del registro (por ejemplo, el email ya escrito)
interface EstadoNavegacion {
  email?: string;
  aviso?: string;
}


// Estado del botón de Google:
//  'preparando'   → cargando el script de Google
//  'listo'        → se puede pulsar
//  'conectando'   → la ventanita está abierta o estamos hablando con el servidor
//  'no-disponible'→ falta el Client ID o Google no carga (bloqueador, sin internet...)
type EstadoGoogle = 'preparando' | 'listo' | 'conectando' | 'no-disponible';

const NO_DISPONIBLE = 'El acceso con Google no está disponible ahora mismo. De momento, entra con tu email.';

// El aviso flotante que se enseña al llegar a "Mi día", según cómo se ha entrado (textos del prototipo)
function avisoDeGoogle(datos: RespuestaServidor): DatosAviso {
  if (datos.nuevo) return { titulo: 'Cuenta creada con Google', texto: 'Google confirmó tu identidad y Tachit creó tu cuenta.' };
  if (datos.unida) return { titulo: 'Google unido a tu cuenta', texto: 'A partir de ahora entra con Google. Tu contraseña anterior ya no sirve.' };
  return { titulo: 'Sesión iniciada con Google', texto: 'Google confirmó tu identidad y Tachit creó tu sesión.' };
}


function Acceso({ modo }: { modo: Modo }) {
  const navigate = useNavigate();
  const estado = (useLocation().state ?? {}) as EstadoNavegacion;
  const esRegistro = modo === 'registro';

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState(estado.email ?? '');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [errorGoogle, setErrorGoogle] = useState('');
  const [estadoGoogle, setEstadoGoogle] = useState<EstadoGoogle>(GOOGLE_CLIENT_ID ? 'preparando' : 'no-disponible');
  // El "cliente" de Google se guarda en una ref: no hace falta repintar la pantalla cuando se crea
  const clienteGoogle = useRef<ClienteCodigoGoogle | null>(null);

  // Al abrir la pantalla, cargamos Google y preparamos la ventanita.
  // Se prepara ANTES de pulsar: así, al pulsar, la ventanita se abre al momento y el navegador
  // no la bloquea (los navegadores solo dejan abrir ventanitas justo después de un clic).
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let activo = true; // si salimos de la pantalla antes de que cargue, no tocamos nada

    // Google nos devuelve el código: lo mandamos a nuestro backend
    const alRecibirCodigo = async ({ code, error: errorDeGoogle }: { code?: string; error?: string }) => {
      if (!code) {
        setEstadoGoogle('listo');
        setErrorGoogle(
          errorDeGoogle === 'access_denied'
            ? 'No has dado permiso a Tachit en Google. Pulsa «Continuar con Google» para volver a intentarlo.'
            : 'No hemos podido conectar con Google. Inténtalo de nuevo.',
        );
        return;
      }
      try {
        const respuesta = await enviar('/api/auth/google', { codigo: code });
        if (!respuesta.ok || !respuesta.datos.token) {
          setErrorGoogle(respuesta.datos.mensaje || 'No hemos podido entrar con Google. Inténtalo de nuevo.');
          setEstadoGoogle('listo');
          return;
        }
        guardarSesion(respuesta.datos);
        navigate('/tareas', { replace: true, state: { bienvenida: avisoDeGoogle(respuesta.datos) } });
      } catch {
        setErrorGoogle('No se pudo conectar con el servidor');
        setEstadoGoogle('listo');
      }
    };

    // La ventanita se cerró sin elegir cuenta, o el navegador no la dejó abrirse
    const alFallar = ({ type }: { type: string }) => {
      setEstadoGoogle('listo');
      if (type === 'popup_closed') {
        setAviso('Has cerrado la ventana de Google. Pulsa «Continuar con Google» para volver a intentarlo.');
      } else if (type === 'popup_failed_to_open') {
        setErrorGoogle('Tu navegador ha bloqueado la ventana de Google. Permite las ventanas emergentes para Tachit y vuelve a intentarlo.');
      } else {
        setErrorGoogle('No hemos podido conectar con Google. Inténtalo de nuevo.');
      }
    };

    cargarGoogle()
      .then(() => {
        if (!activo) return;
        clienteGoogle.current = crearClienteGoogle(alRecibirCodigo, alFallar);
        setEstadoGoogle('listo');
      })
      .catch(() => {
        if (activo) setEstadoGoogle('no-disponible');
      });

    return () => {
      activo = false;
    };
  }, [navigate]);

  // Si ya tienes la sesión abierta (la cookie del pase de renovación sigue valiendo),
  // entras directamente en tus tareas sin escribir nada, como en cualquier app.
  useEffect(() => {
    let activo = true;
    renovarSesion().then((resultado) => {
      if (activo && resultado === 'ok') navigate('/tareas', { replace: true });
    });
    return () => {
      activo = false;
    };
  }, [navigate]);

  const pulsarGoogle = () => {
    setError('');
    setAviso('');
    setErrorGoogle('');
    if (estadoGoogle === 'no-disponible' || !clienteGoogle.current) {
      setErrorGoogle(estadoGoogle === 'preparando' ? 'Un momento, Google todavía se está cargando…' : NO_DISPONIBLE);
      return;
    }
    if (estadoGoogle === 'conectando') return; // evita abrir dos ventanitas con un doble clic
    setEstadoGoogle('conectando');
    clienteGoogle.current.requestCode();
  };
  const conectandoGoogle = estadoGoogle === 'conectando';

  const evaluacion = evaluarContrasena(contrasena);
  // En el registro, el botón solo se activa cuando la contraseña cumple los requisitos
  const botonDesactivado = enviando || conectandoGoogle || (esRegistro && !evaluacion.valida);

  let textoBoton = 'Entrar';
  if (esRegistro) textoBoton = evaluacion.valida ? 'Crear cuenta' : 'Completa los requisitos';
  if (enviando) textoBoton = esRegistro ? 'Creando cuenta…' : 'Entrando…';

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (botonDesactivado) return;
    setError('');
    setAviso('');
    setErrorGoogle('');
    setEnviando(true);

    try {
      if (esRegistro) {
        const registro = await enviar('/api/auth/register', { nombre, email, contrasena });
        if (!registro.ok) {
          setError(registro.datos.mensaje || 'No se pudo crear la cuenta');
          return;
        }
      }

      // Entrar (también justo después de crear la cuenta, como en el prototipo)
      const login = await enviar('/api/auth/login', { email, contrasena });
      if (!login.ok || !login.datos.token) {
        if (esRegistro) {
          // La cuenta sí se creó: lo mandamos a "Entrar" con su email ya escrito
          navigate('/login', { replace: true, state: { email, aviso: 'Cuenta creada. Ya puedes entrar.' } });
          return;
        }
        setError(login.datos.mensaje || 'No se pudo iniciar sesión');
        return;
      }

      guardarSesion(login.datos);
      // Aviso flotante al llegar, con los textos del prototipo
      const bienvenida: DatosAviso = {
        titulo: esRegistro ? 'Cuenta creada' : 'Sesión iniciada',
        texto: 'Contraseña validada en el navegador y en el servidor.',
      };
      navigate('/tareas', { replace: true, state: { bienvenida } });
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setEnviando(false);
    }
  };

  const estiloCampo =
    'h-[46px] w-full rounded-[10px] border border-[#cfd8e3] bg-white px-[14px] text-[15px] text-[#0f1f2e] font-normal focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento';

  return (
    <MarcoAcceso>
      <div>
        <h2 className="text-[28px] font-extrabold tracking-[-0.5px]">
          {esRegistro ? 'Crea tu cuenta' : '¡Bienvenido/a de nuevo!'}
        </h2>
        <p className="mt-1.5 text-[15px] text-[#5b6b7c]">
          {esRegistro ? 'Gratis, sin anuncios y con tus datos exportables.' : 'Entra para ver tu plan de hoy.'}
        </p>
      </div>

      {/* Continuar con Google: abre la ventanita de Google para elegir cuenta.
          Mientras tanto, el logo de Google se cambia por una ruedita y el texto por "Conectando con Google…" */}
      <button
        type="button"
        onClick={pulsarGoogle}
        disabled={conectandoGoogle || enviando}
        aria-busy={conectandoGoogle}
        className="boton-google flex h-[52px] items-center justify-center gap-3 rounded-[14px] border border-[#e3e8ef] bg-white text-base font-semibold text-[#3c4043] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento enabled:cursor-pointer disabled:cursor-wait"
      >
        {conectandoGoogle && <span className="ruedita-google" aria-hidden="true" />}
        <svg className={'logo-google' + (conectandoGoogle ? ' hidden' : '')} width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        <span className="relative">{conectandoGoogle ? 'Conectando con Google…' : 'Continuar con Google'}</span>
      </button>

      <div className="flex items-center gap-3 text-[13px] text-[#5b6b7c]">
        <span className="h-px flex-1 bg-[#dde3ea]" />
        o con tu email
        <span className="h-px flex-1 bg-[#dde3ea]" />
      </div>

      {/* Errores de Google (en rojo, justo debajo del botón de Google) */}
      {errorGoogle && (
        <p role="alert" className="rounded-[10px] bg-[#fdecea] px-3.5 py-2.5 text-sm font-semibold text-[#c4320a]">
          {errorGoogle}
        </p>
      )}

      {(aviso || (estado.aviso && !esRegistro)) && (
        <p role="status" className="rounded-[10px] bg-tachit-acento-suave px-3.5 py-2.5 text-sm font-semibold text-tachit-acento-fuerte">
          {aviso || estado.aviso}
        </p>
      )}

      <form onSubmit={manejarSubmit} className="flex flex-col gap-5">
        {esRegistro && (
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Nombre
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="name"
              placeholder="Kevin"
              maxLength={100}
              required
              className={estiloCampo}
            />
          </label>
        )}

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

        <div className="flex flex-col gap-1.5">
          <label htmlFor="contrasena" className="text-sm font-semibold">Contraseña</label>
          <CampoContrasena
            id="contrasena"
            valor={contrasena}
            alCambiar={setContrasena}
            autoComplete={esRegistro ? 'new-password' : 'current-password'}
            placeholder={esRegistro ? 'Escribe una contraseña para ver la validación' : undefined}
            describidoPor={esRegistro ? 'requisitos-contrasena' : undefined}
          />
        </div>

        {/* Barra de fuerza y requisitos (solo al crear cuenta) */}
        {esRegistro && <RequisitosContrasena id="requisitos-contrasena" evaluacion={evaluacion} />}

        {error && (
          <p role="alert" className="text-sm font-semibold text-[#c4320a]">{error}</p>
        )}

        <button
          type="submit"
          disabled={botonDesactivado}
          className="boton-tachit flex h-12 items-center justify-center gap-1.5 rounded-xl text-base font-extrabold transition-transform focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento enabled:cursor-pointer enabled:bg-tachit-acento-fuerte enabled:text-white disabled:cursor-not-allowed disabled:bg-[#dde3ea] disabled:text-[#5b6b7c]"
        >
          {textoBoton}
          <svg className="check-tachit" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
        </button>

        {/* "¿Olvidaste tu contraseña?": lleva a la pantalla de recuperar, con el email ya escrito */}
        {!esRegistro && (
          <Link
            to="/olvide-contrasena"
            state={{ email }}
            className="-mt-2 self-start rounded text-[13.5px] font-bold text-tachit-acento-fuerte hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        )}
      </form>

      {/* Abajo: el enlace para cambiar entre "Entrar" y "Crear cuenta" (se conserva el email escrito) */}
      <p className="border-t border-[#dde3ea] pt-[18px] text-center text-[14.5px] text-[#5b6b7c]">
        {esRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
        <Link
          to={esRegistro ? '/login' : '/registro'}
          state={{ email }}
          replace
          className="rounded font-extrabold text-tachit-acento-fuerte hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento"
        >
          {esRegistro ? 'Inicia sesión' : 'Regístrate'}
        </Link>
      </p>
    </MarcoAcceso>
  );
}

export default Acceso;
