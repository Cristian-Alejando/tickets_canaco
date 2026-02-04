import { useState } from 'react';
import { loginUser, registerUser } from '../services/ticketService'; // Usamos el servicio nuevo

export default function LoginPage({ onLoginSuccess }) {
  const [esRegistro, setEsRegistro] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let data;
      if (esRegistro) {
        // Lógica de Registro
        data = await registerUser(formData);
        if (data.error) { alert(data.error); return; }
        alert("¡Cuenta creada! Inicia sesión.");
        setEsRegistro(false);
        setFormData({ nombre: '', email: formData.email, password: '' });
      } else {
        // Lógica de Login
        // Nota: loginUser devuelve el objeto data directo, pero necesitamos checar el status en el componente padre o aquí.
        // Para simplificar tu refactorización actual, haremos la llamada directa aquí:
        const res = await loginUser({ email: formData.email, password: formData.password });
        if (res.error) {
            alert(res.error);
        } else {
            onLoginSuccess(res);
        }
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col font-sans">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 h-64 w-full flex items-center justify-center rounded-b-[50px] shadow-lg">
        <div className="text-center pb-10">
          <h1 className="text-4xl font-bold text-white tracking-wide">Bienvenido</h1>
          <p className="text-blue-100 mt-2 tracking-widest uppercase text-xs">Sistema de Reportes Interno</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center -mt-24 px-4 pb-10">
        <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
          <div className="flex justify-center mb-6">
             <img src="/logo_canaco_oficial.png" alt="Logo" className="h-32 w-auto object-contain bg-white p-2" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">{esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {esRegistro && (
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">Nombre</label>
                  <input type="text" required className="w-full p-3 border rounded-lg" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                </div>
            )}
            <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Correo</label>
                <input type="email" required className="w-full p-3 border rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Contraseña</label>
                <input type="password" required className="w-full p-3 border rounded-lg" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-blue-700 text-white py-3 rounded-lg font-bold shadow-md hover:bg-blue-800 transition">
                {esRegistro ? 'Registrarme' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-gray-100">
             <button onClick={() => setEsRegistro(!esRegistro)} className="text-blue-600 font-bold hover:underline">
               {esRegistro ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}