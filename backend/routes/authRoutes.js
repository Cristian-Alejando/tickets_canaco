const router = require('express').Router();
const { login, register } = require('../controllers/authController');

// Definimos las rutas y qué función del controlador las atiende
router.post('/login', login);
router.post('/register', register);

module.exports = router;