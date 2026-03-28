import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TicketCard from '../components/TicketCard';

export default function PublicBoardPage({ tickets, misVotos, handleVotar }) {
  const navigate = useNavigate();
  
  // --- ESTADOS DE FILTROS ---
  const [filtroEstatus, setFiltroEstatus] = useState('todos');
  const [filtroDepto, setFiltroDepto] = useState('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // --- NUEVO: Estado para el ticket seleccionado (abre el modal) ---
  const [selectedTicket, setSelectedTicket] = useState(null);

  // --- FILTRADO INTELIGENTE (Combinado) ---
  const ticketsFiltrados = tickets.filter(t => {
    const matchEstatus = filtroEstatus === 'todos' || t.estatus === filtroEstatus;
    const matchDepto = filtroDepto === 'todos' || t.departamento === filtroDepto;
    
    let matchFechaInicio = true;
    if (fechaInicio) {
      const inicio = new Date(fechaInicio + 'T00:00:00');
      matchFechaInicio = new Date(t.fecha_creacion) >= inicio;
    }
    
    let matchFechaFin = true;
    if (fechaFin) {
      const fin = new Date(fechaFin + 'T23:59:59');
      matchFechaFin = new Date(t.fecha_creacion) <= fin;
    }

    return matchEstatus && matchDepto && matchFechaInicio && matchFechaFin;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 w-full flex justify-center relative">
        <div className="max-w-5xl w-full animate-fade-in-up">
            
            {/* --- ENCABEZADO --- */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-blue-900">Tablero de Mantenimiento</h1>
                    <p className="text-gray-500 mt-1">Transparencia y seguimiento de reportes en CANACO</p>
                </div>
                {/* BORRADO: Los botones de vista tarjetas/tabla ya no están aquí */}
                <button 
                    onClick={() => navigate('/')} 
                    className="bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-800 transition transform hover:scale-105"
                >
                    ➕ Nuevo Reporte
                </button>
            </div>

            {/* --- BARRA DE FILTROS --- */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* ... (Todo el bloque de selectores y fechas sigue igual) ... */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estatus</label>
                    <select 
                        className="w-full mt-2 p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                        value={filtroEstatus}
                        onChange={(e) => setFiltroEstatus(e.target.value)}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="abierto">🟠 Abiertos (Pendientes)</option>
                        <option value="en_proceso">🔵 En Proceso</option>
                        <option value="resuelto">✅ Resueltos</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Departamento</label>
                    <select 
                        className="w-full mt-2 p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                        value={filtroDepto}
                        onChange={(e) => setFiltroDepto(e.target.value)}
                    >
                        <option value="todos">Todos los departamentos</option>
                        <option value="Sistemas">Sistemas</option>
                        <option value="Afiliación">Afiliación</option>
                        <option value="SIEM">SIEM</option>
                        <option value="Mercadotecnia">Mercadotecnia</option>
                        <option value="Contabilidad">Contabilidad</option>
                        <option value="Capital Humano">Capital Humano</option>
                        <option value="Eventos">Eventos</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Desde</label>
                    <input 
                        type="date" 
                        className="w-full mt-2 p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hasta</label>
                    <input 
                        type="date" 
                        className="w-full mt-2 p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                    />
                </div>
            </div>

            {/* --- CONTENIDO PRINCIPAL --- */}
            {ticketsFiltrados.length > 0 ? (
                /* LA ÚNICA VISTA ES LA TABLA */
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                                    <th className="p-4 font-bold">Folio</th>
                                    <th className="p-4 font-bold">Fecha</th>
                                    <th className="p-4 font-bold">Título / Ubicación</th>
                                    <th className="p-4 font-bold">Estatus</th>
                                    <th className="p-4 font-bold text-center">Afectados</th>
                                    <th className="p-4 font-bold text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {ticketsFiltrados.map((t) => (
                                    /* Hacemos la fila clickable para abrir el modal */
                                    <tr 
                                        key={t.id} 
                                        onClick={() => setSelectedTicket(t)}
                                        className="border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer"
                                    >
                                        <td className="p-4 font-mono font-bold text-gray-500">#{t.id}</td>
                                        <td className="p-4 text-gray-600">{new Date(t.fecha_creacion).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <p className="font-bold text-gray-800">{t.titulo}</p>
                                            <p className="text-xs text-gray-500">📍 {t.ubicacion}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                t.estatus === 'resuelto' ? 'bg-green-100 text-green-700' :
                                                t.estatus === 'en_proceso' ? 'bg-blue-100 text-blue-700' :
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                                {t.estatus.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center font-bold text-gray-700">
                                            {t.votos + 1}
                                        </td>
                                        <td className="p-4 text-center">
                                            {/* Prevenimos la propagación para que el voto no abra el modal */}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleVotar(t.id); }}
                                                disabled={misVotos.includes(t.id) || t.estatus === 'resuelto'}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                                    t.estatus === 'resuelto' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                                                    misVotos.includes(t.id) ? 'bg-gray-200 text-gray-600 cursor-not-allowed' :
                                                    'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                                }`}
                                            >
                                                {misVotos.includes(t.id) ? 'Votado' : t.estatus === 'resuelto' ? 'Cerrado' : '✋ Yo también'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <span className="text-5xl">📭</span>
                    <h3 className="text-xl font-bold text-gray-700 mt-4">No hay reportes con estos filtros</h3>
                    <p className="text-gray-400 mt-2">Intenta cambiar las opciones de búsqueda o el rango de fechas.</p>
                </div>
            )}
        </div>

        {/* --- MODAL DE DETALLES DEL TICKET (Ventana Flotante) --- */}
        {selectedTicket && (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
                onClick={() => setSelectedTicket(null)} // Cierra al hacer clic fuera
            >
                <div 
                    className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative p-6 animate-scale-in"
                    onClick={(e) => e.stopPropagation()} // Previene cierre al hacer clic dentro
                >
                    {/* Botón de cierre */}
                    <button 
                        onClick={() => setSelectedTicket(null)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-1.5 rounded-full hover:bg-gray-100"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="pt-4">
                        <TicketCard 
                            ticket={selectedTicket} 
                            usuario={{ rol: 'publico' }} 
                            misVotos={misVotos} 
                            isEditing={false} 
                            editData={{}} 
                            setEditData={()=>{}}
                            listaUsuarios={[]} 
                            handlers={{
                                onVote: handleVotar, 
                                onEditStart: () => {}, 
                                onEditCancel: () => {}, 
                                onEditSave: () => {}, 
                                onPriorityChange: () => {},
                                onDelete: () => {}
                            }} 
                        />
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}