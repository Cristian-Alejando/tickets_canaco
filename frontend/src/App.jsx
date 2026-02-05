import { useState, useEffect } from 'react'
import { API_URL } from './config'
import LoginPage from './pages/LoginPage'
import Navbar from './components/Navbar'
import TicketCard from './components/TicketCard'
import StatsCards from './components/StatsCards'
import CreateTicketForm from './components/CreateTicketForm'
import ConfigModal from './components/ConfigModal' // <--- NUEVO
import UsersList from './components/UsersList'     // <--- NUEVO
import { 
  getTickets, createTicket, updateTicket, voteTicket, getMyVotes, getUsers // <--- NUEVO IMPORT
} from './services/ticketService'

function App() {
  const [usuario, setUsuario] = useState(null);
  const [vista, setVista] = useState('dashboard');
  const [tickets, setTickets] = useState([]);
  
  // Datos Formulario
  const [formData, setFormData] = useState({ titulo: '', ubicacion: '', descripcion: '', categoria: 'Mantenimiento', prioridad: 'media' });

  // Estados de gestión
  const [misVotos, setMisVotos] = useState([]); 
  const [sugerencias, setSugerencias] = useState([]);
  const [ticketEditando, setTicketEditando] = useState(null); 
  const [editData, setEditData] = useState({ estatus: '', comentarios: '', prioridad: 'media' });

  // --- NUEVOS ESTADOS ---
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [listaUsuarios, setListaUsuarios] = useState([]);

  useEffect(() => {
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

  // --- NUEVA FUNCIÓN: CARGAR USUARIOS ---
  const cargarUsuarios = async () => {
    try { const data = await getUsers(); setListaUsuarios(data); } 
    catch (error) { console.error(error); }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const res = await createTicket(formData);
      if (res.ok) {
        alert("¡Ticket creado!");
        setFormData({ titulo: '', ubicacion: '', descripcion: '', categoria: 'Mantenimiento', prioridad: 'media' });
        setSugerencias([]); cargarTickets(); setVista('dashboard');
      }
    } catch (error) { console.error(error); }
  };

  const handleVotar = async (id, desdeSugerencia = false) => {
    if (misVotos.includes(id)) return;
    try {
      const res = await voteTicket(id, usuario.id);
      if (res.ok) {
        cargarTickets(); setMisVotos([...misVotos, id]); 
        if (desdeSugerencia) {
            alert("¡Listo! Voto registrado."); setSugerencias([]);
            setFormData({ titulo: '', ubicacion: '', descripcion: '', categoria: 'Mantenimiento', prioridad: 'media' });
            setVista('dashboard');
        }
      } else { const errorData = await res.json(); alert(errorData.error); }
    } catch (error) { console.error(error); }
  };

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

  if (!usuario) return <LoginPage onLoginSuccess={setUsuario} />;

  // --- RENDERIZADO ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* NAVBAR ACTUALIZADO CON CLICK DE CONFIG */}
      <Navbar 
        usuario={usuario} 
        onLogout={() => setUsuario(null)} 
        onConfigClick={() => setMostrarConfig(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Pestañas */}
        <div className="flex justify-center mb-8 gap-4">
            <button onClick={() => setVista('dashboard')} className={`px-6 py-2 rounded-full font-bold transition shadow-sm ${vista === 'dashboard' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>📊 Panel de Control</button>
            <button onClick={() => { setVista('crear'); setSugerencias([]); }} className={`px-6 py-2 rounded-full font-bold transition shadow-sm ${vista === 'crear' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>➕ Nuevo Reporte</button>
            <button onClick={() => setVista('historial')} className={`px-6 py-2 rounded-full font-bold transition shadow-sm ${vista === 'historial' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>📜 Historial Resueltos</button>
            
            {/* BOTÓN SOLO PARA ADMINS: VER USUARIOS */}
            {(usuario.rol === 'admin' || usuario.rol === 'tecnico') && (
                <button onClick={() => { setVista('usuarios'); cargarUsuarios(); }} 
                    className={`px-6 py-2 rounded-full font-bold transition shadow-sm ${vista === 'usuarios' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                    👥 Usuarios
                </button>
            )}
        </div>

        {/* --- VISTA DASHBOARD --- */}
        {vista === 'dashboard' && (
          <div className="animate-fade-in-up">
            <StatsCards stats={stats} />
            <h2 className="text-2xl font-bold text-blue-900 mb-6 border-b pb-2 border-gray-200">Reportes Recientes</h2>
            <div className="grid gap-6">
              {tickets.filter(t => t.estatus !== 'resuelto').map(ticket => (
                <TicketCard 
                  key={ticket.id}
                  ticket={ticket}
                  usuario={usuario}
                  misVotos={misVotos}
                  isEditing={ticketEditando === ticket.id}
                  editData={editData}
                  setEditData={setEditData}
                  handlers={{ onVote: handleVotar, onEditStart: iniciarEdicion, onEditCancel: () => setTicketEditando(null), onEditSave: guardarEdicion, onPriorityChange: cambiarPrioridad }}
                />
              ))}
            </div>
          </div>
        )}

        {/* --- VISTA HISTORIAL --- */}
        {vista === 'historial' && (
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="text-center mb-8"><h2 className="text-2xl font-bold text-blue-900">📜 Archivo de Casos Resueltos</h2></div>
            <div className="space-y-6">
              {tickets.filter(t => t.estatus === 'resuelto').length === 0 ? (
                  <div className="text-center p-10 bg-gray-100 rounded-2xl border border-dashed border-gray-300"><p className="text-gray-500">Aún no hay tickets en el historial.</p></div>
              ) : (
                  tickets.filter(t => t.estatus === 'resuelto').map(ticket => (
                    <TicketCard 
                      key={ticket.id}
                      ticket={ticket}
                      usuario={usuario}
                      misVotos={misVotos}
                      isEditing={ticketEditando === ticket.id}
                      editData={editData}
                      setEditData={setEditData}
                      handlers={{ onVote: handleVotar, onEditStart: iniciarEdicion, onEditCancel: () => setTicketEditando(null), onEditSave: guardarEdicion, onPriorityChange: cambiarPrioridad }}
                    />
                  ))
              )}
            </div>
          </div>
        )}

        {/* --- VISTA CREAR --- */}
        {vista === 'crear' && (
          <div className="max-w-2xl mx-auto">
             <CreateTicketForm 
                onSubmit={handleCreateTicket}
                onCancel={() => setVista('dashboard')}
                formData={formData}
                setFormData={setFormData}
                onSearch={buscarSimilares}
                sugerencias={sugerencias}
                onVoteSugerencia={handleVotar}
                misVotos={misVotos}
             />
          </div>
        )}

        {/* --- VISTA USUARIOS (NUEVA) --- */}
        {vista === 'usuarios' && (
            <UsersList users={listaUsuarios} />
        )}

      </main>
      
      <footer className="bg-blue-900 text-white py-8 mt-auto">
         <div className="max-w-7xl mx-auto px-4 text-center"><div className="flex justify-center items-center gap-2 mb-4"><span className="text-2xl">🏢</span><h2 className="text-xl font-bold">CANACO Monterrey</h2></div><p className="text-blue-200 text-sm">Sistema de Tickets de Mantenimiento y Sistemas</p><div className="mt-4 text-xs text-blue-400">© 2026 Cámara Nacional de Comercio, Servicios y Turismo de Monterrey.</div></div>
      </footer>

      {/* --- MODAL DE CONFIGURACIÓN (FLOTANTE) --- */}
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