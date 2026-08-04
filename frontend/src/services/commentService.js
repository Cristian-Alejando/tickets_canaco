import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL
});

export const getComentarios = async () => {
  try {
    const { data } = await api.get('/comentarios');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error al obtener comentarios:", error);
    return [];
  }
};

export const createComentario = async (comentarioData) => {
  try {
    const { data } = await api.post('/comentarios', comentarioData);
    return { ok: true, data };
  } catch (error) {
    console.error("Error al crear comentario:", error);
    return {
      ok: false,
      error: error.response?.data?.error || "Error de conexión con el servidor"
    };
  }
};

export const deleteComentario = async (id) => {
  try {
    const { data } = await api.delete(`/comentarios/${id}`);
    return { ok: true, data };
  } catch (error) {
    console.error("Error al eliminar comentario:", error);
    return {
      ok: false,
      error: error.response?.data?.error || "Error al eliminar el comentario"
    };
  }
};
