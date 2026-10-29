// marco/useCuenta.ts
// Los datos del "pase" de tu cuenta (Fase 4, pasos 4.5 y 4.6): tu nombre, tu inicial, cómo entraste
// (Google o email) y la función para salir. Lo usan el pase de la barra lateral (web) y el del menú (móvil).
import { useNavigate } from 'react-router-dom';
import { cerrarSesion, leerMetodoDeAcceso } from '../utils/sesion';

// Un hook propio: devuelve los datos de la cuenta y la función para salir
export function useCuenta() {
  const navigate = useNavigate();
  const nombre = localStorage.getItem('nombre') || 'Tu cuenta';
  const inicial = nombre.trim().charAt(0).toUpperCase() || 'T';
  const metodo = leerMetodoDeAcceso();

  // Cerrar sesión DE VERDAD: el servidor anula el pase de renovación y volvemos a "Entrar"
  const salir = async () => {
    await cerrarSesion();
    navigate('/login', { replace: true });
  };

  return { nombre, inicial, metodo, salir };
}
