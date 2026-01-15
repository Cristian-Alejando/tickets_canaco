const path = require('path'); // Importante para encontrar las carpetas
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Configuración de la Base de Datos
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Ruta para probar la conexión a la Base de Datos
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      mensaje: 'Conexión exitosa a la Base de Datos 🗄️', 
      hora_servidor: result.rows[0].now 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error conectando a la base de datos', detalle: err.message });
  }
});

// --- RUTA DE LOGIN ---
app.post('/login', async (req, res) => {
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
});

// --- RUTA DE REGISTRO ---
app.post('/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    
    // 1. Verificar si ya existe el correo
    const userExist = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: "Este correo ya está registrado." });
    }

    // 2. Crear usuario (Por defecto rol 'empleado')
    const newUser = await pool.query(
      "INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, 'empleado') RETURNING id, nombre, rol",
      [nombre, email, password]
    );

    res.json(newUser.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// --- RUTAS DE LA API ---

// 1. Crear un nuevo ticket
app.post('/tickets', async (req, res) => {
  try {
    const { titulo, descripcion, ubicacion, categoria, prioridad } = req.body;
    const newTicket = await pool.query(
      `INSERT INTO tickets (titulo, descripcion, ubicacion, categoria, prioridad, usuario_id) 
       VALUES ($1, $2, $3, $4, $5, 1) RETURNING *`,
      [titulo, descripcion, ubicacion, categoria, prioridad]
    );
    res.json(newTicket.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// 2. Obtener todos los tickets
app.get('/tickets', async (req, res) => {
  try {
    const allTickets = await pool.query('SELECT * FROM tickets ORDER BY fecha_creacion DESC');
    res.json(allTickets.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// 3. Actualizar ticket
app.put('/tickets/:id', async (req, res) => {
  const { id } = req.params;
  const { estatus, comentarios } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tickets 
       SET estatus = $1::varchar, 
           comentarios = $2, 
           fecha_actualizacion = NOW(),
           fecha_cierre = CASE WHEN $1::varchar = 'resuelto' THEN NOW() ELSE NULL END
       WHERE id = $3 RETURNING *`,
      [estatus, comentarios, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Sumar voto (MODIFICADO: AHORA VALIDA DUPLICADOS)
app.put('/tickets/:id/voto', async (req, res) => {
  const { id } = req.params;      
  const { usuario_id } = req.body; // Recibimos quién vota

  try {
    // 1. Intentamos registrar el voto en la tabla de historial
    await pool.query(
      "INSERT INTO votos_registro (ticket_id, usuario_id) VALUES ($1, $2)",
      [id, usuario_id]
    );

    // 2. Si no hubo error (no es duplicado), sumamos al contador
    const result = await pool.query(
      "UPDATE tickets SET votos = votos + 1 WHERE id = $1 RETURNING *",
      [id]
    );
    res.json(result.rows[0]);

  } catch (error) {
    // Código 23505 = Violación de unicidad (ya votó)
    if (error.code === '23505') {
      return res.status(400).json({ error: "Ya has votado por este ticket" });
    }
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Buscador de duplicados
app.get('/tickets/buscar', async (req, res) => {
  const { q } = req.query; 
  if (!q || q.trim() === '') {
    return res.json([]);
  }
  try {
    const result = await pool.query(
      "SELECT * FROM tickets WHERE titulo ILIKE $1 AND estatus != 'resuelto' LIMIT 3",
      [`%${q}%`] 
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 6. NUEVA RUTA: Obtener historial de votos de un usuario
app.get('/mis-votos/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;
  try {
    const result = await pool.query(
      "SELECT ticket_id FROM votos_registro WHERE usuario_id = $1", 
      [usuario_id]
    );
    // Devolvemos solo un array simple de IDs: [1, 5, 8]
    res.json(result.rows.map(row => row.ticket_id)); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener votos" });
  }
});

// --- INTEGRACIÓN FRONTEND ---
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// --- INICIAR SERVIDOR ---
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Sistema UNIFICADO listo en puerto: ${port}`);
});