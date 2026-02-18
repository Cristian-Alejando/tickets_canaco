const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'secreto_super_seguro';

// ==========================================
// 1. REGISTRAR USUARIO
// ==========================================
const register = async (req, res) => {
  const { nombre, email, password, rol, telefono } = req.body;
  
  try {
    // Verificar si ya existe el correo
    const userExist = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insertar en BD
    // NOTA: La columna 'activo' se pone en TRUE automáticamente por la base de datos (DEFAULT TRUE)
    const newUser = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol, telefono) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, email, rol, telefono, activo',
      [nombre, email, hashedPassword, rol || 'empleado', telefono] 
    );

    // Crear Token
    const token = jwt.sign({ id: newUser.rows[0].id }, SECRET_KEY, { expiresIn: '8h' });

    res.json({ token, user: newUser.rows[0] });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error en el servidor al registrar' });
  }
};

// ==========================================
// 2. LOGIN USUARIO (Con Protección de "Activo")
// ==========================================
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    // --- NUEVO BLOQUE DE SEGURIDAD ---
    // Si el usuario fue "borrado" (desactivado), no lo dejamos entrar.
    if (user.rows[0].activo === false) { 
        return res.status(401).json({ error: 'Este usuario ha sido desactivado. Contacta al administrador.' });
    }
    // ----------------------------------

    const dbPassword = user.rows[0].password;
    let validPassword = false;

    // A. PRIMER INTENTO: Verificar si es encriptada
    const isMatch = await bcrypt.compare(password, dbPassword);
    
    if (isMatch) {
      validPassword = true;
    } 
    // B. SEGUNDO INTENTO: Verificar si es texto plano
    else if (password === dbPassword) {
      validPassword = true;
      console.log("⚠️ ALERTA: Usuario ingresó con contraseña NO encriptada.");
    }

    if (!validPassword) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    // Generar Token
    const token = jwt.sign({ id: user.rows[0].id }, SECRET_KEY, { expiresIn: '8h' });

    res.json({
      token,
      user: {
        id: user.rows[0].id,
        nombre: user.rows[0].nombre,
        email: user.rows[0].email,
        rol: user.rows[0].rol,
        telefono: user.rows[0].telefono,
        activo: user.rows[0].activo // Enviamos el estatus
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
  }
};

// ==========================================
// 3. OBTENER TODOS LOS USUARIOS
// ==========================================
const getUsers = async (req, res) => {
  try {
    // MODIFICADO: Agregamos 'activo' al SELECT para saber quién está disponible
    // Nota: Podrías poner "WHERE activo = true" si solo quieres ver a los activos,
    // pero como Admin es mejor verlos a todos.
    const allUsers = await pool.query('SELECT id, nombre, email, rol, telefono, activo FROM usuarios ORDER BY id ASC');
    res.json(allUsers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// ==========================================
// 4. CAMBIAR ESTATUS (ACTIVAR / DESACTIVAR)
// ==========================================
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    // EL TRUCO: "SET activo = NOT activo" invierte el valor actual.
    const result = await pool.query(
        'UPDATE usuarios SET activo = NOT activo WHERE id = $1 RETURNING *', 
        [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const nuevoEstado = result.rows[0].activo ? "Reactivado" : "Desactivado";
    res.json({ message: `Usuario ${nuevoEstado} correctamente`, user: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al cambiar estatus del usuario' });
  }
};

module.exports = {
  register,
  login,
  getUsers,
  deleteUser
};