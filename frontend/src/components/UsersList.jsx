import { useState } from 'react';
import { registerUser, deleteUser } from '../services/ticketService';

export default function UsersList({ users, onUserUpdated }) { 
  // onUserUpdated: Función que avisa a App.jsx que recargue la lista
  
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'tecnico' // Rol por defecto
  });

  const handleCrear = async (e) => {
    e.preventDefault();
    if(!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.password) return;

    if(window.confirm(`¿Confirmas crear al usuario "${nuevoUsuario.nombre}"?`)) {
        const res = await registerUser(nuevoUsuario);
        if(res.error) {
            alert("❌ Error: " + res.error);
        } else {
            alert("✅ Usuario creado con éxito");
            setNuevoUsuario({ nombre: '', email: '', password: '', rol: 'tecnico' }); // Limpiar formulario
            if(onUserUpdated) onUserUpdated(); // ¡Recargar lista al instante!
        }
    }
  };

  const handleBorrar = async (id, nombre) => {
    if(window.confirm(`⚠️ PELIGRO: ¿Estás seguro de eliminar a ${nombre}?\n\nEsta acción no se puede deshacer y perderá su acceso inmediatamente.`)) {
        const exito = await deleteUser(id);
        if(exito) {
            if(onUserUpdated) onUserUpdated(); // Recargar lista
        } else {
            alert("❌ Error al eliminar. Revisa la consola.");
        }
    }
  };

  return (
    <div className="animate-fade-in-up space-y-8">
      
      {/* --- FORMULARIO DE ALTA --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            👤 Alta de Nuevo Personal
        </h3>
        <form onSubmit={handleCrear} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nombre</label>
                <input type="text" required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej. Juan Pérez" value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Email (Login)</label>
                <input type="email" required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="juan@canaco.com" value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Contraseña</label>
                <input type="text" required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Mínimo 6 chars" value={nuevoUsuario.password} onChange={e => setNuevoUsuario({...nuevoUsuario, password: e.target.value})} />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Rol</label>
                <select className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={nuevoUsuario.rol} onChange={e => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}>
                    <option value="tecnico">🛠️ Técnico</option>
                    <option value="admin">👑 Administrador</option>
                </select>
            </div>
            <button type="submit" className="bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition shadow-sm h-10">
                + Crear
            </button>
        </form>
      </div>

      {/* --- TABLA DE USUARIOS --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">Directorio de Accesos</h2>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-gray-400 text-xs uppercase tracking-wider border-b">
              <th className="p-4 font-medium">Nombre</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium text-center">Rol</th>
              <th className="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-blue-50 transition group">
                <td className="p-4 font-bold text-gray-700">{u.nombre}</td>
                <td className="p-4 text-gray-500">{u.email}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    u.rol === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {u.rol === 'admin' ? 'ADMIN' : 'TÉCNICO'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleBorrar(u.id, u.nombre)}
                    className="text-gray-300 hover:text-red-600 font-bold text-sm transition-colors px-3 py-1 rounded hover:bg-red-50 border border-transparent hover:border-red-100"
                    title="Eliminar usuario">
                    🗑️ Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
            <div className="p-10 text-center text-gray-400">No hay usuarios registrados.</div>
        )}
      </div>
    </div>
  );
}