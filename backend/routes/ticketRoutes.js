const router = require('express').Router();
const multer = require('multer');
const sharp = require('sharp'); // <-- 1. IMPORTAMOS SHARP (La licuadora de imágenes)
const path = require('path');

// 👇 NUEVO: Importamos a los cadeneros (Middlewares de Seguridad) 👇
const { verifyToken, requireAdmin, requireAdminOrTech } = require('../middlewares/authMiddleware');

const { 
  createTicket, 
  getAllTickets, 
  updateTicket, 
  voteTicket, 
  searchTickets,
  getUserVotes,
  deleteTicket,
  getTicketBitacora 
} = require('../controllers/ticketController');

// --- 2. CONFIGURACIÓN DE MULTER (ALTO RENDIMIENTO EN RAM) ---
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Formato no soportado. Solo se permiten imágenes.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } 
});

// --- ENVOLTORIO PARA ATRAPAR ERRORES DE MULTER ---
const atraparErroresMulter = (req, res, next) => {
  const uploadMiddleware = upload.single('evidencia');
  
  uploadMiddleware(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'La imagen es demasiado pesada. Máximo 15MB.' });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// --- 3. MOTOR DE COMPRESIÓN (SHARP) ---
const optimizarImagen = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `ticket-${uniqueSuffix}.webp`;
    const filepath = path.join(__dirname, '../uploads', filename);

    await sharp(req.file.buffer)
      .resize({ width: 1000, withoutEnlargement: true }) 
      .webp({ quality: 80 }) 
      .toFile(filepath); 

    req.file.filename = filename;
    next(); 
  } catch (error) {
    console.error("❌ Error en Sharp:", error);
    next(); 
  }
};

// ==========================================
// RUTAS DE LA API
// ==========================================

// 1. Obtener todos (PÚBLICO - Cualquiera puede ver el tablero)
router.get('/', getAllTickets);

// 2. Crear nuevo (PÚBLICO - Cualquiera puede levantar un reporte)
router.post('/', atraparErroresMulter, optimizarImagen, createTicket);

// 3. Buscar (PÚBLICO)
router.get('/buscar', searchTickets);

// 4. Historial de votos (PÚBLICO)
router.get('/mis-votos/:uid', getUserVotes);

// 5. Actualizar ticket (🔒 PROTEGIDO: Solo Admin o Técnico)
router.put('/:id', verifyToken, requireAdminOrTech, updateTicket);

// 6. Votar (PÚBLICO)
router.post('/:id/vote', voteTicket);

// 7. ELIMINAR TICKET (🔒 MÁXIMA SEGURIDAD: SOLO ADMIN)
router.delete('/:id', verifyToken, requireAdmin, deleteTicket);

// 8. OBTENER BITÁCORA DEL TICKET (🔒 PROTEGIDO: Solo Admin o Técnico)
router.get('/:id/bitacora', verifyToken, requireAdminOrTech, getTicketBitacora);

module.exports = router;