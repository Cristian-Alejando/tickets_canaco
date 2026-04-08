import { API_URL } from '../config';

const ngrokHeaders = {
  'ngrok-skip-browser-warning': 'true'
};

// 👇 NUEVO: Función para sacar el gafete VIP de la memoria del navegador 👇
const getAuthHeaders = () => {
    const token = localStorage.getItem('token_admin_canaco');
    if (token) {
        return { 
            ...ngrokHeaders, 
            'Authorization': `Bearer ${token}` 
        };
    }
    return ngrokHeaders;
};

// ==========================================
// 1. GESTIÓN DE USUARIOS
// ==========================================
export const loginUser = async (credentials) => {
  try {
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
    
    // 👇 NUEVO: ¡Guardamos el Token en la caja fuerte del navegador! 👇
    if (data.token) {
        localStorage.setItem('token_admin_canaco', data.token);
    }
    
    return data.user;
  } catch (error) {
    console.error("Error login:", error);
    return { error: "Error de conexión" };
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...ngrokHeaders // El registro no ocupa token
      },
      body: JSON.stringify(userData),
    });
    return await response.json();
  } catch (error) {
    console.error("Error register:", error);
    return { error: "Error de conexión" };
  }
};

export const getUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/users`, {
      // 👇 Usamos getAuthHeaders() para identificarnos como administradores 👇
      headers: getAuthHeaders() 
    });
    if (!response.ok) return []; 
    return await response.json();
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await fetch(`${API_URL}/auth/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders() // 👇 Protegido
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

export const getTickets = async (page = null, limit = null, filters = {}) => {
  try {
    let url = `${API_URL}/tickets`;
    const params = new URLSearchParams();

    if (page !== null && limit !== null) {
      params.append('page', page);
      params.append('limit', limit);
      if (filters.estatus) params.append('estatus', filters.estatus);
      if (filters.departamento) params.append('departamento', filters.departamento);
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await fetch(url, {
      headers: { ...ngrokHeaders } // Público, no necesita token
    });
    
    return await response.json();
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

    const response = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: { ...ngrokHeaders }, // Público, cualquiera puede crear
      body: formData, 
    });
    
    const data = await response.json();
    return { ok: response.ok, id: data.id };
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
        ...getAuthHeaders() // 👇 Protegido: Mostramos el gafete
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
        ...ngrokHeaders // Público
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
      headers: { ...ngrokHeaders } // Público
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
      headers: getAuthHeaders() // 👇 MÁXIMA SEGURIDAD: Mostramos el gafete para borrar
    });
    const data = await response.json();
    return { ok: response.ok, ...data };
  } catch (error) {
    console.error("Error al eliminar ticket:", error);
    return { ok: false, error: "Error de conexión" };
  }
};

export const getTicketBitacora = async (id) => {
  try {
    const response = await fetch(`${API_URL}/tickets/${id}/bitacora`, {
      headers: getAuthHeaders() // 👇 Protegido: Solo admins ven la bitácora
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error al cargar bitácora:", error);
    return [];
  }
};