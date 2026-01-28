const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./config/db'); // Conexión
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// --- IMPORTAR RUTAS ---
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

// --- USAR RUTAS ---
app.use('/', authRoutes);   // Login y Registro
app.use('/', ticketRoutes); // Tickets, Votos y Buscador

// Test de Base de Datos (Simple)
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ mensaje: 'Conexión exitosa a la Base de Datos 🗄️', hora: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error conectando a la base de datos' });
  }
});

// --- INTEGRACIÓN FRONTEND ---
// Servir archivos estáticos del build de React
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Cualquier ruta no atrapada por la API, la maneja React (para que no de error 404 al recargar)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// --- INICIAR SERVIDOR ---
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Sistema UNIFICADO (Arquitectura MVC) listo en puerto: ${port}`);
});