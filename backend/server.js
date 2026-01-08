const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares (Para que el servidor entienda JSON y acepte peticiones externas)
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

// Ruta de prueba (para ver si el servidor responde)
app.get('/', (req, res) => {
  res.send('¡Hola! El servidor del Sistema de Tickets está funcionando 🚀');
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
    
    // 1. Buscamos al usuario por email
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const usuario = result.rows[0];

    // 2. Verificamos la contraseña
    if (password !== usuario.password) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // 3. Login exitoso: Mandamos sus datos (incluyendo el ROL)
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

// --- RUTAS DE LA API ---

// 1. Crear un nuevo ticket
app.post('/tickets', async (req, res) => {
  try {
    // AQUI AGREGAMOS "ubicacion"
    const { titulo, descripcion, ubicacion, categoria, prioridad } = req.body;
    
    const newTicket = await pool.query(
      // AQUI AGREGAMOS LA COLUMNA Y EL VALOR ($3)
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

// Actualizar ticket (CORREGIDO FINAL)
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

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});