import { useState } from 'react';
import { registerUser, deleteUser } from '../services/ticketService';
import { toast } from 'react-hot-toast'; // <-- NUEVO
import Swal from 'sweetalert2'; // <-- NUEVO

export default function UsersList({ users, onUserUpdated }) { 
  
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'tecnico' 
  });

  const handleCrear = async (e) => {
    e.preventDefault();
    if(!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.password) return;

    // <-- NUEVO: Confirmación moderna con SweetAlert
    const confirmacion = await Swal.fire({
        title: '¿Crear nuevo usuario?',
        text: `Vas a registrar a "${nuevoUsuario.nombre}" en el sistema.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#16a34a', // Verde
        cancelButtonColor: '#6b7280', // Gris
        confirmButtonText: 'Sí, crear usuario',
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'rounded-2xl' }
    });

    if(confirmacion.isConfirmed) {
        const res = await registerUser(nuevoUsuario);
        if(res.error) {
            toast.error("Error: " + res.error); // <-- NUEVO: Toast de error
        } else {
            toast.success("Usuario creado con éxito"); // <-- NUEVO: Toast de éxito
            setNuevoUsuario({ nombre: '', email: '', password: '', rol: 'tecnico' }); 
            if(onUserUpdated) onUserUpdated(); 
        }
    }
  };

  const handleToggleStatus = async (id, nombre, estaActivo) => {
    const accion = estaActivo ? "DESACTIVAR" : "REACTIVAR";
    const titulo = estaActivo ? '¿Quitar acceso?' : '¿Devolver acceso?';
    const mensaje = estaActivo 
        ? `El usuario ${nombre} ya no podrá entrar al sistema.`
        : `El usuario ${nombre} podrá volver a iniciar sesión.`;
    const iconType = estaActivo ? 'warning' : 'info';
    const confirmColor = estaActivo ? '#dc2626' : '#2563eb'; // Rojo para baja, Azul para alta

    // <-- NUEVO: Confirmación moderna dinámica
    const confirmacion = await Swal.fire({
        title: titulo,
        text: mensaje,
        icon: iconType,
        showCancelButton: true,
        confirmButtonColor: confirmColor,
        cancelButtonColor: '#6b7280',
        confirmButtonText: `Sí, ${accion.toLowerCase()}`,
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'rounded-2xl' }
    });

    if(confirmacion.isConfirmed) {
        const exito = await deleteUser(id);
        if(exito) {
            toast.success(`Acceso de ${nombre} actualizado`); // <-- NUEVO
            if(onUserUpdated) onUserUpdated(); // Recargar lista
        } else {
            toast.error(`Error al ${accion.toLowerCase()} al usuario.`); // <-- NUEVO
        }
    }
  };

  return (
    <div className="animate-fade-in-up space-y-8">
      
      {/* FORMULARIO DE ALTA */}
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

      {/* TABLA DE USUARIOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">Directorio de Accesos</h2>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-gray-400 text-xs uppercase tracking-wider border-b">
              <th className="p-4 font-medium">Nombre</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium text-center">Rol / Estatus</th>
              <th className="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => {
              const estaActivo = u.activo !== false; 

              return (
                <tr key={u.id} className={`transition group ${!estaActivo ? 'bg-gray-50' : 'hover:bg-blue-50'}`}>
                  <td className="p-4 font-bold text-gray-700 flex flex-col">
                    <span className={!estaActivo ? 'line-through text-gray-400' : ''}>{u.nombre}</span>
                    {!estaActivo && <span className="text-[10px] text-red-500 font-bold uppercase">Desactivado</span>}
                  </td>
                  <td className={`p-4 ${!estaActivo ? 'text-gray-300' : 'text-gray-500'}`}>{u.email}</td>
                  
                  <td className="p-4 text-center">
                    {estaActivo ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            u.rol === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                            {u.rol === 'admin' ? 'ADMIN' : 'TÉCNICO'}
                        </span>
                    ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold border bg-red-50 text-red-600 border-red-200">
                            ⛔ BAJA
                        </span>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    <button 
                        onClick={() => handleToggleStatus(u.id, u.nombre, estaActivo)}
                        className={`font-bold text-sm transition-colors px-3 py-1 rounded border border-transparent 
                            ${estaActivo 
                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100' 
                                : 'text-green-600 hover:text-green-800 hover:bg-green-50 hover:border-green-200 bg-white border-green-100 shadow-sm'
                            }`}
                        title={estaActivo ? "Desactivar acceso" : "Reactivar acceso"}
                    >
                        {estaActivo ? '🚫 Desactivar' : '♻️ Reactivar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {users.length === 0 && (
            <div className="p-10 text-center text-gray-400">No hay usuarios registrados.</div>
        )}
      </div>
    </div>
  );
}