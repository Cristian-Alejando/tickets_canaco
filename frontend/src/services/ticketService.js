import { API_URL } from '../config'; // Asegúrate de que esto esté arriba

// Cabecera para saltar la pantalla de advertencia de ngrok
const ngrokHeaders = {
  'ngrok-skip-browser-warning': 'true'
};

export const loginUser = async (credentials) => {
  try {
    // ESTA ES LA FORMA CORRECTA Y PROFESIONAL:
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...ngrokHeaders
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (!response.ok) return { error: data.error || 'Error al iniciar sesión' };
    return data.user;
  } catch (error) {
    console.error("Error login:", error);
    return { error: "Error de conexión" };
  }
};

// Registrar nuevo usuario (Para el Admin)
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...ngrokHeaders
      },
      body: JSON.stringify(userData),
    });
    return await response.json();
  } catch (error) {
    console.error("Error register:", error);
    return { error: "Error de conexión" };
  }
};

// Obtener todos los usuarios
export const getUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/users`, {
      headers: { ...ngrokHeaders }
    });
    // Validación extra para evitar errores si el backend falla
    if (!response.ok) return []; 
    return await response.json();
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
};

// Eliminar usuario
export const deleteUser = async (id) => {
  try {
    const response = await fetch(`${API_URL}/auth/users/${id}`, {
      method: 'DELETE',
      headers: { ...ngrokHeaders }
    });
    return response.ok;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
};

// ==========================================
// 2. GESTIÓN DE TICKETS
// ==========================================

export const getTickets = async () => {
  try {
    const response = await fetch(`${API_URL}/tickets`, {
      headers: { ...ngrokHeaders }
    });
    return await response.json();
  } catch (error) {
    console.error("Error getting tickets:", error);
    return [];
  }
};

// --- AQUÍ ESTÁ EL CAMBIO MÁGICO PARA ATRAPAR EL ID ---
export const createTicket = async (ticketData) => {
  try {
    const response = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...ngrokHeaders
      },
      body: JSON.stringify(ticketData),
    });
    
    // Capturamos la respuesta del backend (que trae el ID recién creado)
    const data = await response.json();
    
    // Devolvemos tanto el estado (ok) como el ID del ticket
    return { 
        ok: response.ok,
        id: data.id 
    };
  } catch (error) {
    console.error("Error creating ticket:", error);
    return { ok: false };
  }
};

export const updateTicket = async (id, updates) => {
  try {
    const response = await fetch(`${API_URL}/tickets/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...ngrokHeaders
      },
      body: JSON.stringify(updates),
    });
    return { ok: response.ok };
  } catch (error) {
    console.error("Error updating ticket:", error);
    return { ok: false };
  }
};

export const voteTicket = async (ticketId, userId) => {
  try {
    const response = await fetch(`${API_URL}/tickets/${ticketId}/vote`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...ngrokHeaders
      },
      body: JSON.stringify({ usuario_id: userId }),
    });
    return response; 
  } catch (error) {
    console.error("Error voting:", error);
    return { ok: false };
  }
};

export const getMyVotes = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/tickets/mis-votos/${userId}`, {
      headers: { ...ngrokHeaders }
    });
    return await response.json();
  } catch (error) {
    console.error("Error getting votes:", error);
    return [];
  }
};

export const deleteTicket = async (id) => {
  try {
    const response = await fetch(`${API_URL}/tickets/${id}`, {
      method: 'DELETE',
      headers: { ...ngrokHeaders }
    });
    const data = await response.json();
    return { ok: response.ok, ...data };
  } catch (error) {
    console.error("Error al eliminar ticket:", error);
    return { ok: false, error: "Error de conexión" };
  }
};