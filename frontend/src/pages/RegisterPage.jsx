import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/ticketService'; // Ajuste de ruta para tu estructura

const RegisterPage = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState(''); // <--- NUEVO CAMPO
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await registerUser({ nombre, email, password, telefono });
    
    if (res.error) {
      setError(res.error);
    } else {
      alert('Registro exitoso. Ahora inicia sesión.');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Crear Cuenta</h2>
        {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Nombre Completo</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded mt-1" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Correo Electrónico</label>
            <input 
              type="email" 
              className="w-full p-2 border rounded mt-1" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* --- AQUÍ ESTÁ EL NUEVO INPUT DE TELÉFONO --- */}
          <div className="mb-4">
            <label className="block text-gray-700">Teléfono / Extensión</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded mt-1" 
              placeholder="Ej: 555-1234 o Ext. 102"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700">Contraseña</label>
            <input 
              type="password" 
              className="w-full p-2 border rounded mt-1" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition">
            Registrarse
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <Link to="/login" className="text-blue-500 hover:underline">
            ¿Ya tienes cuenta? Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;