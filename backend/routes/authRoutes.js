const router = require('express').Router();
// Importamos 'login', 'register' y la NUEVA función 'getAllUsers'
const { login, register, getAllUsers } = require('../controllers/authController');

// Definimos las rutas y qué función del controlador las atiende
router.post('/login', login);
router.post('/register', register);

// --- NUEVA RUTA (Idea 5): Ver lista de usuarios ---
router.get('/users', getAllUsers);

module.exports = router;