const pool = require('../config/db'); // Importamos la conexión

// 1. Crear Ticket
const createTicket = async (req, res) => {
  try {
    const { titulo, descripcion, ubicacion, categoria, prioridad } = req.body;
    // OJO: Aquí mantenemos el usuario_id = 1 fijo por ahora, como en tu original
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
};

// 2. Obtener Todos
const getAllTickets = async (req, res) => {
  try {
    const allTickets = await pool.query('SELECT * FROM tickets ORDER BY fecha_creacion DESC');
    res.json(allTickets.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
};

// 3. Actualizar (Gestión)
const updateTicket = async (req, res) => {
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
};

// 4. Votar (Lógica Anti-Duplicados)
const voteTicket = async (req, res) => {
  const { id } = req.params;      
  const { usuario_id } = req.body; 

  try {
    // A. Registrar en historial
    await pool.query(
      "INSERT INTO votos_registro (ticket_id, usuario_id) VALUES ($1, $2)",
      [id, usuario_id]
    );

    // B. Sumar voto
    const result = await pool.query(
      "UPDATE tickets SET votos = votos + 1 WHERE id = $1 RETURNING *",
      [id]
    );
    res.json(result.rows[0]);

  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: "Ya has votado por este ticket" });
    }
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// 5. Buscador
const searchTickets = async (req, res) => {
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
};

// 6. Mis Votos
const getUserVotes = async (req, res) => {
  const { usuario_id } = req.params;
  try {
    const result = await pool.query(
      "SELECT ticket_id FROM votos_registro WHERE usuario_id = $1", 
      [usuario_id]
    );
    res.json(result.rows.map(row => row.ticket_id)); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener votos" });
  }
};

// Exportamos TODAS las funciones
module.exports = {
  createTicket,
  getAllTickets,
  updateTicket,
  voteTicket,
  searchTickets,
  getUserVotes
};