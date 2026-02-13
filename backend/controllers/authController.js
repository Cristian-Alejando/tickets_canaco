const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'secreto_super_seguro';

// 1. REGISTRAR USUARIO
const register = async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  
  try {
    // Verificar si ya existe
    const userExist = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insertar en BD
    const newUser = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol',
      [nombre, email, hashedPassword, rol || 'tecnico']
    );

    // Crear Token
    const token = jwt.sign({ id: newUser.rows[0].id }, SECRET_KEY, { expiresIn: '8h' });

    res.json({ token, user: newUser.rows[0] });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error en el servidor al registrar' });
  }
};

// 2. LOGIN USUARIO (¡MODIFICADO PARA ACEPTAR CONTRASEÑAS VIEJAS!)
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    const dbPassword = user.rows[0].password;
    let validPassword = false;

    // A. PRIMER INTENTO: Verificar si es encriptada (Seguridad moderna)
    const isMatch = await bcrypt.compare(password, dbPassword);
    
    if (isMatch) {
      validPassword = true;
    } 
    // B. SEGUNDO INTENTO: Verificar si es texto plano (Usuario viejo)
    else if (password === dbPassword) {
      validPassword = true;
      console.log("⚠️ ALERTA: Usuario ingresó con contraseña NO encriptada.");
    }

    if (!validPassword) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    // Generar Token si pasó cualquiera de las dos pruebas
    const token = jwt.sign({ id: user.rows[0].id }, SECRET_KEY, { expiresIn: '8h' });

    res.json({
      token,
      user: {
        id: user.rows[0].id,
        nombre: user.rows[0].nombre,
        email: user.rows[0].email,
        rol: user.rows[0].rol
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
  }
};

// 3. OBTENER TODOS LOS USUARIOS
const getUsers = async (req, res) => {
  try {
    const allUsers = await pool.query('SELECT id, nombre, email, rol FROM usuarios ORDER BY id ASC');
    res.json(allUsers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// 4. ELIMINAR USUARIO
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING *', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

module.exports = {
  register,
  login,
  getUsers,
  deleteUser
};