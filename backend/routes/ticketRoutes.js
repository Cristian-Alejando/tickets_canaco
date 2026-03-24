const router = require('express').Router();
const multer = require('multer');
const sharp = require('sharp'); // <-- 1. IMPORTAMOS SHARP (La licuadora de imágenes)
const path = require('path');

const { 
  createTicket, 
  getAllTickets, 
  updateTicket, 
  voteTicket, 
  searchTickets,
  getUserVotes,
  deleteTicket 
} = require('../controllers/ticketController');

// --- 2. CONFIGURACIÓN DE MULTER (ALTO RENDIMIENTO EN RAM) ---
// En lugar de guardar en disco, lo retenemos en la memoria para procesarlo al vuelo con Sharp. Esto es mucho más rápido y eficiente.
const storage = multer.memoryStorage();

// Filtro estricto: Solo dejamos pasar imágenes reales, nada de PDFs o EXEs disfrazados. Esto mejora la seguridad y evita errores en Sharp.
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Formato no soportado. Solo se permiten imágenes.'), false);
  }
};

// Inicializamos el middleware con límite de peso (15MB)
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } 
});

// --- NUEVO: ENVOLTORIO PARA ATRAPAR ERRORES DE MULTER ---
// Este middleware intercepta los errores de Multer antes de que rompan el servidor
const atraparErroresMulter = (req, res, next) => {
  const uploadMiddleware = upload.single('evidencia');
  
  uploadMiddleware(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Error propio de Multer (ej. el archivo pesa más de los 15MB permitidos)
      return res.status(400).json({ error: 'La imagen es demasiado pesada. Máximo 15MB.' });
    } else if (err) {
      // Error de nuestro filtro (ej. intentaron subir un PDF o un EXE)
      return res.status(400).json({ error: err.message });
    }
    // Si no hubo ningún error, continuamos al siguiente paso (Sharp)
    next();
  });
};

// --- 3. MOTOR DE COMPRESIÓN (SHARP) ---
const optimizarImagen = async (req, res, next) => {
  if (!req.file) return next(); // Si no mandaron foto, seguimos de largo

  try {
    // Generamos el nombre único con extensión .webp (formato súper ligero)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `ticket-${uniqueSuffix}.webp`;
    const filepath = path.join(__dirname, '../uploads', filename);

    // Agarramos la foto flotante de la RAM, la achicamos y la guardamos en el disco
    await sharp(req.file.buffer)
      .resize({ width: 1000, withoutEnlargement: true }) // Máximo 1000px de ancho
      .webp({ quality: 80 }) // Compresión moderna
      .toFile(filepath); 

    // Engañamos a tu controlador original pasándole el nombre de la nueva foto
    req.file.filename = filename;
    
    next(); // Brincamos a createTicket
  } catch (error) {
    console.error("❌ Error en Sharp:", error);
    next(); // Si algo falla, el ticket se crea de todos modos sin foto
  }
};

// IMPORTANTE: En server.js ya definimos que todo esto vive bajo '/tickets'.

// 1. Obtener todos (GET /tickets)
router.get('/', getAllTickets);

// 2. Crear nuevo (POST /tickets)
// <-- 4. LA MAGIA OCURRE AQUÍ: Atrapa Errores -> Pasa por Sharp (Comprime) -> createTicket (Guarda en BD)
router.post('/', atraparErroresMulter, optimizarImagen, createTicket);

// 3. Buscar (GET /tickets/buscar)
router.get('/buscar', searchTickets);

// 4. Historial de votos (GET /tickets/mis-votos/:uid)
router.get('/mis-votos/:uid', getUserVotes);

// 5. Actualizar ticket (PUT /tickets/:id)
router.put('/:id', updateTicket);

// 6. Votar (POST /tickets/:id/vote)
router.post('/:id/vote', voteTicket);

// 7. ELIMINAR TICKET (DELETE /tickets/:id)
router.delete('/:id', deleteTicket);

module.exports = router;