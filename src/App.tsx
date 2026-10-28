import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Registro from './pages/Registro';
import OlvideContrasena from './pages/OlvideContrasena';
import RestablecerContrasena from './pages/RestablecerContrasena';
import Tareas from './pages/Tareas';
import RutaProtegida from './marco/RutaProtegida';
import MarcoApp from './marco/MarcoApp';
import MiDia from './pantallas/MiDia';
import PantallaCalendario from './pantallas/Calendario';
import MiRitmo from './pantallas/MiRitmo';
import Ajustes from './pantallas/Ajustes';
import Muestrario from './pantallas/Muestrario';
import { PANTALLA_INICIAL } from './utils/destino';

function App() {
  return (
    <Routes>
      {/* Pantallas sin sesión */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      {/* ¿Olvidaste tu contraseña? (Fase 3, paso 9): pedir el enlace y abrir el enlace del email */}
      <Route path="/olvide-contrasena" element={<OlvideContrasena />} />
      <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />

      {/* Pantallas con sesión (Fase 4, paso 4.4): el portero (RutaProtegida) comprueba la sesión
          y el marco (MarcoApp) envuelve a todas. Cada una se rellena en su fase. */}
      <Route
        element={
          <RutaProtegida>
            <MarcoApp />
          </RutaProtegida>
        }
      >
        <Route path="/hoy" element={<MiDia />} />
        <Route path="/tareas" element={<Tareas />} />
        <Route path="/calendario" element={<PantallaCalendario />} />
        <Route path="/ritmo" element={<MiRitmo />} />
        <Route path="/ajustes" element={<Ajustes />} />
      </Route>

      {/* Muestrario de componentes (Fase 4, paso 4.3): SOLO en tu ordenador, no sale en la web publicada */}
      {import.meta.env.DEV && <Route path="/muestrario" element={<Muestrario />} />}

      {/* Cualquier otra dirección → Mi día (y, si no hay sesión, el portero te manda a "Entrar") */}
      <Route path="*" element={<Navigate to={PANTALLA_INICIAL} replace />} />
    </Routes>
  );
}

export default App;
