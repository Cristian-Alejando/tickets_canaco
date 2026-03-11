const router = require('express').Router();
const multer = require('multer'); // <-- 1. IMPORTAMOS MULTER
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

// --- 2. CONFIGURACIÓN DE MULTER (EL GUARDIA DE LAS FOTOS) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Aquí le decimos que las guarde en tu nueva carpeta
  },
  filename: function (req, file, cb) {
    // Le ponemos la fecha exacta + un número al azar para que el nombre sea 100% único
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname); // Sacamos si es .png, .jpg, etc.
    cb(null, 'ticket-' + uniqueSuffix + extension); 
  }
});

// Inicializamos el middleware
const upload = multer({ storage: storage });

// IMPORTANTE: En server.js ya definimos que todo esto vive bajo '/tickets'.

// 1. Obtener todos (GET /tickets)
router.get('/', getAllTickets);

// 2. Crear nuevo (POST /tickets)
// <-- 3. AQUÍ LE INYECTAMOS MULTER. Le decimos que espere UN archivo llamado 'evidencia'
router.post('/', upload.single('evidencia'), createTicket);

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