import { useState, useEffect } from 'react'
import { API_URL } from './config'
import LoginPage from './pages/LoginPage'
import Navbar from './components/Navbar'
import TicketCard from './components/TicketCard'
import StatsCards from './components/StatsCards'
import CreateTicketForm from './components/CreateTicketForm'
import ConfigModal from './components/ConfigModal' 
import UsersList from './components/UsersList'     
import { 
  getTickets, createTicket, updateTicket, voteTicket, getMyVotes, getUsers 
} from './services/ticketService'

function App() {
  const [usuario, setUsuario] = useState(null);
  const [vista, setVista] = useState('dashboard');
  const [tickets, setTickets] = useState([]);
  
  // --- NUEVO ESTADO: CONTROL DEL LOGIN (INTERRUPTOR) ---
  const [mostrandoLogin, setMostrandoLogin] = useState(false);

  // Datos Formulario (Ahora incluye nombre y email para el público)
  const [formData, setFormData] = useState({ 
      titulo: '', ubicacion: '', descripcion: '', categoria: 'Mantenimiento', prioridad: 'media',
      nombre_contacto: '', email_contacto: '' // <--- NUEVOS CAMPOS PÚBLICOS
  });

  const [misVotos, setMisVotos] = useState([]); 
  const [sugerencias, setSugerencias] = useState([]);
  const [ticketEditando, setTicketEditando] = useState(null); 
  const [editData, setEditData] = useState({ estatus: '', comentarios: '', prioridad: 'media' });

  // Estados de gestión
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [listaUsuarios, setListaUsuarios] = useState([]);

  useEffect(() => {
    // Solo cargamos datos si hay un admin logueado
    if (usuario) { cargarTickets(); cargarMisVotos(); }
  }, [usuario]);

  // --- LÓGICA DE DATOS ---
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

  const cargarMisVotos = async () => {
    if (!usuario) return;
    try { const data = await getMyVotes(usuario.id); setMisVotos(data); } catch (error) { console.error(error); }
  };

  const cargarUsuarios = async () => {
    try { const data = await getUsers(); setListaUsuarios(data); } 
    catch (error) { console.error(error); }
  };

  // --- CREAR TICKET (INTELIGENTE: PÚBLICO O ADMIN) ---
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      // Preparamos los datos dependiendo de quién lo envía
      const ticketAEnviar = {
          ...formData,
          // Si hay usuario (Admin), mandamos su ID. Si no, va null.
          usuario_id: usuario ? usuario.id : null,
          // Si hay usuario, tomamos su nombre. Si no, lo que escribió en el form.
          nombre_contacto: usuario ? usuario.nombre : formData.nombre_contacto,
          email_contacto: usuario ? usuario.email : formData.email_contacto
      };

      const res = await createTicket(ticketAEnviar);
      
      if (res.ok) {
        alert(usuario ? "¡Ticket registrado correctamente!" : "¡Reporte enviado! Gracias por avisarnos.");
        
        // Limpiamos formulario completo
        setFormData({ 
            titulo: '', ubicacion: '', descripcion: '', categoria: 'Mantenimiento', prioridad: 'media',
            nombre_contacto: '', email_contacto: ''
        });
        setSugerencias([]); 
        
        // Si es admin, actualizamos la vista
        if (usuario) {
            cargarTickets(); 
            setVista('dashboard');
        }
      }
    } catch (error) { console.error(error); alert("Error al crear el reporte"); }
  };

  const handleVotar = async (id, desdeSugerencia = false) => {
    if (!usuario) return; // El público no puede votar (aún)
    if (misVotos.includes(id)) return;
    try {
      const res = await voteTicket(id, usuario.id);
      if (res.ok) {
        cargarTickets(); setMisVotos([...misVotos, id]); 
        if (desdeSugerencia) {
            alert("¡Listo! Voto registrado."); setSugerencias([]);
            setFormData({ titulo: '', ubicacion: '', descripcion: '', categoria: 'Mantenimiento', prioridad: 'media', nombre_contacto: '', email_contacto: '' });
            if (usuario) setVista('dashboard');
        }
      } else { const errorData = await res.json(); alert(errorData.error); }
    } catch (error) { console.error(error); }
  };

  // ... Resto de funciones auxiliares (sin cambios) ...
  const guardarEdicion = async (id) => {
    const ticketOriginal = tickets.find(t => t.id === id);
    if (!ticketOriginal) return;
    const datosCompletos = { ...ticketOriginal, estatus: editData.estatus, comentarios: editData.comentarios, prioridad: editData.prioridad || ticketOriginal.prioridad || 'media' };
    try {
      const res = await updateTicket(id, datosCompletos);
      if (res.ok) { setTicketEditando(null); cargarTickets(); } else { alert("Error al guardar cambios"); }
    } catch (error) { console.error(error); }
  };

  const cambiarPrioridad = async (ticket, nuevaPrioridad) => {
    const datosActualizados = { ...ticket, prioridad: nuevaPrioridad };
    try {
      const res = await updateTicket(ticket.id, datosActualizados);
      if (res.ok) { cargarTickets(); }
    } catch (error) { console.error(error); }
  };

  const iniciarEdicion = (ticket) => {
    setTicketEditando(ticket.id);
    setEditData({ estatus: ticket.estatus || 'abierto', comentarios: ticket.comentarios || '', prioridad: ticket.prioridad || 'media' });
  };

  const buscarSimilares = async (texto) => {
    setFormData(prev => ({ ...prev, titulo: texto }));
    if (texto.length < 3) { setSugerencias([]); return; }
    try {
      const res = await fetch(`${API_URL}/tickets/buscar?q=${texto}`);
      const data = await res.json();
      setSugerencias(data);
    } catch (error) { console.error(error); }
  };

  const stats = {
    abiertos: tickets.filter(t => t.estatus === 'abierto').length,
    proceso: tickets.filter(t => t.estatus === 'en_proceso').length,
    resueltos: tickets.filter(t => t.estatus === 'resuelto').length
  };

  // --- RENDERIZADO CONDICIONAL (LA NUEVA ESTRUCTURA) ---

  // 1. PANTALLA DE LOGIN (SOLO SI SE PIDE CON EL BOTÓN SECRETO)
  if (!usuario && mostrandoLogin) {
      return (
        <div className="relative">
             {/* Botón para regresar al Buzón Público */}
            <button 
                onClick={() => setMostrandoLogin(false)} 
                className="absolute top-4 left-4 z-10 bg-white px-4 py-2 rounded-full shadow text-sm font-bold text-gray-600 hover:text-blue-700 transition"
            >
                ← Volver al Buzón
            </button>
            <LoginPage onLoginSuccess={(u) => { setUsuario(u); setMostrandoLogin(false); }} />
        </div>
      );
  }

  // 2. PANTALLA DE ADMIN (PANEL COMPLETO) - SI YA INICIASTE SESIÓN
  if (usuario) {
      return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
          <Navbar 
            usuario={usuario} 
            onLogout={() => setUsuario(null)} 
            onConfigClick={() => setMostrarConfig(true)}
          />

          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Pestañas de Admin */}
            <div className="flex justify-center mb-8 gap-4 overflow-x-auto pb-2">
                <button onClick={() => setVista('dashboard')} className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition shadow-sm ${vista === 'dashboard' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>📊 Panel de Control</button>
                <button onClick={() => setVista('crear')} className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition shadow-sm ${vista === 'crear' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>➕ Nuevo Reporte</button>
                <button onClick={() => setVista('historial')} className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition shadow-sm ${vista === 'historial' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>📜 Historial Resueltos</button>
                
                {/* BOTÓN USUARIOS (SOLO ADMINS) */}
                {(usuario.rol === 'admin' || usuario.rol === 'tecnico') && (
                    <button onClick={() => { setVista('usuarios'); cargarUsuarios(); }} 
                        className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition shadow-sm ${vista === 'usuarios' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                        👥 Usuarios
                    </button>
                )}
            </div>

            {/* VISTAS ADMIN */}
            {vista === 'dashboard' && (
              <div className="animate-fade-in-up">
                <StatsCards stats={stats} />
                <h2 className="text-2xl font-bold text-blue-900 mb-6 border-b pb-2 border-gray-200 mt-6">Reportes Activos</h2>
                <div className="grid gap-6">
                  {tickets.filter(t => t.estatus !== 'resuelto').map(ticket => (
                    <TicketCard 
                      key={ticket.id} ticket={ticket} usuario={usuario} misVotos={misVotos} isEditing={ticketEditando === ticket.id} editData={editData} setEditData={setEditData}
                      handlers={{ onVote: handleVotar, onEditStart: iniciarEdicion, onEditCancel: () => setTicketEditando(null), onEditSave: guardarEdicion, onPriorityChange: cambiarPrioridad }}
                    />
                  ))}
                </div>
              </div>
            )}

            {vista === 'historial' && (
              <div className="max-w-4xl mx-auto animate-fade-in-up">
                <div className="text-center mb-8"><h2 className="text-2xl font-bold text-blue-900">📜 Archivo de Casos Resueltos</h2></div>
                <div className="space-y-6">
                  {tickets.filter(t => t.estatus === 'resuelto').length === 0 ? (
                      <div className="text-center p-10 bg-gray-100 rounded-2xl border border-dashed border-gray-300"><p className="text-gray-500">Aún no hay tickets en el historial.</p></div>
                  ) : (
                      tickets.filter(t => t.estatus === 'resuelto').map(ticket => (
                        <TicketCard key={ticket.id} ticket={ticket} usuario={usuario} misVotos={misVotos} isEditing={ticketEditando === ticket.id} editData={editData} setEditData={setEditData} handlers={{ onVote: handleVotar, onEditStart: iniciarEdicion, onEditCancel: () => setTicketEditando(null), onEditSave: guardarEdicion, onPriorityChange: cambiarPrioridad }} />
                      ))
                  )}
                </div>
              </div>
            )}

            {vista === 'crear' && (
              <div className="max-w-2xl mx-auto">
                 <CreateTicketForm 
                    onSubmit={handleCreateTicket} onCancel={() => setVista('dashboard')} formData={formData} setFormData={setFormData} onSearch={buscarSimilares} sugerencias={sugerencias} onVoteSugerencia={handleVotar} misVotos={misVotos}
                    usuario={usuario} // <--- ADMIN: PASAMOS EL USUARIO
                 />
              </div>
            )}

            {vista === 'usuarios' && (
                <UsersList users={listaUsuarios} />
            )}
          </main>
          
          <footer className="bg-blue-900 text-white py-8 mt-auto">
             <div className="max-w-7xl mx-auto px-4 text-center"><div className="flex justify-center items-center gap-2 mb-4"><span className="text-2xl">🏢</span><h2 className="text-xl font-bold">CANACO Monterrey</h2></div><p className="text-blue-200 text-sm">Sistema de Tickets de Mantenimiento y Sistemas</p></div>
          </footer>

          {mostrarConfig && (
            <ConfigModal usuario={usuario} onClose={() => setMostrarConfig(false)} />
          )}
        </div>
      );
  }

  // 3. PANTALLA PÚBLICA (BUZÓN) - SI NO HAY NADIE LOGUEADO
  // 
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full animate-fade-in-up">
            <div className="text-center mb-8">
                <img src="/logo_canaco_oficial.png" alt="Logo" className="h-24 mx-auto mb-4 object-contain" />
                <h1 className="text-3xl font-bold text-blue-900">Buzón de Mantenimiento</h1>
                <p className="text-gray-500 mt-2">Reporta incidencias técnicas o de infraestructura de forma rápida.</p>
            </div>

            {/* FORMULARIO EN MODO PÚBLICO (usuario={null}) */}
            <CreateTicketForm 
                onSubmit={handleCreateTicket} 
                onCancel={() => setFormData({titulo:'', ubicacion:'', descripcion:'', categoria:'Mantenimiento', prioridad:'media', nombre_contacto:'', email_contacto:''})} 
                formData={formData} 
                setFormData={setFormData}
                onSearch={buscarSimilares}
                sugerencias={sugerencias}
                onVoteSugerencia={handleVotar}
                misVotos={[]}
                usuario={null} // <--- PÚBLICO: NO HAY USUARIO
            />

            {/* BOTÓN SECRETO PARA ADMINS */}
            <div className="text-center mt-12">
                <button 
                    onClick={() => setMostrandoLogin(true)} 
                    className="text-xs text-gray-400 hover:text-blue-600 transition flex items-center justify-center gap-1 mx-auto"
                >
                    🔒 Acceso Administrativo
                </button>
            </div>
        </div>
        
        <div className="mt-8 text-xs text-gray-400">
            © 2026 Cámara Nacional de Comercio Monterrey
        </div>
    </div>
  );
}

export default App;