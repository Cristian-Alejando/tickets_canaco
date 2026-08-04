import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import { getComentarios } from '../services/commentService';
import Footer from '../components/Footer';

export default function CommentsHistoryPage() {
  const navigate = useNavigate();

  // Estados principales
  const [comentarios, setComentarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados de filtros
  const [busqueda, setBusqueda] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [orden, setOrden] = useState('recientes');

  // Cargar comentarios iniciales
  const cargarComentarios = async () => {
    try {
      const data = await getComentarios();
      setComentarios(data);
    } catch (error) {
      console.error("Error al cargar comentarios:", error);
      toast.error("No se pudieron cargar los comentarios.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarComentarios();

    // Conexión WebSocket para tiempo real
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('comentario_creado', (nuevoComentario) => {
      setComentarios((prev) => {
        // Evitar duplicados si ya fue agregado localmente
        if (prev.some((c) => c.id === nuevoComentario.id)) return prev;
        return [nuevoComentario, ...prev];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Función para resetear todos los filtros
  const limpiarFiltros = () => {
    setBusqueda('');
    setFechaInicio('');
    setFechaFin('');
    setOrden('recientes');
  };

  const hayFiltrosActivos = busqueda.trim() !== '' || fechaInicio !== '' || fechaFin !== '' || orden !== 'recientes';

  // Lógica de filtrado y ordenamiento dinámico
  const comentariosFiltrados = useMemo(() => {
    let resultado = [...comentarios];

    // 1. Filtrado por texto (título o contenido)
    if (busqueda.trim()) {
      const query = busqueda.toLowerCase().trim();
      resultado = resultado.filter((c) => {
        const matchTitulo = c.titulo?.toLowerCase().includes(query);
        const matchProblematica = c.problematica?.toLowerCase().includes(query);
        return matchTitulo || matchProblematica;
      });
    }

    // 2. Filtrado por fecha inicial (Desde)
    if (fechaInicio) {
      const inicio = new Date(fechaInicio + 'T00:00:00');
      resultado = resultado.filter((c) => {
        const fecha = new Date(c.fecha_creacion);
        return !isNaN(fecha.getTime()) && fecha >= inicio;
      });
    }

    // 3. Filtrado por fecha final (Hasta)
    if (fechaFin) {
      const fin = new Date(fechaFin + 'T23:59:59.999');
      resultado = resultado.filter((c) => {
        const fecha = new Date(c.fecha_creacion);
        return !isNaN(fecha.getTime()) && fecha <= fin;
      });
    }

    // 4. Ordenamiento
    resultado.sort((a, b) => {
      const dateA = new Date(a.fecha_creacion).getTime() || 0;
      const dateB = new Date(b.fecha_creacion).getTime() || 0;

      if (orden === 'antiguos') {
        return dateA - dateB;
      }
      // 'recientes' (por defecto)
      return dateB - dateA;
    });

    return resultado;
  }, [comentarios, busqueda, fechaInicio, fechaFin, orden]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col w-full relative">
      <div className="flex-grow flex justify-center p-4 md:p-8">
        <div className="max-w-5xl w-full animate-fade-in-up">
          
          {/* --- ENCABEZADO --- */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-3xl">💬</span>
                <h1 className="text-3xl font-bold text-blue-900">
                  Tablero de Comentarios
                </h1>
              </div>
              <p className="text-gray-500 mt-1">
                Historial de retroalimentación, observaciones y comentarios de la comunidad CANACO
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold shadow-sm transition flex items-center gap-2"
              >
                🏠 Inicio
              </button>
              <button
                onClick={() => navigate('/comentarios')}
                className="bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-800 transition flex items-center gap-2 transform hover:scale-105"
              >
                <span>➕</span> + Nuevo Comentario
              </button>
            </div>
          </div>

          {/* --- BARRA DE FILTROS --- */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-blue-700 font-bold text-lg">🔍</span>
                <h2 className="text-base font-bold text-blue-950">
                  Filtros de Búsqueda
                </h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {comentariosFiltrados.length} {comentariosFiltrados.length === 1 ? 'comentario' : 'comentarios'}
                </span>
              </div>

              {hayFiltrosActivos && (
                <button
                  onClick={limpiarFiltros}
                  className="text-xs text-gray-500 hover:text-blue-600 font-semibold underline decoration-transparent hover:decoration-blue-600 transition"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Buscador de texto */}
              <div>
                <label htmlFor="busqueda-texto" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Buscador de texto
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    🔍
                  </span>
                  <input
                    id="busqueda-texto"
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Título o contenido..."
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Desde (Fecha inicial) */}
              <div>
                <label htmlFor="fecha-desde" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Desde
                </label>
                <input
                  id="fecha-desde"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Hasta (Fecha final) */}
              <div>
                <label htmlFor="fecha-hasta" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Hasta
                </label>
                <input
                  id="fecha-hasta"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Ordenar por */}
              <div>
                <label htmlFor="ordenar-por" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Ordenar por
                </label>
                <select
                  id="ordenar-por"
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="recientes">Más recientes</option>
                  <option value="antiguos">Más antiguos</option>
                </select>
              </div>
            </div>
          </div>

          {/* --- LISTADO DE COMENTARIOS --- */}
          {cargando ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
              <p className="text-gray-500 font-medium">Cargando comentarios...</p>
            </div>
          ) : comentariosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {comentariosFiltrados.map((comentario) => {
                const fechaObj = new Date(comentario.fecha_creacion);
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

                return (
                  <div
                    key={comentario.id}
                    className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <h3 className="text-lg font-bold text-blue-900 break-words">
                          {comentario.titulo}
                        </h3>
                        <span className="inline-flex items-center gap-1 self-start sm:self-auto text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                          <span>👤</span> Anónimo
                        </span>
                      </div>

                      <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 text-gray-700 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                        {comentario.problematica}
                      </div>
                    </div>

                    {/* Fecha y Hora */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 font-medium text-gray-600">
                          <span>📅</span>
                          <span><strong>Fecha:</strong> {fechaFormateada}</span>
                        </span>
                        <span className="flex items-center gap-1.5 font-medium text-gray-600">
                          <span>⏰</span>
                          <span><strong>Hora:</strong> {horaFormateada}</span>
                        </span>
                      </div>
                      <span className="font-mono text-gray-400 text-[11px]">
                        Folio #{comentario.id}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-5xl">💬</span>
              {hayFiltrosActivos ? (
                <>
                  <h3 className="text-xl font-bold text-gray-700 mt-4">Sin coincidencias</h3>
                  <p className="text-gray-400 mt-2">No se encontraron comentarios que coincidan con los filtros seleccionados.</p>
                  <button
                    onClick={limpiarFiltros}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                  >
                    Restablecer filtros
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-gray-700 mt-4">Aún no hay comentarios</h3>
                  <p className="text-gray-400 mt-2">Sé el primero en compartir una observación o sugerencia.</p>
                  <button
                    onClick={() => navigate('/comentarios')}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition shadow"
                  >
                    <span>➕</span> Publicar Comentario
                  </button>
                </>
              )}
            </div>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}
