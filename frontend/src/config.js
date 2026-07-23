// Configuración inyectada por el entorno (.env)
export const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `http://${window.location.hostname}:3000`;