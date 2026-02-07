import { useState } from 'react';
import { loginUser, registerUser } from '../services/ticketService'; 

export default function LoginPage({ onLoginSuccess }) {
  const [esRegistro, setEsRegistro] = useState(false);
  
  // ACTUALIZADO: Agregamos telefono y departamento al estado inicial
  const [formData, setFormData] = useState({ 
    nombre: '', 
    email: '', 
    password: '', 
    telefono: '', 
    departamento: 'Sistemas' 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let data;
      if (esRegistro) {
        // Lógica de Registro (envía todos los datos nuevos)
        data = await registerUser(formData);
        if (data.error) { alert(data.error); return; }
        alert("¡Cuenta creada con éxito! Ahora inicia sesión.");
        setEsRegistro(false);
        // Limpiamos formulario pero dejamos el email para facilitar el login
        setFormData({ nombre: '', email: formData.email, password: '', telefono: '', departamento: 'Sistemas' });
      } else {
        // Lógica de Login
        const res = await loginUser({ email: formData.email, password: formData.password });
        if (res.error) {
            alert(res.error);
        } else {
            onLoginSuccess(res);
        }
      }
    } catch (error) { console.error(error); alert("Error de conexión con el servidor"); }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col font-sans">
      {/* Encabezado Azul Degradado */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 h-64 w-full flex items-center justify-center rounded-b-[50px] shadow-lg">
        <div className="text-center pb-10">
          <h1 className="text-4xl font-bold text-white tracking-wide">Bienvenido</h1>
          <p className="text-blue-100 mt-2 tracking-widest uppercase text-xs">Sistema de Reportes Interno</p>
        </div>
      </div>

      {/* Tarjeta del Formulario */}
      <div className="flex-1 flex items-center justify-center -mt-24 px-4 pb-10">
        <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 animate-fade-in-up">
          <div className="flex justify-center mb-6">
              <img src="/logo_canaco_oficial.png" alt="Logo" className="h-32 w-auto object-contain bg-white p-2" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">{esRegistro ? 'Crear Cuenta Nueva' : 'Iniciar Sesión'}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* CAMPOS EXCLUSIVOS DE REGISTRO */}
            {esRegistro && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">Nombre Completo</label>
                    <input 
                        type="text" 
                        required 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={formData.nombre} 
                        onChange={e => setFormData({...formData, nombre: e.target.value})} 
                    />
                  </div>

                  {/* NUEVO: COLUMNAS PARA TELÉFONO Y DEPTO */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">Teléfono / Ext.</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="Ej. 8183..."
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={formData.telefono} 
                            onChange={e => setFormData({...formData, telefono: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">Departamento</label>
                        <select 
                            className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={formData.departamento} 
                            onChange={e => setFormData({...formData, departamento: e.target.value})}
                        >
                            <option>Sistemas</option>
                            <option>Mantenimiento</option>
                            <option>Recursos Humanos</option>
                            <option>Administración</option>
                            <option>Ventas</option>
                            <option>Presidencia</option>
                            <option>Afiliación</option>
                            <option>Jurídico</option>
                        </select>
                    </div>
                  </div>
                </>
            )}

            {/* CAMPOS COMUNES */}
            <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Correo Electrónico</label>
                <input 
                    type="email" 
                    required 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Contraseña</label>
                <input 
                    type="password" 
                    required 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                />
            </div>

            <button type="submit" className="w-full bg-blue-700 text-white py-3 rounded-lg font-bold shadow-md hover:bg-blue-800 transition transform active:scale-95">
                {esRegistro ? 'Registrarme' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-gray-100">
             <button onClick={() => setEsRegistro(!esRegistro)} className="text-blue-600 font-bold hover:underline text-sm">
               {esRegistro ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate aquí'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}