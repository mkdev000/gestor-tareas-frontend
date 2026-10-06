// Dirección del servidor (backend).
// Se lee de la variable de entorno VITE_API_URL:
//  - en tu ordenador viene del archivo .env.development (npm run dev)
//  - en Vercel viene de Settings → Environment Variables
export const API_URL = import.meta.env.VITE_API_URL;
