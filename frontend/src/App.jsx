import { useState, useEffect } from 'react'
import { API_URL } from './config' // <--- IMPORTANTE: Se mantiene la configuración

function App() {
  const [usuario, setUsuario] = useState(null);
  const [vista, setVista] = useState('dashboard');
  const [tickets, setTickets] = useState([]);
  
  // Datos Login y Formulario
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [formData, setFormData] = useState({
    titulo: '', ubicacion: '', descripcion: '', categoria: 'Mantenimiento', prioridad: 'media'
  });

  // Buscador de duplicados
  const [sugerencias, setSugerencias] = useState([]);

  // Edición
  const [ticketEditando, setTicketEditando] = useState(null); 
  const [editData, setEditData] = useState({ estatus: '', comentarios: '' });

  useEffect(() => {
    if (usuario) cargarTickets();
  }, [usuario]);

  // --- LOGIN (Lógica intacta) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/login`, {
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
      const res = await fetch(`${API_URL}/tickets`);
      const data = await res.json();
      const ticketsOrdenados = data.sort((a, b) => b.votos - a.votos || new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
      setTickets(ticketsOrdenados);
    } catch (error) { console.error(error); }
  };

  // --- CALCULAR DÍAS (Lógica intacta) ---
  const calcularDias = (fechaInicio, fechaFin = null) => {
    if (!fechaInicio) return 0;
    const inicio = new Date(fechaInicio);
    const fin = fechaFin ? new Date(fechaFin) : new Date(); 
    
    const diferencia = fin - inicio;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24)); 
    
    if (dias === 0) return "Hoy";
    if (dias === 1) return "1 día";
    return `${dias} días`;
  };

  // --- BUSCADOR (Lógica intacta) ---
  const buscarSimilares = async (texto) => {
    setFormData(prev => ({ ...prev, titulo: texto }));
    if (texto.length < 3) { setSugerencias([]); return; }
    try {
      const res = await fetch(`${API_URL}/tickets/buscar?q=${texto}`);
      const data = await res.json();
      setSugerencias(data);
    } catch (error) { console.error(error); }
  };

  // --- CREAR TICKET (Lógica intacta) ---
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert("¡Ticket creado!");
        setFormData({ titulo: '', ubicacion: '', descripcion: '', categoria: 'Mantenimiento', prioridad: 'media' });
        setSugerencias([]);
        cargarTickets();
        setVista('dashboard');
      }
    } catch (error) { console.error(error); }
  };

  // --- VOTAR (Lógica intacta) ---
  const handleVotar = async (id, desdeSugerencia = false) => {
    try {
      const res = await fetch(`${API_URL}/tickets/${id}/voto`, { method: 'PUT' });
      if (res.ok) {
        cargarTickets();
        if (desdeSugerencia) {
            alert("¡Listo! Voto registrado.");
            setSugerencias([]);
            setFormData({ titulo: '', ubicacion: '', descripcion: '', categoria: 'Mantenimiento', prioridad: 'media' });
            setVista('dashboard');
        }
      }
    } catch (error) { console.error(error); }
  };

  // --- GESTIÓN (Lógica intacta) ---
  const iniciarEdicion = (ticket) => {
    setTicketEditando(ticket.id);
    setEditData({ 
      estatus: ticket.estatus, 
      comentarios: ticket.comentarios ? ticket.comentarios : '' 
    });
  };

  const guardarEdicion = async (id) => {
    try {
      const res = await fetch(`${API_URL}/tickets/${id}`, {
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

  // --- NUEVO: CÁLCULO DE ESTADÍSTICAS PARA EL DASHBOARD ---
  const stats = {
    abiertos: tickets.filter(t => t.estatus === 'abierto').length,
    proceso: tickets.filter(t => t.estatus === 'en_proceso').length,
    resueltos: tickets.filter(t => t.estatus === 'resuelto').length
  };

  // =================================================================
  // A PARTIR DE AQUÍ CAMBIA SOLO EL DISEÑO (JSX) - LÓGICA MANTENIDA
  // =================================================================

  // --- VISTA DE LOGIN (Diseño Moderno) ---
  if (!usuario) {
    return (
      <div className="flex min-h-screen bg-gray-50 flex-col font-sans">
        {/* Header Azul Curvo */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 h-64 w-full flex items-center justify-center rounded-b-[50px] shadow-lg">
            <div className="text-center">
                <div className="bg-white/20 p-4 rounded-full inline-block mb-4 backdrop-blur-sm">
                    <span className="text-5xl">🏢</span>
                </div>
                <h1 className="text-4xl font-bold text-white tracking-wide">CANACO <span className="font-light">Tickets</span></h1>
                <p className="text-blue-100 mt-2 tracking-widest uppercase text-xs">Sistema de Reportes Interno</p>
            </div>
        </div>

        {/* Tarjeta de Login Flotante */}
        <div className="flex-1 flex items-center justify-center -mt-20 px-4">
          <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">Iniciar Sesión</h2>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Correo Electrónico</label>
                <input type="email" placeholder="ejemplo@canaco.com" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" value={loginData.email} onChange={e => setLoginData({...loginData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Contraseña</label>
                <input type="password" placeholder="••••••••" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-bold shadow-md transition transform hover:scale-[1.02]">Entrar al Sistema</button>
            </form>
            <div className="mt-6 text-xs text-center text-gray-400">
               © 2026 CANACO Servytur Monterrey
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- APP PRINCIPAL (Diseño Dashboard) ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      
      {/* 1. NAVBAR SUPERIOR (Reemplaza la barra lateral) */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="bg-blue-900 text-white p-2 rounded-lg">🏢</div>
              <div>
                 <h1 className="text-xl font-bold text-blue-900 leading-none">CANACO</h1>
                 <span className="text-xs text-gray-500 font-medium tracking-widest">TICKETS</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-700">{usuario.nombre}</p>
                  <p className="text-xs text-gray-500 capitalize">{usuario.rol}</p>
               </div>
               <button onClick={() => setUsuario(null)} className="text-sm text-red-500 font-medium hover:bg-red-50 px-3 py-1 rounded-full border border-transparent hover:border-red-100 transition">
                 Salir
               </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. CONTENIDO PRINCIPAL CENTRADO */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Pestañas de Navegación */}
        <div className="flex justify-center mb-8 gap-4">
            <button 
                onClick={() => setVista('dashboard')} 
                className={`px-6 py-2 rounded-full font-bold transition shadow-sm ${vista === 'dashboard' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
                📊 Panel de Control
            </button>
            <button 
                onClick={() => { setVista('crear'); setSugerencias([]); }} 
                className={`px-6 py-2 rounded-full font-bold transition shadow-sm ${vista === 'crear' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
                ➕ Nuevo Reporte
            </button>
        </div>

        {vista === 'dashboard' && (
          <div className="animate-fade-in-up">
            
            {/* MINI DASHBOARD (Tarjetas de Resumen) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition cursor-default">
                    <div className="bg-orange-100 p-4 rounded-xl text-orange-600 text-2xl">⚠️</div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Pendientes</p>
                        <p className="text-3xl font-bold text-gray-800">{stats.abiertos}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition cursor-default">
                    <div className="bg-blue-100 p-4 rounded-xl text-blue-600 text-2xl">🛠️</div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">En Proceso</p>
                        <p className="text-3xl font-bold text-gray-800">{stats.proceso}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition cursor-default">
                    <div className="bg-green-100 p-4 rounded-xl text-green-600 text-2xl">✅</div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Resueltos</p>
                        <p className="text-3xl font-bold text-gray-800">{stats.resueltos}</p>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-blue-900 mb-6 border-b pb-2 border-gray-200">Reportes Recientes</h2>

            {/* LISTA DE TICKETS */}
            <div className="grid gap-6">
              {tickets.map(ticket => (
                <div key={ticket.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition relative overflow-hidden group">
                  {/* Borde lateral de color según estatus */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      ticket.estatus === 'abierto' ? 'bg-orange-400' :
                      ticket.estatus === 'en_proceso' ? 'bg-blue-500' : 
                      ticket.estatus === 'resuelto' ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>

                  {ticketEditando !== ticket.id ? (
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 pl-2">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-3 items-center">
                            {/* Badges de Categoría y Estatus */}
                            <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full uppercase tracking-wide">{ticket.categoria}</span>
                            
                            <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border ${
                              ticket.estatus === 'resuelto' 
                                ? 'bg-green-50 text-green-700 border-green-100' 
                                : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                            }`}>
                               {ticket.estatus === 'resuelto' ? '⏱️ Duración:' : '⏱️ Activo:'} 
                               {calcularDias(ticket.fecha_creacion, ticket.estatus === 'resuelto' ? ticket.fecha_cierre : null)}
                            </span>

                            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                               ticket.estatus === 'abierto' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                               ticket.estatus === 'en_proceso' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                               ticket.estatus === 'resuelto' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-500'
                            }`}>{ticket.estatus.replace('_', ' ')}</span>
                            
                            {ticket.votos > 0 && (
                               <span className="text-xs font-bold bg-red-50 text-red-600 px-3 py-1 rounded-full border border-red-100 flex items-center gap-1">
                                 🔥 {ticket.votos} afectados
                               </span>
                            )}
                        </div>

                        <h3 className="font-bold text-xl text-gray-800 mb-2">{ticket.titulo}</h3>
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">{ticket.descripcion}</p>
                        
                        <div className="flex items-center gap-2 text-sm text-blue-600 font-medium bg-blue-50 px-3 py-2 rounded-lg inline-block">
                            <span>📍</span> {ticket.ubicacion}
                        </div>
                        
                        {ticket.estatus === 'resuelto' && ticket.fecha_cierre && (
                          <div className="mt-4 text-xs text-green-800 font-semibold bg-green-50 px-3 py-2 rounded-lg border border-green-100 inline-block ml-2">
                             🏁 Finalizado el: {new Date(ticket.fecha_cierre).toLocaleDateString()}
                          </div>
                        )}

                        {ticket.comentarios && (
                          <div className="mt-4 bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                            <p className="text-xs text-yellow-800 font-bold uppercase mb-1">💬 Nota del Técnico:</p>
                            <p className="text-sm text-gray-700 italic">"{ticket.comentarios}"</p>
                          </div>
                        )}
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex flex-col gap-3 min-w-[140px]">
                        {ticket.estatus !== 'resuelto' && (
                          <button onClick={() => handleVotar(ticket.id)} className="group flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:border-blue-400 hover:text-blue-600 transition shadow-sm">
                            <span>✋</span> Yo también <span className="font-bold bg-gray-100 px-1.5 rounded text-xs group-hover:bg-blue-100">{ticket.votos || 0}</span>
                          </button>
                        )}
                        {(usuario.rol === 'admin' || usuario.rol === 'tecnico') && (
                          <button onClick={() => iniciarEdicion(ticket)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md font-medium transition">
                            ⚙️ Gestionar
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* MODO EDICIÓN (Diseño Integrado) */
                    <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                      <h4 className="font-bold text-blue-900 mb-4 text-lg">🛠️ Gestionar Ticket</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nuevo Estatus</label>
                          <select className="w-full p-3 border border-gray-300 rounded-lg mt-1 bg-white focus:ring-2 focus:ring-blue-400 outline-none" 
                            value={editData.estatus} onChange={e => setEditData({...editData, estatus: e.target.value})}>
                            <option value="abierto">🟠 Abierto (Pendiente)</option>
                            <option value="en_proceso">🔵 En Proceso (Trabajando)</option>
                            <option value="resuelto">✅ Resuelto (Finalizado)</option>
                            <option value="cancelado">⛔ Cancelado</option>
                          </select>
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nota o Solución</label>
                        <textarea 
                          rows="3" 
                          className="w-full p-3 border border-gray-300 rounded-lg mt-1 text-sm bg-white focus:ring-2 focus:ring-blue-400 outline-none"
                          style={{ position: 'relative', zIndex: 10 }}
                          placeholder="Describe qué se hizo o por qué se cancela..."
                          value={editData.comentarios || ''} 
                          onChange={e => setEditData({...editData, comentarios: e.target.value})}
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setTicketEditando(null)} className="text-sm text-gray-500 px-4 py-2 hover:bg-gray-100 rounded-lg font-medium transition">Cancelar</button>
                        <button onClick={() => guardarEdicion(ticket.id)} className="bg-green-600 text-white text-sm px-6 py-2 rounded-lg font-bold hover:bg-green-700 shadow-lg transition">💾 Guardar Cambios</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- VISTA DE CREAR (Diseño Centrado) --- */}
        {vista === 'crear' && (
          <div className="max-w-2xl mx-auto">
             <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📝</div>
                    <h2 className="text-2xl font-bold text-gray-800">Nuevo Reporte</h2>
                    <p className="text-gray-500">Describe el problema para que mantenimiento pueda atenderlo.</p>
                </div>
                
                <form onSubmit={handleCreateTicket} className="space-y-6">
                   <div className="relative">
                     <label className="block text-sm font-bold text-gray-700 mb-2">Título del problema</label>
                     <input 
                       className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
                       placeholder="Ej: Internet lento en sala de juntas..." 
                       value={formData.titulo} 
                       onChange={e => buscarSimilares(e.target.value)} 
                       required autoComplete="off"
                     />
                     
                     {/* Alerta de duplicados */}
                     {sugerencias.length > 0 && (
                       <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-5 animate-pulse">
                         <div className="flex items-center gap-2 mb-3">
                            <span className="text-orange-500 text-xl">⚠️</span>
                            <p className="text-sm text-orange-800 font-bold">¡Espera! Encontramos reportes similares:</p>
                         </div>
                         <ul className="space-y-3">
                           {sugerencias.map(s => (
                             <li key={s.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-orange-100 shadow-sm">
                               <div>
                                   <span className="text-sm font-semibold text-gray-800 block">{s.titulo}</span>
                                   <span className="text-xs text-gray-500">{s.ubicacion} • {s.estatus}</span>
                               </div>
                               <button type="button" onClick={() => handleVotar(s.id, true)} className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold transition">
                                   ✋ Votar por este
                               </button>
                             </li>
                           ))}
                         </ul>
                       </div>
                     )}
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Ubicación exacta</label>
                           <input className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Ej: Piso 2, Oficina 3" value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})} required/>
                       </div>
                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Categoría</label>
                           <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                             <option>Mantenimiento</option><option>Sistemas</option><option>Limpieza</option>
                             <option value="Seguridad">Seguridad</option><option value="Administrativo">Administrativo</option>
                           </select>
                       </div>
                   </div>

                   <div>
                       <label className="block text-sm font-bold text-gray-700 mb-2">Descripción detallada</label>
                       <textarea rows="4" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Explica qué sucede..." value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} required/>
                   </div>
                   
                   <div className="flex gap-4 pt-4">
                     <button type="button" onClick={() => setVista('dashboard')} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-lg font-bold transition">Cancelar</button>
                     <button type="submit" className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-bold shadow-lg transition transform hover:scale-[1.02]">Crear Reporte</button>
                   </div>
                </form>
             </div>
          </div>
        )}
      </main>

      {/* 3. FOOTER (Nuevo) */}
      <footer className="bg-blue-900 text-white py-8 mt-auto">
         <div className="max-w-7xl mx-auto px-4 text-center">
             <div className="flex justify-center items-center gap-2 mb-4">
                 <span className="text-2xl">🏢</span>
                 <h2 className="text-xl font-bold">CANACO Monterrey</h2>
             </div>
             <p className="text-blue-200 text-sm">Sistema de Tickets de Mantenimiento y Sistemas</p>
             <div className="mt-4 text-xs text-blue-400">
                 © 2026 Cámara Nacional de Comercio, Servicios y Turismo de Monterrey.
             </div>
         </div>
      </footer>

    </div>
  )
}

export default App