const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 5173;

// Proxy estándar para peticiones HTTP de la API
app.use('/api', createProxyMiddleware({ 
    target: 'http://localhost:3000', 
    changeOrigin: true,
    pathRewrite: { '^/': '/api/' }
}));

// Proxy exclusivo para el tiempo real (WebSockets)
app.use('/socket.io', createProxyMiddleware({ 
    target: 'http://localhost:3000', 
    changeOrigin: true,
    ws: true,
    pathRewrite: { '^/': '/socket.io/' }
}));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'dist')));

// Soporte para React Router (cualquier otra ruta carga index.html)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const os = require('os');

// Bind a todas las interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor Frontend iniciado en el puerto ${PORT}`);
  console.log(`\nPuedes acceder a la aplicación desde la red local a través de las siguientes direcciones:`);
  
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`   ➜  ${interfaceName}: http://${iface.address}:${PORT}`);
      }
    }
  }
  console.log(`   ➜  Localhost: http://localhost:${PORT}\n`);
});