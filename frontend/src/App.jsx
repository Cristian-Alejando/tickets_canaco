import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom' // <--- IMPORTANTE: Herramientas de ruta
import { API_URL } from './config'

// Componentes
import LoginPage from './pages/LoginPage'
import Navbar from './components/Navbar'
import TicketCard from './components/TicketCard'
import StatsCards from './components/StatsCards'
import CreateTicketForm from './components/CreateTicketForm'
import ConfigModal from './components/ConfigModal'
import UsersList from './components/UsersList'

// Servicios
import { 
  getTickets, createTicket, updateTicket, voteTicket, getMyVotes, getUsers 
} from './services/ticketService'

function App() {
  const [usuario, setUsuario] = useState(null);
  // const [vista, setVista] = useState('dashboard'); // <--- BORRADO: Ya no usamos esto
  const [tickets, setTickets] = useState([]);
  
  const navigate = useNavigate(); // <--- EL GPS ACTIVADO

  // Estados de la app
  const [mostrandoLogin, setMostrandoLogin] = useState(false); // Para el botón del candado
  const [formData, setFormData] = useState({ 
      titulo: '', ubicacion: '', descripcion: '', categoria: 'Mantenimiento', prioridad: 'media',
      nombre_contacto: '', email_contacto: '' 
  });

  const [misVotos, setMisVotos] = useState([]); 
  const [sugerencias, setSugerencias] = useState([]);
  const [ticketEditando, setTicketEditando] = useState(null); 
  const [editData, setEditData] = useState({ estatus: '', comentarios: '', prioridad: 'media' });
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [listaUsuarios, setListaUsuarios] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    if (usuario) { 
        cargarTickets(); 
        cargarMisVotos();
        cargarUsuarios(); // Cargar usuarios si es admin
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

  // Crear Ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const ticketAEnviar = {
          ...formData,
          usuario_id: usuario ? usuario.id : null,
          nombre_contacto: usuario ? usuario.nombre : formData.nombre_contacto,
          email_contacto: usuario ? usuario.email : formData.email_contacto
      };

      const res = await createTicket(ticketAEnviar);
      
      if (res.ok) {
        alert(usuario ? "¡Ticket registrado correctamente!" : "¡Reporte enviado! Gracias.");
        setFormData({ titulo: '', ubicacion: '', descripcion: '', categoria: 'Mantenimiento', prioridad: 'media', nombre_contacto: '', email_contacto: '' });
        setSugerencias([]);
        
        if (usuario) {
            cargarTickets(); 
            navigate('/admin/dashboard'); // <--- REDIRECCIÓN AUTOMÁTICA
        }
      }
    } catch (error) { console.error(error); alert("Error al crear reporte"); }
  };

  // Login y Logout con redirección
  const handleLoginSuccess = (u) => {
      setUsuario(u);
      navigate('/admin/dashboard'); // <--- AL ENTRAR, VA AL PANEL
  };

  const handleLogout = () => {
      setUsuario(null);
      navigate('/'); // <--- AL SALIR, VA AL BUZÓN PÚBLICO
  };

  // ... Funciones auxiliares (Votar, Editar, etc.) se quedan igual
  const handleVotar = async (id, desdeSugerencia = false) => { if (!usuario) return; if (misVotos.includes(id)) return; try { const res = await voteTicket(id, usuario.id); if (res.ok) { cargarTickets(); setMisVotos([...misVotos, id]); if (desdeSugerencia) { alert("¡Voto registrado!"); setSugerencias([]); setFormData({...formData, titulo:''}); if(usuario) navigate('/admin/dashboard'); } } } catch (error) { console.error(error); } };
  const guardarEdicion = async (id) => { const ticketOriginal = tickets.find(t => t.id === id); if (!ticketOriginal) return; const datosCompletos = { ...ticketOriginal, estatus: editData.estatus, comentarios: editData.comentarios, prioridad: editData.prioridad || ticketOriginal.prioridad || 'media' }; try { const res = await updateTicket(id, datosCompletos); if (res.ok) { setTicketEditando(null); cargarTickets(); } else { alert("Error"); } } catch (error) { console.error(error); } };
  const cambiarPrioridad = async (t, p) => { const datos = { ...t, prioridad: p }; try { const res = await updateTicket(t.id, datos); if (res.ok) cargarTickets(); } catch (e) { console.error(e); } };
  const iniciarEdicion = (t) => { setTicketEditando(t.id); setEditData({ estatus: t.estatus || 'abierto', comentarios: t.comentarios || '', prioridad: t.prioridad || 'media' }); };
  const buscarSimilares = async (txt) => { setFormData(prev => ({ ...prev, titulo: txt })); if (txt.length < 3) { setSugerencias([]); return; } try { const res = await fetch(`${API_URL}/tickets/buscar?q=${txt}`); const data = await res.json(); setSugerencias(data); } catch (e) { console.error(e); } };

  const stats = {
    abiertos: tickets.filter(t => t.estatus === 'abierto').length,
    proceso: tickets.filter(t => t.estatus === 'en_proceso').length,
    resueltos: tickets.filter(t => t.estatus === 'resuelto').length
  };

  // --- COMPONENTE DE BOTONES ADMIN (Para no repetir código) ---
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
        {/* Navbar solo si hay usuario logueado */}
        {usuario && <Navbar usuario={usuario} onLogout={handleLogout} onConfigClick={() => setMostrarConfig(true)} />}

        {/* --- AQUÍ ESTÁN LAS RUTAS DEFINIDAS --- */}
        <Routes>
            
            {/* 1. BUZÓN PÚBLICO (RUTA RAÍZ /) */}
            <Route path="/" element={
                <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 w-full">
                    <div className="max-w-2xl w-full animate-fade-in-up">
                        <div className="text-center mb-8">
                            <img src="/logo_canaco_oficial.png" alt="Logo" className="h-24 mx-auto mb-4 object-contain" />
                            <h1 className="text-3xl font-bold text-blue-900">Buzón de Mantenimiento</h1>
                            <p className="text-gray-500 mt-2">Reporta incidencias técnicas de forma rápida.</p>
                        </div>
                        <CreateTicketForm 
                            onSubmit={handleCreateTicket} 
                            onCancel={() => setFormData({titulo:'', ubicacion:'', descripcion:'', categoria:'Mantenimiento', prioridad:'media', nombre_contacto:'', email_contacto:''})} 
                            formData={formData} setFormData={setFormData} onSearch={buscarSimilares} sugerencias={sugerencias} onVoteSugerencia={handleVotar} misVotos={[]} 
                            usuario={null} 
                        />
                        
                        <div className="mt-8 text-xs text-gray-400 text-center">© 2026 Cámara Nacional de Comercio Monterrey</div>
                    </div>
                </div>
            } />

            {/* 2. LOGIN (/admin) */}
            <Route path="/admin" element={
                usuario ? <Navigate to="/admin/dashboard" /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
            } />

            {/* 3. DASHBOARD (/admin/dashboard) */}
            <Route path="/admin/dashboard" element={
                usuario ? (
                    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                        <AdminMenu activo="dashboard" />
                        <div className="animate-fade-in-up">
                            <StatsCards stats={stats} />
                            <h2 className="text-2xl font-bold text-blue-900 mb-6 border-b pb-2 mt-6">Reportes Activos</h2>
                            <div className="grid gap-6">
                                {tickets.filter(t => t.estatus !== 'resuelto').map(t => (
                                    <TicketCard key={t.id} ticket={t} usuario={usuario} misVotos={misVotos} isEditing={ticketEditando === t.id} editData={editData} setEditData={setEditData} handlers={{onVote: handleVotar, onEditStart: iniciarEdicion, onEditCancel: ()=>setTicketEditando(null), onEditSave: guardarEdicion, onPriorityChange: cambiarPrioridad}} />
                                ))}
                            </div>
                        </div>
                    </main>
                ) : <Navigate to="/admin" />
            } />

            {/* 4. HISTORIAL (/admin/historial) */}
            <Route path="/admin/historial" element={
                usuario ? (
                    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                        <AdminMenu activo="historial" />
                        <div className="max-w-4xl mx-auto animate-fade-in-up">
                            <div className="text-center mb-8"><h2 className="text-2xl font-bold text-blue-900">📜 Archivo de Casos Resueltos</h2></div>
                            <div className="space-y-6">
                                {tickets.filter(t => t.estatus === 'resuelto').map(t => (
                                    <TicketCard key={t.id} ticket={t} usuario={usuario} misVotos={misVotos} isEditing={ticketEditando === t.id} editData={editData} setEditData={setEditData} handlers={{onVote: handleVotar, onEditStart: iniciarEdicion, onEditCancel: ()=>setTicketEditando(null), onEditSave: guardarEdicion}} />
                                ))}
                            </div>
                        </div>
                    </main>
                ) : <Navigate to="/admin" />
            } />

            {/* 5. CREAR INTERNO (/admin/crear) */}
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

            {/* 6. USUARIOS (/admin/usuarios) */}
            <Route path="/admin/usuarios" element={
                usuario ? (
                    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                        <AdminMenu activo="usuarios" />
                        <UsersList users={listaUsuarios} />
                    </main>
                ) : <Navigate to="/admin" />
            } />

        </Routes>

        {mostrarConfig && <ConfigModal usuario={usuario} onClose={() => setMostrarConfig(false)} />}
    </div>
  );
}

export default App;