const express = require('express');
const router = express.Router();

// 👇 NUEVO: Importamos a los cadeneros (Middlewares de Seguridad) 👇
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

// IMPORTANTE: Aquí los nombres deben ser IDÉNTICOS a los de authController.js
const { login, register, getUsers, deleteUser } = require('../controllers/authController');

// --- RUTAS PÚBLICAS ---
router.post('/login', login);

// --- RUTAS DE REGISTRO (🔒 PROTEGIDAS: Solo Administradores) ---
// Solo administradores pueden dar de alta a nuevo personal (Escalada de privilegios parcheada)
router.post('/register', verifyToken, requireAdmin, register);

// --- RUTAS DE GESTIÓN (🔒 PROTEGIDAS: Solo Administradores) ---
// Ahora nadie puede ver ni borrar usuarios si no tiene un token válido de Admin
router.get('/users', verifyToken, requireAdmin, getUsers);          
router.delete('/users/:id', verifyToken, requireAdmin, deleteUser); 

module.exports = router;