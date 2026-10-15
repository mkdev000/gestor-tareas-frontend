/// <reference types="vite/client" />

// Le explica a TypeScript qué variables de entorno propias tiene la app.
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Client ID de Google: es PÚBLICO (no es un secreto). Puede faltar: entonces el botón avisa.
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
