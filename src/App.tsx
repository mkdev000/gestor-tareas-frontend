import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Tareas from './pages/Tareas';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/tareas" element={<Tareas />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;