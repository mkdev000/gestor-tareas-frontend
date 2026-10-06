/// <reference types="vite/client" />

// Le explica a TypeScript qué variables de entorno propias tiene la app.
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
