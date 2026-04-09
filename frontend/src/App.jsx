import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { API_URL } from './config';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { Toaster, toast } from 'react-hot-toast'; 

// Importamos Socket.io para escuchar al servidor en tiempo real
import { io } from 'socket.io-client';

// --- LIBRERÍAS DE GRÁFICAS (FASE 2) ---
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// Componentes
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import TicketCard from './components/TicketCard';
import StatsCards from './components/StatsCards';
import CreateTicketForm from './components/CreateTicketForm';
import ConfigModal from './components/ConfigModal';
import UsersList from './components/UsersList';
import RegisterPage from './pages/RegisterPage';
import PublicBoardPage from './pages/PublicBoardPage';

// Servicios
import {
  getTickets,
  createTicket,
  updateTicket,
  voteTicket,
  getMyVotes,
  getUsers,
  deleteTicket,
  searchTickets
} from './services/ticketService';

function App() {
  const [usuario, setUsuario] = useState(() => {
    const usuarioGuardado = localStorage.getItem('sesion_admin_canaco');
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  // Todos los tickets (usado principalmente para el Dashboard y métricas rápidas)
  const [tickets, setTickets] = useState([]); 
  
  // Estados para la paginación profunda en el Historial
  const [historialTickets, setHistorialTickets] = useState([]);
  const [historialPage, setHistorialPage] = useState(1);
  const [historialTotalPages, setHistorialTotalPages] = useState(1);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    titulo: '',
    ubicacion: '',
    descripcion: '',
    departamento: '',
    categoria: 'Mantenimiento',
    prioridad: 'media',
    nombre_contacto: '',
    email_contacto: ''
  });

  const [misVotos, setMisVotos] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [ticketEditando, setTicketEditando] = useState(null);
  const [ticketModalAdmin, setTicketModalAdmin] = useState(null);
  
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [listaUsuarios, setListaUsuarios] = useState([]);

  // ==========================================
  // FILTROS EXCLUSIVOS PARA EL HISTORIAL (Llaman al Backend)
  // ==========================================
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [filtroDepartamento, setFiltroDepartamento] = useState('Todos');
  const [filtroEstatus, setFiltroEstatus] = useState('Todos'); 
  const [filtroTexto, setFiltroTexto] = useState('');

  // ==========================================
  // NUEVOS FILTROS EXCLUSIVOS PARA EL PANEL (Dashboard) (Locales)
  // ==========================================
  const [filtroPrioridadActivos, setFiltroPrioridadActivos] = useState('Todas'); 
  const [dashFiltroTexto, setDashFiltroTexto] = useState('');
  const [dashFiltroDepartamento, setDashFiltroDepartamento] = useState('Todos');
  const [dashFiltroEstatus, setDashFiltroEstatus] = useState('Todos_Activos'); // Excluye "resueltos"
  const [dashFiltroFechaInicio, setDashFiltroFechaInicio] = useState('');
  const [dashFiltroFechaFin, setDashFiltroFechaFin] = useState('');

  const [editData, setEditData] = useState({
    estatus: '',
    comentarios: '',
    prioridad: 'media',
    asignado_a: ''
  });

  // Función para resetear filtros del Historial
  const limpiarFiltrosHistorial = () => {
    setFiltroEstatus('Todos');
    setFiltroDepartamento('Todos');
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
    setFiltroTexto('');
    setHistorialPage(1);
  };

  // Función para resetear filtros del Dashboard
  const limpiarFiltrosDashboard = () => {
    setFiltroPrioridadActivos('Todas');
    setDashFiltroTexto('');
    setDashFiltroDepartamento('Todos');
    setDashFiltroEstatus('Todos_Activos');
    setDashFiltroFechaInicio('');
    setDashFiltroFechaFin('');
  };

  // EFECTO: CONEXIÓN DE WEBSOCKETS
  useEffect(() => {
    const socketURL = API_URL.replace('/api', ''); 
    const socket = io(socketURL);

    socket.on('ticket_creado', (nuevoTicket) => {
        toast.success(`🎫 ¡Nuevo ticket recibido: ${nuevoTicket.titulo}!`, { icon: '🔔' });
        cargarTicketsGlobales(); 
        if (usuario) cargarHistorialPaginado(historialPage);
    });

    socket.on('ticket_actualizado', (ticketActualizado) => {
        cargarTicketsGlobales();
        if (usuario) cargarHistorialPaginado(historialPage);
        if (ticketModalAdmin && ticketModalAdmin.id === ticketActualizado.id) {
            setTicketModalAdmin(ticketActualizado);
        }
    });

    socket.on('ticket_eliminado', (ticketId) => {
        cargarTicketsGlobales();
        if (usuario) cargarHistorialPaginado(historialPage);
        if (ticketModalAdmin && ticketModalAdmin.id === ticketId) {
            setTicketModalAdmin(null);
            toast('El ticket que estabas viendo fue eliminado', { icon: '⚠️' });
        }
    });

    return () => {
        socket.disconnect();
    };
  }, [usuario, historialPage, filtroEstatus, filtroDepartamento, filtroFechaInicio, filtroFechaFin, filtroTexto, ticketModalAdmin]);

  useEffect(() => {
    cargarTicketsGlobales();
    if (usuario) {
      cargarMisVotos();
      cargarUsuarios();
    } else {
      const votosLocales = JSON.parse(localStorage.getItem('votos_publicos')) || [];
      setMisVotos(votosLocales);
    }
  }, [usuario]);

  useEffect(() => {
    if (usuario) {
      const timer = setTimeout(() => {
        cargarHistorialPaginado(historialPage);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [historialPage, filtroEstatus, filtroDepartamento, filtroFechaInicio, filtroFechaFin, filtroTexto, usuario]);

  const cargarTicketsGlobales = async () => {
    try {
      const data = await getTickets();
      const ticketsOrdenados = data.sort((a, b) => {
        if (a.estatus === 'resuelto' && b.estatus !== 'resuelto') return 1;
        if (a.estatus !== 'resuelto' && b.estatus === 'resuelto') return -1;
        return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
      });
      setTickets(ticketsOrdenados);
    } catch (error) {
      console.error(error);
    }
  };

  const cargarHistorialPaginado = async (page) => {
    try {
      const filters = {
        estatus: filtroEstatus,
        departamento: filtroDepartamento,
        fechaInicio: filtroFechaInicio,
        fechaFin: filtroFechaFin,
        texto: filtroTexto 
      };
      
      const data = await getTickets(page, 15, filters); 
      
      if (data && data.tickets) {
        setHistorialTickets(data.tickets);
        setHistorialTotalPages(data.totalPages);
      } else {
        setHistorialTickets([]);
        setHistorialTotalPages(1);
      }
    } catch (error) {
      console.error("Error al cargar historial paginado:", error);
    }
  };

  const handleFiltroChange = (setter, value) => {
    setter(value);
    setHistorialPage(1);
  };

  const cargarMisVotos = async () => {
    try {
      const data = await getMyVotes(usuario.id);
      setMisVotos(data);
    } catch (e) {
      console.error(e);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const data = await getUsers();
      setListaUsuarios(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTicket = async (e, customData = null) => {
    e.preventDefault();
    try {
      const datosBase = customData || formData;
      const ticketAEnviar = {
        ...datosBase,
        usuario_id: usuario ? usuario.id : null,
        nombre_contacto: (usuario && !datosBase.esParaOtro) ? usuario.nombre : datosBase.nombre_contacto,
        email_contacto: (usuario && !datosBase.esParaOtro) ? usuario.email : datosBase.email_contacto,
        departamento: (usuario && !datosBase.esParaOtro) ? usuario.departamento : datosBase.departamento
      };

      const res = await createTicket(ticketAEnviar);

      if (res.ok) {
        if (usuario) {
          toast.success('Ticket guardado correctamente'); 
        } else {
          Swal.fire({
            title: '¡Reporte Enviado!',
            html: `Tu número de folio es: <b>#${res.id}</b><br><br>Por favor, guárdalo para futuras consultas.`,
            icon: 'success',
            confirmButtonColor: '#1d4ed8',
            confirmButtonText: 'Entendido',
            customClass: { popup: 'rounded-2xl' }
          });
        }

        setFormData({
          titulo: '',
          ubicacion: '',
          descripcion: '',
          departamento: '',
          categoria: 'Mantenimiento',
          prioridad: 'media',
          nombre_contacto: '',
          email_contacto: ''
        });
        setSugerencias([]);
        
        cargarTicketsGlobales();
        if (usuario) cargarHistorialPaginado(historialPage);

        if (usuario) {
          navigate('/admin/dashboard');
        }
      } else {
        toast.error('No se pudo enviar el reporte.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error de conexión.');
    }
  };

  const handleLoginSuccess = (u) => {
    setUsuario(u);
    localStorage.setItem('sesion_admin_canaco', JSON.stringify(u));
    toast.success(`¡Bienvenido de nuevo, ${u.nombre}!`); 
    navigate('/admin/dashboard');
  };

  const handleLogout = () => {
    setUsuario(null);
    localStorage.removeItem('sesion_admin_canaco');
    localStorage.removeItem('token_admin_canaco'); 
    toast('Sesión cerrada correctamente', { icon: '👋' }); 
    navigate('/');
  };

  const handleVotar = async (id, desdeSugerencia = false) => {
    if (misVotos.includes(id)) return;
    
    try {
      const userId = usuario ? usuario.id : null;
      const res = await voteTicket(id, userId);

      if (res.ok) {
        cargarTicketsGlobales();
        if (usuario) cargarHistorialPaginado(historialPage);
        
        const nuevosVotos = [...misVotos, id];
        setMisVotos(nuevosVotos);

        if (!usuario) {
          localStorage.setItem('votos_publicos', JSON.stringify(nuevosVotos));
        }

        if (desdeSugerencia) {
          toast.success('¡Voto registrado! Gracias por confirmar.');
          setSugerencias([]);
          setFormData({ ...formData, titulo: '' });
          if (usuario) navigate('/admin/dashboard');
        } else {
          toast.success('¡Soporte notificado! Sumamos tu confirmación.');
        }
      } else {
        toast.error('No se pudo registrar el voto.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Problema de conexión al votar.');
    }
  };

  const guardarEdicion = async (id) => {
    const ticketOriginal = tickets.find((t) => t.id === id) || historialTickets.find(t => t.id === id);
    if (!ticketOriginal) return;

    const datosCompletos = {
      ...ticketOriginal,
      estatus: editData.estatus,
      comentarios: editData.comentarios,
      prioridad: editData.prioridad || ticketOriginal.prioridad || 'media',
      asignado_a: editData.asignado_a || null
    };

    try {
      const res = await updateTicket(id, datosCompletos);
      if (res.ok) {
        setTicketEditando(null);
        cargarTicketsGlobales();
        if (usuario) cargarHistorialPaginado(historialPage);
        toast.success("Cambios guardados exitosamente"); 
      } else {
        toast.error("Error al actualizar el ticket"); 
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión al actualizar");
    }
  };

  const cambiarPrioridad = async (t, p) => {
    const datos = { ...t, prioridad: p };
    try {
      const res = await updateTicket(t.id, datos);
      if (res.ok) {
        cargarTicketsGlobales();
        if (usuario) cargarHistorialPaginado(historialPage);
        toast.success(`Prioridad cambiada a ${p.toUpperCase()}`); 
      }
    } catch (e) {
      console.error(e);
      toast.error("Error al cambiar la prioridad");
    }
  };

  const iniciarEdicion = (t) => {
    setTicketEditando(t.id);
    setEditData({
      estatus: t.estatus || 'abierto',
      comentarios: t.comentarios || '',
      prioridad: t.prioridad || 'media',
      asignado_a: t.asignado_a || ''
    });
  };

  const buscarSimilares = async (txt, ubicacionActual) => {
    setFormData((prev) => ({ ...prev, titulo: txt }));
    const piso = ubicacionActual || formData.ubicacion;

    if (txt.length < 3 || !piso) {
      setSugerencias([]);
      return;
    }

    try {
      const data = await searchTickets(txt, piso);
      setSugerencias(data);
    } catch (e) {
      console.error(e);
      setSugerencias([]);
    }
  };

  const handleDeleteTicket = async (id) => {
    try {
      const res = await deleteTicket(id);
      if (res.ok) {
        setTickets((prev) => prev.filter((t) => t.id !== id));
        setHistorialTickets((prev) => prev.filter((t) => t.id !== id));
        if (ticketEditando === id) {
          setTicketEditando(null);
        }
        toast.success("Ticket eliminado permanentemente"); 
      } else {
        toast.error("Error al eliminar en la base de datos"); 
      }
    } catch (error) {
      console.error("Error eliminando:", error);
      toast.error("Error de conexión al intentar eliminar."); 
    }
  };

  const ticketsAMostrar = historialTickets;

  const exportarAExcel = () => {
    if (ticketsAMostrar.length === 0) {
      toast.error('No hay tickets en pantalla para exportar.');
      return;
    }

    const datosLimpios = ticketsAMostrar.map((t) => ({
      "Folio": `#${t.id}`,
      "Título del Reporte": t.titulo,
      "Estatus": t.estatus.toUpperCase(),
      "Prioridad": t.prioridad?.toUpperCase() || 'MEDIA',
      "Departamento": t.departamento || 'No asignado',
      "Categoría": t.categoria,
      "Afectados (Votos)": t.votos + 1,
      "Solicitante": t.nombre_contacto || "Usuario Interno",
      "Fecha de Creación": new Date(t.fecha_creacion).toLocaleDateString(),
      "Comentarios de Sistemas": t.comentarios || "Sin comentarios adicionales"
    }));

    const hoja = XLSX.utils.json_to_sheet(datosLimpios);
    hoja['!cols'] = [
      { wch: 8 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, 
      { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 40 }
    ];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Reporte_Filtrado");

    const fechaHoy = new Date().toLocaleDateString().replace(/\//g, '-');
    XLSX.writeFile(libro, `Reporte_CANACO_${fechaHoy}.xlsx`);
    
    toast.success('Excel descargado correctamente'); 
  };

  const stats = {
    abiertos: tickets.filter((t) => t.estatus === 'abierto').length,
    proceso: tickets.filter((t) => t.estatus === 'en_proceso').length,
    resueltos: tickets.filter((t) => t.estatus === 'resuelto').length
  };

  const departamentosUnicos = ['Todos', ...new Set(tickets.map(t => t.departamento).filter(Boolean))];

  const getDatosDepartamentos = () => {
    const conteo = {};
    tickets.forEach(t => {
      const dep = t.departamento || 'Sin asignar';
      conteo[dep] = (conteo[dep] || 0) + 1;
    });
    return Object.keys(conteo).map(key => ({ name: key, cantidad: conteo[key] }));
  };

  const getDatosCategorias = () => {
    const conteo = {};
    tickets.forEach(t => {
      const cat = t.categoria || 'Otro';
      conteo[cat] = (conteo[cat] || 0) + 1;
    });
    return Object.keys(conteo).map(key => ({ name: key, cantidad: conteo[key] }));
  };

  const COLORS = ['#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd', '#1e3a8a', '#bfdbfe'];

  const AdminMenu = ({ activo }) => (
    <div className="flex justify-center mb-8 gap-4 overflow-x-auto pb-2">
      <button 
        onClick={() => navigate('/admin/dashboard')} 
        className={`px-6 py-2 rounded-full font-bold shadow-sm transition ${activo === 'dashboard' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
      >
        📊 Panel
      </button>
      <button 
        onClick={() => navigate('/admin/crear')} 
        className={`px-6 py-2 rounded-full font-bold shadow-sm transition ${activo === 'crear' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
      >
        ➕ Nuevo
      </button>
      <button 
        onClick={() => navigate('/admin/historial')} 
        className={`px-6 py-2 rounded-full font-bold shadow-sm transition ${activo === 'historial' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
      >
        📜 Reportes
      </button>
      {(usuario?.rol === 'admin' || usuario?.rol === 'tecnico') && (
        <button 
          onClick={() => navigate('/admin/usuarios')} 
          className={`px-6 py-2 rounded-full font-bold shadow-sm transition ${activo === 'usuarios' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
        >
          👥 Usuarios
        </button>
      )}
    </div>
  );

  // Función auxiliar para limpiar el texto de tildes para la búsqueda local
  const normalizarTexto = (str) => {
    return str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
        }}
      />

      {usuario && (
        <Navbar 
          usuario={usuario} 
          onLogout={handleLogout} 
          onConfigClick={() => setMostrarConfig(true)} 
        />
      )}

      <Routes>
        <Route path="/" element={
          usuario ? <Navigate to="/admin/dashboard" replace /> : (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 w-full">
              <div className="max-w-2xl w-full animate-fade-in-up">
                <div className="text-center mb-8">
                  <img src="/logo_canaco_oficial.png" alt="Logo" className="h-24 mx-auto mb-4 object-contain" />
                  <h1 className="text-3xl font-bold text-blue-900">Buzón de Mantenimiento</h1>
                  <p className="text-gray-500 mt-2">Reporta incidencias para mejoras de CANACO</p>
                  <button 
                    onClick={() => navigate('/tablero')} 
                    className="mt-6 px-8 py-3 bg-white text-blue-700 font-bold rounded-full shadow border border-blue-100 hover:bg-blue-50 transition flex items-center gap-2 mx-auto"
                  >
                    👀 Ver Tablero Público de Reportes
                  </button>
                </div>
                <CreateTicketForm 
                  onSubmit={handleCreateTicket} 
                  onCancel={() => setFormData({
                    titulo: '', ubicacion: '', descripcion: '', departamento: '', categoria: 'Mantenimiento', prioridad: 'media', nombre_contacto: '', email_contacto: ''
                  })} 
                  formData={formData} 
                  setFormData={setFormData} 
                  onSearch={buscarSimilares} 
                  sugerencias={sugerencias} 
                  onVoteSugerencia={handleVotar} 
                  misVotos={misVotos} 
                  usuario={null} 
                />
                <div className="mt-8 text-xs text-gray-400 text-center">
                  © 2026 Cámara Nacional de Comercio Monterrey
                </div>
              </div>
            </div>
          )
        } />

        <Route path="/tablero" element={
          <PublicBoardPage 
            tickets={tickets} 
            misVotos={misVotos} 
            handleVotar={handleVotar} 
          />
        } />
        
        <Route path="/admin" element={
          usuario ? <Navigate to="/admin/dashboard" /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
        } />
        
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/admin/dashboard" element={
          usuario ? (
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              <AdminMenu activo="dashboard" />
              <div className="animate-fade-in-up">
                
                <StatsCards stats={stats} />

                {(() => {
                    // 👇 APLICACIÓN DE LOS FILTROS LOCALES DEL PANEL 👇
                    const textoBuscado = normalizarTexto(dashFiltroTexto);
                    
                    const ticketsActivosFiltrados = tickets.filter(t => {
                        // REGLA DE ORO DEL PANEL: NUNCA mostrar resueltos
                        if (t.estatus === 'resuelto') return false; 
                        
                        // Filtro de Prioridad Rápida
                        if (filtroPrioridadActivos !== 'Todas' && (t.prioridad || 'media') !== filtroPrioridadActivos) return false;
                        
                        // Filtros de Búsqueda Avanzada del Panel
                        if (dashFiltroEstatus !== 'Todos_Activos' && t.estatus !== dashFiltroEstatus) return false;
                        if (dashFiltroDepartamento !== 'Todos' && t.departamento !== dashFiltroDepartamento) return false;
                        
                        if (dashFiltroFechaInicio && t.fecha_creacion.substring(0, 10) < dashFiltroFechaInicio) return false;
                        if (dashFiltroFechaFin && t.fecha_creacion.substring(0, 10) > dashFiltroFechaFin) return false;

                        if (textoBuscado) {
                            const matchFolio = t.id.toString().includes(textoBuscado);
                            const matchTitulo = normalizarTexto(t.titulo).includes(textoBuscado);
                            const matchUbicacion = normalizarTexto(t.ubicacion).includes(textoBuscado);
                            if (!matchFolio && !matchTitulo && !matchUbicacion) return false;
                        }

                        return true;
                    });

                    return (
                        <div className="mt-8 mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* CABECERA Y FILTROS DEL DASHBOARD */}
                            <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50 flex flex-col gap-4">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                  <h3 className="text-lg font-bold text-blue-900 whitespace-nowrap">
                                    Reportes Activos
                                  </h3>
                                  
                                  <div className="flex flex-wrap justify-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm gap-1">
                                      <button onClick={() => setFiltroPrioridadActivos('Todas')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${filtroPrioridadActivos === 'Todas' ? 'bg-gray-100 text-gray-800 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>Todas</button>
                                      <button onClick={() => setFiltroPrioridadActivos('alta')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1 ${filtroPrioridadActivos === 'alta' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>🔴 Alta</button>
                                      <button onClick={() => setFiltroPrioridadActivos('media')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1 ${filtroPrioridadActivos === 'media' ? 'bg-yellow-50 text-yellow-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>🟡 Media</button>
                                      <button onClick={() => setFiltroPrioridadActivos('baja')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1 ${filtroPrioridadActivos === 'baja' ? 'bg-green-50 text-green-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>🟢 Baja</button>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                                        {ticketsActivosFiltrados.length} Pendientes
                                    </span>
                                    <button onClick={limpiarFiltrosDashboard} className="text-xs text-gray-500 hover:text-blue-600 underline">
                                      Limpiar
                                    </button>
                                  </div>
                                </div>

                                {/* BARRAS DE BÚSQUEDA DEL DASHBOARD */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-2">
                                  <div className="lg:col-span-1">
                                    <input type="text" placeholder="Buscar folio o texto..." className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500" value={dashFiltroTexto} onChange={(e) => setDashFiltroTexto(e.target.value)} />
                                  </div>
                                  <div>
                                    <select className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500" value={dashFiltroEstatus} onChange={(e) => setDashFiltroEstatus(e.target.value)}>
                                      {/* OJO: Aquí se quitó intencionalmente el estatus 'resuelto' */}
                                      <option value="Todos_Activos">Todos los activos</option>
                                      <option value="abierto">Abiertos</option>
                                      <option value="en_proceso">En Proceso</option>
                                    </select>
                                  </div>
                                  <div>
                                    <select className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500" value={dashFiltroDepartamento} onChange={(e) => setDashFiltroDepartamento(e.target.value)}>
                                      {departamentosUnicos.map((dep) => (<option key={`dash-dep-${dep}`} value={dep}>{dep}</option>))}
                                    </select>
                                  </div>
                                  <div>
                                    <input type="date" title="Fecha Desde" className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500" value={dashFiltroFechaInicio} onChange={(e) => setDashFiltroFechaInicio(e.target.value)} />
                                  </div>
                                  <div>
                                    <input type="date" title="Fecha Hasta" className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500" value={dashFiltroFechaFin} onChange={(e) => setDashFiltroFechaFin(e.target.value)} />
                                  </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto max-h-[400px]">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                                        <tr className="border-b border-gray-200 text-gray-600 text-sm">
                                            <th className="p-4 font-bold">Folio</th>
                                            <th className="p-4 font-bold">Fecha</th>
                                            <th className="p-4 font-bold">Solicitante</th>
                                            <th className="p-4 font-bold">Título / Ubicación</th>
                                            <th className="p-4 font-bold text-center">Estatus</th>
                                            <th className="p-4 font-bold text-center">Prioridad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {ticketsActivosFiltrados.map((t) => (
                                            <tr 
                                                key={t.id} 
                                                onClick={() => setTicketModalAdmin(t)}
                                                className="border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer"
                                            >
                                                <td className="p-4 font-mono font-bold text-gray-500">#{t.id}</td>
                                                <td className="p-4 text-gray-600">{new Date(t.fecha_creacion).toLocaleDateString()}</td>
                                                <td className="p-4 font-medium text-gray-800">{t.nombre_contacto || "Interno"}</td>
                                                <td className="p-4">
                                                    <p className="font-bold text-gray-800 truncate max-w-[250px]">{t.titulo}</p>
                                                    <p className="text-xs text-gray-500">📍 {t.ubicacion}</p>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${t.estatus === 'en_proceso' ? 'bg-blue-100 text-blue-700' : t.estatus === 'resuelto' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {t.estatus.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${(t.prioridad || 'media') === 'alta' ? 'bg-red-100 text-red-700' : (t.prioridad || 'media') === 'baja' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {t.prioridad || 'MEDIA'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {ticketsActivosFiltrados.length === 0 && (
                                    <div className="p-8 text-center text-gray-500 font-medium">No hay reportes activos que coincidan con estos filtros. 🎉</div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 text-center">Reportes por Departamento</h3>
                    <div className="h-64 w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                        <PieChart>
                          <Pie data={getDatosDepartamentos()} dataKey="cantidad" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {getDatosDepartamentos().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip /><Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 text-center">Incidencias por Categoría</h3>
                    <div className="h-64 w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                        <BarChart data={getDatosCategorias()} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <XAxis dataKey="name" tick={{fontSize: 12}} /><YAxis allowDecimals={false} /><Tooltip cursor={{fill: '#f3f4f6'}} />
                          <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          ) : <Navigate to="/admin" />
        } />

        <Route path="/admin/historial" element={
          usuario ? (
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              <AdminMenu activo="historial" />
              <div className="max-w-6xl mx-auto animate-fade-in-up">
                
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Centro de Búsqueda y Filtros
                    </h3>
                    <button 
                      onClick={limpiarFiltrosHistorial} 
                      className="text-sm text-gray-500 hover:text-blue-600 font-semibold underline decoration-transparent hover:decoration-blue-600 transition"
                    >
                      Limpiar Filtros
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    <div className="lg:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Buscar (Folio o Texto)</label>
                      <input 
                        type="text" 
                        placeholder="Ej. 124 o 'luces'" 
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                        value={filtroTexto} 
                        onChange={(e) => handleFiltroChange(setFiltroTexto, e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estatus</label>
                      <select className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500" value={filtroEstatus} onChange={(e) => handleFiltroChange(setFiltroEstatus, e.target.value)}>
                        <option value="Todos">Todos</option><option value="abierto">Abiertos</option><option value="en_proceso">En Proceso</option><option value="resuelto">Resueltos</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                      <select className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500" value={filtroDepartamento} onChange={(e) => handleFiltroChange(setFiltroDepartamento, e.target.value)}>
                        {departamentosUnicos.map((dep) => (<option key={`hist-dep-${dep}`} value={dep}>{dep}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                      <input type="date" className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500" value={filtroFechaInicio} onChange={(e) => handleFiltroChange(setFiltroFechaInicio, e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                      <input type="date" className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500" value={filtroFechaFin} onChange={(e) => handleFiltroChange(setFiltroFechaFin, e.target.value)} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-2">
                    <p className="text-sm text-gray-500 font-medium">Mostrando {ticketsAMostrar.length} resultados en esta página</p>
                    <button onClick={exportarAExcel} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow transition flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Descargar a Excel
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr className="text-gray-600 text-sm">
                          <th className="p-4 font-bold">Folio</th>
                          <th className="p-4 font-bold">Fecha</th>
                          <th className="p-4 font-bold">Solicitante</th>
                          <th className="p-4 font-bold">Título / Ubicación</th>
                          <th className="p-4 font-bold text-center">Estatus</th>
                          <th className="p-4 font-bold text-center">Prioridad</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {ticketsAMostrar.map((t) => (
                          <tr 
                            key={t.id} 
                            onClick={() => setTicketModalAdmin(t)}
                            className="border-b border-gray-50 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <td className="p-4 font-mono font-bold text-gray-500">#{t.id}</td>
                            <td className="p-4 text-gray-600">{new Date(t.fecha_creacion).toLocaleDateString()}</td>
                            <td className="p-4 font-medium text-gray-800">{t.nombre_contacto || "Interno"}</td>
                            <td className="p-4">
                              <p className="font-bold text-gray-800 truncate max-w-[200px]">{t.titulo}</p>
                              <p className="text-xs text-gray-400">📍 {t.ubicacion}</p>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${t.estatus === 'en_proceso' ? 'bg-blue-100 text-blue-700' : t.estatus === 'resuelto' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {t.estatus.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${(t.prioridad || 'media') === 'alta' ? 'bg-red-100 text-red-700' : (t.prioridad || 'media') === 'baja' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {t.prioridad || 'MEDIA'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {ticketsAMostrar.length === 0 && (
                      <div className="p-12 text-center text-gray-500 font-medium">No se encontraron tickets con estos filtros.</div>
                    )}
                  </div>
                </div>

                {historialTotalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8 pb-8">
                      <button onClick={() => setHistorialPage(p => Math.max(1, p - 1))} disabled={historialPage === 1} className={`px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${historialPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-105'}`}>&larr; Anterior</button>
                      <span className="text-gray-600 font-bold bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">Página {historialPage} de {historialTotalPages}</span>
                      <button onClick={() => setHistorialPage(p => Math.min(historialTotalPages, p + 1))} disabled={historialPage === historialTotalPages} className={`px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${historialPage === historialTotalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-105'}`}>Siguiente &rarr;</button>
                  </div>
                )}
              </div>
            </main>
          ) : <Navigate to="/admin" />
        } />

        <Route path="/admin/crear" element={
          usuario ? (
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              <AdminMenu activo="crear" /><div className="max-w-2xl mx-auto">
                <CreateTicketForm onSubmit={handleCreateTicket} onCancel={() => navigate('/admin/dashboard')} formData={formData} setFormData={setFormData} onSearch={buscarSimilares} sugerencias={sugerencias} onVoteSugerencia={handleVotar} misVotos={misVotos} usuario={usuario} />
              </div>
            </main>
          ) : <Navigate to="/admin" />
        } />

        <Route path="/admin/usuarios" element={
          usuario ? (
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              <AdminMenu activo="usuarios" /><UsersList users={listaUsuarios} onUserUpdated={cargarUsuarios} />
            </main>
          ) : <Navigate to="/admin" />
        } />
      </Routes>

      {ticketModalAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4" onClick={() => { setTicketModalAdmin(null); setTicketEditando(null); }}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => { setTicketModalAdmin(null); setTicketEditando(null); }} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition p-2 rounded-full hover:bg-gray-100 z-10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="pt-2">
                    <TicketCard 
                        ticket={tickets.find(t => t.id === ticketModalAdmin.id) || historialTickets.find(t => t.id === ticketModalAdmin.id) || ticketModalAdmin} 
                        usuario={usuario} misVotos={misVotos} 
                        isEditing={ticketEditando === ticketModalAdmin.id} 
                        editData={editData} setEditData={setEditData} 
                        listaUsuarios={listaUsuarios} 
                        handlers={{ 
                            onVote: handleVotar, 
                            onEditStart: iniciarEdicion, 
                            onEditCancel: () => setTicketEditando(null), 
                            onEditSave: guardarEdicion, 
                            onPriorityChange: cambiarPrioridad, 
                            onDelete: async (id) => { await handleDeleteTicket(id); setTicketModalAdmin(null); } 
                        }} 
                    />
                </div>
            </div>
        </div>
      )}

      {mostrarConfig && (
        <ConfigModal usuario={usuario} onClose={() => setMostrarConfig(false)} />
      )}
    </div>
  );
}

export default App;