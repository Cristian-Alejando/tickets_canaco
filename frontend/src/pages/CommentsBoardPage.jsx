import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { createComentario } from '../services/commentService';
import Footer from '../components/Footer';

export default function CommentsBoardPage() {
  const navigate = useNavigate();

  // Estados del Formulario
  const [titulo, setTitulo] = useState('');
  const [problematica, setProblematica] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Manejador para enviar un nuevo comentario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!titulo.trim()) {
      toast.error('Por favor ingresa un título para el comentario.');
      return;
    }

    if (!problematica.trim()) {
      toast.error('Por favor describe la problemática.');
      return;
    }

    setEnviando(true);
    try {
      const res = await createComentario({
        titulo: titulo.trim(),
        problematica: problematica.trim()
      });

      if (res.ok) {
        toast.success('¡Comentario publicado exitosamente!');
        setTitulo('');
        setProblematica('');
      } else {
        toast.error(res.error || 'Ocurrió un error al publicar el comentario.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error de conexión al enviar el comentario.');
    } finally {
      setEnviando(false);
    }
  };

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
                  Visualizador de observaciones
                </h1>
              </div>
              <p className="text-gray-500 mt-1">
                Espacio de retroalimentación, observaciones y comentarios de la comunidad CANACO
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
                onClick={() => navigate('/comentarios/historial')}
                className="bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-800 transition flex items-center gap-2"
              >
                👀 Ver Tablero
              </button>
            </div>
          </div>

          {/* --- FORMULARIO DE CREACIÓN (100% ANÓNIMO) --- */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 md:p-8 mb-8 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-gray-100 gap-2">
              <div>
                <h2 className="text-lg font-bold text-blue-950 flex items-center gap-2">
                  <span>✍️</span> Agregar Nuevo Comentario
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Comparte tus observaciones o sugerencias generales de forma anónima
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="titulo" className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  id="titulo"
                  type="text"
                  required
                  maxLength={180}
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Observación sobre iluminación en estacionamiento"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
                />
              </div>

              <div>
                <label htmlFor="problematica" className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Comentario <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="problematica"
                  required
                  rows={4}
                  maxLength={1200}
                  value={problematica}
                  onChange={(e) => setProblematica(e.target.value)}
                  placeholder="Describe aquí detalladamente tu sugerencia o comentario general..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition resize-y"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={enviando}
                  className={`px-7 py-3 rounded-xl font-bold text-white shadow-md transition-all flex items-center gap-2 ${
                    enviando 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-700 hover:bg-blue-800 active:scale-98'
                  }`}
                >
                  {enviando ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Publicando...
                    </>
                  ) : (
                    <>
                      <span>📤</span> Publicar Comentario
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
