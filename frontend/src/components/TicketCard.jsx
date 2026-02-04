import { calcularDias, formatearFecha } from '../utils/format';

export default function TicketCard({ 
  ticket, 
  usuario, 
  misVotos, 
  isEditing, 
  editData, 
  setEditData, 
  handlers // Aquí agruparemos las funciones (votar, editar, guardar, etc.)
}) {
  
  const { onVote, onEditStart, onEditCancel, onEditSave, onPriorityChange } = handlers;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition relative overflow-hidden group">
      {/* Borde de color lateral */}
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
                
                {ticket.votos > 0 && (<span className="text-xs font-bold bg-red-50 text-red-600 px-3 py-1 rounded-full border border-red-100 flex items-center gap-1">🔥 {ticket.votos} afectados</span>)}
            </div>

            <h3 className="font-bold text-xl text-gray-800 mb-2">{ticket.titulo}</h3>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">{ticket.descripcion}</p>
            
            <div className="flex items-center gap-2 text-sm text-blue-600 font-medium bg-blue-50 px-3 py-2 rounded-lg inline-block">
                <span>📍</span> {ticket.ubicacion}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium bg-gray-50 px-3 py-2 rounded-lg inline-block ml-2 border border-gray-200">
               <span>📅</span> Creado el: {formatearFecha(ticket.fecha_creacion)}
            </div>

            {ticket.estatus === 'resuelto' && ticket.fecha_cierre && (
              <div className="mt-4 text-xs text-green-800 font-semibold bg-green-50 px-3 py-2 rounded-lg border border-green-100 inline-block ml-2">
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
              <select value={ticket.prioridad || 'media'} onChange={(e) => onPriorityChange(ticket, e.target.value)}
                className={`text-sm px-3 py-2 rounded-lg font-bold border-2 transition cursor-pointer focus:outline-none focus:ring-2 ${
                  ticket.prioridad === 'alta' ? 'bg-red-100 text-red-700 border-red-300 focus:ring-red-400' :
                  ticket.prioridad === 'media' ? 'bg-yellow-100 text-yellow-700 border-yellow-300 focus:ring-yellow-400' :
                  'bg-green-100 text-green-700 border-green-300 focus:ring-green-400'
                }`}>
                <option value="baja">🟢 Baja</option><option value="media">🟡 Media</option><option value="alta">🔴 Alta</option>
              </select>
            )}
            {ticket.estatus !== 'resuelto' && (
                <button onClick={() => onVote(ticket.id)} disabled={misVotos.includes(ticket.id)}
                    className={`group flex items-center justify-center gap-2 border text-sm px-4 py-2 rounded-lg transition shadow-sm ${
                      misVotos.includes(ticket.id) ? 'bg-blue-100 text-blue-600 border-blue-200 cursor-not-allowed opacity-80' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                    }`}>
                    <span>{misVotos.includes(ticket.id) ? '✅' : '✋'}</span> {misVotos.includes(ticket.id) ? 'Ya votaste' : 'Yo también'} <span className="font-bold bg-gray-100 px-1.5 rounded text-xs group-hover:bg-blue-100 ml-1">{ticket.votos || 0}</span>
                </button>
            )}
            {(usuario.rol === 'admin' || usuario.rol === 'tecnico') && (
              <button onClick={() => onEditStart(ticket)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md font-medium transition">⚙️ Gestionar</button>
            )}
          </div>
        </div>
      ) : (
        // --- MODO EDICIÓN ---
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