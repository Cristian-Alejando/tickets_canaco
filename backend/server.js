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

// Configuramos Socket.io con las mismas reglas de CORS 
const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
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

// Activamos Helmet 
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false, 
}));

// Activamos Rate Limiting (Antispam)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 150, 
  message: { error: 'Demasiadas peticiones desde esta IP. Relájate y vuelve a intentar en 15 minutos. 🛑' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

// CONFIGURACIÓN CORS CRÍTICA PARA RED LOCAL (LAN)
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));

// Le decimos a Express que entienda el formato JSON
app.use(express.json());

// 👇 CORRECCIÓN: Aplicamos el antispam a las rutas con el prefijo /api
app.use('/api/tickets', limiter);
app.use('/api/auth', limiter);

// Hacer pública la carpeta de evidencias 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 2. IMPORTAR Y USAR RUTAS (API) ---
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

// 👇 CORRECCIÓN: Definimos las rutas de la API explícitamente con /api
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
// 👇 CORRECCIÓN: Le decimos a React que ignore cualquier cosa que empiece con /api o /uploads
app.get(/^(?!\/api|\/uploads).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// --- 5. INICIAR SERVIDOR ---
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor Backend + WebSockets en puerto: ${port}`);
  console.log(`🌐 Accesible en tu red local (LAN) a través de la IP de esta máquina`);
  console.log(`🛡️  Muralla activada: Helmet y Rate-Limit protegiendo el servidor`);
});