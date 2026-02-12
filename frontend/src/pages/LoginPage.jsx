import { useState } from 'react';
import { loginUser } from '../services/ticketService'; 

export default function LoginPage({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '' 
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
        const res = await loginUser({ email: formData.email, password: formData.password });
        if (res.error) {
            setError("❌ " + res.error);
        } else {
            // Al ser exitoso, App.jsx se encarga de redirigir al Dashboard
            onLoginSuccess(res);
        }
    } catch (error) { 
        console.error(error); 
        setError("Error de conexión con el servidor"); 
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col font-sans w-full">
      {/* Encabezado Azul */}
      <div className="bg-blue-900 h-64 w-full flex items-center justify-center rounded-b-[50px] shadow-lg absolute top-0 left-0 z-0">
        <div className="text-center pb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wide">Administración</h1>
          <p className="text-blue-200 mt-2 tracking-widest uppercase text-xs">Acceso Restringido</p>
        </div>
      </div>

      {/* Tarjeta del Formulario */}
      <div className="flex-1 flex items-center justify-center px-4 z-10 pt-20">
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 animate-fade-in-up">
          
          <div className="flex justify-center mb-6">
              <div className="bg-blue-50 p-4 rounded-full">
                <img src="/logo_canaco_oficial.png" alt="Logo" className="h-16 w-auto object-contain" />
              </div>
          </div>

          <h2 className="text-xl font-bold text-gray-800 text-center mb-6">Iniciar Sesión</h2>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm rounded">
                {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Correo Institucional</label>
                <input 
                    type="email" 
                    required 
                    placeholder="admin@canaco.com"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Contraseña</label>
                <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                />
            </div>

            <button type="submit" className="w-full bg-blue-800 text-white py-3.5 rounded-lg font-bold shadow-lg hover:bg-blue-900 transition transform active:scale-95">
                🔐 Entrar al Sistema
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-4">
             <p className="text-xs text-gray-400">
                Uso exclusivo para personal de CANACO. <br/>
                Tu IP está siendo registrada por seguridad.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}