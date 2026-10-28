import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Registro from './pages/Registro';
import OlvideContrasena from './pages/OlvideContrasena';
import RestablecerContrasena from './pages/RestablecerContrasena';
import Tareas from './pages/Tareas';
import Ajustes from './pantallas/Ajustes';
import Muestrario from './pantallas/Muestrario';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      {/* ¿Olvidaste tu contraseña? (Fase 3, paso 9): pedir el enlace y abrir el enlace del email */}
      <Route path="/olvide-contrasena" element={<OlvideContrasena />} />
      <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
      <Route path="/tareas" element={<Tareas />} />
      {/* Ajustes (Fase 4, paso 4.2): de momento solo el selector de tema */}
      <Route path="/ajustes" element={<Ajustes />} />
      {/* Muestrario de componentes (Fase 4, paso 4.3): SOLO en tu ordenador, no sale en la web publicada */}
      {import.meta.env.DEV && <Route path="/muestrario" element={<Muestrario />} />}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
