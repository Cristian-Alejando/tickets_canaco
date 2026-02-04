export default function CreateTicketForm({ 
    onSubmit, 
    onCancel, 
    formData, 
    setFormData, 
    onSearch, 
    sugerencias, 
    onVoteSugerencia, 
    misVotos 
}) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 animate-fade-in-up">
        <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📝</div>
            <h2 className="text-2xl font-bold text-gray-800">Nuevo Reporte</h2>
            <p className="text-gray-500">Describe el problema para que mantenimiento pueda atenderlo.</p>
        </div>
        
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
                
                {/* Alerta de duplicados */}
                {sugerencias.length > 0 && (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-5 animate-pulse">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-orange-500 text-xl">⚠️</span>
                        <p className="text-sm text-orange-800 font-bold">¡Espera! Encontramos reportes similares:</p>
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
                            {misVotos.includes(s.id) ? 'Ya votaste' : '✋ Votar por este'}
                        </button>
                        </li>
                    ))}
                    </ul>
                </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Ubicación exacta</label>
                    <input className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Ej: Piso 2, Oficina 3" value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})} required/>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Categoría</label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                        <option>Mantenimiento</option><option>Sistemas</option><option>Limpieza</option>
                        <option value="Seguridad">Seguridad</option><option value="Administrativo">Administrativo</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Descripción detallada</label>
                <textarea rows="4" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Explica qué sucede..." value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} required/>
            </div>
            
            <div className="flex gap-4 pt-4">
                <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-lg font-bold transition">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-bold shadow-lg transition transform hover:scale-[1.02]">Crear Reporte</button>
            </div>
        </form>
    </div>
  );
}