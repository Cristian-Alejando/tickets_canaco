import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { API_URL } from './config'
import Swal from 'sweetalert2'; // <--- MAGIA VISUAL AGREGADA

// Componentes
import LoginPage from './pages/LoginPage'
import Navbar from './components/Navbar'
import TicketCard from './components/TicketCard'
import StatsCards from './components/StatsCards'
import CreateTicketForm from './components/CreateTicketForm'
import ConfigModal from './components/ConfigModal'
import UsersList from './components/UsersList'
import RegisterPage from './pages/RegisterPage' 
import PublicBoardPage from './pages/PublicBoardPage' // <--- NUEVO COMPONENTE

// Servicios
import { 
  getTickets, createTicket, updateTicket, voteTicket, getMyVotes, getUsers, deleteTicket 
} from './services/ticketService'

function App() {
  const [usuario, setUsuario] = useState(null);
  const [tickets, setTickets] = useState([]);
  
  const navigate = useNavigate();

  // Estados de la app
  const [mostrandoLogin, setMostrandoLogin] = useState(false);
  const [formData, setFormData] = useState({ 
      titulo: '', ubicacion: '', descripcion: '', departamento: '', categoria: 'Mantenimiento', prioridad: 'media',
      nombre_contacto: '', email_contacto: '' 
  });

  const [misVotos, setMisVotos] = useState([]); 
  const [sugerencias, setSugerencias] = useState([]);
  const [ticketEditando, setTicketEditando] = useState(null); 
  
  const [editData, setEditData] = useState({ estatus: '', comentarios: '', prioridad: 'media', asignado_a: '' });
  
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [listaUsuarios, setListaUsuarios] = useState([]);

  // ==========================================
  // CARGAR DATOS INICIALES (CORREGIDO PARA PÚBLICO)
  // ==========================================
  useEffect(() => {
    cargarTickets(); 

    if (usuario) { 
        cargarMisVotos();
        cargarUsuarios();
    } else {
        // Si es usuario público, cargamos los votos guardados en el navegador
        const votosLocales = JSON.parse(localStorage.getItem('votos_publicos')) || [];
        setMisVotos(votosLocales);
    }
  }, [usuario]);

  // --- FUNCIONES ---
  const cargarTickets = async () => {
    try {
      const data = await getTickets();
      const ticketsOrdenados = data.sort((a, b) => {
        if (a.estatus === 'resuelto' && b.estatus !== 'resuelto') return 1;
        if (a.estatus !== 'resuelto' && b.estatus === 'resuelto') return -1;
        return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
      });
      setTickets(ticketsOrdenados);
    } catch (error) { console.error(error); }
  };
  const cargarMisVotos = async () => { try { const data = await getMyVotes(usuario.id); setMisVotos(data); } catch (e) {} };
  const cargarUsuarios = async () => { try { const data = await getUsers(); setListaUsuarios(data); } catch (e) {} };

  // ==========================================
  // CREAR TICKET (SOPORTA MODO ASISTENCIA)
  // ==========================================
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
                text: 'El ticket se guardó correctamente en el sistema.',
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

        setFormData({ titulo: '', ubicacion: '', descripcion: '', departamento: '', categoria: 'Mantenimiento', prioridad: 'media', nombre_contacto: '', email_contacto: '' });
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
        Swal.fire('Error de conexión', 'Revisa tu internet y vuelve a intentarlo.', 'error');
    }
  };

  const handleLoginSuccess = (u) => {
      setUsuario(u);
      navigate('/admin/dashboard');
  };

  const handleLogout = () => {
      setUsuario(null);
      navigate('/');
  };

  // ==========================================
  // FUNCIÓN VOTAR (ACTUALIZADA PARA PÚBLICOS)
  // ==========================================
  const handleVotar = async (id, desdeSugerencia = false) => { 
      // 1. Verificamos si ya votó (ya sea en su cuenta o en local)
      if (misVotos.includes(id)) return; 

      try { 
          // 2. Si hay admin usamos su ID, si es público mandamos null
          const userId = usuario ? usuario.id : null;
          const res = await voteTicket(id, userId); 
          
          if (res.ok) { 
              cargarTickets(); 
              
              // 3. Actualizamos la lista de tickets que ya votó
              const nuevosVotos = [...misVotos, id];
              setMisVotos(nuevosVotos); 
              
              // 4. Si es público, guardamos el voto en su navegador
              if (!usuario) {
                  localStorage.setItem('votos_publicos', JSON.stringify(nuevosVotos));
              }

              // 5. Alertas visuales
              if (desdeSugerencia) { 
                  Swal.fire('¡Voto registrado!', 'Gracias por confirmar este reporte.', 'success'); 
                  setSugerencias([]); 
                  setFormData({...formData, titulo:''}); 
                  if(usuario) navigate('/admin/dashboard'); 
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
              Swal.fire('Aviso', 'No se pudo registrar el voto. Revisa tu conexión.', 'warning');
          }
      } catch (error) { 
          console.error(error); 
          Swal.fire('Error', 'Hubo un problema de conexión al registrar el voto.', 'error');
      } 
  };
  
  const guardarEdicion = async (id) => { 
    const ticketOriginal = tickets.find(t => t.id === id); 
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
            alert("Error"); 
        } 
    } catch (error) { console.error(error); } 
  };
  
  const cambiarPrioridad = async (t, p) => { const datos = { ...t, prioridad: p }; try { const res = await updateTicket(t.id, datos); if (res.ok) cargarTickets(); } catch (e) { console.error(e); } };
  
  const iniciarEdicion = (t) => { 
      setTicketEditando(t.id); 
      setEditData({ 
          estatus: t.estatus || 'abierto', 
          comentarios: t.comentarios || '', 
          prioridad: t.prioridad || 'media', 
          asignado_a: t.asignado_a || '' 
      }); 
  };
  
  const buscarSimilares = async (txt) => { setFormData(prev => ({ ...prev, titulo: txt })); if (txt.length < 3) { setSugerencias([]); return; } try { const res = await fetch(`${API_URL}/tickets/buscar?q=${txt}`); const data = await res.json(); setSugerencias(data); } catch (e) { console.error(e); } };

  const handleDeleteTicket = async (id) => {
    try {
        const res = await deleteTicket(id);
        if (res.ok) {
            setTickets(prevTickets => prevTickets.filter(t => t.id !== id));
            if (ticketEditando === id) setTicketEditando(null);
        } else {
            alert("Error al eliminar: " + (res.error || "Desconocido"));
        }
    } catch (error) {
        console.error("Error eliminando:", error);
        alert("Error de conexión al eliminar.");
    }
  };

  const stats = {
    abiertos: tickets.filter(t => t.estatus === 'abierto').length,
    proceso: tickets.filter(t => t.estatus === 'en_proceso').length,
    resueltos: tickets.filter(t => t.estatus === 'resuelto').length
  };

  const AdminMenu = ({ activo }) => (
    <div className="flex justify-center mb-8 gap-4 overflow-x-auto pb-2">
        <button onClick={() => navigate('/admin/dashboard')} className={`px-6 py-2 rounded-full font-bold shadow-sm transition ${activo === 'dashboard' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>📊 Panel</button>
        <button onClick={() => navigate('/admin/crear')} className={`px-6 py-2 rounded-full font-bold shadow-sm transition ${activo === 'crear' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>➕ Nuevo</button>
        <button onClick={() => navigate('/admin/historial')} className={`px-6 py-2 rounded-full font-bold shadow-sm transition ${activo === 'historial' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>📜 Historial</button>
        {(usuario?.rol === 'admin' || usuario?.rol === 'tecnico') && (
            <button onClick={() => navigate('/admin/usuarios')} className={`px-6 py-2 rounded-full font-bold shadow-sm transition ${activo === 'usuarios' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>👥 Usuarios</button>
        )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
        {usuario && <Navbar usuario={usuario} onLogout={handleLogout} onConfigClick={() => setMostrarConfig(true)} />}

        <Routes>
            {/* 1. BUZÓN PÚBLICO */}
            <Route path="/" element={
                <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 w-full">
                    <div className="max-w-2xl w-full animate-fade-in-up">
                        <div className="text-center mb-8">
                            <img src="/logo_canaco_oficial.png" alt="Logo" className="h-24 mx-auto mb-4 object-contain" />
                            <h1 className="text-3xl font-bold text-blue-900">Buzón de Mantenimiento</h1>
                            <p className="text-gray-500 mt-2">Reporta incidencias para mejoras de CANACO</p>
                            
                            {/* --- BOTÓN NUEVO PARA IR AL TABLERO --- */}
                            <button onClick={() => navigate('/tablero')} className="mt-6 px-8 py-3 bg-white text-blue-700 font-bold rounded-full shadow border border-blue-100 hover:bg-blue-50 transition flex items-center gap-2 mx-auto">
                                👀 Ver Tablero Público de Reportes
                            </button>
                        </div>
                        <CreateTicketForm 
                            onSubmit={handleCreateTicket} 
                            onCancel={() => setFormData({titulo:'', ubicacion:'', descripcion:'', departamento:'', categoria:'Mantenimiento', prioridad:'media', nombre_contacto:'', email_contacto:''})} 
                            formData={formData} setFormData={setFormData} onSearch={buscarSimilares} sugerencias={sugerencias} onVoteSugerencia={handleVotar} misVotos={misVotos} 
                            usuario={null} 
                        />
                        <div className="mt-8 text-xs text-gray-400 text-center">© 2026 Cámara Nacional de Comercio Monterrey</div>
                    </div>
                </div>
            } />

            {/* --- 1.5 NUEVA RUTA DEL TABLERO PÚBLICO --- */}
            <Route path="/tablero" element={
                <PublicBoardPage tickets={tickets} misVotos={misVotos} handleVotar={handleVotar} />
            } />

            {/* 2. LOGIN */}
            <Route path="/admin" element={
                usuario ? <Navigate to="/admin/dashboard" /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
            } />

            {/* 3. REGISTRO */}
            <Route path="/register" element={<RegisterPage />} />

            {/* 4. DASHBOARD */}
            <Route path="/admin/dashboard" element={
                usuario ? (
                    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                        <AdminMenu activo="dashboard" />
                        <div className="animate-fade-in-up">
                            <StatsCards stats={stats} />
                            <h2 className="text-2xl font-bold text-blue-900 mb-6 border-b pb-2 mt-6">Reportes Activos</h2>
                            <div className="grid gap-6">
                                {tickets.filter(t => t.estatus !== 'resuelto').map(t => (
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
                                            onEditCancel: ()=>setTicketEditando(null), 
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

            {/* 5. HISTORIAL */}
            <Route path="/admin/historial" element={
                usuario ? (
                    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                        <AdminMenu activo="historial" />
                        <div className="max-w-4xl mx-auto animate-fade-in-up">
                            <div className="text-center mb-8"><h2 className="text-2xl font-bold text-blue-900">📜 Archivo de Casos Resueltos</h2></div>
                            <div className="space-y-6">
                                {tickets.filter(t => t.estatus === 'resuelto').map(t => (
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
                                            onEditCancel: ()=>setTicketEditando(null), 
                                            onEditSave: guardarEdicion,
                                            onDelete: handleDeleteTicket
                                        }} 
                                    />
                                ))}
                            </div>
                        </div>
                    </main>
                ) : <Navigate to="/admin" />
            } />

            {/* 6. CREAR INTERNO */}
            <Route path="/admin/crear" element={
                usuario ? (
                    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                        <AdminMenu activo="crear" />
                        <div className="max-w-2xl mx-auto">
                            <CreateTicketForm onSubmit={handleCreateTicket} onCancel={() => navigate('/admin/dashboard')} formData={formData} setFormData={setFormData} onSearch={buscarSimilares} sugerencias={sugerencias} onVoteSugerencia={handleVotar} misVotos={misVotos} usuario={usuario} />
                        </div>
                    </main>
                ) : <Navigate to="/admin" />
            } />

            {/* 7. USUARIOS */}
            <Route path="/admin/usuarios" element={
                usuario ? (
                    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                        <AdminMenu activo="usuarios" />
                        <UsersList users={listaUsuarios} onUserUpdated={cargarUsuarios} />
                    </main>
                ) : <Navigate to="/admin" />
            } />

        </Routes>

        {mostrarConfig && <ConfigModal usuario={usuario} onClose={() => setMostrarConfig(false)} />}
    </div>
  );
}

export default App;