const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./config/db'); 
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// --- MIDDLEWARES (Los porteros) ---
app.use(cors());
app.use(express.json()); // Vital para leer JSON del frontend

// --- IMPORTAR RUTAS ---
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

// --- USAR RUTAS (EL MAPA DEL EDIFICIO) ---

// 1. Rutas de Autenticación
// Antes estaba en '/', ahora lo mantenemos en '/auth' para que funcione el login
app.use('/auth', authRoutes); 

// 2. Rutas de Tickets
// Definimos el prefijo '/tickets' para ordenar el tráfico.
app.use('/tickets', ticketRoutes); 

// 3. Test de Base de Datos (MANTENIDO IGUAL) 🗄️
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ mensaje: 'Conexión exitosa a la Base de Datos 🗄️', hora: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error conectando a la base de datos' });
  }
});

// --- INTEGRACIÓN FRONTEND (MANTENIDO IGUAL) 🎨 ---
// Esto sirve los archivos estáticos cuando compiles React (build)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// [AQUÍ ESTÁ LA CORRECCIÓN] 🛠️
// El error "Missing parameter name at index 1: *" ocurre porque la librería nueva
// ya no permite usar '*' solo. Lo cambiamos por /(.*)/ que significa lo mismo
// ("cualquier ruta") pero escrito en un formato que sí acepta.
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// --- INICIAR SERVIDOR ---
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Sistema UNIFICADO listo en puerto: ${port}`);
});