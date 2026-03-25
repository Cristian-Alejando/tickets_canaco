import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/ticketService'; 
import { motion } from 'framer-motion'; // <-- NUEVO: Animación
import { toast } from 'react-hot-toast'; // <-- NUEVO: Notificaciones

const RegisterPage = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState(''); 
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      const res = await registerUser({ nombre, email, password, telefono });
      
      if (res.error) {
        toast.error(res.error); // <-- Reemplazo de error rojo nativo
      } else {
        toast.success('¡Registro exitoso! Ahora inicia sesión.'); // <-- Reemplazo de window.alert()
        navigate('/admin'); // Redirigimos a la pantalla de login (/admin en tu App.jsx)
      }
    } catch (error) {
      toast.error('Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
      
      {/* Fondo decorativo sutil */}
      <div className="absolute top-0 left-0 w-full h-64 bg-blue-900 rounded-b-[50px] shadow-lg z-0"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 border border-gray-100"
      >
        <div className="text-center mb-6">
            <span className="bg-blue-100 text-blue-700 text-3xl p-4 rounded-full inline-block mb-4">📝</span>
            <h2 className="text-2xl font-bold text-gray-800">Crear Cuenta</h2>
            <p className="text-sm text-gray-500 mt-1">Regístrate para gestionar reportes</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Nombre Completo</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
              placeholder="Ej: Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Correo Electrónico</label>
            <input 
              type="email" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
              placeholder="juan@canaco.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Teléfono / Extensión</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
              placeholder="Ej: 555-1234 o Ext. 102"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Contraseña</label>
            <input 
              type="password" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className={`w-full text-white p-3 rounded-lg font-bold transition transform active:scale-95 mt-2 ${cargando ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'}`}
          >
            {cargando ? '⏳ Registrando...' : 'Registrarse'}
          </button>
        </form>
        
        <div className="mt-6 text-center border-t border-gray-100 pt-4">
          <Link to="/admin" className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline transition">
            ¿Ya tienes cuenta? Inicia sesión aquí
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;