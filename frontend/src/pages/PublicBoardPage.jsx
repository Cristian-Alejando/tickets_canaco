import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TicketCard from '../components/TicketCard';

export default function PublicBoardPage({ tickets, misVotos, handleVotar }) {
  const navigate = useNavigate();
  const [filtroEstatus, setFiltroEstatus] = useState('todos');
  const [filtroDepto, setFiltroDepto] = useState('todos');

  // Filtrado inteligente
  const ticketsFiltrados = tickets.filter(t => {
    const matchEstatus = filtroEstatus === 'todos' || t.estatus === filtroEstatus;
    const matchDepto = filtroDepto === 'todos' || t.departamento === filtroDepto;
    return matchEstatus && matchDepto;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 w-full flex justify-center">
        <div className="max-w-5xl w-full animate-fade-in-up">
            
            {/* Encabezado */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-blue-900">Tablero de Mantenimiento</h1>
                    <p className="text-gray-500 mt-1">Transparencia y seguimiento de reportes en CANACO</p>
                </div>
                <button 
                    onClick={() => navigate('/')} 
                    className="bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-800 transition transform hover:scale-105"
                >
                    ➕ Crear Nuevo Reporte
                </button>
            </div>

            {/* Barra de Filtros */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filtrar por Estatus</label>
                    <select 
                        className="w-full mt-2 p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        value={filtroEstatus}
                        onChange={(e) => setFiltroEstatus(e.target.value)}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="abierto">🟠 Abiertos (Pendientes)</option>
                        <option value="en_proceso">🔵 En Proceso</option>
                        <option value="resuelto">✅ Resueltos</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filtrar por Departamento</label>
                    <select 
                        className="w-full mt-2 p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
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
            </div>

            {/* Lista de Tickets (Solo Lectura) */}
            <div className="grid gap-6">
                {ticketsFiltrados.length > 0 ? (
                    ticketsFiltrados.map(t => (
                        <TicketCard 
                            key={t.id} 
                            ticket={t} 
                            usuario={{ rol: 'publico' }} // TRUCO: Finge ser público para ocultar botones admin
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
                    ))
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <span className="text-5xl">📭</span>
                        <h3 className="text-xl font-bold text-gray-700 mt-4">No hay reportes con estos filtros</h3>
                        <p className="text-gray-400 mt-2">Intenta cambiar las opciones de búsqueda.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}