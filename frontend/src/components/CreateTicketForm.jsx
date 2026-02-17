import { useEffect } from 'react';

export default function CreateTicketForm({ 
    onSubmit, 
    onCancel, 
    formData, 
    setFormData, 
    onSearch, 
    sugerencias, 
    onVoteSugerencia, 
    misVotos,
    usuario // <--- IMPORTANTE: Recibimos al usuario
}) {

  // Fijar Categoría Automáticamente al cargar
  useEffect(() => {
    setFormData(prev => ({ ...prev, categoria: 'General' }));
  }, []);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 animate-fade-in-up">
        
        {/* ENCABEZADO DINÁMICO */}
        <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                {usuario ? '👮‍♂️' : '📝'}
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
                {usuario ? 'Nuevo Reporte Interno' : 'Nuevo Reporte'}
            </h2>
            <p className="text-gray-500">
                {usuario ? 'Registrando ticket como Administrador.' : 'Describe el problema para que te ayudemos.'}
            </p>
        </div>
        
        {/* --- SECCIÓN DE IDENTIDAD --- */}
        {usuario ? (
            /* CASO 1: ADMIN (Tarjeta de Identificación) */
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-center gap-4">
                <div className="bg-blue-200 text-blue-800 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    {usuario.nombre ? usuario.nombre.charAt(0) : 'U'}
                </div>
                <div>
                    <p className="text-sm font-bold text-blue-900">Solicitante: {usuario.nombre}</p>
                    <p className="text-xs text-blue-600">
                        {usuario.rol} • {usuario.email} 
                        {/* AQUI: Mostramos el teléfono si lo tiene */}
                        {usuario.telefono && ` • 📞 ${usuario.telefono}`}
                    </p>
                </div>
            </div>
        ) : (
            /* CASO 2: PÚBLICO (Inputs de Nombre, Correo y TELÉFONO) */
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase">Tus Datos de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
                    {/* CAMBIO: Grid de 3 columnas para que quepa el teléfono */}
                    
                    <div className="md:col-span-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tu Nombre *</label>
                        <input 
                            type="text" required 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            placeholder="Ej. Juan Pérez"
                            value={formData.nombre_contacto || ''}
                            onChange={e => setFormData({...formData, nombre_contacto: e.target.value})}
                        />
                    </div>
                    
                    <div className="md:col-span-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tu Correo *</label>
                        <input 
                            type="email" required 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            placeholder="contacto@ejemplo.com"
                            value={formData.email_contacto || ''}
                            onChange={e => setFormData({...formData, email_contacto: e.target.value})}
                        />
                    </div>

                    {/* --- NUEVO INPUT DE TELÉFONO --- */}
                    <div className="md:col-span-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono *</label>
                        <input 
                            type="tel" required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            placeholder="Ej. 555-1234"
                            value={formData.telefono_contacto || ''}
                            onChange={e => setFormData({...formData, telefono_contacto: e.target.value})}
                        />
                    </div>
                </div>
            </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
            <div className="relative">
                <label className="block text-sm font-bold text-gray-700 mb-2">Título del problema</label>
                <input 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
                    placeholder="Ej: Internet lento en sala de juntas..." 
                    value={formData.titulo} 
                    onChange={e => onSearch(e.target.value)} 
                    required autoComplete="off"
                />
                
                {/* ALERTA DE DUPLICADOS */}
                {sugerencias.length > 0 && usuario && (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-5 animate-pulse">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-orange-500 text-xl">⚠️</span>
                        <p className="text-sm text-orange-800 font-bold">Posibles duplicados encontrados:</p>
                    </div>
                    <ul className="space-y-3">
                    {sugerencias.map(s => (
                        <li key={s.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-orange-100 shadow-sm">
                        <div>
                            <span className="text-sm font-semibold text-gray-800 block">{s.titulo}</span>
                            <span className="text-xs text-gray-500">{s.ubicacion} • {s.estatus}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => onVoteSugerencia(s.id, true)} 
                            disabled={misVotos.includes(s.id)}
                            className={`text-xs px-4 py-2 rounded-lg font-bold transition ${misVotos.includes(s.id) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                        >
                            {misVotos.includes(s.id) ? 'Ya votaste' : '✋ Es este'}
                        </button>
                        </li>
                    ))}
                    </ul>
                </div>
                )}
            </div>

            {/* --- SOLO MOSTRAMOS UBICACIÓN (Categoría Oculta) --- */}
            <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">Ubicación exacta</label>
                 <input 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
                    placeholder="Ej: Piso 2, Oficina 3" 
                    value={formData.ubicacion} 
                    onChange={e => setFormData({...formData, ubicacion: e.target.value})} 
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Descripción detallada</label>
                <textarea rows="4" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Explica qué sucede..." value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} required/>
            </div>
            
            <div className="flex gap-4 pt-4">
                <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-lg font-bold transition">
                    {usuario ? 'Cancelar' : 'Limpiar Formulario'}
                </button>
                <button type="submit" className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-bold shadow-lg transition transform hover:scale-[1.02]">
                    Enviar Reporte 🚀
                </button>
            </div>
        </form>
    </div>
  );
}