const express = require('express');
const router = express.Router();

// IMPORTANTE: Aquí los nombres deben ser IDÉNTICOS a los de authController.js
// Antes decía 'getAllUsers', ahora lo corregimos a 'getUsers'
const { login, register, getUsers, deleteUser } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);

// Rutas de gestión
router.get('/users', getUsers);          // <--- Ahora usa 'getUsers' (Correcto)
router.delete('/users/:id', deleteUser); // <--- Para borrar usuarios

module.exports = router;