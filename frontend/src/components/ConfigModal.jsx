export default function ConfigModal({ onClose, usuario }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        {/* Encabezado */}
        <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            ⚙️ Configuración del Sistema
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          
          {/* Sección de Información */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Información General</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-100 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">Versión del Software:</span>
                    <span className="font-mono font-bold text-blue-700">v1.2.0</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Entorno:</span>
                    <span className="text-green-600 font-bold bg-green-100 px-2 rounded-full text-xs">Producción (LAN)</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Base de Datos:</span>
                    <span className="text-gray-800">PostgreSQL 16</span>
                </div>
            </div>
          </div>

          {/* Sección de Usuario (Solo visual por ahora) */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Tu Sesión</h4>
            <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="bg-blue-200 text-blue-700 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    {usuario.nombre.charAt(0)}
                </div>
                <div>
                    <p className="text-sm font-bold text-blue-900">{usuario.nombre}</p>
                    <p className="text-xs text-blue-600">{usuario.email}</p>
                </div>
            </div>
          </div>

          <div className="text-xs text-center text-gray-400 mt-4">
            Desarrollado por el Depto. de Sistemas CANACO © 2026
          </div>
        </div>

        {/* Pie de página con botón */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button 
            onClick={onClose} 
            className="bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}