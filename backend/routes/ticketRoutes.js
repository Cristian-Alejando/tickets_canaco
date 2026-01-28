const router = require('express').Router();
const { 
  createTicket, 
  getAllTickets, 
  updateTicket, 
  voteTicket, 
  searchTickets,
  getUserVotes 
} = require('../controllers/ticketController');

// Rutas de Tickets
router.post('/tickets', createTicket);
router.get('/tickets', getAllTickets);
router.put('/tickets/:id', updateTicket);
router.put('/tickets/:id/voto', voteTicket);
router.get('/tickets/buscar', searchTickets);

// Ruta de Historial de Votos (aunque no empiece con /tickets, tiene sentido que viva aquí)
router.get('/mis-votos/:usuario_id', getUserVotes);

module.exports = router;