import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Registro from './pages/Registro';
import OlvideContrasena from './pages/OlvideContrasena';
import RestablecerContrasena from './pages/RestablecerContrasena';
import Tareas from './pages/Tareas';
import Ajustes from './pantallas/Ajustes';

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
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
