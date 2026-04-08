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
// XSS-CLEAN ELIMINADO

const app = express();
const port = process.env.PORT || 3000;

// Le decimos a Express que confíe en el primer proxy (Ngrok)
// Así el Rate-Limit leerá la IP real de la persona y no la de Ngrok
app.set('trust proxy', 1); 

// Creamos el servidor HTTP envolviendo nuestra app de Express 
const server = http.createServer(app);

// Configuramos Socket.io con las mismas reglas de CORS que tu Express 
const io = new Server(server, {
  cors: {
    origin: '*', // Permite que cualquier IP de tu red local se conecte
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

// Activamos Helmet (Oculta información sensible del servidor)
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false, // Lo apagamos para no bloquear tu frontend de React ni Ngrok
}));

// Activamos Rate Limiting (Antispam)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: 150, // Límite de 150 peticiones por IP en esa ventana de tiempo
  message: { error: 'Demasiadas peticiones desde esta IP. Relájate y vuelve a intentar en 15 minutos. 🛑' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

// CONFIGURACIÓN CORS CRÍTICA PARA RED LOCAL (LAN)
app.use(cors({
  origin: '*', // Permite que cualquier IP de tu red local se conecte
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // OPTIONS es vital para las peticiones pre-flight del navegador
  allowedHeaders: ['Content-Type', 'Authorization'] // Permite enviar JSON y tokens
}));

// Le decimos a Express que entienda el formato JSON
app.use(express.json());

// Aplicamos el antispam SOLO a las rutas de la API, no a las fotos ni al frontend
app.use('/tickets', limiter);
app.use('/auth', limiter);

// Hacer pública la carpeta de evidencias 
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
// Agregamos |\/uploads para que React no bloquee las imágenes 
app.get(/^(?!\/auth|\/tickets|\/uploads).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// --- 5. INICIAR SERVIDOR ---
// ¡IMPORTANTE! Ahora encendemos el 'server' (que trae HTTP + WebSockets), no el 'app' viejo 
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor Backend + WebSockets en puerto: ${port}`);
  console.log(`🌐 Accesible en tu red local (LAN) a través de la IP de esta máquina`);
  console.log(`🛡️  Muralla activada: Helmet y Rate-Limit protegiendo el servidor`);
});