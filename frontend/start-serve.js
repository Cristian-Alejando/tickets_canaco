const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 5173;

// Proxy estándar para peticiones HTTP de la API
app.use('/api', createProxyMiddleware({ 
    target: 'http://localhost:3000', 
    changeOrigin: true 
}));

// Proxy exclusivo para el tiempo real (WebSockets)
app.use('/socket.io', createProxyMiddleware({ 
    target: 'http://localhost:3000', 
    changeOrigin: true,
    ws: true 
}));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'dist')));

// Soporte para React Router (cualquier otra ruta carga index.html)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Bind a todas las interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de producción iniciado en el puerto ${PORT} en todas las interfaces de red (0.0.0.0)`);
});