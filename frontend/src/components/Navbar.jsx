export default function Navbar({ usuario, onLogout, onConfigClick }) {
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          
          {/* LADO IZQUIERDO: LOGO Y TÍTULO */}
          <div className="flex items-center gap-4">
            <img src="/logo_canaco_oficial.png" alt="Logo" className="h-14 w-auto object-contain" />
            <div className="hidden sm:block h-8 w-[1px] bg-gray-300"></div> 
            <div>
               <h1 className="text-xl font-bold text-blue-900 leading-none">Mesa de Ayuda</h1>
               <span className="text-xs text-gray-500 font-medium tracking-widest">SISTEMA INTERNO</span>
            </div>
          </div>

          {/* LADO DERECHO: DATOS Y BOTONES */}
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block mr-2">
                <p className="text-sm font-bold text-gray-700">{usuario.nombre}</p>
                <p className="text-xs text-gray-500 capitalize">{usuario.rol}</p>
             </div>
             
             {/* --- NUEVO: BOTÓN DE CONFIGURACIÓN --- */}
             <button 
                onClick={onConfigClick}
                className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition flex items-center justify-center"
                title="Configuración"
             >
                <span className="text-xl">⚙️</span>
             </button>

             {/* BOTÓN SALIR */}
             <button onClick={onLogout} className="text-sm text-red-500 font-medium hover:bg-red-50 px-3 py-1 rounded-full border border-transparent hover:border-red-100 transition">
               Salir
             </button>
          </div>

        </div>
      </div>
    </nav>
  );
}