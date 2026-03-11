import { calcularDias, formatearFecha } from '../utils/format';
import { API_URL } from '../config'; // <--- NUEVO: Importamos la URL de tu backend para encontrar la foto

export default function TicketCard({ 
  ticket, 
  usuario, 
  misVotos, 
  isEditing, 
  editData, 
  setEditData, 
  listaUsuarios, 
  handlers 
}) {
  
  const { onVote, onEditStart, onEditCancel, onEditSave, onPriorityChange, onDelete } = handlers;

  const handleDeleteClick = () => {
    if (window.confirm(`⚠️ PELIGRO:\n\n¿Estás seguro de que quieres ELIMINAR el ticket "${ticket.titulo}"?\n\nEsta acción es permanente y NO se puede deshacer.`)) {
      onDelete(ticket.id);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition relative overflow-hidden group">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          ticket.estatus === 'abierto' ? 'bg-orange-400' :
          ticket.estatus === 'en_proceso' ? 'bg-blue-500' : 
          ticket.estatus === 'resuelto' ? 'bg-green-500' : 'bg-gray-300'
      }`}></div>

      {!isEditing ? (
        // --- MODO VISUALIZACIÓN ---
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 pl-2">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-3 items-center">
                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full uppercase tracking-wide">{ticket.categoria}</span>
                
                <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border ${ticket.estatus === 'resuelto' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                   {ticket.estatus === 'resuelto' ? '⏱️ Duración:' : '⏱️ Activo:'} {calcularDias(ticket.fecha_creacion, ticket.estatus === 'resuelto' ? ticket.fecha_cierre : null)}
                </span>

                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                   ticket.estatus === 'abierto' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                   ticket.estatus === 'en_proceso' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                   'bg-green-100 text-green-600 border-green-100'
                }`}>{(ticket.estatus || '').replace('_', ' ')}</span>
                
                {ticket.tecnico_nombre && (
                    <span className="text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full border border-purple-200 flex items-center gap-1">
                        👷‍♂️ {ticket.tecnico_nombre}
                    </span>
                )}

                {ticket.votos > 0 && (<span className="text-xs font-bold bg-red-50 text-red-600 px-3 py-1 rounded-full border border-red-100 flex items-center gap-1">🔥 {ticket.votos} afectados</span>)}
            </div>

            <h3 className="font-bold text-xl text-gray-800 mb-2">{ticket.titulo}</h3>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">{ticket.descripcion}</p>
            
            {/* 👇 NUEVO: SECCIÓN DE EVIDENCIA VISUAL 👇 */}
            {ticket.evidencia && (
              <div className="mb-5 bg-gray-50 border border-gray-200 rounded-xl p-3 inline-block">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  📸 Evidencia Adjunta:
                </p>
                <a 
                  href={`${API_URL}${ticket.evidencia}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block overflow-hidden rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all relative group cursor-zoom-in max-w-sm"
                >
                  <img 
                    src={`${API_URL}${ticket.evidencia}`} 
                    alt="Evidencia del reporte" 
                    className="w-full h-auto max-h-48 object-cover group-hover:opacity-90 transition-opacity" 
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full shadow">Ver foto completa</span>
                  </div>
                </a>
              </div>
            )}
            {/* 👆 FIN SECCIÓN DE EVIDENCIA 👆 */}

            <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-blue-600 font-medium bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                    <span>📍</span> {ticket.ubicacion}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                   <span>📅</span> {formatearFecha(ticket.fecha_creacion)}
                </div>
            </div>

            {/* SECCIÓN DE CONTACTO */}
            <div className="mb-4 flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/80">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-blue-600 font-bold text-lg shadow-sm">
                    {ticket.usuario_nombre ? ticket.usuario_nombre.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        {ticket.usuario_nombre || 'Usuario Desconocido'}
                        <span className="text-xs font-normal text-gray-400 bg-white px-2 rounded border border-gray-100">Solicitante</span>
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-0.5">
                        {ticket.usuario_telefono ? (
                            <a href={`tel:${ticket.usuario_telefono}`} className="flex items-center gap-1 hover:text-blue-600 transition font-medium text-blue-500">
                                📞 {ticket.usuario_telefono}
                            </a>
                        ) : (
                            <span className="opacity-50">Sin teléfono</span>
                        )}
                        {ticket.usuario_email && (
                            <span className="flex items-center gap-1 hidden sm:flex">✉️ {ticket.usuario_email}</span>
                        )}
                    </div>
                </div>
            </div>

            {ticket.estatus === 'resuelto' && ticket.fecha_cierre && (
              <div className="mt-4 text-xs text-green-800 font-semibold bg-green-50 px-3 py-2 rounded-lg border border-green-100 inline-block">
                 🏁 Finalizado el: {formatearFecha(ticket.fecha_cierre)}
              </div>
            )}

            {ticket.comentarios && (
              <div className="mt-4 bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                <p className="text-xs text-yellow-800 font-bold uppercase mb-1">💬 Nota del Técnico:</p>
                <p className="text-sm text-gray-700 italic">"{ticket.comentarios}"</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 min-w-[140px]">
            {(usuario.rol === 'admin' || usuario.rol === 'tecnico') && (
              <div className="mb-1">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Prioridad</label>
                 <select value={ticket.prioridad || 'media'} onChange={(e) => onPriorityChange(ticket, e.target.value)}
                  className={`w-full text-sm px-3 py-2 rounded-lg font-bold border-2 transition cursor-pointer focus:outline-none focus:ring-2 ${
                    ticket.prioridad === 'alta' ? 'bg-red-50 text-red-700 border-red-200 focus:ring-red-400' :
                    ticket.prioridad === 'media' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-yellow-400' :
                    'bg-green-50 text-green-700 border-green-200 focus:ring-green-400'
                  }`}>
                  <option value="baja">🟢 Baja</option><option value="media">🟡 Media</option><option value="alta">🔴 Alta</option>
                </select>
              </div>
            )}
            
            {ticket.estatus !== 'resuelto' && (
                <button onClick={() => onVote(ticket.id)} disabled={misVotos.includes(ticket.id)}
                    className={`group flex items-center justify-center gap-2 border text-sm px-4 py-2 rounded-lg transition shadow-sm ${
                      misVotos.includes(ticket.id) ? 'bg-blue-100 text-blue-600 border-blue-200 cursor-not-allowed opacity-80' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                    }`}>
                    <span>{misVotos.includes(ticket.id) ? '✅' : '✋'}</span> {misVotos.includes(ticket.id) ? 'Votado' : 'Yo también'} <span className="font-bold bg-gray-100 px-1.5 rounded text-xs group-hover:bg-blue-100 ml-1">{ticket.votos || 0}</span>
                </button>
            )}

            {(usuario.rol === 'admin' || usuario.rol === 'tecnico') && (
              <button onClick={() => onEditStart(ticket)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md font-medium transition flex items-center justify-center gap-2">
                <span>⚙️</span> Gestionar
              </button>
            )}
          </div>
        </div>
      ) : (
        // --- MODO EDICIÓN ---
        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 relative">
          <h4 className="font-bold text-blue-900 mb-4 text-lg">🛠️ Gestionar Ticket</h4>
          
          {usuario.rol === 'admin' && (
            <button 
              onClick={handleDeleteClick}
              className="absolute top-6 right-6 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-100 px-3 py-2 rounded-lg transition flex items-center gap-1 border border-red-200 hover:border-red-300 bg-white"
              title="Eliminar este ticket permanentemente"
            >
              🗑️ Eliminar Ticket
            </button>
          )}

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

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Asignar Responsable</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg mt-1 bg-white focus:ring-2 focus:ring-blue-400 outline-none"
                value={editData.asignado_a || ''}
                onChange={e => setEditData({...editData, asignado_a: e.target.value})}
              >
                <option value="">-- Sin Asignar --</option>
                {listaUsuarios && listaUsuarios
                    .filter(u => u.rol === 'admin' || u.rol === 'tecnico')
                    .map(u => (
                        <option key={u.id} value={u.id}>
                            {u.nombre} ({u.rol})
                        </option>
                    ))
                }
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nota o Solución</label>
            <textarea rows="3" className="w-full p-3 border border-gray-300 rounded-lg mt-1 text-sm bg-white focus:ring-2 focus:ring-blue-400 outline-none" style={{ position: 'relative', zIndex: 10 }}
              placeholder="Describe qué se hizo o por qué se cancela..." value={editData.comentarios || ''} onChange={e => setEditData({...editData, comentarios: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onEditCancel} className="text-sm text-gray-500 px-4 py-2 hover:bg-gray-100 rounded-lg font-medium transition">Cancelar</button>
            <button onClick={() => onEditSave(ticket.id)} className="bg-green-600 text-white text-sm px-6 py-2 rounded-lg font-bold hover:bg-green-700 shadow-lg transition">💾 Guardar Cambios</button>
          </div>
        </div>
      )}
    </div>
  );
}