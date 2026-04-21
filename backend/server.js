require('dotenv').config(); 
const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 
const pool = require('./config/db'); 

// 👇 IMPORTAMOS LOS GUARDAESPALDAS DE SEGURIDAD 👇
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3000;

// Le decimos a Express que confíe en el primer proxy
app.set('trust proxy', 1); 

// Creamos el servidor HTTP envolviendo nuestra app de Express 
const server = http.createServer(app);

// CONFIGURACIÓN CORS PARA RED LOCAL (Definimos el origen exacto)
const corsOptions = {
  origin: "http://mantenimiento.canaco.net:5173", // Tu Frontend local
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Configuramos Socket.io con las reglas de CORS locales
const io = new Server(server, {
  cors: corsOptions
});

// Guardamos 'io' en la app de Express para poder usarlo en ticketController.js 
app.set('socketio', io);

// Escuchamos cuando alguien se conecta al "radio" 
io.on('connection', (socket) => {
  console.log(`🔌 Nuevo cliente conectado al WebSocket: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`🛑 Cliente desconectado: ${socket.id}`);
  });
});

// --- 1. MIDDLEWARES ---

// Activamos Helmet (Configurado para no bloquear recursos locales)
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false, 
}));

// Activamos Rate Limiting (Antispam)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 300, // Aumentamos un poco el límite para pruebas de desarrollo
  message: { error: 'Demasiadas peticiones. Relájate y vuelve a intentar en 15 minutos. 🛑' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

// APLICAMOS CORS A LA APP
app.use(cors(corsOptions));

// Le decimos a Express que entienda el formato JSON
app.use(express.json());

// Aplicamos el antispam a las rutas de la API
app.use('/api/', limiter);

// Hacer pública la carpeta de evidencias 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 2. IMPORTAR Y USAR RUTAS (API) ---
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

app.use('/api/auth', authRoutes); 
app.use('/api/tickets', ticketRoutes); 

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ mensaje: 'Conexión exitosa', hora: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en BD' });
  }
});

// --- 3. INTEGRACIÓN FRONTEND (ESTÁTICOS) ---
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// --- 4. RUTA COMODÍN (SOLUCIÓN INFALIBLE) ---
app.get(/^(?!\/api|\/uploads).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// --- 5. INICIAR SERVIDOR ---
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor Backend + WebSockets en puerto: ${port}`);
  console.log(`🌐 Dominio Local API: http://api-mantenimiento.canaco.net:${port}`);
  console.log(`🛡️  Infraestructura de red local configurada correctamente.`);
});