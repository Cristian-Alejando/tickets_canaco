import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { API_URL } from './config';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

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
  const [filtroEstatus, setFiltroEstatus] = useState('resuelto'); // Por defecto en historial muestra resueltos

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
          Swal.fire({
            title: '¡Registrado!',
            text: 'El ticket se guardó correctamente.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
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
        Swal.fire('Error', 'No se pudo enviar el reporte. Intenta de nuevo.', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error de conexión', 'Revisa tu internet.', 'error');
    }
  };

  const handleLoginSuccess = (u) => {
    setUsuario(u);
    localStorage.setItem('sesion_admin_canaco', JSON.stringify(u));
    navigate('/admin/dashboard');
  };

  const handleLogout = () => {
    setUsuario(null);
    localStorage.removeItem('sesion_admin_canaco');
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
          Swal.fire('¡Voto registrado!', 'Gracias por confirmar.', 'success');
          setSugerencias([]);
          setFormData({ ...formData, titulo: '' });
          if (usuario) {
            navigate('/admin/dashboard');
          }
        } else {
          Swal.fire({
            title: '¡Soporte notificado!',
            text: 'Sumamos tu confirmación a este reporte.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      } else {
        Swal.fire('Aviso', 'No se pudo registrar el voto.', 'warning');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Problema de conexión.', 'error');
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
      asignado_a: editData.asignado_a
    };

    try {
      const res = await updateTicket(id, datosCompletos);
      if (res.ok) {
        setTicketEditando(null);
        cargarTickets();
      } else {
        alert("Error al actualizar el ticket");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const cambiarPrioridad = async (t, p) => {
    const datos = { ...t, prioridad: p };
    try {
      const res = await updateTicket(t.id, datos);
      if (res.ok) {
        cargarTickets();
      }
    } catch (e) {
      console.error(e);
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
      } else {
        alert("Error al eliminar");
      }
    } catch (error) {
      console.error("Error eliminando:", error);
      alert("Error de conexión al eliminar.");
    }
  };

  // ==========================================
  // LÓGICA DE FILTRADO MAESTRO (PARA PANTALLA Y EXCEL)
  // ==========================================
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

  // Variable que contiene los tickets ya pasados por todos los filtros
  const ticketsAMostrar = obtenerTicketsFiltrados();

  // ==========================================
  // EXPORTAR A EXCEL (USA LOS MISMOS FILTROS DE PANTALLA)
  // ==========================================
  const exportarAExcel = () => {
    if (ticketsAMostrar.length === 0) {
      Swal.fire('Sin resultados', 'No hay tickets en pantalla para exportar.', 'info');
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
  };

  const stats = {
    abiertos: tickets.filter((t) => t.estatus === 'abierto').length,
    proceso: tickets.filter((t) => t.estatus === 'en_proceso').length,
    resueltos: tickets.filter((t) => t.estatus === 'resuelto').length
  };

  const departamentosUnicos = ['Todos', ...new Set(tickets.map(t => t.departamento).filter(Boolean))];

  // ==========================================
  // LÓGICA PARA LAS GRÁFICAS (MINI POWER BI)
  // ==========================================
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

        <Route path="/admin/dashboard" element={
          usuario ? (
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              <AdminMenu activo="dashboard" />
              <div className="animate-fade-in-up">
                
                <StatsCards stats={stats} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 mb-8">
                  
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 text-center">Reportes por Departamento</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
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

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 text-center">Incidencias por Categoría</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
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

                <h2 className="text-2xl font-bold text-blue-900 mb-6 border-b pb-2">Reportes Activos</h2>
                <div className="grid gap-6">
                  {tickets.filter((t) => t.estatus !== 'resuelto').map((t) => (
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
                        onPriorityChange: cambiarPrioridad, 
                        onDelete: handleDeleteTicket 
                      }} 
                    />
                  ))}
                </div>

              </div>
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
                  
                  {/* --- AHORA SON 4 COLUMNAS PARA EL NUEVO FILTRO DE ESTATUS --- */}
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
                  {/* --- AQUÍ REEMPLAZAMOS EL FILTER DIRECTO POR LA NUEVA VARIABLE ticketsAMostrar --- */}
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