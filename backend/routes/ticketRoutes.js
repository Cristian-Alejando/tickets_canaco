const router = require('express').Router();
const { 
  createTicket, 
  getAllTickets, 
  updateTicket, 
  voteTicket, 
  searchTickets,
  getUserVotes,
  deleteTicket // <--- 1. AQUÍ AGREGAMOS LA IMPORTACIÓN
} = require('../controllers/ticketController');

// IMPORTANTE: En server.js ya definimos que todo esto vive bajo '/tickets'.

// 1. Obtener todos (GET /tickets)
router.get('/', getAllTickets);

// 2. Crear nuevo (POST /tickets)
router.post('/', createTicket);

// 3. Buscar (GET /tickets/buscar)
router.get('/buscar', searchTickets);

// 4. Historial de votos (GET /tickets/mis-votos/:uid)
router.get('/mis-votos/:uid', getUserVotes);

// 5. Actualizar ticket (PUT /tickets/:id)
router.put('/:id', updateTicket);

// 6. Votar (POST /tickets/:id/vote)
router.post('/:id/vote', voteTicket);

// 7. ELIMINAR TICKET (DELETE /tickets/:id)
// <--- 2. AQUÍ AGREGAMOS LA RUTA NUEVA
router.delete('/:id', deleteTicket);

module.exports = router;