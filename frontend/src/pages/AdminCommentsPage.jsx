import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import { getComentarios, deleteComentario } from '../services/commentService';

export default function AdminCommentsPage() {
  const [comentarios, setComentarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');

  // Modal para ver detalle completo del comentario
  const [modalComentario, setModalComentario] = useState(null);

  // Cargar comentarios desde el servicio
  const cargarComentarios = async () => {
    try {
      setCargando(true);
      const data = await getComentarios();
      setComentarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar comentarios en admin:", error);
      toast.error("No se pudieron cargar los comentarios.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarComentarios();

    // Conexión WebSocket para recibir comentarios nuevos y eliminaciones en tiempo real
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('comentario_creado', (nuevoComentario) => {
      setComentarios((prev) => {
        if (prev.some((c) => c.id === nuevoComentario.id)) return prev;
        return [nuevoComentario, ...prev];
      });
      toast.success(`💬 Nuevo comentario recibido: "${nuevoComentario.titulo}"`, { icon: '🔔' });
    });

    socket.on('comentario_eliminado', (deletedId) => {
      setComentarios((prev) => prev.filter((c) => c.id !== deletedId));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Manejador para eliminar comentario con confirmación nativa
  const handleEliminar = async (id) => {
    const confirmado = window.confirm('¿Estás seguro de que deseas eliminar este comentario? Esta acción no se puede deshacer.');
    if (!confirmado) return;

    try {
      const res = await deleteComentario(id);
      if (res.ok) {
        toast.success('Comentario eliminado exitosamente');
        setComentarios((prev) => prev.filter((c) => c.id !== id));
        if (modalComentario?.id === id) {
          setModalComentario(null);
        }
      } else {
        toast.error(res.error || 'Error al eliminar el comentario');
      }
    } catch (error) {
      console.error("Error al eliminar comentario:", error);
      toast.error('Error de conexión al intentar eliminar');
    }
  };

  // Función para resetear filtros
  const limpiarFiltros = () => {
    setFiltroTexto('');
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
  };

  // Normalizador de texto para búsqueda insensible a acentos
  const normalizarTexto = (str) => {
    return str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
  };

  // Filtrado reactivo en memoria
  const comentariosFiltrados = useMemo(() => {
    const textoBuscado = normalizarTexto(filtroTexto.trim());

    return comentarios.filter((c) => {
      // 1. Filtro por texto o folio
      if (textoBuscado) {
        const matchFolio = c.id?.toString().includes(textoBuscado);
        const matchTitulo = normalizarTexto(c.titulo).includes(textoBuscado);
        const matchProblematica = normalizarTexto(c.problematica).includes(textoBuscado);
        if (!matchFolio && !matchTitulo && !matchProblematica) return false;
      }

      // 2. Filtro fecha inicio
      if (filtroFechaInicio) {
        const fechaComentario = c.fecha_creacion?.substring(0, 10);
        if (fechaComentario && fechaComentario < filtroFechaInicio) return false;
      }

      // 3. Filtro fecha fin
      if (filtroFechaFin) {
        const fechaComentario = c.fecha_creacion?.substring(0, 10);
        if (fechaComentario && fechaComentario > filtroFechaFin) return false;
      }

      return true;
    });
  }, [comentarios, filtroTexto, filtroFechaInicio, filtroFechaFin]);

  // Exportar comentarios filtrados a Excel
  const exportarAExcel = () => {
    if (comentariosFiltrados.length === 0) {
      toast.error('No hay comentarios en pantalla para exportar.');
      return;
    }

    const datosLimpios = comentariosFiltrados.map((c) => {
      const fechaObj = new Date(c.fecha_creacion);
      const fechaFormateada = isNaN(fechaObj.getTime())
        ? 'Sin fecha'
        : fechaObj.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
      const horaFormateada = isNaN(fechaObj.getTime())
        ? 'Sin hora'
        : fechaObj.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

      return {
        "Folio": `#${c.id}`,
        "Título del Comentario": c.titulo || 'Sin título',
        "Descripción / Problemática": c.problematica || '',
        "Fecha de Publicación": fechaFormateada,
        "Hora": horaFormateada,
        "Tipo": "Anónimo"
      };
    });

    const hoja = XLSX.utils.json_to_sheet(datosLimpios);
    hoja['!cols'] = [
      { wch: 10 },
      { wch: 35 },
      { wch: 60 },
      { wch: 22 },
      { wch: 14 },
      { wch: 12 }
    ];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Comentarios_Generales");

    const fechaHoy = new Date().toLocaleDateString().replace(/\//g, '-');
    XLSX.writeFile(libro, `Comentarios_CANACO_${fechaHoy}.xlsx`);

    toast.success('Excel de comentarios descargado correctamente');
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up">
      
      {/* --- TARJETA DE BÚSQUEDA Y FILTROS --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Centro de Búsqueda y Filtros
          </h3>
          <button 
            onClick={limpiarFiltros} 
            className="text-sm text-gray-500 hover:text-blue-600 font-semibold underline decoration-transparent hover:decoration-blue-600 transition"
          >
            Limpiar Filtros
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          {/* Buscador (Folio o Texto) */}
          <div className="md:col-span-1 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar (Folio o Texto)
            </label>
            <input 
              type="text" 
              placeholder="Ej. 12 o 'estacionamiento'" 
              className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm" 
              value={filtroTexto} 
              onChange={(e) => setFiltroTexto(e.target.value)} 
            />
          </div>

          {/* Desde (Fecha) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input 
              type="date" 
              className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm" 
              value={filtroFechaInicio} 
              onChange={(e) => setFiltroFechaInicio(e.target.value)} 
            />
          </div>

          {/* Hasta (Fecha) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input 
              type="date" 
              className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm" 
              value={filtroFechaFin} 
              onChange={(e) => setFiltroFechaFin(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center border-t border-gray-100 pt-4 mt-2 gap-3">
          <p className="text-sm text-gray-500 font-medium">
            Mostrando {comentariosFiltrados.length} {comentariosFiltrados.length === 1 ? 'resultado' : 'resultados'} en total
          </p>
          <button 
            onClick={exportarAExcel} 
            className="w-full sm:w-auto px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar a Excel
          </button>
        </div>
      </div>

      {/* --- TABLA DE DATOS --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-blue-50/80 border-b border-blue-100">
              <tr className="text-blue-900 text-sm">
                <th className="p-4 font-bold w-24">Folio</th>
                <th className="p-4 font-bold w-36">Fecha</th>
                <th className="p-4 font-bold">Título / Comentario</th>
                <th className="p-4 font-bold text-center w-52">Acción</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {cargando ? (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-gray-500 font-medium">
                    <div className="animate-spin inline-block w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full mb-2"></div>
                    <p>Cargando comentarios...</p>
                  </td>
                </tr>
              ) : comentariosFiltrados.length > 0 ? (
                comentariosFiltrados.map((c) => {
                  const fechaObj = new Date(c.fecha_creacion);
                  const fechaFormateada = isNaN(fechaObj.getTime())
                    ? 'Sin fecha'
                    : fechaObj.toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      });
                  const horaFormateada = isNaN(fechaObj.getTime())
                    ? ''
                    : fechaObj.toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });

                  return (
                    <tr 
                      key={c.id} 
                      className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-gray-500 align-top">
                        #{c.id}
                      </td>
                      <td className="p-4 text-gray-600 align-top whitespace-nowrap">
                        <div className="font-medium text-gray-800">{fechaFormateada}</div>
                        {horaFormateada && (
                          <div className="text-xs text-gray-400 mt-0.5">{horaFormateada}</div>
                        )}
                      </td>
                      <td className="p-4 align-top">
                        <p className="font-bold text-gray-800 break-words">{c.titulo}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed whitespace-pre-wrap">
                          {c.problematica}
                        </p>
                      </td>
                      <td className="p-4 text-center align-top whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setModalComentario(c)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-sm inline-flex items-center gap-1"
                            title="Ver detalle del comentario"
                          >
                            <span>👁️</span> Ver Detalle
                          </button>
                          <button
                            onClick={() => handleEliminar(c.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 shadow-sm inline-flex items-center gap-1"
                            title="Eliminar comentario"
                          >
                            <span>🗑️</span> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-gray-500 font-medium">
                    No se encontraron comentarios con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL FLOTANTE DE DETALLE DEL COMENTARIO --- */}
      {modalComentario && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4" 
          onClick={() => setModalComentario(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative p-6 md:p-8 animate-scale-in" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setModalComentario(null)} 
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition p-2 rounded-full hover:bg-gray-100 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-lg">
                    Folio #{modalComentario.id}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                    <span>👤</span> Anónimo
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  📅 {new Date(modalComentario.fecha_creacion).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })} - ⏰ {new Date(modalComentario.fecha_creacion).toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Título
                  </h4>
                  <h2 className="text-xl font-bold text-blue-950 break-words">
                    {modalComentario.titulo}
                  </h2>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Contenido del Comentario
                  </h4>
                  <div className="bg-gray-50/90 rounded-2xl p-5 border border-gray-100 text-gray-800 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                    {modalComentario.problematica}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                <button
                  onClick={() => handleEliminar(modalComentario.id)}
                  className="px-4 py-2 rounded-xl font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center gap-1 text-sm"
                >
                  <span>🗑️</span> Eliminar Comentario
                </button>
                <button
                  onClick={() => setModalComentario(null)}
                  className="px-5 py-2 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
