import { useNavigate } from 'react-router-dom'; 
import Swal from 'sweetalert2'; // <-- NUEVO: Para la confirmación de salida
import { motion } from 'framer-motion'; // <-- NUEVO: Para animar la barra al entrar

export default function Navbar({ usuario, onLogout, onConfigClick }) {
  const navigate = useNavigate(); 

  // <-- NUEVO: Función para confirmar antes de cerrar sesión
  const handleLogoutClick = async () => {
    const confirmacion = await Swal.fire({
        title: '¿Cerrar sesión?',
        text: "Tendrás que ingresar tus credenciales la próxima vez.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626', // Rojo
        cancelButtonColor: '#6b7280', // Gris
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'rounded-2xl' }
    });

    if (confirmacion.isConfirmed) {
        onLogout(); // Si dice que sí, ejecutamos la función original de App.jsx
    }
  };

  return (
    // <-- NUEVO: Cambiamos <nav> por <motion.nav> para que caiga suavemente desde arriba
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white shadow-md sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* LOGO CON NAVEGACIÓN */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => navigate('/admin/dashboard')} 
          >
            <img src="/logo_canaco_oficial.png" alt="Logo" className="h-10 w-auto transition-transform group-hover:scale-105" />
            <div className="hidden md:block">
               <h1 className="text-lg font-bold text-blue-900 leading-tight group-hover:text-blue-700 transition-colors">CANACO MTY</h1>
               <p className="text-xs text-blue-500 font-medium">Panel Administrativo</p>
            </div>
          </div>

          {/* MENÚ DERECHO (USUARIO Y CONFIG) */}
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-700">{usuario.nombre}</p>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold uppercase shadow-sm">
                  {usuario.rol || 'Staff'}
                </span>
             </div>

             <div className="h-8 w-8 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-blue-100">
                {usuario.nombre.charAt(0)}
             </div>

             {/* BOTÓN DE CONFIGURACIÓN */}
             <button 
               onClick={onConfigClick}
               className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition transform hover:rotate-90"
               title="Configuración"
             >
                ⚙️
             </button>

             <div className="h-6 w-px bg-gray-300 mx-1"></div>

             {/* BOTÓN SALIR (Ahora llama a nuestra nueva función) */}
             <button 
                onClick={handleLogoutClick} 
                className="text-sm font-bold text-red-500 hover:text-white hover:bg-red-500 px-3 py-1.5 rounded-lg transition-colors"
             >
                Salir
             </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}