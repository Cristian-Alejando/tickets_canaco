import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { API_URL } from './config';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { Toaster, toast } from 'react-hot-toast'; 

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
  deleteTicket
} from './services/ticketService';

function App() {
  // === 1. MEMORIA INTELIGENTE AL INICIAR ===
  const [usuario, setUsuario] = useState(() => {
    const usuarioGuardado = localStorage.getItem('sesion_admin_canaco');
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  const [tickets, setTickets] = useState([]);
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
  
  // 👇 ESTADOS PARA EL DASHBOARD DE ADMIN 👇
  const [ticketModalAdmin, setTicketModalAdmin] = useState(null);
  const [filtroPrioridadActivos, setFiltroPrioridadActivos] = useState('Todas'); // <-- NUEVO

  const [editData, setEditData] = useState({
    estatus: '',
    comentarios: '',
    prioridad: 'media',
    asignado_a: ''
  });

  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [listaUsuarios, setListaUsuarios] = useState([]);

  // === ESTADOS PARA FILTROS EN PANTALLA Y EXCEL ===
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [filtroDepartamento, setFiltroDepartamento] = useState('Todos');
  const [filtroEstatus, setFiltroEstatus] = useState('resuelto'); 

  useEffect(() => {
    cargarTickets();
    if (usuario) {
      cargarMisVotos();
      cargarUsuarios();
    } else {
      const votosLocales = JSON.parse(localStorage.getItem('votos_publicos')) || [];
      setMisVotos(votosLocales);
    }
  }, [usuario]);

  const cargarTickets = async () => {
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
        cargarTickets();

        if (usuario) {
          navigate('/admin/dashboard');
        }
      } else {
        toast.error('No se pudo enviar el reporte. Revisa el archivo adjunto.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error de conexión. Revisa tu internet.');
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
    toast('Sesión cerrada correctamente', { icon: '👋' }); 
    navigate('/');
  };

  const handleVotar = async (id, desdeSugerencia = false) => {
    if (misVotos.includes(id)) return;
    
    try {
      const userId = usuario ? usuario.id : null;
      const res = await voteTicket(id, userId);

      if (res.ok) {
        cargarTickets();
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
    const ticketOriginal = tickets.find((t) => t.id === id);
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
        cargarTickets();
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
        cargarTickets();
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

  const buscarSimilares = async (txt) => {
    setFormData((prev) => ({ ...prev, titulo: txt }));
    
    if (txt.length < 3) {
      setSugerencias([]);
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/tickets/buscar?q=${txt}`);
      const data = await res.json();
      setSugerencias(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTicket = async (id) => {
    try {
      const res = await deleteTicket(id);
      if (res.ok) {
        setTickets((prevTickets) => prevTickets.filter((t) => t.id !== id));
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

  const obtenerTicketsFiltrados = () => {
    let filtrados = tickets;

    if (filtroEstatus !== 'Todos') {
      filtrados = filtrados.filter(t => t.estatus === filtroEstatus);
    }
    if (filtroDepartamento !== 'Todos') {
      filtrados = filtrados.filter(t => t.departamento === filtroDepartamento);
    }
    if (filtroFechaInicio) {
      const inicio = new Date(filtroFechaInicio + 'T00:00:00');
      filtrados = filtrados.filter(t => new Date(t.fecha_creacion) >= inicio);
    }
    if (filtroFechaFin) {
      const fin = new Date(filtroFechaFin + 'T23:59:59');
      filtrados = filtrados.filter(t => new Date(t.fecha_creacion) <= fin);
    }

    return filtrados;
  };

  const ticketsAMostrar = obtenerTicketsFiltrados();

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
      { wch: 8 },  // Folio
      { wch: 40 }, // Título
      { wch: 15 }, // Estatus
      { wch: 15 }, // Prioridad
      { wch: 20 }, // Departamento
      { wch: 20 }, // Categoría
      { wch: 15 }, // Votos
      { wch: 25 }, // Solicitante
      { wch: 15 }, // Fecha
      { wch: 40 }  // Comentarios
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
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
                    titulo: '', 
                    ubicacion: '', 
                    descripcion: '', 
                    departamento: '', 
                    categoria: 'Mantenimiento', 
                    prioridad: 'media', 
                    nombre_contacto: '', 
                    email_contacto: ''
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

        {/* ========================================================================= */}
        {/* --- DASHBOARD DEL ADMINISTRADOR CON NUEVA TABLA TIPO EXCEL Y MODAL --- */}
        {/* ========================================================================= */}
        <Route path="/admin/dashboard" element={
          usuario ? (
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              <AdminMenu activo="dashboard" />
              <div className="animate-fade-in-up">
                
                <StatsCards stats={stats} />

                {/* --- NUEVA TABLA TIPO EXCEL (REPORTE ACTIVO) --- */}
                {(() => {
                    // 👇 Calculamos los tickets activos combinados con el nuevo filtro 👇
                    const ticketsActivosFiltrados = tickets.filter(t => 
                        t.estatus !== 'resuelto' && 
                        (filtroPrioridadActivos === 'Todas' || (t.prioridad || 'media') === filtroPrioridadActivos)
                    );

                    return (
                        <div className="mt-8 mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* --- ENCABEZADO CON LOS BOTONES DE PRIORIDAD --- */}
                            <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                                <h3 className="text-lg font-bold text-blue-900 whitespace-nowrap">Reportes Activos (Vista Rápida)</h3>
                                
                                {/* Botones en el centro */}
                                <div className="flex flex-wrap justify-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm gap-1">
                                    <button 
                                        onClick={() => setFiltroPrioridadActivos('Todas')} 
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${filtroPrioridadActivos === 'Todas' ? 'bg-gray-100 text-gray-800 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        Todas
                                    </button>
                                    <button 
                                        onClick={() => setFiltroPrioridadActivos('alta')} 
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1 ${filtroPrioridadActivos === 'alta' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        🔴 Alta
                                    </button>
                                    <button 
                                        onClick={() => setFiltroPrioridadActivos('media')} 
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1 ${filtroPrioridadActivos === 'media' ? 'bg-yellow-50 text-yellow-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        🟡 Media
                                    </button>
                                    <button 
                                        onClick={() => setFiltroPrioridadActivos('baja')} 
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1 ${filtroPrioridadActivos === 'baja' ? 'bg-green-50 text-green-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        🟢 Baja
                                    </button>
                                </div>

                                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                                    {ticketsActivosFiltrados.length} Pendientes
                                </span>
                            </div>

                            {/* --- CUERPO DE LA TABLA --- */}
                            <div className="overflow-x-auto max-h-[400px]">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                                        <tr className="border-b border-gray-200 text-gray-600 text-sm">
                                            <th className="p-4 font-bold">Folio</th>
                                            <th className="p-4 font-bold">Fecha</th>
                                            <th className="p-4 font-bold">Solicitante</th>
                                            <th className="p-4 font-bold">Título / Ubicación</th>
                                            <th className="p-4 font-bold">Estatus</th>
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
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                        t.estatus === 'en_proceso' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                        {t.estatus.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                        (t.prioridad || 'media') === 'alta' ? 'bg-red-100 text-red-700' :
                                                        (t.prioridad || 'media') === 'baja' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {t.prioridad || 'MEDIA'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {ticketsActivosFiltrados.length === 0 && (
                                    <div className="p-8 text-center text-gray-500 font-medium">No hay reportes con esta prioridad. 🎉</div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* --- GRÁFICAS ORIGINALES (Con corrección de consola) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 text-center">Reportes por Departamento</h3>
                    <div className="h-64 w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                        <PieChart>
                          <Pie 
                            data={getDatosDepartamentos()} 
                            dataKey="cantidad" 
                            nameKey="name" 
                            cx="50%" 
                            cy="50%" 
                            outerRadius={80} 
                            label
                          >
                            {getDatosDepartamentos().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 text-center">Incidencias por Categoría</h3>
                    <div className="h-64 w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                        <BarChart data={getDatosCategorias()} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <XAxis dataKey="name" tick={{fontSize: 12}} />
                          <YAxis allowDecimals={false} />
                          <Tooltip cursor={{fill: '#f3f4f6'}} />
                          <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

              </div>

              {/* --- MODAL FLOTANTE DEL ADMINISTRADOR --- */}
              {ticketModalAdmin && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center p-4"
                    onClick={() => { setTicketModalAdmin(null); setTicketEditando(null); }}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative p-6 animate-scale-in"
                        onClick={(e) => e.stopPropagation()} 
                    >
                        {/* Botón de cierre */}
                        <button 
                            onClick={() => { setTicketModalAdmin(null); setTicketEditando(null); }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-1.5 rounded-full hover:bg-gray-100 z-10"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="pt-2">
                            {/* Pasamos el ticket buscando actualizaciones en tiempo real */}
                            <TicketCard 
                                ticket={tickets.find(t => t.id === ticketModalAdmin.id) || ticketModalAdmin} 
                                usuario={usuario} 
                                misVotos={misVotos} 
                                isEditing={ticketEditando === ticketModalAdmin.id} 
                                editData={editData} 
                                setEditData={setEditData} 
                                listaUsuarios={listaUsuarios} 
                                handlers={{ 
                                    onVote: handleVotar, 
                                    onEditStart: iniciarEdicion, 
                                    onEditCancel: () => setTicketEditando(null), 
                                    onEditSave: guardarEdicion, 
                                    onPriorityChange: cambiarPrioridad, 
                                    onDelete: async (id) => { 
                                        await handleDeleteTicket(id); 
                                        setTicketModalAdmin(null); 
                                    } 
                                }} 
                            />
                        </div>
                    </div>
                </div>
              )}
            </main>
          ) : <Navigate to="/admin" />
        } />

        <Route path="/admin/historial" element={
          usuario ? (
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              <AdminMenu activo="historial" />
              <div className="max-w-4xl mx-auto animate-fade-in-up">
                
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100">
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Centro de Reportes y Búsqueda
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estatus</label>
                      <select 
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                        value={filtroEstatus} 
                        onChange={(e) => setFiltroEstatus(e.target.value)}
                      >
                        <option value="Todos">Todos</option>
                        <option value="abierto">Abiertos</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="resuelto">Resueltos</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                      <select 
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                        value={filtroDepartamento} 
                        onChange={(e) => setFiltroDepartamento(e.target.value)}
                      >
                        {departamentosUnicos.map((dep) => (
                          <option key={dep} value={dep}>{dep}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Desde (Fecha)</label>
                      <input 
                        type="date" 
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                        value={filtroFechaInicio} 
                        onChange={(e) => setFiltroFechaInicio(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hasta (Fecha)</label>
                      <input 
                        type="date" 
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                        value={filtroFechaFin} 
                        onChange={(e) => setFiltroFechaFin(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t pt-4 mt-2">
                    <p className="text-sm text-gray-500 font-medium">
                      Mostrando {ticketsAMostrar.length} resultados en pantalla
                    </p>
                    <button 
                      onClick={exportarAExcel}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow transition flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Descargar a Excel
                    </button>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-500">
                    Resultados de la Búsqueda
                  </h2>
                </div>

                <div className="space-y-6">
                  {ticketsAMostrar.map((t) => (
                    <TicketCard 
                      key={t.id} 
                      ticket={t} 
                      usuario={usuario} 
                      misVotos={misVotos} 
                      isEditing={ticketEditando === t.id} 
                      editData={editData} 
                      setEditData={setEditData} 
                      listaUsuarios={listaUsuarios} 
                      handlers={{ 
                        onVote: handleVotar, 
                        onEditStart: iniciarEdicion, 
                        onEditCancel: () => setTicketEditando(null), 
                        onEditSave: guardarEdicion, 
                        onDelete: handleDeleteTicket 
                      }} 
                    />
                  ))}
                  
                  {ticketsAMostrar.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                      <p className="text-gray-500 text-lg">No se encontraron tickets con estos filtros.</p>
                    </div>
                  )}
                </div>
              </div>
            </main>
          ) : <Navigate to="/admin" />
        } />

        <Route path="/admin/crear" element={
          usuario ? (
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              <AdminMenu activo="crear" />
              <div className="max-w-2xl mx-auto">
                <CreateTicketForm 
                  onSubmit={handleCreateTicket} 
                  onCancel={() => navigate('/admin/dashboard')} 
                  formData={formData} 
                  setFormData={setFormData} 
                  onSearch={buscarSimilares} 
                  sugerencias={sugerencias} 
                  onVoteSugerencia={handleVotar} 
                  misVotos={misVotos} 
                  usuario={usuario} 
                />
              </div>
            </main>
          ) : <Navigate to="/admin" />
        } />

        <Route path="/admin/usuarios" element={
          usuario ? (
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              <AdminMenu activo="usuarios" />
              <UsersList 
                users={listaUsuarios} 
                onUserUpdated={cargarUsuarios} 
              />
            </main>
          ) : <Navigate to="/admin" />
        } />
      </Routes>

      {mostrarConfig && (
        <ConfigModal 
          usuario={usuario} 
          onClose={() => setMostrarConfig(false)} 
        />
      )}
    </div>
  );
}

export default App;