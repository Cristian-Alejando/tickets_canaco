const pool = require('../config/db'); // Importamos la conexión que acabamos de crear

// Lógica de Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }
    const usuario = result.rows[0];
    if (password !== usuario.password) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }
    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
};

// Lógica de Registro
const register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    
    // 1. Verificar si ya existe
    const userExist = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: "Este correo ya está registrado." });
    }

    // 2. Crear usuario
    const newUser = await pool.query(
      "INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, 'empleado') RETURNING id, nombre, rol",
      [nombre, email, password]
    );

    res.json(newUser.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
};

module.exports = { login, register };