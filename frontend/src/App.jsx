import { useState, useEffect } from 'react'

function App() {
  const [usuario, setUsuario] = useState(null);
  const [vista, setVista] = useState('dashboard');
  const [tickets, setTickets] = useState([]);
  
  // Login y Creación
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [formData, setFormData] = useState({
    titulo: '', ubicacion: '', descripcion: '', categoria: 'Mantenimiento', prioridad: 'media'
  });

  // ESTADO NUEVO: Para saber qué ticket se está editando
  const [ticketEditando, setTicketEditando] = useState(null); 
  // Datos temporales de la edición (comentario y estatus)
  const [editData, setEditData] = useState({ estatus: '', comentarios: '' });

  useEffect(() => {
    if (usuario) cargarTickets();
  }, [usuario]);

  // --- LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();
      if (res.ok) setUsuario(data);
      else alert(data.error);
    } catch (error) { console.error(error); }
  };

  const cargarTickets = async () => {
    try {
      const res = await fetch('http://localhost:3000/tickets');
      const data = await res.json();
      setTickets(data);
    } catch (error) { console.error(error); }
  };

  // --- CREAR TICKET ---
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert("¡Ticket creado!");
        setFormData({ titulo: '', ubicacion: '', descripcion: '', categoria: 'Mantenimiento', prioridad: 'media' });
        cargarTickets();
        setVista('dashboard');
      }
    } catch (error) { console.error(error); }
  };

  // --- NUEVA FUNCIÓN: Iniciar Edición ---
  const iniciarEdicion = (ticket) => {
    setTicketEditando(ticket.id);
    setEditData({ 
      estatus: ticket.estatus, 
      comentarios: ticket.comentarios || '' 
    });
  };

  // --- NUEVA FUNCIÓN: Guardar Cambios ---
  const guardarEdicion = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData) 
      });
      if (res.ok) {
        setTicketEditando(null); 
        cargarTickets(); 
      }
    } catch (error) { console.error(error); }
  };

  if (!usuario) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg w-96">
          <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">CANACO Tickets</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Correo" required className="w-full p-2 border rounded" value={loginData.email} onChange={e => setLoginData({...loginData, email: e.target.value})} />
            <input type="password" placeholder="Contraseña" required className="w-full p-2 border rounded" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold">Entrar</button>
          </form>
          <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded">
             <p>Admin: admin@canaco.com / admin123</p>
             <p>Empleado: juan@canaco.com / 123456</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* SIDEBAR */}
      <div className="w-64 bg-white shadow-lg flex flex-col p-4">
        <h1 className="text-2xl font-bold text-blue-700 px-2">CANACO</h1>
        <p className="text-sm text-gray-600 px-2 mt-1">Hola, {usuario.nombre}</p>
        <div className="flex-1 mt-8 space-y-2">
          <button onClick={() => setVista('dashboard')} className={`w-full text-left p-3 rounded ${vista==='dashboard'?'bg-blue-50 text-blue-700':'hover:bg-gray-50'}`}>📊 Dashboard</button>
          <button onClick={() => setVista('crear')} className={`w-full text-left p-3 rounded ${vista==='crear'?'bg-blue-50 text-blue-700':'hover:bg-gray-50'}`}>➕ Nuevo Ticket</button>
        </div>
        <button onClick={() => setUsuario(null)} className="text-red-500 text-sm mt-4 text-left p-2">🔓 Cerrar Sesión</button>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 p-8 overflow-y-auto">
        {vista === 'dashboard' && (
          <div className="grid gap-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Panel de Control</h2>
            
            {tickets.map(ticket => (
              <div key={ticket.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                
                {/* --- MODO VISUALIZACIÓN (NORMAL) --- */}
                {ticketEditando !== ticket.id ? (
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex gap-2 mb-2 items-center">
                          <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{ticket.categoria}</span>
                          
                          {/* 📅 FECHA DE CREACIÓN (NUEVO) */}
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            📅 {new Date(ticket.fecha_creacion).toLocaleDateString()}
                          </span>

                          <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                             ticket.estatus === 'abierto' ? 'bg-orange-100 text-orange-600' :
                             ticket.estatus === 'en_proceso' ? 'bg-blue-100 text-blue-600' : 
                             ticket.estatus === 'resuelto' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'
                          }`}>{ticket.estatus.replace('_', ' ')}</span>
                      </div>

                      <h3 className="font-bold text-lg">{ticket.titulo}</h3>
                      <p className="text-gray-600 text-sm mt-1">{ticket.descripcion}</p>
                      <p className="text-xs text-blue-600 mt-2 font-medium">📍 {ticket.ubicacion}</p>
                      
                      {/* 🏁 FECHA DE CIERRE (NUEVO - Solo si está resuelto) */}
                      {ticket.estatus === 'resuelto' && ticket.fecha_cierre && (
                        <p className="text-xs text-green-700 font-bold mt-2 bg-green-50 inline-block px-2 py-1 rounded border border-green-100">
                           🏁 Finalizado el: {new Date(ticket.fecha_cierre).toLocaleDateString()} {new Date(ticket.fecha_cierre).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      )}

                      {/* MOSTRAR COMENTARIO */}
                      {ticket.comentarios && (
                        <div className="mt-3 bg-yellow-50 p-2 rounded border border-yellow-100">
                          <p className="text-xs text-yellow-800 font-bold">💬 Nota del Admin:</p>
                          <p className="text-xs text-gray-700 italic">{ticket.comentarios}</p>
                        </div>
                      )}
                    </div>

                    {/* BOTÓN GESTIONAR */}
                    {(usuario.rol === 'admin' || usuario.rol === 'tecnico') && (
                      <button onClick={() => iniciarEdicion(ticket)} className="bg-blue-600 text-white text-xs px-4 py-2 rounded hover:bg-blue-700 shadow">
                        ⚙️ Gestionar
                      </button>
                    )}
                  </div>

                ) : (
                  // --- MODO EDICIÓN ---
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-bold text-blue-800 mb-3">🛠️ Gestionar Ticket</h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="text-xs font-bold text-gray-600">Cambiar Estatus:</label>
                        <select className="w-full p-2 border rounded mt-1 bg-white" 
                          value={editData.estatus} onChange={e => setEditData({...editData, estatus: e.target.value})}>
                          <option value="abierto">🟠 Abierto</option>
                          <option value="en_proceso">🔵 En Proceso</option>
                          <option value="resuelto">✅ Resuelto</option>
                          <option value="cancelado">⛔ Cancelado</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="text-xs font-bold text-gray-600">Agregar Nota / Razón:</label>
                      <textarea rows="2" className="w-full p-2 border rounded mt-1 text-sm" 
                        placeholder="Ej: Falta comprar pieza, Se requiere proveedor externo..."
                        value={editData.comentarios} onChange={e => setEditData({...editData, comentarios: e.target.value})}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button onClick={() => setTicketEditando(null)} className="text-xs text-gray-500 px-3 py-1 hover:text-gray-700">Cancelar</button>
                      <button onClick={() => guardarEdicion(ticket.id)} className="bg-green-600 text-white text-xs px-4 py-2 rounded font-bold hover:bg-green-700">
                        💾 Guardar Cambios
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* VISTA DE CREAR */}
        {vista === 'crear' && (
          <div className="bg-white p-8 rounded shadow">
             <h2 className="text-xl font-bold mb-4">Nuevo Ticket</h2>
             <form onSubmit={handleCreateTicket} className="space-y-4">
                <input className="w-full border p-2 rounded" placeholder="Título" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} required/>
                <input className="w-full border p-2 rounded" placeholder="Ubicación" value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})} required/>
                <select className="w-full border p-2 rounded" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                  <option>Mantenimiento</option><option>Sistemas</option><option>Limpieza</option>
                </select>
                <textarea className="w-full border p-2 rounded" placeholder="Descripción" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} required/>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setVista('dashboard')} className="flex-1 bg-gray-200 py-2 rounded">Cancelar</button>
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded">Guardar</button>
                </div>
             </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default App