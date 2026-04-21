import axios from 'axios';
import { API_URL } from '../config';

// 👇 Función para sacar el token de la memoria del navegador 👇
const getAuthHeaders = () => {
    const token = localStorage.getItem('token_admin_canaco');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// ==========================================
// 1. GESTIÓN DE USUARIOS
// ==========================================
export const loginUser = async (credentials) => {
  try {
    const { data } = await axios.post(`${API_URL}/auth/login`, credentials);
    
    if (data.token) {
        localStorage.setItem('token_admin_canaco', data.token);
    }
    return data.user;
  } catch (error) {
    console.error("Error login:", error);
    return { error: error.response?.data?.error || "Error de conexión" };
  }
};

export const registerUser = async (userData) => {
  try {
    const { data } = await axios.post(`${API_URL}/auth/register`, userData);
    return data;
  } catch (error) {
    console.error("Error register:", error);
    return { error: "Error de conexión" };
  }
};

export const getUsers = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/auth/users`, {
      headers: getAuthHeaders()
    });
    return data;
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
};

export const deleteUser = async (id) => {
  try {
    await axios.delete(`${API_URL}/auth/users/${id}`, {
      headers: getAuthHeaders()
    });
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
};

// ==========================================
// 2. GESTIÓN DE TICKETS
// ==========================================

export const getTickets = async (page = null, limit = null, filters = {}) => {
  try {
    const params = {};
    if (page !== null && limit !== null) {
      params.page = page;
      params.limit = limit;
      if (filters.estatus) params.estatus = filters.estatus;
      if (filters.departamento) params.departamento = filters.departamento;
      if (filters.fechaInicio) params.fechaInicio = filters.fechaInicio;
      if (filters.fechaFin) params.fechaFin = filters.fechaFin;
    }

    const { data } = await axios.get(`${API_URL}/tickets`, { params });
    return data;
  } catch (error) {
    console.error("Error getting tickets:", error);
    return [];
  }
};

export const createTicket = async (ticketData) => {
  try {
    const formData = new FormData();
    for (const key in ticketData) {
      if (ticketData[key] !== null && ticketData[key] !== undefined && ticketData[key] !== '') {
         formData.append(key, ticketData[key]);
      }
    }

    const { data } = await axios.post(`${API_URL}/tickets`, formData);
    return { ok: true, id: data.id };
  } catch (error) {
    console.error("Error creating ticket:", error);
    if (error.response?.status === 409) {
        return { error: error.response.data.error, ticketExistente: error.response.data.ticketExistente };
    }
    return { ok: false, error: "Error de conexión" };
  }
};

export const updateTicket = async (id, updates) => {
  try {
    await axios.put(`${API_URL}/tickets/${id}`, updates, {
      headers: getAuthHeaders()
    });
    return { ok: true };
  } catch (error) {
    console.error("Error updating ticket:", error);
    return { ok: false };
  }
};

export const voteTicket = async (ticketId, userId) => {
  try {
    const response = await axios.post(`${API_URL}/tickets/${ticketId}/vote`, { usuario_id: userId });
    return response;
  } catch (error) {
    console.error("Error voting:", error);
    return { ok: false };
  }
};

export const getMyVotes = async (userId) => {
  try {
    const { data } = await axios.get(`${API_URL}/tickets/mis-votos/${userId}`);
    return data;
  } catch (error) {
    console.error("Error getting votes:", error);
    return [];
  }
};

export const deleteTicket = async (id) => {
  try {
    const { data } = await axios.delete(`${API_URL}/tickets/${id}`, {
      headers: getAuthHeaders()
    });
    return { ok: true, ...data };
  } catch (error) {
    console.error("Error al eliminar ticket:", error);
    return { ok: false, error: "Error de conexión" };
  }
};

export const getTicketBitacora = async (id) => {
  try {
    const { data } = await axios.get(`${API_URL}/tickets/${id}/bitacora`, {
      headers: getAuthHeaders()
    });
    return data;
  } catch (error) {
    console.error("Error al cargar bitácora:", error);
    return [];
  }
};

// ==========================================
// 3. BUSCADOR INTELIGENTE
// ==========================================
export const searchTickets = async (query, ubicacion) => {
  try {
    const { data } = await axios.get(`${API_URL}/tickets/buscar`, {
      params: { q: query, ubicacion: ubicacion }
    });
    return data;
  } catch (error) {
    console.error("Error buscando tickets sugeridos:", error);
    return [];
  }
};