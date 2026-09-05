import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';

function Registro() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const respuesta = await fetch('https://backend-consolidado.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, contrasena }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.mensaje || 'Error al registrarse');
        return;
      }

      navigate('/login');

    } catch (err) {
      console.error(err);
      setError('No se pudo conectar con el servidor');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <img src={logo} alt="KmTask" className="h-16 mx-auto mb-6" />

        <h1 className="font-bold text-2xl mb-1 text-marino">
          Crea tu <span className="text-azul">cuenta</span>
        </h1>
        <p className="text-muted text-base mb-8">
          Empieza a organizar tus tareas
        </p>

        <form onSubmit={manejarSubmit} className="flex flex-col gap-4 text-left">
          <div>
            <label className="text-sm text-texto font-medium block mb-1">
              Nombre
            </label>
            <input
              type="text"
              placeholder="Escribe tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-texto outline-none focus:border-azul focus:ring-1 focus:ring-azul"
            />
          </div>

          <div>
            <label className="text-sm text-texto font-medium block mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="Escribe tu dirección de correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-texto outline-none focus:border-azul focus:ring-1 focus:ring-azul"
            />
          </div>

          <div>
            <label className="text-sm text-texto font-medium block mb-1">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="Escribe tu contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-texto outline-none focus:border-azul focus:ring-1 focus:ring-azul"
            />
          </div>

          <button
            type="submit"
            className="bg-marino text-white font-semibold rounded-lg py-3 mt-2 hover:opacity-90 transition"
          >
            Crear cuenta
          </button>
        </form>

        {error && (
          <p className="text-rosa text-sm mt-4">{error}</p>
        )}

        <p className="text-muted text-sm mt-8">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-azul font-semibold underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Registro;