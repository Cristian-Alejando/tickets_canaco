import { useNavigate } from 'react-router-dom'; // <--- IMPORTAMOS ESTO

export default function Navbar({ usuario, onLogout, onConfigClick }) {
  const navigate = useNavigate(); // <--- ACTIVAMOS EL GPS

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* LOGO CON NAVEGACIÓN */}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => navigate('/admin/dashboard')} // <--- AL DAR CLICK, NOS LLEVA AL PANEL
          >
            <img src="/logo_canaco_oficial.png" alt="Logo" className="h-10 w-auto" />
            <div className="hidden md:block">
               <h1 className="text-lg font-bold text-blue-900 leading-tight">CANACO MTY</h1>
               <p className="text-xs text-blue-500 font-medium">Panel Administrativo</p>
            </div>
          </div>

          {/* MENÚ DERECHO (USUARIO Y CONFIG) */}
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-700">{usuario.nombre}</p>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold uppercase">
                  {usuario.rol || 'Staff'}
                </span>
             </div>

             <div className="h-8 w-8 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {usuario.nombre.charAt(0)}
             </div>

             {/* BOTÓN DE CONFIGURACIÓN */}
             <button 
               onClick={onConfigClick}
               className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
               title="Configuración"
             >
                ⚙️
             </button>

             <div className="h-6 w-px bg-gray-300 mx-1"></div>

             {/* BOTÓN SALIR */}
             <button 
                onClick={onLogout} 
                className="text-sm font-bold text-red-500 hover:text-red-700 transition"
             >
                Salir
             </button>
          </div>
        </div>
      </div>
    </nav>
  );
}