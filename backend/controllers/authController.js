const pool = require('../config/db');

// Registro de usuario (ACTUALIZADO CON TEL Y DEPTO)
const register = async (req, res) => {
  const { nombre, email, password, telefono, departamento } = req.body; 

  try {
    // 1. Verificar si ya existe
    const userExist = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // 2. Insertar nuevo usuario (Ahora con 5 campos)
    const newUser = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, telefono, departamento, rol) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nombre, email, password, telefono, departamento, 'empleado'] // Rol default: empleado
    );

    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor al registrar');
  }
};

// Login de usuario (SE QUEDA IGUAL)
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (user.rows.length === 0) return res.status(400).json({ error: 'Usuario no encontrado' });
        
        if (password !== user.rows[0].password) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }
        res.json(user.rows[0]);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

// --- NUEVA FUNCIÓN: OBTENER TODOS LOS USUARIOS (IDEA 5) ---
const getAllUsers = async (req, res) => {
    try {
        // Traemos todo MENOS la contraseña por seguridad
        // Ordenados alfabéticamente por nombre
        const users = await pool.query('SELECT id, nombre, email, rol, telefono, departamento FROM usuarios ORDER BY nombre ASC');
        res.json(users.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al obtener usuarios');
    }
};

module.exports = { register, login, getAllUsers };