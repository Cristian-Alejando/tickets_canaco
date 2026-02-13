const router = require('express').Router();
const { 
  createTicket, 
  getAllTickets, 
  updateTicket, 
  voteTicket, 
  searchTickets,
  getUserVotes 
} = require('../controllers/ticketController');

// IMPORTANTE: En server.js ya definimos que todo esto vive bajo '/tickets'.
// Por eso, aquí quitamos el prefijo '/tickets' para no duplicarlo.

// 1. Obtener todos (GET /tickets)
router.get('/', getAllTickets);

// 2. Crear nuevo (POST /tickets)
router.post('/', createTicket);

// 3. Buscar (GET /tickets/buscar)
router.get('/buscar', searchTickets);

// 4. Historial de votos (GET /tickets/mis-votos/:uid)
// Nota: Usamos :uid para que coincida con el controlador
router.get('/mis-votos/:uid', getUserVotes);

// 5. Actualizar ticket (PUT /tickets/:id)
router.put('/:id', updateTicket);

// 6. Votar (POST /tickets/:id/vote)
// CORRECCIÓN: El frontend usa POST y la ruta terminada en /vote
router.post('/:id/vote', voteTicket);

module.exports = router;