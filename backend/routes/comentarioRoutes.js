const router = require('express').Router();
const { getComentarios, createComentario, deleteComentario } = require('../controllers/comentarioController');

// Rutas para el apartado de comentarios
router.get('/', getComentarios);
router.post('/', createComentario);
router.delete('/:id', deleteComentario);

module.exports = router;
