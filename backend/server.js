require('dotenv').config(); // 1. SIEMPRE HASTA ARRIBA para cargar variables antes de usarlas
const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./config/db'); 

const app = express();
const port = process.env.PORT || 3000;

// --- 1. MIDDLEWARES ---
// CONFIGURACIÓN CORS CRÍTICA PARA RED LOCAL (LAN)
app.use(cors({
  origin: '*', // Permite que cualquier IP de tu red local se conecte
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // OPTIONS es vital para las peticiones pre-flight del navegador
  allowedHeaders: ['Content-Type', 'Authorization'] // Permite enviar JSON y tokens
}));

app.use(express.json());

// 👇 NUEVO: Hacer pública la carpeta de evidencias 👇
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
// 👇 NUEVO: Agregamos |\/uploads para que React no bloquee las imágenes 👇
app.get(/^(?!\/auth|\/tickets|\/uploads).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// --- 5. INICIAR SERVIDOR ---
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor Backend en puerto: ${port}`);
  console.log(`🌐 Accesible en tu red local (LAN) a través de la IP de esta máquina`);
});