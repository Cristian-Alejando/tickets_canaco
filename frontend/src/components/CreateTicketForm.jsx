import { useEffect, useState } from 'react';

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

  // --- NUEVO ESTADO PARA EL MODO ASISTENCIA ---
  const [esParaOtro, setEsParaOtro] = useState(false); 

  // Fijar Categoría Automáticamente al cargar
  useEffect(() => {
    setFormData(prev => ({ ...prev, categoria: 'General' }));
  }, []);

  // =================================================================
  // 1. VALIDACIÓN EN TIEMPO REAL (SIN EXIGIR CORREO)
  // =================================================================
  const isFormValid = 
      (usuario && !esParaOtro) 
      ? (formData.titulo?.trim() !== '' && formData.ubicacion !== '' && formData.descripcion?.trim() !== '') 
      : (formData.nombre_contacto?.trim() !== '' && formData.departamento !== '' && formData.titulo?.trim() !== '' && formData.ubicacion !== '' && formData.descripcion?.trim() !== '');

  // =================================================================
  // 2. FUNCIÓN DE ENVÍO PERSONALIZADA (Intermedia)
  // =================================================================
  const handleLocalSubmit = (e) => {
    e.preventDefault();
    
    const correoFinal = formData.email_contacto?.trim() 
        ? `${formData.email_contacto}@canaco.net` 
        : '';

    const dataToSend = (usuario && !esParaOtro) 
      ? { ...formData, nombre_contacto: usuario.nombre, email_contacto: usuario.email, departamento: usuario.departamento || '' }
      : { ...formData, email_contacto: correoFinal, esParaOtro: esParaOtro };

    // Llamamos a la función original que viene del padre
    onSubmit(e, dataToSend); 
  };

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
                {usuario ? 'Registrando ticket desde el panel.' : 'Describe el problema para que te ayudemos.'}
            </p>
        </div>
        
        {/* --- SECCIÓN DE IDENTIDAD --- */}
        {usuario ? (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-200 text-blue-800 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                            {usuario.nombre ? usuario.nombre.charAt(0) : 'U'}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-blue-900">
                                Solicitante: {esParaOtro ? 'Otro Colaborador' : usuario.nombre}
                            </p>
                            <p className="text-xs text-blue-600">
                                {esParaOtro ? 'Modo asistencia' : `${usuario.rol} • ${usuario.email}`}
                                {(!esParaOtro && usuario.departamento) && ` • 🏢 ${usuario.departamento}`}
                            </p>
                        </div>
                    </div>
                    {/* --- TOGGLE PARA MODO ASISTENCIA --- */}
                    <button 
                        type="button"
                        onClick={() => setEsParaOtro(!esParaOtro)}
                        className={`text-xs font-bold px-4 py-2 rounded-lg border transition whitespace-nowrap w-full sm:w-auto ${esParaOtro ? 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-sm'}`}
                    >
                        {esParaOtro ? '❌ Cancelar asistencia' : '📞 Reportar por otra persona'}
                    </button>
                </div>
            </div>
        ) : null}

        {/* --- CASO 2: INPUTS DE CONTACTO --- */}
        {(!usuario || esParaOtro) && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4 animate-fade-in-up">
                <h3 className="text-xs font-bold text-gray-500 uppercase">
                    {esParaOtro ? 'Datos del Colaborador Afectado' : 'Tus Datos de Contacto'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
                    
                    <div className="md:col-span-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tu Nombre *</label>
                        <input 
                            type="text" required 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                            placeholder="Ej. Juan Pérez"
                            value={formData.nombre_contacto || ''}
                            onChange={e => setFormData({...formData, nombre_contacto: e.target.value})}
                        />
                    </div>
                    
                    <div className="md:col-span-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Usuario Institucional</label>
                        <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-white shadow-sm">
                            <input 
                                type="text"
                                className="w-full p-3 outline-none text-gray-700"
                                placeholder="usuario"
                                value={formData.email_contacto || ''}
                                onChange={e => {
                                    const val = e.target.value.split('@')[0];
                                    setFormData({...formData, email_contacto: val})
                                }}
                            />
                            <span className="bg-gray-100 text-gray-500 font-bold px-3 py-3 flex items-center border-l border-gray-200 select-none text-sm">
                                @canaco.net
                            </span>
                        </div>
                    </div>

                    {/* --- SELECT DE DEPARTAMENTO --- */}
                    <div className="md:col-span-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Departamento *</label>
                        <select 
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                            value={formData.departamento || ''}
                            onChange={e => setFormData({...formData, departamento: e.target.value})}
                        >
                            <option value="" disabled>Selecciona...</option>
                            <option value="Afiliación">Afiliación</option>
                            <option value="SIEM">SIEM</option>
                            <option value="Mercadotecnia">Mercadotecnia</option>
                            <option value="Legal">Legal</option>
                            <option value="Comunicación">Comunicación</option>
                            <option value="Eventos">Eventos</option>
                            <option value="Dirección">Dirección</option>
                            <option value="Contabilidad">Contabilidad</option>
                            <option value="Sistemas">Sistemas</option>
                            <option value="Capital Humano">Capital Humano</option>
                            <option value="Conciliación">Conciliación</option>
                            <option value="Economía">Economía</option>
                        </select>
                    </div>
                </div>
            </div>
        )}

        {/* --- FORMULARIO PRINCIPAL --- */}
        <form onSubmit={handleLocalSubmit} className="space-y-6">
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

            {/* --- SELECT PARA UBICACIÓN --- */}
            <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">Ubicación exacta</label>
                 <select 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white" 
                    value={formData.ubicacion || ''} 
                    onChange={e => setFormData({...formData, ubicacion: e.target.value})} 
                    required
                >
                    <option value="" disabled>Selecciona tu piso o área...</option>
                    <option value="Sótano">Sótano</option>
                    <option value="Planta baja">Planta baja</option>
                    <option value="Piso 1">Piso 1</option>
                    <option value="Piso 2">Piso 2</option>
                    <option value="Piso 3">Piso 3</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Descripción detallada</label>
                <textarea 
                    rows="4" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
                    placeholder="Explica qué sucede..." 
                    value={formData.descripcion} 
                    onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                    required
                />
            </div>

            {/* 👇👇👇 NUEVO: ZONA DE SUBIDA Y TOMA DE EVIDENCIA (DOS BOTONES) 👇👇👇 */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Evidencia Visual (Opcional)</label>
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                    
                    {/* BOTÓN 1: TOMAR FOTO (Usa capture="environment" para abrir la cámara directo en móviles) */}
                    <label className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-all">
                        <span className="text-2xl mb-1">📷</span>
                        <span className="text-sm text-gray-600 font-semibold">Tomar Foto</span>
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            capture="environment" 
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if(file) setFormData({...formData, evidencia: file});
                            }} 
                        />
                    </label>

                    {/* BOTÓN 2: SUBIR ARCHIVO DE LA GALERÍA/PC */}
                    <label className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-all">
                        <span className="text-2xl mb-1">📁</span>
                        <span className="text-sm text-gray-600 font-semibold">Subir Archivo</span>
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if(file) setFormData({...formData, evidencia: file});
                            }} 
                        />
                    </label>

                </div>

                {/* Mostramos esto si el usuario ya seleccionó/tomó una foto */}
                {formData.evidencia && (
                    <div className="mt-3 bg-green-50 text-green-700 px-4 py-3 rounded-lg border border-green-200 text-sm font-bold flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span>✅</span>
                            <span className="truncate max-w-[200px] md:max-w-[300px]">
                                {formData.evidencia.name}
                            </span>
                        </div>
                        <button 
                            type="button" 
                            className="text-red-500 hover:text-red-700 font-semibold text-xs bg-white px-3 py-1.5 rounded shadow-sm border border-red-100 transition-colors"
                            onClick={() => setFormData({...formData, evidencia: null})}
                        >
                            Quitar
                        </button>
                    </div>
                )}
            </div>
            {/* 👆👆👆 FIN DE ZONA DE SUBIDA DE EVIDENCIA 👆👆👆 */}
            
            <div className="flex gap-4 pt-6">
                <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-lg font-bold transition">
                    {usuario ? 'Cancelar' : 'Limpiar'}
                </button>
                
                {/* --- BOTÓN DE ENVÍO INTELIGENTE --- */}
                <button 
                    type="submit" 
                    disabled={!isFormValid} 
                    className={`flex-1 py-3 rounded-lg font-bold shadow-lg transition transform 
                        ${(!isFormValid) 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                            : 'bg-blue-700 hover:bg-blue-800 text-white hover:scale-[1.02]' 
                        }`}
                >
                    {(!isFormValid) ? 'Completa los campos...' : 'Enviar Reporte 🚀'}
                </button>
            </div>
        </form>
    </div>
  );
}