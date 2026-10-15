// utils/google.ts
// "Continuar con Google" en el navegador (Fase 3, paso 8.3).
//
// Usamos la librería oficial de Google, "Google Identity Services" (GIS), en modo VENTANITA (popup):
//  1. Al abrir la pantalla de acceso cargamos el script de Google (una sola vez).
//  2. Al pulsar el botón, Google abre su ventanita para elegir cuenta.
//  3. Google nos devuelve un CÓDIGO de un solo uso, que mandamos al backend (/api/auth/google).
//     El backend lo canjea con el secreto de la app, que NUNCA está en el navegador.
//
// Aquí solo se usa el Client ID (VITE_GOOGLE_CLIENT_ID), que es PÚBLICO: Google lo enseña
// en la propia ventanita. No hay ningún secreto en este archivo.

// ---------- Tipos: lo poco que usamos de la librería de Google ----------

export interface RespuestaCodigoGoogle {
  code?: string;
  error?: string; // por ejemplo 'access_denied' si la persona no da permiso
}

export interface ErrorClienteGoogle {
  type: 'popup_failed_to_open' | 'popup_closed' | 'unknown';
}

export interface ClienteCodigoGoogle {
  requestCode: () => void;
}

interface ConfigClienteCodigo {
  client_id: string;
  scope: string;
  ux_mode: 'popup';
  select_account: boolean;
  callback: (respuesta: RespuestaCodigoGoogle) => void;
  error_callback: (error: ErrorClienteGoogle) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: ConfigClienteCodigo) => ClienteCodigoGoogle;
        };
      };
    };
  }
}

// ---------- Configuración ----------

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

// Dirección oficial del script de Google. Solo se carga desde aquí (https y dominio de Google).
const URL_SCRIPT_GOOGLE = 'https://accounts.google.com/gsi/client';

// Permisos que pedimos: SOLO saber quién eres (nombre y email). Nada de Gmail, Drive ni Calendar.
const PERMISOS = 'openid email profile';

// ---------- Cargar el script (una sola vez) ----------

let cargaEnCurso: Promise<void> | null = null;

export function cargarGoogle(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (cargaEnCurso) return cargaEnCurso;

  cargaEnCurso = new Promise<void>((resolver, rechazar) => {
    const script = document.createElement('script');
    script.src = URL_SCRIPT_GOOGLE;
    script.async = true;
    script.onload = () => (window.google?.accounts?.oauth2 ? resolver() : rechazar(new Error('Google no se ha cargado bien')));
    script.onerror = () => {
      script.remove();
      cargaEnCurso = null; // así se puede volver a intentar (por ejemplo, si volvió internet)
      rechazar(new Error('No se ha podido cargar Google'));
    };
    document.head.appendChild(script);
  });
  return cargaEnCurso;
}

// ---------- Preparar el cliente que abre la ventanita ----------

export function crearClienteGoogle(
  alRecibirCodigo: (respuesta: RespuestaCodigoGoogle) => void,
  alFallar: (error: ErrorClienteGoogle) => void,
): ClienteCodigoGoogle {
  if (!window.google?.accounts?.oauth2) throw new Error('Google todavía no está cargado');
  return window.google.accounts.oauth2.initCodeClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: PERMISOS,
    ux_mode: 'popup',
    select_account: true, // siempre enseña la lista de cuentas (como Todoist), aunque ya entraras antes
    callback: alRecibirCodigo,
    error_callback: alFallar,
  });
}
