import { API_URL } from '../config';

// --- AUTENTICACIÓN ---
export const loginUser = async (credentials) => {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return await res.json();
};

export const registerUser = async (userData) => {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return await res.json();
};

// --- TICKETS ---
export const getTickets = async () => {
  const res = await fetch(`${API_URL}/tickets`);
  return await res.json();
};

export const createTicket = async (ticketData) => {
  const res = await fetch(`${API_URL}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticketData)
  });
  return res;
};

export const updateTicket = async (id, data) => {
  const res = await fetch(`${API_URL}/tickets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res;
};

export const voteTicket = async (id, userId) => {
  const res = await fetch(`${API_URL}/tickets/${id}/voto`, { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario_id: userId }) 
  });
  return res;
};

export const getMyVotes = async (userId) => {
    const res = await fetch(`${API_URL}/mis-votos/${userId}`);
    return await res.json();
};

// --- USUARIOS (ESTA ES LA QUE FALTABA) ---
export const getUsers = async () => {
    const res = await fetch(`${API_URL}/users`);
    return await res.json();
};