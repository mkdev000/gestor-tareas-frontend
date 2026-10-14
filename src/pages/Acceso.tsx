// pages/Acceso.tsx
// Pantalla de acceso de Tachit: a la izquierda el panel de bienvenida y a la derecha el formulario.
// Primero sale "Entrar"; abajo, "¿No tienes cuenta? Regístrate" lleva a "Crear cuenta" (y al revés).
// La usan Login.tsx (modo "entrar") y Registro.tsx (modo "registro").
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import LogoTachit from '../components/LogoTachit';
import PanelBienvenida from '../components/PanelBienvenida';
import CampoContrasena from '../components/CampoContrasena';
import { evaluarContrasena } from '../utils/contrasena';

type Modo = 'entrar' | 'registro';

// Lo que puede venir de la otra pestaña o del registro (por ejemplo, el email ya escrito)
interface EstadoNavegacion {
  email?: string;
  aviso?: string;
}

interface RespuestaServidor {
  mensaje?: string;
  token?: string;
  nombre?: string;
}

// Envía datos al servidor y devuelve la respuesta ya leída.
// Si el servidor no devuelve JSON (por ejemplo, una página de error), no rompemos la pantalla.
async function enviar(ruta: string, cuerpo: object) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  const datos: RespuestaServidor = await respuesta.json().catch(() => ({}));
  return { ok: respuesta.ok, datos };
}

// Guarda la sesión y entra en la app
function guardarSesion(datos: RespuestaServidor) {
  localStorage.setItem('token', datos.token ?? '');
  localStorage.setItem('nombre', datos.nombre ?? '');
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
  const [avisoContrasena, setAvisoContrasena] = useState(false);

  const evaluacion = evaluarContrasena(contrasena);
  // En el registro, el botón solo se activa cuando la contraseña cumple los requisitos
  const botonDesactivado = enviando || (esRegistro && !evaluacion.valida);

  let textoBoton = 'Entrar';
  if (esRegistro) textoBoton = evaluacion.valida ? 'Crear cuenta' : 'Completa los requisitos';
  if (enviando) textoBoton = esRegistro ? 'Creando cuenta…' : 'Entrando…';

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (botonDesactivado) return;
    setError('');
    setAviso('');
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
      navigate('/tareas', { replace: true });
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setEnviando(false);
    }
  };

  const estiloCampo =
    'h-[46px] w-full rounded-[10px] border border-[#cfd8e3] bg-white px-[14px] text-[15px] text-[#0f1f2e] font-normal focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento';

  return (
    <div className="flex min-h-screen bg-tachit-fondo text-[#0f1f2e]">
      {/* ===== Panel de bienvenida (pantallas grandes) ===== */}
      <PanelBienvenida />

      {/* ===== Formulario ===== */}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-[420px] flex-col gap-5">
          {/* En móvil no hay panel: mostramos el logo arriba */}
          <div className="mb-2 text-tachit-tinta lg:hidden">
            <LogoTachit ancho={140} colorCheck="var(--tachit-acento)" />
          </div>

          <div>
            <h2 className="text-[28px] font-extrabold tracking-[-0.5px]">
              {esRegistro ? 'Crea tu cuenta' : '¡Bienvenido/a de nuevo!'}
            </h2>
            <p className="mt-1.5 text-[15px] text-[#5b6b7c]">
              {esRegistro ? 'Gratis, sin anuncios y con tus datos exportables.' : 'Entra para ver tu plan de hoy.'}
            </p>
          </div>

          {/* Continuar con Google: el diseño ya es el del prototipo; la conexión real llega en el paso 8 */}
          <button
            type="button"
            onClick={() => setAviso('El acceso con Google estará disponible muy pronto. De momento, entra con tu email.')}
            className="boton-google flex h-[52px] cursor-pointer items-center justify-center gap-3 rounded-[14px] border border-[#e3e8ef] bg-white text-base font-semibold text-[#3c4043] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento"
          >
            <svg className="logo-google" width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span className="relative">Continuar con Google</span>
          </button>

          <div className="flex items-center gap-3 text-[13px] text-[#5b6b7c]">
            <span className="h-px flex-1 bg-[#dde3ea]" />
            o con tu email
            <span className="h-px flex-1 bg-[#dde3ea]" />
          </div>

          {(aviso || (estado.aviso && !esRegistro)) && (
            <p role="status" className="rounded-[10px] bg-tachit-acento-suave px-3.5 py-2.5 text-sm font-semibold text-tachit-acento-texto">
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
            {esRegistro && (
              <div id="requisitos-contrasena" className="flex flex-col gap-2.5">
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
            )}

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

            {/* "¿Olvidaste tu contraseña?": de momento solo avisa; funcionará en el paso 9 de la Fase 3 */}
            {!esRegistro && (
              <div className="-mt-2 flex flex-col items-start gap-2">
                <button
                  type="button"
                  onClick={() => setAvisoContrasena(true)}
                  className="cursor-pointer rounded text-[13.5px] font-bold text-tachit-acento-fuerte hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tachit-acento"
                >
                  ¿Olvidaste tu contraseña?
                </button>
                {avisoContrasena && (
                  <p role="status" className="text-[13px] font-semibold text-tachit-acento-texto">
                    Recuperar la contraseña estará disponible muy pronto.
                  </p>
                )}
              </div>
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
        </div>
      </main>
    </div>
  );
}

export default Acceso;
