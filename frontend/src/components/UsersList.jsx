export default function UsersList({ users }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
            👥 Directorio de Usuarios
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{users.length} registrados</span>
        </h2>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-sm text-gray-500 border-b border-gray-200">
                        <th className="py-3 font-bold uppercase tracking-wider">Nombre</th>
                        <th className="py-3 font-bold uppercase tracking-wider">Departamento</th>
                        <th className="py-3 font-bold uppercase tracking-wider">Contacto</th>
                        <th className="py-3 font-bold uppercase tracking-wider">Rol</th>
                    </tr>
                </thead>
                <tbody className="text-gray-700 text-sm">
                    {users.map((u) => (
                        <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                            <td className="py-3 font-bold text-gray-800">{u.nombre}</td>
                            <td className="py-3">
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold uppercase">
                                    {u.departamento || 'Sin asignar'}
                                </span>
                            </td>
                            <td className="py-3 text-gray-500">
                                <div className="flex flex-col">
                                    <span>📧 {u.email}</span>
                                    {u.telefono && <span>📞 {u.telefono}</span>}
                                </div>
                            </td>
                            <td className="py-3 capitalize">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    u.rol === 'admin' ? 'bg-purple-100 text-purple-700' :
                                    u.rol === 'tecnico' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                }`}>
                                    {u.rol}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}