const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./config/db'); 
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// --- 1. MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- 2. IMPORTAR Y USAR RUTAS (API) ---
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

// Definimos las rutas de la API explícitamente
app.use('/auth', authRoutes); 
app.use('/tickets', ticketRoutes); 

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ mensaje: 'Conexión exitosa', hora: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en BD' });
  }
});

// --- 3. INTEGRACIÓN FRONTEND (ESTÁTICOS) ---
// Solo servir estáticos si no entró a ninguna ruta de la API arriba
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// --- 4. RUTA COMODÍN (SOLUCIÓN INFALIBLE PARA EXPRESS 5) ---
// Usamos una expresión regular directa para capturar cualquier ruta
app.get(/^(?!\/auth|\/tickets).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor en puerto: ${port}`);
});